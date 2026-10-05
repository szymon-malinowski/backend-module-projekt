import { Router } from 'express';
import { authenticate } from '../auth/tokens.js';
import { validate } from '../middleware/validate.js';
import { ApiError, asyncHandler } from '../middleware/errors.js';

const id = value => /^\d+$/.test(String(value)) && Number(value) > 0 && Number(value) <= 2147483647
  ? undefined : 'ID must be a positive integer';
const name = value => typeof value === 'string' && value.trim().length > 0 && value.trim().length <= 120
  ? undefined : 'Name must contain 1–120 characters';
const email = value => typeof value === 'string' && value.trim().length <= 255
  && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()) ? undefined : 'Invalid email';

const publicCustomer = customer => ({
  id: customer.id, name: customer.name, email: customer.email, createdAt: customer.createdAt,
});
const requireRole = role => (req, res, next) => {
  if (req.auth.role !== role) return next(new ApiError(403, 'Forbidden'));
  next();
};
const ownOrStaff = (req, res, next) => {
  if (req.auth.role === 'staff' || req.auth.customerId === Number(req.params.id)) return next();
  next(new ApiError(404, 'Resource not found'));
};

export function customerRoutes(database, tokens) {
  const router = Router();
  router.use(authenticate(database, tokens));
  router.get('/', requireRole('staff'), validate('query', {}), asyncHandler(async (req, res) => {
    const customers = await database.customer.findMany({ orderBy: { id: 'asc' } });
    res.json({ data: customers.map(publicCustomer) });
  }));
  router.post('/', requireRole('staff'), validate('body', { name, email }), asyncHandler(async (req, res) => {
    try {
      const customer = await database.customer.create({ data: {
        name: req.body.name.trim(), email: req.body.email.trim().toLowerCase(),
      } });
      res.location(`/customers/${customer.id}`).status(201).json({ data: publicCustomer(customer) });
    } catch (error) {
      if (error.code === 'P2002') throw new ApiError(409, 'Email already registered');
      throw error;
    }
  }));
  router.get('/:id', validate('params', { id }), ownOrStaff, asyncHandler(async (req, res) => {
    const customer = await database.customer.findUnique({ where: { id: Number(req.params.id) } });
    if (!customer) throw new ApiError(404, 'Resource not found');
    res.json({ data: publicCustomer(customer) });
  }));
  router.patch('/:id', validate('params', { id }), ownOrStaff, validate('body', { name, email }, { required: [] }), asyncHandler(async (req, res) => {
    if (!Object.keys(req.body).length) throw new ApiError(400, 'Validation failed', [{ field: 'body', message: 'At least one field is required' }]);
    const data = {};
    if (Object.hasOwn(req.body, 'name')) data.name = req.body.name.trim();
    if (Object.hasOwn(req.body, 'email')) data.email = req.body.email.trim().toLowerCase();
    try {
      const customer = await database.$transaction(async tx => {
        const updated = await tx.customer.update({ where: { id: Number(req.params.id) }, data });
        if (data.email) await tx.account.updateMany({ where: { customerId: updated.id }, data: { email: data.email } });
        return updated;
      });
      res.json({ data: publicCustomer(customer) });
    } catch (error) {
      if (error.code === 'P2002') throw new ApiError(409, 'Email already registered');
      if (error.code === 'P2025') throw new ApiError(404, 'Resource not found');
      throw error;
    }
  }));
  router.delete('/:id', requireRole('staff'), validate('params', { id }), asyncHandler(async (req, res) => {
    const customerId = Number(req.params.id);
    const customer = await database.customer.findUnique({ where: { id: customerId }, select: { id: true } });
    if (!customer) throw new ApiError(404, 'Resource not found');
    const orderCount = await database.order.count({ where: { customerId } });
    if (orderCount > 0) throw new ApiError(409, 'Customer has orders');
    try {
      await database.customer.delete({ where: { id: customerId } });
      res.status(204).end();
    } catch (error) {
      if (error.code === 'P2025') throw new ApiError(404, 'Resource not found');
      throw error;
    }
  }));
  return router;
}
