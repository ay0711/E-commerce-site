const rawBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const API_BASE_URL = String(rawBaseUrl).replace(/\/+$/, '');

const buildHeaders = (token, hasBody = true) => {
  const headers = {};
  if (hasBody) {
    headers['Content-Type'] = 'application/json';
  }
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
};

const parseJson = async (response) => {
  const text = await response.text();
  if (!text) {
    return {};
  }

  try {
    return JSON.parse(text);
  } catch (error) {
    return { message: text };
  }
};

const request = async (path, options = {}, token) => {
  const hasBody = options.body !== undefined;
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      ...buildHeaders(token, hasBody),
      ...(options.headers || {}),
    },
  });

  const payload = await parseJson(response);

  if (!response.ok) {
    throw new Error(payload.message || 'Request failed.');
  }

  return payload;
};

export const authApi = {
  register: (body) => request('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  login: (body) => request('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
  social: (body) => request('/auth/social', { method: 'POST', body: JSON.stringify(body) }),
  me: (token) => request('/auth/me', {}, token),
};

export const productApi = {
  list: (params = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        query.append(key, String(value));
      }
    });

    const queryText = query.toString();
    return request(`/products${queryText ? `?${queryText}` : ''}`);
  },
  getById: (productId) => request(`/products/${productId}`),
  categoryMeta: () => request('/products/categories/meta'),
  create: (token, body) => request('/products', { method: 'POST', body: JSON.stringify(body) }, token),
  update: (token, productId, body) =>
    request(`/products/${productId}`, { method: 'PATCH', body: JSON.stringify(body) }, token),
  remove: (token, productId) => request(`/products/${productId}`, { method: 'DELETE' }, token),
};

export const cartApi = {
  get: (token) => request('/cart', {}, token),
  add: (token, body) => request('/cart', { method: 'POST', body: JSON.stringify(body) }, token),
  update: (token, productId, body) => request(`/cart/${productId}`, { method: 'PATCH', body: JSON.stringify(body) }, token),
  remove: (token, productId) => request(`/cart/${productId}`, { method: 'DELETE' }, token),
  clear: (token) => request('/cart', { method: 'DELETE' }, token),
};

export const orderApi = {
  create: (token, body) => request('/orders', { method: 'POST', body: JSON.stringify(body) }, token),
  mine: (token) => request('/orders/mine', {}, token),
};
