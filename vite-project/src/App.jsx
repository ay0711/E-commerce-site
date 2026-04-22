import { useEffect, useMemo, useState } from 'react';
import { Link, NavLink, Navigate, Route, Routes, useLocation, useNavigate, useParams } from 'react-router-dom';
import { authApi, cartApi, orderApi, productApi } from './api/client';
import './App.css';

const initialAuth = { name: '', email: '', password: '' };
const initialShipping = {
  fullName: '',
  line1: '',
  city: '',
  state: '',
  postalCode: '',
  country: '',
  phone: '',
};

const adminFormDefaults = {
  name: '',
  slug: '',
  category: 'Essentials',
  price: '',
  stock: '',
  image: '',
  description: '',
  featured: false,
};

const defaultCategories = [
  'All',
  'Luxury Sets',
  'Essentials',
  'Occasion Wear',
  'Accessories',
  'Resort Edit',
  'Contemporary',
  'Outerwear',
  'Footwear',
];

const formatCurrency = (value) => `$${Number(value || 0).toFixed(2)}`;
const getItemProductId = (item) => (typeof item.product === 'string' ? item.product : item.product?._id);

function SiteLayout({ children, user, onLogout, cartCount, statusMessage, clearStatus, searchValue, onSearchChange }) {
  const navigate = useNavigate();

  return (
    <div className="app-shell">
      <div className="atmosphere atmosphere-a" />
      <div className="atmosphere atmosphere-b" />

      <header className="top-nav">
        <button className="brand" type="button" onClick={() => navigate('/')}>
          <span className="brand-dot" />
          <span>
            <strong>Ayanfe Clothings</strong>
            <small>Editorial Commerce</small>
          </span>
        </button>

        <nav className="nav-links" aria-label="Main navigation">
          <NavLink to="/" end>
            Home
          </NavLink>
          <NavLink to="/shop">Shop</NavLink>
          <NavLink to="/cart">Cart</NavLink>
          <NavLink to="/account">Account</NavLink>
          {user?.role === 'admin' ? <NavLink to="/admin">Admin</NavLink> : null}
        </nav>

        <label className="search-input" aria-label="Search catalog">
          <input
            type="search"
            value={searchValue}
            placeholder="Search collections"
            onChange={(event) => onSearchChange(event.target.value)}
          />
        </label>

        <div className="account-actions">
          <Link className="pill-button" to="/cart">
            Bag ({cartCount})
          </Link>
          {user ? (
            <button className="pill-button ghost" type="button" onClick={onLogout}>
              Logout
            </button>
          ) : (
            <Link className="pill-button ghost" to="/account">
              Sign in
            </Link>
          )}
        </div>
      </header>

      {statusMessage ? (
        <div className="status-banner" role="status">
          <span>{statusMessage}</span>
          <button type="button" onClick={clearStatus} aria-label="Dismiss message">
            x
          </button>
        </div>
      ) : null}

      {children}
    </div>
  );
}

