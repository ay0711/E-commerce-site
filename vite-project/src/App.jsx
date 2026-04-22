import { useEffect, useMemo, useState } from 'react';
import { authApi, cartApi, orderApi, productApi } from './api/client';
import { fallbackProducts } from './api/mockProducts';
import './App.css';

const assurances = [
  'Encrypted checkout',
  'Fast nationwide shipping',
  'Easy size exchanges',
  'Premium packaging',
];

const servicePoints = [
  '24-hour order processing',
  'Tracked deliveries',
  'Fraud-aware checkout flow',
];

const testimonials = [
  {
    quote:
      'The fit, finishing, and packaging feel premium. It looks like a brand that already knows where it is going.',
    author: 'Customer review',
  },
  {
    quote:
      'The storefront is calm, sharp, and easy to shop. The luxury feel is there without being crowded.',
    author: 'Style buyer',
  },
];

const initialShipping = {
  fullName: '',
  line1: '',
  city: '',
  state: '',
  postalCode: '',
  country: '',
  phone: '',
};

const initialAdminProductForm = {
  name: '',
  slug: '',
  category: 'Essentials',
  price: '',
  stock: '',
  image: '',
  description: '',
  featured: false,
};

const categoryAccentMap = {
  'Luxury Sets': 'from-gold',
  Essentials: 'from-rose',
  'Occasion Wear': 'from-plum',
  Accessories: 'from-copper',
};

const getCardAccent = (category) => categoryAccentMap[category] || 'from-slate';

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M10.5 4a6.5 6.5 0 1 0 4.17 11.49l4.92 4.92 1.41-1.41-4.92-4.92A6.5 6.5 0 0 0 10.5 4Zm0 2a4.5 4.5 0 1 1 0 9 4.5 4.5 0 0 1 0-9Z" />
    </svg>
  );
}

function CartIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M7 4h-2l-1 2H1v2h2l3.6 7.59-1.35 2.45A2 2 0 0 0 7 21h11v-2H7l1.1-2h7.45a2 2 0 0 0 1.8-1.12L22 7H6.42L5.73 5.6H7V4Zm2.16 7-1-2h11.2l-1.33 3.2a.5.5 0 0 1-.46.3H9.16Zm-.66 8a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3Zm8 0a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3Z" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 2 4 5v6c0 5.25 3.44 9.87 8 11 4.56-1.13 8-5.75 8-11V5l-8-3Zm0 18c-3.28-.96-6-4.63-6-9V6.3l6-2.25 6 2.25V11c0 4.37-2.72 8.04-6 9Zm-1-4.5 6-6-1.41-1.41L11 13.17l-2.59-2.58L7 12l4 3.5Z" />
    </svg>
  );
}

function SparkIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="m12 2 1.89 5.06L19 9l-5.11 1.94L12 16l-1.89-5.06L5 9l5.11-1.94L12 2Zm7 10 1.03 2.75L23 16l-2.97 1.25L19 20l-1.03-2.75L15 16l2.97-1.25L19 12Zm-14 0 1.03 2.75L9 16l-2.97 1.25L5 20l-1.03-2.75L1 16l2.97-1.25L5 12Z" />
    </svg>
  );
}

function StarIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="m12 2 3.09 6.26L22 9.27l-5 4.88 1.18 6.89L12 17.97l-6.18 3.07L7 14.15 2 9.27l6.91-1.01L12 2Z" />
    </svg>
  );
}

function TruckIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M3 5h11v11H3V5Zm13 3h3.5L22 11v5h-2a3 3 0 0 1-6 0H9a3 3 0 0 1-6 0H1v-2h2.1A3 3 0 0 1 7 11c1.45 0 2.7 1.03 2.96 2.4H14V8Zm0 2v2h2.5L15 10Zm-10 7a1 1 0 1 0 0 2 1 1 0 0 0 0-2Zm10 0a1 1 0 1 0 0 2 1 1 0 0 0 0-2Z" />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 6h16v2H4V6Zm0 5h16v2H4v-2Zm0 5h16v2H4v-2Z" />
    </svg>
  );
}

