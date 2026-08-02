import api from '../services/api';

export const auth = {
  register: (data) => api.post('/auth/register', data).then((r) => r.data),
  login: (data) => api.post('/auth/login', data).then((r) => r.data),
  me: () => api.get('/auth/me').then((r) => r.data),
  updateProfile: (data) => api.put('/auth/profile', data).then((r) => r.data),
  logout: () => api.post('/auth/logout').then((r) => r.data),
};

export const productsApi = {
  list: (params) => api.get('/products', { params }).then((r) => r.data),
  get: (slug) => api.get(`/products/${slug}`).then((r) => r.data),
  getById: (id) => api.get(`/products/id/${id}`).then((r) => r.data),
  create: (data) => api.post('/products', data).then((r) => r.data),
  update: (id, data) => api.put(`/products/${id}`, data).then((r) => r.data),
  remove: (id) => api.delete(`/products/${id}`).then((r) => r.data),
};

export const categoriesApi = {
  list: () => api.get('/categories').then((r) => r.data),
  create: (data) => api.post('/categories', data).then((r) => r.data),
  update: (id, data) => api.put(`/categories/${id}`, data).then((r) => r.data),
  remove: (id) => api.delete(`/categories/${id}`).then((r) => r.data),
};

export const cartApi = {
  get: () => api.get('/cart').then((r) => r.data),
  add: (data) => api.post('/cart/items', data).then((r) => r.data),
  update: (id, quantity) => api.put(`/cart/items/${id}`, { quantity }).then((r) => r.data),
  remove: (id) => api.delete(`/cart/items/${id}`).then((r) => r.data),
  clear: () => api.delete('/cart').then((r) => r.data),
};

export const ordersApi = {
  create: (data) => api.post('/orders', data).then((r) => r.data),
  mine: () => api.get('/orders').then((r) => r.data),
  get: (id) => api.get(`/orders/${id}`).then((r) => r.data),
  track: (email, orderNumber) => api.get('/orders/track', { params: { email, orderNumber } }).then((r) => r.data),
  confirmDelivery: (id) => api.post(`/orders/${id}/confirm`).then((r) => r.data),
};

export const paymentsApi = {
  create: (data) => api.post('/payments/create', data).then((r) => r.data),
  verify: (paymentReference) => api.post('/payments/verify', { paymentReference }).then((r) => r.data),
};

export const reviewsApi = {
  list: (productId) => api.get(`/reviews/product/${productId}`).then((r) => r.data),
  create: (productId, data) => {
    const isForm = data instanceof FormData;
    return api
      .post(`/reviews/product/${productId}`, data, isForm ? { headers: { 'Content-Type': 'multipart/form-data' } } : undefined)
      .then((r) => r.data);
  },
  remove: (id) => api.delete(`/reviews/${id}`).then((r) => r.data),
};

export const wishlistApi = {
  mine: () => api.get('/wishlist').then((r) => r.data),
  add: (productId) => api.post('/wishlist', { productId }).then((r) => r.data),
  remove: (productId) => api.delete(`/wishlist/${productId}`).then((r) => r.data),
};

export const promosApi = {
  valid: (code) => api.get('/promos/valid', { params: { code } }).then((r) => r.data),
};

export const adminPromosApi = {
  list: () => api.get('/admin/promos').then((r) => r.data),
  create: (data) => api.post('/admin/promos', data).then((r) => r.data),
  update: (id, data) => api.put(`/admin/promos/${id}`, data).then((r) => r.data),
  remove: (id) => api.delete(`/admin/promos/${id}`).then((r) => r.data),
};

export const newsletterApi = {
  subscribe: (data) => api.post('/newsletter/subscribe', data).then((r) => r.data),
  unsubscribe: (email) => api.post('/newsletter/unsubscribe', { email }).then((r) => r.data),
  status: (email) => api.get(`/newsletter/status/${email}`).then((r) => r.data),
  campaign: (data) => api.post('/newsletter/campaign', data).then((r) => r.data),
};

export const deliveryZonesApi = {
  list: () => api.get('/delivery-zones').then((r) => r.data),
};

export const contactApi = {
  submit: (data) => api.post('/contact', data).then((r) => r.data),
};

export const adminApi = {
  stats: () => api.get('/admin/stats').then((r) => r.data),
  salesSeries: () => api.get('/admin/sales-series').then((r) => r.data),
  orders: () => api.get('/admin/orders').then((r) => r.data),
  order: (id) => api.get(`/admin/orders/${id}`).then((r) => r.data),
  updateOrderStatus: (id, status) => api.put(`/admin/orders/${id}/status`, { status }).then((r) => r.data),
  customers: () => api.get('/admin/customers').then((r) => r.data),
  newsletter: () => api.get('/admin/newsletter').then((r) => r.data),
  reviews: () => api.get('/admin/reviews').then((r) => r.data),
  deliveryZones: () => api.get('/admin/delivery-zones').then((r) => r.data),
  createDeliveryZone: (data) => api.post('/admin/delivery-zones', data).then((r) => r.data),
  updateDeliveryZone: (id, data) => api.put(`/admin/delivery-zones/${id}`, data).then((r) => r.data),
  deleteDeliveryZone: (id) => api.delete(`/admin/delivery-zones/${id}`).then((r) => r.data),
  sendTestEmail: (to) => api.post('/admin/test-email', { to }).then((r) => r.data),
};
