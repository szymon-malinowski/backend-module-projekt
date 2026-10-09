import { Router } from 'express';
import { authenticate } from '../auth/tokens.js';
import { validate } from '../middleware/validate.js';
import { ApiError, asyncHandler } from '../middleware/errors.js';
import { pagination, envelope } from '../middleware/pagination.js';

const id = value => /^\d+$/.test(String(value)) && Number(value) > 0 && Number(value) <= 2147483647 ? undefined : 'ID must be a positive integer';
const name = value => typeof value === 'string' && value.trim().length > 0 && value.trim().length <= 160 ? undefined : 'Name must contain 1–160 characters';
const description = value => typeof value === 'string' && value.length <= 5000 ? undefined : 'Description must contain at most 5000 characters';
const price = value => typeof value === 'string' && /^(?:0|[1-9]\d{0,9})(?:\.\d{1,2})?$/.test(value) ? undefined : 'Price must be a nonnegative decimal with at most two decimal places';
const stock = value => Number.isInteger(value) && value >= 0 && value <= 2147483647 ? undefined : 'Stock must be a nonnegative integer';
const publicProduct = product => ({ id: product.id, name: product.name, description: product.description, price: product.price.toString(), stock: product.stock, createdAt: product.createdAt });
const staffOnly = (req, res, next) => req.auth.role === 'staff' ? next() : next(new ApiError(403, 'Forbidden'));

export function productRoutes(database, tokens) {
  const router = Router();
  router.get('/', asyncHandler(async (req, res) => {
    const { page, limit, skip } = pagination(req.query, ['search']);
    const search = req.query.search;
    if (search !== undefined && (typeof search !== 'string' || !search.trim() || search.length > 160 || Object.keys(req.query).some(k => !['page', 'limit', 'search'].includes(k)))) throw new ApiError(400, 'Validation failed', [{ field: 'search', message: 'Search must contain 1–160 characters' }]);
    const where = search ? { OR: [{ name: { contains: search.trim(), mode: 'insensitive' } }, { description: { contains: search.trim(), mode: 'insensitive' } }] } : {};
    const [products, total] = await Promise.all([database.product.findMany({ where, orderBy: { id: 'asc' }, skip, take: limit }), database.product.count({ where })]);
    res.json(envelope(products.map(publicProduct), page, limit, total));
  }));
  router.get('/:id', validate('params', { id }), asyncHandler(async (req, res) => {
    const product = await database.product.findUnique({ where: { id: Number(req.params.id) } });
    if (!product) throw new ApiError(404, 'Resource not found');
    res.json({ data: publicProduct(product) });
  }));
  router.use(authenticate(database, tokens), staffOnly);
  router.post('/', validate('body', { name, description, price, stock }, { required: ['name', 'price', 'stock'] }), asyncHandler(async (req, res) => {
    const product = await database.product.create({ data: { name: req.body.name.trim(), description: req.body.description ?? '', price: req.body.price, stock: req.body.stock } });
    res.location(`/products/${product.id}`).status(201).json({ data: publicProduct(product) });
  }));
  router.patch('/:id', validate('params', { id }), validate('body', { name, description, price, stock }, { required: [] }), asyncHandler(async (req, res) => {
    if (!Object.keys(req.body).length) throw new ApiError(400, 'Validation failed', [{ field: 'body', message: 'At least one field is required' }]);
    const data = { ...req.body }; if (data.name) data.name = data.name.trim();
    try {
      const product = await database.product.update({ where: { id: Number(req.params.id) }, data });
      res.json({ data: publicProduct(product) });
    } catch (error) { if (error.code === 'P2025') throw new ApiError(404, 'Resource not found'); throw error; }
  }));
  router.delete('/:id', validate('params', { id }), asyncHandler(async (req, res) => {
    const productId = Number(req.params.id);
    const product = await database.product.findUnique({ where: { id: productId }, select: { id: true } });
    if (!product) throw new ApiError(404, 'Resource not found');
    if (await database.orderItem.count({ where: { productId } })) throw new ApiError(409, 'Product is referenced by orders');
    try { await database.product.delete({ where: { id: productId } }); res.status(204).end(); }
    catch (error) { if (error.code === 'P2003') throw new ApiError(409, 'Product is referenced by orders'); if (error.code === 'P2025') throw new ApiError(404, 'Resource not found'); throw error; }
  }));
  return router;
}