function HomePage({ featuredProducts, loading, onAddToCart, onRequireAuth }) {
  return (
    <>
      <section className="hero-section page-wrap">
        <div className="hero-copy">
          <p className="eyebrow">New season / 2026</p>
          <h1>Modern silhouettes for power, softness, and presence.</h1>
          <p>
            Elevated fabrics, bold tailoring, and checkout that feels as premium as the wardrobe. This is a flagship storefront,
            not a template.
          </p>
          <div className="hero-actions">
            <Link className="pill-button" to="/shop">
              Explore catalog
            </Link>
            <button className="pill-button ghost" type="button" onClick={onRequireAuth}>
              Join members
            </button>
          </div>
        </div>

        <div className="hero-panel">
          <p>Featured pieces</p>
          <strong>{featuredProducts.length > 0 ? `${featuredProducts.length} handpicked styles` : 'Curating now'}</strong>
          <span>Free style-exchange in 7 days</span>
        </div>
      </section>

      <section className="featured-grid page-wrap">
        <div className="section-head">
          <h2>Top picks</h2>
          <Link to="/shop">View all products</Link>
        </div>

        <div className="product-grid">
          {loading ? <p className="empty-state">Loading featured products...</p> : null}
          {!loading && featuredProducts.length === 0 ? <p className="empty-state">No featured products yet.</p> : null}

          {featuredProducts.map((product) => (
            <article className="product-card" key={product._id || product.slug}>
              <Link to={`/shop/${product._id}`} className="card-image" style={{ backgroundImage: `url(${product.image})` }}>
                <span>{product.category}</span>
              </Link>
              <div className="card-content">
                <h3>{product.name}</h3>
                <p>{product.description}</p>
                <div className="card-row">
                  <strong>{formatCurrency(product.price)}</strong>
                  <button type="button" onClick={() => onAddToCart(product)}>
                    Add
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}

function ShopPage({ filters, setFilters, products, pagination, loading, categories, onAddToCart }) {
  const totalPages = pagination?.pages || 1;
  const page = pagination?.page || 1;

  return (
    <section className="page-wrap shop-page">
      <div className="section-head stack-mobile">
        <div>
          <h2>Shop all products</h2>
          <p>{pagination.total || 0} items available</p>
        </div>
        <div className="shop-controls">
          <select
            value={filters.category}
            onChange={(event) => setFilters((state) => ({ ...state, category: event.target.value, page: 1 }))}
          >
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
          <select
            value={filters.sort}
            onChange={(event) => setFilters((state) => ({ ...state, sort: event.target.value, page: 1 }))}
          >
            <option value="newest">Newest</option>
            <option value="price-asc">Price low-high</option>
            <option value="price-desc">Price high-low</option>
            <option value="rating">Top rated</option>
          </select>
        </div>
      </div>

      {loading ? <p className="empty-state">Loading products...</p> : null}
      {!loading && products.length === 0 ? <p className="empty-state">No products found for this filter.</p> : null}

      <div className="product-grid">
        {products.map((product) => (
          <article className="product-card" key={product._id || product.slug}>
            <Link to={`/shop/${product._id}`} className="card-image" style={{ backgroundImage: `url(${product.image})` }}>
              <span>{product.featured ? 'Featured' : product.category}</span>
            </Link>
            <div className="card-content">
              <h3>{product.name}</h3>
              <p>{product.description}</p>
              <div className="card-row">
                <strong>{formatCurrency(product.price)}</strong>
                <button type="button" onClick={() => onAddToCart(product)}>
                  Add
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>

      <div className="pagination-row">
        <button type="button" disabled={page <= 1} onClick={() => setFilters((state) => ({ ...state, page: page - 1 }))}>
          Previous
        </button>
        <span>
          Page {page} of {totalPages}
        </span>
        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => setFilters((state) => ({ ...state, page: page + 1 }))}
        >
          Next
        </button>
      </div>
    </section>
  );
}

function ProductPage({ onAddToCart }) {
  const { productId } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    const loadProduct = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await productApi.getById(productId);
        if (active) {
          setProduct(response.product || null);
        }
      } catch (apiError) {
        if (active) {
          setError(apiError.message || 'Unable to load product.');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadProduct();

    return () => {
      active = false;
    };
  }, [productId]);

  if (loading) {
    return (
      <section className="page-wrap">
        <p className="empty-state">Loading product...</p>
      </section>
    );
  }

  if (error || !product) {
    return (
      <section className="page-wrap">
        <p className="empty-state">{error || 'Product not found.'}</p>
      </section>
    );
  }

  return (
    <section className="page-wrap product-detail">
      <div className="detail-image" style={{ backgroundImage: `url(${product.image})` }} />
      <div className="detail-panel">
        <p className="eyebrow">{product.category}</p>
        <h2>{product.name}</h2>
        <p>{product.description}</p>
        <div className="detail-stats">
          <span>Rating {Number(product.rating || 0).toFixed(1)}</span>
          <span>Stock {product.stock}</span>
        </div>
        <strong>{formatCurrency(product.price)}</strong>
        <button className="pill-button" type="button" onClick={() => onAddToCart(product)}>
          Add to bag
        </button>
      </div>
    </section>
  );
}

function CartPage({ cart, onUpdateItem, onRemoveItem, onClearCart, shippingAddress, setShippingAddress, onCheckout, checkoutLoading }) {
  return (
    <section className="page-wrap cart-layout">
      <div className="cart-items card-surface">
        <div className="section-head">
          <h2>Your bag</h2>
          <button type="button" onClick={onClearCart} disabled={cart.items.length === 0}>
            Clear bag
          </button>
        </div>

        {cart.items.length === 0 ? <p className="empty-state">Your bag is empty.</p> : null}

        {cart.items.map((item) => (
          <article className="cart-row" key={`${getItemProductId(item)}-${item.name}`}>
            <div>
              <h3>{item.name}</h3>
              <p>{formatCurrency(item.price)}</p>
            </div>
            <label>
              Qty
              <input
                type="number"
                min="1"
                value={item.quantity}
                onChange={(event) => onUpdateItem(getItemProductId(item), Number(event.target.value || 1))}
              />
            </label>
            <button type="button" onClick={() => onRemoveItem(getItemProductId(item))}>
              Remove
            </button>
          </article>
        ))}
      </div>

      <form className="checkout-form card-surface" onSubmit={onCheckout}>
        <div className="section-head">
          <h2>Checkout</h2>
          <p>{formatCurrency(cart.subtotal)}</p>
        </div>

        {Object.entries(shippingAddress).map(([key, value]) => (
          <label key={key}>
            {key}
            <input
              value={value}
              onChange={(event) =>
                setShippingAddress((state) => ({
                  ...state,
                  [key]: event.target.value,
                }))
              }
              required
            />
          </label>
        ))}

        <button className="pill-button" type="submit" disabled={checkoutLoading || cart.items.length === 0}>
          {checkoutLoading ? 'Placing order...' : 'Place order'}
        </button>
      </form>
    </section>
  );
}

function AccountPage({ user, authMode, setAuthMode, authForm, setAuthForm, onSubmitAuth, authLoading, orders, loadingOrders }) {
  if (!user) {
    return (
      <section className="page-wrap account-card card-surface">
        <div className="section-head">
          <h2>{authMode === 'login' ? 'Sign in' : 'Create account'}</h2>
          <button type="button" onClick={() => setAuthMode((state) => (state === 'login' ? 'register' : 'login'))}>
            {authMode === 'login' ? 'Need an account?' : 'Have an account?'}
          </button>
        </div>

        <form className="account-form" onSubmit={onSubmitAuth}>
          {authMode === 'register' ? (
            <label>
              Name
              <input
                value={authForm.name}
                onChange={(event) => setAuthForm((state) => ({ ...state, name: event.target.value }))}
                required
              />
            </label>
          ) : null}

          <label>
            Email
            <input
              type="email"
              value={authForm.email}
              onChange={(event) => setAuthForm((state) => ({ ...state, email: event.target.value }))}
              required
            />
          </label>

          <label>
            Password
            <input
              type="password"
              minLength={8}
              value={authForm.password}
              onChange={(event) => setAuthForm((state) => ({ ...state, password: event.target.value }))}
              required
            />
          </label>

          <button className="pill-button" type="submit" disabled={authLoading}>
            {authLoading ? 'Please wait...' : authMode === 'login' ? 'Sign in' : 'Create account'}
          </button>
        </form>
      </section>
    );
  }

  return (
    <section className="page-wrap account-card card-surface">
      <div className="section-head">
        <h2>Hello, {user.name}</h2>
        <p>{user.email}</p>
      </div>

      <h3>My orders</h3>
      {loadingOrders ? <p className="empty-state">Loading orders...</p> : null}
      {!loadingOrders && orders.length === 0 ? <p className="empty-state">No orders yet.</p> : null}

      <div className="orders-grid">
        {orders.map((order) => (
          <article key={order._id} className="order-card">
            <strong>{order._id.slice(-8).toUpperCase()}</strong>
            <span>Status: {order.status}</span>
            <span>Total: {formatCurrency(order.totalAmount)}</span>
          </article>
        ))}
      </div>
    </section>
  );
}

function AdminPage({ user, token, products, refreshProducts, setStatusMessage }) {
  const [busy, setBusy] = useState(false);
  const [editingId, setEditingId] = useState('');
  const [form, setForm] = useState(adminFormDefaults);

  const categories = useMemo(() => {
    const set = new Set(defaultCategories.filter((category) => category !== 'All'));
    products.forEach((product) => {
      if (product.category) {
        set.add(product.category);
      }
    });
    return Array.from(set);
  }, [products]);

  if (!user || user.role !== 'admin') {
    return <Navigate to="/account" replace />;
  }

  const resetForm = () => {
    setEditingId('');
    setForm(adminFormDefaults);
  };

  const startEdit = (product) => {
    setEditingId(product._id);
    setForm({
      name: product.name || '',
      slug: product.slug || '',
      category: product.category || 'Essentials',
      price: String(product.price || ''),
      stock: String(product.stock || ''),
      image: product.image || '',
      description: product.description || '',
      featured: Boolean(product.featured),
    });
  };

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    try {
      const payload = {
        name: form.name,
        slug: form.slug,
        category: form.category,
        description: form.description,
        image: form.image,
        price: Number(form.price),
        stock: Number(form.stock),
        featured: Boolean(form.featured),
      };

      if (editingId) {
        await productApi.update(token, editingId, payload);
        setStatusMessage('Product updated.');
      } else {
        await productApi.create(token, payload);
        setStatusMessage('Product created.');
      }

      resetForm();
      await refreshProducts();
    } catch (error) {
      setStatusMessage(error.message);
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id) => {
    setBusy(true);
    try {
      await productApi.remove(token, id);
      setStatusMessage('Product deleted.');
      await refreshProducts();
      if (editingId === id) {
        resetForm();
      }
    } catch (error) {
      setStatusMessage(error.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="page-wrap admin-layout">
      <form className="admin-form card-surface" onSubmit={submit}>
        <div className="section-head">
          <h2>{editingId ? 'Edit product' : 'Create product'}</h2>
          <button type="button" onClick={resetForm}>
            Clear
          </button>
        </div>

        <label>
          Name
          <input value={form.name} onChange={(event) => setForm((state) => ({ ...state, name: event.target.value }))} required />
        </label>
        <label>
          Slug
          <input value={form.slug} onChange={(event) => setForm((state) => ({ ...state, slug: event.target.value }))} required />
        </label>
        <label>
          Category
          <select value={form.category} onChange={(event) => setForm((state) => ({ ...state, category: event.target.value }))}>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </label>
        <label>
          Price
          <input
            type="number"
            min="0"
            step="0.01"
            value={form.price}
            onChange={(event) => setForm((state) => ({ ...state, price: event.target.value }))}
            required
          />
        </label>
        <label>
          Stock
          <input
            type="number"
            min="0"
            value={form.stock}
            onChange={(event) => setForm((state) => ({ ...state, stock: event.target.value }))}
            required
          />
        </label>
        <label>
          Image URL
          <input value={form.image} onChange={(event) => setForm((state) => ({ ...state, image: event.target.value }))} required />
        </label>
        <label className="full-width">
          Description
          <textarea
            rows={3}
            value={form.description}
            onChange={(event) => setForm((state) => ({ ...state, description: event.target.value }))}
            required
          />
        </label>
        <label className="check-line full-width">
          <input
            type="checkbox"
            checked={form.featured}
            onChange={(event) => setForm((state) => ({ ...state, featured: event.target.checked }))}
          />
          Featured
        </label>
        <button className="pill-button full-width" type="submit" disabled={busy}>
          {busy ? 'Saving...' : editingId ? 'Update product' : 'Create product'}
        </button>
      </form>

      <div className="admin-list card-surface">
        <div className="section-head">
          <h2>Catalog snapshot</h2>
          <p>{products.length} loaded items</p>
        </div>

        {products.map((product) => (
          <article className="admin-row" key={product._id || product.slug}>
            <div>
              <strong>{product.name}</strong>
              <p>
                {product.category} / {formatCurrency(product.price)}
              </p>
            </div>
            <div className="row-actions">
              <button type="button" onClick={() => startEdit(product)}>
                Edit
              </button>
              <button type="button" onClick={() => remove(product._id)}>
                Delete
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function App() {
  const location = useLocation();
  const navigate = useNavigate();

  const [token, setToken] = useState(localStorage.getItem('ayanfe_token') || '');
  const [user, setUser] = useState(null);
  const [statusMessage, setStatusMessage] = useState('');

  const [filters, setFilters] = useState({
    q: '',
    category: 'All',
    sort: 'newest',
    page: 1,
    limit: 24,
  });

  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0, limit: 24 });
  const [featuredProducts, setFeaturedProducts] = useState([]);

  const [loadingProducts, setLoadingProducts] = useState(false);
  const [loadingFeatured, setLoadingFeatured] = useState(false);

  const [cart, setCart] = useState({ items: [], subtotal: 0 });
  const [shippingAddress, setShippingAddress] = useState(initialShipping);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  const [authForm, setAuthForm] = useState(initialAuth);
  const [authMode, setAuthMode] = useState('login');
  const [authLoading, setAuthLoading] = useState(false);

  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  const cartCount = useMemo(() => cart.items.reduce((sum, item) => sum + Number(item.quantity || 0), 0), [cart.items]);

  const categoryOptions = useMemo(() => {
    const set = new Set(defaultCategories);
    products.forEach((product) => {
      if (product.category) {
        set.add(product.category);
      }
    });
    featuredProducts.forEach((product) => {
      if (product.category) {
        set.add(product.category);
      }
    });
    return Array.from(set);
  }, [products, featuredProducts]);

  const refreshProducts = async (nextFilters = filters) => {
    setLoadingProducts(true);
    try {
      const params = {
        q: nextFilters.q,
        sort: nextFilters.sort,
        page: nextFilters.page,
        limit: nextFilters.limit,
      };
      if (nextFilters.category !== 'All') {
        params.category = nextFilters.category;
      }

      const response = await productApi.list(params);
      setProducts(response.products || []);
      setPagination(response.pagination || { page: 1, pages: 1, total: 0, limit: nextFilters.limit });
    } catch (error) {
      setStatusMessage(error.message);
      setProducts([]);
    } finally {
      setLoadingProducts(false);
    }
  };

  useEffect(() => {
    refreshProducts(filters);
  }, [filters]);

  useEffect(() => {
    let active = true;

    const loadFeatured = async () => {
      setLoadingFeatured(true);
      try {
        const response = await productApi.list({ featured: true, limit: 8, sort: 'rating' });
        if (active) {
          setFeaturedProducts(response.products || []);
        }
      } catch {
        if (active) {
          setFeaturedProducts([]);
        }
      } finally {
        if (active) {
          setLoadingFeatured(false);
        }
      }
    };

    loadFeatured();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    const hydrateUser = async () => {
      if (!token) {
        if (active) {
          setUser(null);
          setCart({ items: [], subtotal: 0 });
          setOrders([]);
        }
        return;
      }

      try {
        const [meResponse, cartResponse] = await Promise.all([authApi.me(token), cartApi.get(token)]);
        if (!active) return;
        setUser(meResponse.user || null);
        setCart(cartResponse.cart || { items: [], subtotal: 0 });
      } catch {
        if (!active) return;
        localStorage.removeItem('ayanfe_token');
        setToken('');
        setUser(null);
      }
    };

    hydrateUser();

    return () => {
      active = false;
    };
  }, [token]);

  useEffect(() => {
    let active = true;

    const loadOrders = async () => {
      if (!token || !user) {
        setOrders([]);
        return;
      }

      setLoadingOrders(true);
      try {
        const response = await orderApi.mine(token);
        if (active) {
          setOrders(response.orders || []);
        }
      } catch {
        if (active) {
          setOrders([]);
        }
      } finally {
        if (active) {
          setLoadingOrders(false);
        }
      }
    };

    loadOrders();

    return () => {
      active = false;
    };
  }, [token, user]);

  const handleSearchChange = (value) => {
    setFilters((state) => ({ ...state, q: value, page: 1 }));
    if (!location.pathname.startsWith('/shop')) {
      navigate('/shop');
    }
  };

  const requireAuth = () => {
    setStatusMessage('Sign in to continue.');
    navigate('/account');
  };

  const addToCart = async (product) => {
    if (!token || !user) {
      requireAuth();
      return;
    }

    try {
      const response = await cartApi.add(token, { productId: product._id, quantity: 1 });
      setCart(response.cart || { items: [], subtotal: 0 });
      setStatusMessage(`${product.name} added to bag.`);
    } catch (error) {
      setStatusMessage(error.message);
    }
  };

  const updateCartItem = async (productId, quantity) => {
    if (!token) return;
    try {
      const response = await cartApi.update(token, productId, { quantity });
      setCart(response.cart || { items: [], subtotal: 0 });
    } catch (error) {
      setStatusMessage(error.message);
    }
  };

  const removeCartItem = async (productId) => {
    if (!token) return;
    try {
      const response = await cartApi.remove(token, productId);
      setCart(response.cart || { items: [], subtotal: 0 });
    } catch (error) {
      setStatusMessage(error.message);
    }
  };

  const clearCart = async () => {
    if (!token) return;
    try {
      const response = await cartApi.clear(token);
      setCart(response.cart || { items: [], subtotal: 0 });
    } catch (error) {
      setStatusMessage(error.message);
    }
  };

  const handleCheckout = async (event) => {
    event.preventDefault();
    if (!token || !user) {
      requireAuth();
      return;
    }

    if (cart.items.length === 0) {
      setStatusMessage('Your bag is empty.');
      return;
    }

    setCheckoutLoading(true);
    try {
      const response = await orderApi.create(token, { shippingAddress, paymentMethod: 'card' });
      setCart({ items: [], subtotal: 0 });
      setShippingAddress(initialShipping);
      setStatusMessage(`Order placed: ${response.order?._id || 'created'}`);
      navigate('/account');
    } catch (error) {
      setStatusMessage(error.message);
    } finally {
      setCheckoutLoading(false);
    }
  };

  const submitAuth = async (event) => {
    event.preventDefault();
    setAuthLoading(true);

    try {
      const response =
        authMode === 'login'
          ? await authApi.login({ email: authForm.email, password: authForm.password })
          : await authApi.register(authForm);

      localStorage.setItem('ayanfe_token', response.token);
      setToken(response.token);
      setAuthForm(initialAuth);
      setStatusMessage(response.message || 'Authentication successful.');
      navigate('/account');
    } catch (error) {
      setStatusMessage(error.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('ayanfe_token');
    setToken('');
    setUser(null);
    setCart({ items: [], subtotal: 0 });
    setOrders([]);
    setStatusMessage('Signed out.');
    navigate('/');
  };

  return (
    <SiteLayout
      user={user}
      onLogout={logout}
      cartCount={cartCount}
      statusMessage={statusMessage}
      clearStatus={() => setStatusMessage('')}
      searchValue={filters.q}
      onSearchChange={handleSearchChange}
    >
      <Routes>
        <Route
          path="/"
          element={<HomePage featuredProducts={featuredProducts} loading={loadingFeatured} onAddToCart={addToCart} onRequireAuth={requireAuth} />}
        />
        <Route
          path="/shop"
          element={
            <ShopPage
              filters={filters}
              setFilters={setFilters}
              products={products}
              pagination={pagination}
              loading={loadingProducts}
              categories={categoryOptions}
              onAddToCart={addToCart}
            />
          }
        />
        <Route path="/shop/:productId" element={<ProductPage onAddToCart={addToCart} />} />
        <Route
          path="/cart"
          element={
            <CartPage
              cart={cart}
              onUpdateItem={updateCartItem}
              onRemoveItem={removeCartItem}
              onClearCart={clearCart}
              shippingAddress={shippingAddress}
              setShippingAddress={setShippingAddress}
              onCheckout={handleCheckout}
              checkoutLoading={checkoutLoading}
            />
          }
        />
        <Route
          path="/account"
          element={
            <AccountPage
              user={user}
              authMode={authMode}
              setAuthMode={setAuthMode}
              authForm={authForm}
              setAuthForm={setAuthForm}
              onSubmitAuth={submitAuth}
              authLoading={authLoading}
              orders={orders}
              loadingOrders={loadingOrders}
            />
          }
        />
        <Route
          path="/admin"
          element={
            <AdminPage
              user={user}
              token={token}
              products={products}
              refreshProducts={() => refreshProducts(filters)}
              setStatusMessage={setStatusMessage}
            />
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </SiteLayout>
  );
}

export default App;
