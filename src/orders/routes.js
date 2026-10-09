import { Router } from 'express';
import { authenticate } from '../auth/tokens.js';
import { validate } from '../middleware/validate.js';
import { ApiError, asyncHandler } from '../middleware/errors.js';
import { pagination, envelope } from '../middleware/pagination.js';

const itemList = value => Array.isArray(value) && value.length >= 1 && value.length <= 100 ? undefined : 'Items must contain 1–100 entries';
const itemShape = value => value && typeof value === 'object' && !Array.isArray(value)
  && Number.isInteger(value.productId) && value.productId > 0 && Number.isInteger(value.quantity) && value.quantity > 0 && value.quantity <= 2147483647
  && Object.keys(value).every(key => key === 'productId' || key === 'quantity') ? undefined : 'Each item needs a positive productId and quantity';
const cents = value => {
  const text = value.toString();
  if (!/^\d+(?:\.\d{1,2})?$/.test(text)) throw new Error('Invalid stored price');
  const [whole, fraction = ''] = text.split('.');
  return BigInt(whole) * 100n + BigInt(fraction.padEnd(2, '0'));
};
const money = value => `${value / 100n}.${(value % 100n).toString().padStart(2, '0')}`;
const publicOrder = order => ({
  id: order.id, customerId: order.customerId, status: order.status, createdAt: order.createdAt,
  items: order.items.map(item => ({ id: item.id, productId: item.productId, quantity: item.quantity, unitPrice: item.unitPrice.toString() })),
  total: money(order.items.reduce((sum, item) => sum + cents(item.unitPrice) * BigInt(item.quantity), 0n)),
});

export function orderRoutes(database, tokens) {
  const router = Router();
  router.use(authenticate(database, tokens));
  const visible = req => req.auth.role === 'staff' ? {} : { customerId: req.auth.customerId };
  const format = order => ({ data: publicOrder(order) });

  router.get('/', asyncHandler(async (req, res) => {
    const { page, limit, skip } = pagination(req.query, ['status']);
    const status = req.query.status;
    if (status !== undefined && !['pending', 'paid', 'shipped', 'cancelled'].includes(status)) throw new ApiError(400, 'Validation failed', [{ field: 'status', message: 'Invalid order status' }]);
    const where = { ...visible(req), ...(status ? { status } : {}) };
    const [orders, total] = await Promise.all([database.order.findMany({ where, orderBy: { id: 'asc' }, skip, take: limit, include: { items: true } }), database.order.count({ where })]);
    res.json(envelope(orders.map(publicOrder), page, limit, total));
  }));
  router.get('/:id', validate('params', { id: value => /^\d+$/.test(String(value)) && Number(value) > 0 ? undefined : 'ID must be a positive integer' }), asyncHandler(async (req, res) => {
    const order = await database.order.findFirst({ where: { id: Number(req.params.id), ...visible(req) }, include: { items: true } });
    if (!order) throw new ApiError(404, 'Resource not found');
    res.json(format(order));
  }));
  router.post('/', validate('body', { items: value => {
    const listError = itemList(value); if (listError) return listError;
    const errors = value.map(itemShape).filter(Boolean); return errors.length ? errors[0] : undefined;
  } }), asyncHandler(async (req, res) => {
    if (req.auth.role !== 'customer') throw new ApiError(403, 'Forbidden');
    const requested = req.body.items;
    const ids = requested.map(item => item.productId);
    if (new Set(ids).size !== ids.length) throw new ApiError(400, 'Validation failed', [{ field: 'items', message: 'Product IDs must be unique' }]);
    try {
      const order = await database.$transaction(async tx => {
        const products = await tx.product.findMany({ where: { id: { in: ids } } });
        if (products.length !== ids.length) throw new ApiError(404, 'Product not found');
        const byId = new Map(products.map(product => [product.id, product]));
        for (const item of requested) {
          const product = byId.get(item.productId);
          const result = await tx.product.updateMany({ where: { id: product.id, stock: { gte: item.quantity } }, data: { stock: { decrement: item.quantity } } });
          if (result.count !== 1) throw new ApiError(409, 'Insufficient stock');
        }
        return tx.order.create({ data: {
          customerId: req.auth.customerId, status: 'pending',
          items: { create: requested.map(item => ({ productId: item.productId, quantity: item.quantity, unitPrice: byId.get(item.productId).price })) },
        }, include: { items: true } });
      });
      res.location(`/orders/${order.id}`).status(201).json({ data: publicOrder(order) });
    } catch (error) {
      if (error instanceof ApiError) throw error;
      if (error.code === 'P2003') throw new ApiError(404, 'Product not found');
      throw error;
    }
  }));
  router.patch('/:id/status', validate('params', { id: value => /^\d+$/.test(String(value)) && Number(value) > 0 ? undefined : 'ID must be a positive integer' }), validate('body', { status: value => ['paid', 'shipped', 'cancelled'].includes(value) ? undefined : 'Invalid order status' }), asyncHandler(async (req, res) => {
    if (req.auth.role !== 'staff') throw new ApiError(403, 'Forbidden');
    const order = await database.order.findUnique({ where: { id: Number(req.params.id) }, include: { items: true } });
    if (!order) throw new ApiError(404, 'Resource not found');
    const allowed = { pending: ['paid', 'cancelled'], paid: ['shipped', 'cancelled'], shipped: [], cancelled: [] };
    if (!allowed[order.status]?.includes(req.body.status)) throw new ApiError(409, 'Invalid status transition');
    const updated = await database.order.update({ where: { id: order.id }, data: { status: req.body.status }, include: { items: true } });
    res.json(format(updated));
  }));
  return router;
}