function App() {
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [products, setProducts] = useState([]);
  const [token, setToken] = useState(localStorage.getItem('ayanfe_token') || '');
  const [user, setUser] = useState(null);
  const [cart, setCart] = useState({ items: [], subtotal: 0 });
  const [authForm, setAuthForm] = useState({ name: '', email: '', password: '' });
  const [authMode, setAuthMode] = useState('login');
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [showAuthPanel, setShowAuthPanel] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [shippingAddress, setShippingAddress] = useState(initialShipping);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [adminBusy, setAdminBusy] = useState(false);
  const [editingProductId, setEditingProductId] = useState('');
  const [adminProductForm, setAdminProductForm] = useState(initialAdminProductForm);

  const cartCount = useMemo(
    () => cart.items.reduce((total, item) => total + item.quantity, 0),
    [cart.items]
  );

  const visibleProducts = useMemo(() => {
    let filtered = products;

    if (activeCategory !== 'All') {
      filtered = filtered.filter((product) => product.category === activeCategory);
    }

    if (searchTerm.trim()) {
      const needle = searchTerm.toLowerCase();
      filtered = filtered.filter((product) => {
        const haystack = `${product.name} ${product.description} ${product.category}`.toLowerCase();
        return haystack.includes(needle);
      });
    }

    return filtered;
  }, [products, activeCategory, searchTerm]);

  const featuredProduct = useMemo(
    () => products.find((product) => product.featured) || products[0],
    [products]
  );

  const catalogCategories = useMemo(() => {
    const set = new Set();
    products.forEach((product) => {
      if (product.category) {
        set.add(product.category);
      }
    });
    return ['All', ...Array.from(set)];
  }, [products]);

  const productCounts = useMemo(() => {
    const counts = products.reduce((acc, product) => {
      acc[product.category] = (acc[product.category] || 0) + 1;
      return acc;
    }, {});

    return counts;
  }, [products]);

  const refreshProducts = async () => {
    setLoadingProducts(true);
    try {
      const response = await productApi.list({ limit: 120 });
      setProducts(response.products || []);
    } catch (error) {
      setProducts(fallbackProducts);
      setStatusMessage('Using local catalog preview while backend is unavailable.');
    } finally {
      setLoadingProducts(false);
    }
  };

  useEffect(() => {
    refreshProducts();
  }, []);

  useEffect(() => {
    const hydrateUser = async () => {
      if (!token) {
        setUser(null);
        setCart({ items: [], subtotal: 0 });
        return;
      }

      try {
        const [meRes, cartRes] = await Promise.all([authApi.me(token), cartApi.get(token)]);
        setUser(meRes.user || null);
        setCart(cartRes.cart || { items: [], subtotal: 0 });
      } catch (error) {
        localStorage.removeItem('ayanfe_token');
        setToken('');
        setUser(null);
      }
    };

    hydrateUser();
  }, [token]);

  const addToCart = async (product) => {
    if (!user || !token) {
      setShowAuthPanel(true);
      setStatusMessage('Sign in to add items to cart.');
      return;
    }

    try {
      const response = await cartApi.add(token, { productId: product._id, quantity: 1 });
      setCart(response.cart);
      setStatusMessage(`${product.name} added to your bag.`);
    } catch (error) {
      setStatusMessage(error.message);
    }
  };

  const submitAuth = async (event) => {
    event.preventDefault();
    setAuthLoading(true);
    setStatusMessage('');

    try {
      const response =
        authMode === 'login'
          ? await authApi.login({ email: authForm.email, password: authForm.password })
          : await authApi.register(authForm);

      localStorage.setItem('ayanfe_token', response.token);
      setToken(response.token);
      setAuthForm({ name: '', email: '', password: '' });
      setShowAuthPanel(false);
      setStatusMessage(response.message || 'Authentication successful.');
    } catch (error) {
      setStatusMessage(error.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleCheckout = async (event) => {
    event.preventDefault();
    if (!token || !user) {
      setShowAuthPanel(true);
      setStatusMessage('Sign in to place your order.');
      return;
    }

    if (cart.items.length === 0) {
      setStatusMessage('Your cart is empty. Add items before checkout.');
      return;
    }

    setCheckoutLoading(true);

    try {
      const response = await orderApi.create(token, {
        shippingAddress,
        paymentMethod: 'card',
      });

      setCart({ items: [], subtotal: 0 });
      setShowCheckout(false);
      setShippingAddress(initialShipping);
      setStatusMessage(`Order placed successfully. Order id: ${response.order?._id || 'created'}.`);
    } catch (error) {
      setStatusMessage(error.message);
    } finally {
      setCheckoutLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('ayanfe_token');
    setToken('');
    setUser(null);
    setCart({ items: [], subtotal: 0 });
    setStatusMessage('Signed out successfully.');
    setShowAdminPanel(false);
    setEditingProductId('');
    setAdminProductForm(initialAdminProductForm);
  };

  const upsertProduct = async (event) => {
    event.preventDefault();
    if (!token || user?.role !== 'admin') {
      setStatusMessage('Admin access required.');
      return;
    }

    setAdminBusy(true);
    try {
      const payload = {
        name: adminProductForm.name,
        slug: adminProductForm.slug,
        category: adminProductForm.category,
        description: adminProductForm.description,
        image: adminProductForm.image,
        price: Number(adminProductForm.price),
        stock: Number(adminProductForm.stock),
        featured: Boolean(adminProductForm.featured),
      };

      if (editingProductId) {
        await productApi.update(token, editingProductId, payload);
        setStatusMessage('Product updated successfully.');
      } else {
        await productApi.create(token, payload);
        setStatusMessage('Product created successfully.');
      }

      setEditingProductId('');
      setAdminProductForm(initialAdminProductForm);
      await refreshProducts();
    } catch (error) {
      setStatusMessage(error.message);
    } finally {
      setAdminBusy(false);
    }
  };

  const startEditProduct = (product) => {
    setEditingProductId(product._id);
    setShowAdminPanel(true);
    setAdminProductForm({
      name: product.name || '',
      slug: product.slug || '',
      category: product.category || 'Essentials',
      price: String(product.price ?? ''),
      stock: String(product.stock ?? ''),
      image: product.image || '',
      description: product.description || '',
      featured: Boolean(product.featured),
    });
  };

  const removeProduct = async (productId) => {
    if (!token || user?.role !== 'admin') {
      setStatusMessage('Admin access required.');
      return;
    }

    setAdminBusy(true);
    try {
      await productApi.remove(token, productId);
      setStatusMessage('Product deleted successfully.');
      await refreshProducts();

      if (editingProductId === productId) {
        setEditingProductId('');
        setAdminProductForm(initialAdminProductForm);
      }
    } catch (error) {
      setStatusMessage(error.message);
    } finally {
      setAdminBusy(false);
    }
  };

  return (
    <main className="site-shell">
      <header className="topbar">
        <div className="brand-lockup">
          <div className="brand-mark">
            <SparkIcon />
          </div>
          <div>
            <span className="brand-kicker">Ayanfe Clothings</span>
            <strong>Luxury wear, made to move.</strong>
          </div>
        </div>

        <label className="search-bar" aria-label="Search products">
          <SearchIcon />
          <input
            type="search"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search dresses, sets, totes, and more"
          />
        </label>

        <div className="topbar-actions">
          {!user ? (
            <button className="secondary-button auth-button" type="button" onClick={() => setShowAuthPanel((state) => !state)}>
              {showAuthPanel ? 'Close' : 'Sign in'}
            </button>
          ) : (
            <button className="secondary-button auth-button" type="button" onClick={logout}>
              Logout
            </button>
          )}
          {user?.role === 'admin' ? (
            <button className="secondary-button auth-button" type="button" onClick={() => setShowAdminPanel((state) => !state)}>
              {showAdminPanel ? 'Hide admin' : 'Admin'}
            </button>
          ) : null}
          <button className="icon-button mobile-only" type="button" aria-label="Open menu">
            <MenuIcon />
          </button>
          <button className="icon-button" type="button" aria-label="View cart" onClick={() => setShowCheckout((state) => !state)}>
            <CartIcon />
            <span className="badge">{cartCount}</span>
          </button>
        </div>
      </header>

      {statusMessage ? <p className="status-banner">{statusMessage}</p> : null}

      {showAuthPanel ? (
        <section className="auth-panel reveal" aria-live="polite">
          <div className="section-heading split">
            <div>
              <p className="eyebrow">{authMode === 'login' ? 'Welcome back' : 'Create account'}</p>
              <h2>{authMode === 'login' ? 'Sign in to manage your cart.' : 'Join Ayanfe Clothings today.'}</h2>
            </div>
            <p className="section-copy">Your account lets you save your cart, track orders, and checkout securely.</p>
          </div>

          <form className="auth-form" onSubmit={submitAuth}>
            {authMode === 'register' ? (
              <label>
                Name
                <input
                  value={authForm.name}
                  onChange={(event) => setAuthForm((state) => ({ ...state, name: event.target.value }))}
                  placeholder="Ayanfe customer"
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
                placeholder="you@example.com"
                required
              />
            </label>

            <label>
              Password
              <input
                type="password"
                value={authForm.password}
                onChange={(event) => setAuthForm((state) => ({ ...state, password: event.target.value }))}
                placeholder="At least 8 characters"
                minLength={8}
                required
              />
            </label>

            <div className="auth-actions">
              <button className="primary-button" type="submit" disabled={authLoading}>
                {authLoading ? 'Please wait...' : authMode === 'login' ? 'Sign in' : 'Create account'}
              </button>
              <button
                type="button"
                className="secondary-button"
                onClick={() => setAuthMode((state) => (state === 'login' ? 'register' : 'login'))}
              >
                {authMode === 'login' ? 'Need an account?' : 'Already have an account?'}
              </button>
            </div>
          </form>
        </section>
      ) : null}

      <section className="hero-grid">
        <div className="hero-copy reveal">
          <p className="eyebrow">Spring 2026 drop</p>
          <h1>Sharp silhouettes for the modern Ayanfe woman.</h1>
          <p className="hero-text">
            Ayanfe Clothings blends elegant tailoring, calm luxury, and fast, secure shopping into one premium storefront experience.
          </p>

          <div className="hero-actions">
            <button className="primary-button" type="button" onClick={() => document.getElementById('product-grid')?.scrollIntoView({ behavior: 'smooth' })}>
              Shop the drop
            </button>
            <button className="secondary-button" type="button" onClick={() => setShowCheckout(true)}>
              Checkout now
            </button>
          </div>

          <div className="hero-metrics">
            <div>
              <strong>48h</strong>
              <span>fast dispatch</span>
            </div>
            <div>
              <strong>4.9/5</strong>
              <span>customer rating</span>
            </div>
            <div>
              <strong>100%</strong>
              <span>secure checkout</span>
            </div>
          </div>
        </div>

        <div className="hero-visual reveal delay-1">
          <div className="floating-card card-a">
            <span>Featured style</span>
            <strong>{featuredProduct?.name || 'Signature Draped Set'}</strong>
            <p>{featuredProduct?.description || 'Clean lines, premium finish, instant confidence.'}</p>
          </div>

          <div className="showcase-panel">
            <div className="showcase-orb orb-one" />
            <div className="showcase-orb orb-two" />
            <div className="showcase-product">
              <div className="product-glow" />
              <span className="product-tag">New arrival</span>
              <h2>Elevated essentials with a luxury edge.</h2>
              <p>Built for the woman who wants a polished brand experience that feels premium from landing page to checkout.</p>
              <div className="product-stats">
                <div>
                  <ShieldIcon />
                  <span>Secure by default</span>
                </div>
                <div>
                  <TruckIcon />
                  <span>Tracked delivery</span>
                </div>
              </div>
            </div>
          </div>

          <div className="floating-card card-b">
            <span>This week</span>
            <strong>{cartCount > 0 ? `${cartCount} items in bag` : 'Your bag is waiting'}</strong>
            <p>Modern workflow, clean fulfillment, premium packaging.</p>
          </div>
        </div>
      </section>

      <section className="assurance-strip reveal delay-2">
        {assurances.map((item) => (
          <div key={item} className="assurance-chip">
            <ShieldIcon />
            <span>{item}</span>
          </div>
        ))}
      </section>

      <section className="section-block reveal delay-2">
        <div className="section-heading">
          <p className="eyebrow">Shop by mood</p>
          <h2>From everyday essentials to elevated occasion pieces.</h2>
        </div>
        <div className="category-row">
          {catalogCategories.map((category) => (
            <button
              key={category}
              className={category === activeCategory ? 'category-pill active' : 'category-pill'}
              type="button"
              onClick={() => setActiveCategory(category)}
            >
              <span>{category}</span>
              {category !== 'All' ? <strong>{productCounts[category] || 0}</strong> : <strong>{products.length}</strong>}
            </button>
          ))}
        </div>
      </section>

      {user?.role === 'admin' && showAdminPanel ? (
        <section className="admin-panel reveal delay-2">
          <div className="section-heading split">
            <div>
              <p className="eyebrow">Admin dashboard</p>
              <h2>Manage products, stock, and featured visibility.</h2>
            </div>
            <p className="section-copy">{products.length} products currently in catalog.</p>
          </div>

          <form className="admin-form" onSubmit={upsertProduct}>
            <label>
              Product name
              <input
                value={adminProductForm.name}
                onChange={(event) => setAdminProductForm((state) => ({ ...state, name: event.target.value }))}
                required
              />
            </label>
            <label>
              Slug
              <input
                value={adminProductForm.slug}
                onChange={(event) => setAdminProductForm((state) => ({ ...state, slug: event.target.value }))}
                required
              />
            </label>
            <label>
              Category
              <select
                value={adminProductForm.category}
                onChange={(event) => setAdminProductForm((state) => ({ ...state, category: event.target.value }))}
              >
                {['Essentials', 'Luxury Sets', 'Occasion Wear', 'Accessories'].map((category) => (
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
                value={adminProductForm.price}
                onChange={(event) => setAdminProductForm((state) => ({ ...state, price: event.target.value }))}
                required
              />
            </label>
            <label>
              Stock
              <input
                type="number"
                min="0"
                value={adminProductForm.stock}
                onChange={(event) => setAdminProductForm((state) => ({ ...state, stock: event.target.value }))}
                required
              />
            </label>
            <label>
              Image URL
              <input
                value={adminProductForm.image}
                onChange={(event) => setAdminProductForm((state) => ({ ...state, image: event.target.value }))}
                required
              />
            </label>
            <label className="span-all">
              Description
              <textarea
                value={adminProductForm.description}
                onChange={(event) => setAdminProductForm((state) => ({ ...state, description: event.target.value }))}
                rows={3}
                required
              />
            </label>
            <label className="feature-toggle span-all">
              <input
                type="checkbox"
                checked={adminProductForm.featured}
                onChange={(event) => setAdminProductForm((state) => ({ ...state, featured: event.target.checked }))}
              />
              Mark as featured
            </label>

            <div className="auth-actions span-all">
              <button className="primary-button" type="submit" disabled={adminBusy}>
                {adminBusy ? 'Saving...' : editingProductId ? 'Update product' : 'Create product'}
              </button>
              <button
                className="secondary-button"
                type="button"
                onClick={() => {
                  setEditingProductId('');
                  setAdminProductForm(initialAdminProductForm);
                }}
              >
                Clear form
              </button>
            </div>
          </form>

          <div className="admin-product-list">
            {products.slice(0, 20).map((product) => (
              <article key={product._id || product.slug} className="admin-product-row">
                <div>
                  <strong>{product.name}</strong>
                  <p>{product.category}</p>
                </div>
                <div>
                  <span>${Number(product.price || 0).toFixed(2)}</span>
                  <small>Stock {product.stock}</small>
                </div>
                <div className="admin-row-actions">
                  <button type="button" className="secondary-button mini-button" onClick={() => startEditProduct(product)}>
                    Edit
                  </button>
                  <button type="button" className="secondary-button mini-button" onClick={() => removeProduct(product._id)}>
                    Delete
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      <section className="section-block reveal delay-3" id="product-grid">
        <div className="section-heading split">
          <div>
            <p className="eyebrow">Curated collection</p>
            <h2>Products designed to feel editorial and convert like a flagship store.</h2>
          </div>
          <div className="catalog-summary">
            <p className="section-copy">
              {loadingProducts ? 'Loading products...' : `${visibleProducts.length} of ${products.length} products ready to shop.`}
            </p>
            <button
              type="button"
              className="secondary-button mini-button"
              onClick={() => {
                setActiveCategory('All');
                setSearchTerm('');
              }}
            >
              Reset filters
            </button>
          </div>
        </div>

        <div className="product-grid">
          {visibleProducts.map((product, index) => (
            <article
              key={product._id || product.slug || product.name}
              className={`product-card ${getCardAccent(product.category)}`}
              style={{ '--delay': `${index * 80}ms` }}
            >
              <div
                className="card-visual"
                style={{
                  backgroundImage: `linear-gradient(160deg, rgba(31,26,23,0.72), rgba(102,74,46,0.58)), url(${product.image})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
              >
                <span>{product.featured ? 'Featured' : 'In stock'}</span>
                <div className="card-shape" />
              </div>
              <div className="product-meta">
                <div>
                  <p>{product.category}</p>
                  <h3>{product.name}</h3>
                </div>
                <div className="rating-line">
                  <StarIcon />
                  <span>{Number(product.rating || 0).toFixed(1)}</span>
                </div>
              </div>
              <div className="product-footer">
                <strong>${Number(product.price || 0).toFixed(2)}</strong>
                <button type="button" onClick={() => addToCart(product)}>
                  Add to bag
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      {showCheckout ? (
        <section className="checkout-panel reveal delay-2">
          <div className="section-heading split">
            <div>
              <p className="eyebrow">Checkout</p>
              <h2>Secure payment and delivery details.</h2>
            </div>
            <p className="section-copy">Subtotal: ${Number(cart.subtotal || 0).toFixed(2)}.</p>
          </div>

          <form className="checkout-form" onSubmit={handleCheckout}>
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

            <div className="auth-actions">
              <button type="submit" className="primary-button" disabled={checkoutLoading}>
                {checkoutLoading ? 'Placing order...' : 'Place order'}
              </button>
              <button type="button" className="secondary-button" onClick={() => setShowCheckout(false)}>
                Close
              </button>
            </div>
          </form>
        </section>
      ) : null}

      <section className="story-grid reveal delay-3">
        <div className="story-card story-panel">
          <p className="eyebrow">Operations-first</p>
          <h2>Security, trust, and fulfillment should feel built in.</h2>
          <ul>
            {servicePoints.map((point) => (
              <li key={point}>{point}</li>
            ))}
          </ul>
        </div>
        <div className="story-card testimonials">
          {testimonials.map((item) => (
            <blockquote key={item.author}>
              <p>“{item.quote}”</p>
              <footer>{item.author}</footer>
            </blockquote>
          ))}
        </div>
      </section>

      <section className="newsletter reveal delay-3">
        <div>
          <p className="eyebrow">Stay updated</p>
          <h2>Get new drops, restocks, and private offers first.</h2>
        </div>
        <form className="newsletter-form" onSubmit={(event) => event.preventDefault()}>
          <input type="email" placeholder="Enter your email address" aria-label="Email address" />
          <button type="submit">Join the list</button>
        </form>
      </section>

      <footer className="site-footer">
        <div>
          <strong>Ayanfe Clothings</strong>
          <p>Elegant fashion storefront with a secure, conversion-focused shopping experience.</p>
        </div>
        <div>
          <span>Secure checkout</span>
          <span>Responsive by design</span>
          <span>Built for scale</span>
        </div>
      </footer>
    </main>
  );
}

export default App;
