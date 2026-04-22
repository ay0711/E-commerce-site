import { useEffect, useMemo, useState } from 'react';
import { Link, NavLink, Navigate, Route, Routes, useLocation, useNavigate, useParams } from 'react-router-dom';
import { authApi, cartApi, orderApi, productApi } from './api/client';
import './App.css';

const brandLogo = '/logo.png';

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

const coreCategories = [
  'Luxury Sets',
  'Essentials',
  'Occasion Wear',
  'Accessories',
  'Resort Edit',
  'Contemporary',
  'Outerwear',
  'Footwear',
];

const categoryDescriptions = {
  'Luxury Sets': 'Structured statement looks with polished tailoring.',
  Essentials: 'Everyday foundational pieces with premium construction.',
  'Occasion Wear': 'Event-ready silhouettes that own the room.',
  Accessories: 'Bags and finishing details for complete styling.',
  'Resort Edit': 'Lightweight elevated pieces for travel and leisure.',
  Contemporary: 'Modern urban edits with directional cuts.',
  Outerwear: 'Confident layers designed for movement and presence.',
  Footwear: 'Refined foundations from morning to evening.',
};

const formatCurrency = (value) => `$${Number(value || 0).toFixed(2)}`;
const slugifyCategory = (value) => String(value).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
const parseCategorySlug = (slug, options) => {
  const match = options.find((item) => slugifyCategory(item) === slug);
  return match || null;
};
const getItemProductId = (item) => (typeof item.product === 'string' ? item.product : item.product?._id);

function SiteLayout({ children, user, onLogout, cartCount, statusMessage, clearStatus, searchValue, onSearchChange }) {
  const navigate = useNavigate();

  return (
    <div className="app-shell">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />

      <header className="top-nav">
        <button className="brand" type="button" onClick={() => navigate('/')}>
          <img src={brandLogo} alt="Ayanfe Clothings" className="brand-logo" />
          <span>
            <strong>Ayanfe Clothings</strong>
            <small>Excellence In Every Detail</small>
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
            placeholder="Search products, categories, or style names"
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

function HomePage({ featuredProducts, loading, onAddToCart, onRequireAuth, categories }) {
  return (
    <>
      <section className="hero-section page-wrap">
        <div className="hero-copy card-surface">
          <p className="eyebrow">Spring Capsule 2026</p>
          <h1>Confident silhouettes for women who lead.</h1>
          <p>
            Ayanfe Clothings brings editorial-grade fashion into a clean, modern commerce experience built for speed,
            trust, and elegance.
          </p>
          <div className="hero-actions">
            <Link className="pill-button" to="/shop">
              Shop all
            </Link>
            <button className="pill-button ghost" type="button" onClick={onRequireAuth}>
              Become a member
            </button>
          </div>

          <div className="collection-strip">
            {categories.slice(0, 6).map((category) => (
              <Link key={category} to={`/collections/${slugifyCategory(category)}`} className="collection-pill">
                {category}
              </Link>
            ))}
          </div>
        </div>

        <div className="hero-panel">
          <p>Curated drops</p>
          <strong>{featuredProducts.length > 0 ? `${featuredProducts.length} top-rated picks` : 'Curating now'}</strong>
          <span>Secure checkout and tracked delivery across all orders.</span>
        </div>
      </section>

      <section className="featured-grid page-wrap">
        <div className="section-head">
          <h2>Featured products</h2>
          <Link to="/shop">Browse full catalog</Link>
        </div>

        <div className="product-grid">
          {loading ? <p className="empty-state">Loading featured products...</p> : null}
          {!loading && featuredProducts.length === 0 ? <p className="empty-state">No featured products available right now.</p> : null}

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

function FilterSidebar({ filters, setFilters, categories, onReset }) {
  return (
    <aside className="filters-sidebar card-surface">
      <div className="filters-head">
        <h3>Filters</h3>
        <button type="button" onClick={onReset}>
          Reset
        </button>
      </div>

      <label>
        Category
        <select
          value={filters.category}
          onChange={(event) => setFilters((state) => ({ ...state, category: event.target.value, page: 1 }))}
        >
          <option value="All">All</option>
          {categories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      </label>

      <label>
        Minimum price
        <input
          type="number"
          min="0"
          value={filters.minPrice}
          onChange={(event) => setFilters((state) => ({ ...state, minPrice: event.target.value, page: 1 }))}
        />
      </label>

      <label>
        Maximum price
        <input
          type="number"
          min="0"
          value={filters.maxPrice}
          onChange={(event) => setFilters((state) => ({ ...state, maxPrice: event.target.value, page: 1 }))}
        />
      </label>

      <label className="checkbox-line">
        <input
          type="checkbox"
          checked={filters.featuredOnly}
          onChange={(event) => setFilters((state) => ({ ...state, featuredOnly: event.target.checked, page: 1 }))}
        />
        Featured items only
      </label>
    </aside>
  );
}

function MobileFilterDrawer({ open, onClose, filters, setFilters, categories, onReset }) {
  return (
    <div className={open ? 'mobile-drawer open' : 'mobile-drawer'} aria-hidden={!open}>
      <button type="button" className="mobile-drawer-overlay" onClick={onClose} aria-label="Close filters" />
      <div className="mobile-drawer-panel card-surface">
        <div className="filters-head">
          <h3>Filter & Sort</h3>
          <button type="button" onClick={onClose}>
            Close
          </button>
        </div>

        <label>
          Category
          <select
            value={filters.category}
            onChange={(event) => setFilters((state) => ({ ...state, category: event.target.value, page: 1 }))}
          >
            <option value="All">All</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </label>

        <label>
          Minimum price
          <input
            type="number"
            min="0"
            value={filters.minPrice}
            onChange={(event) => setFilters((state) => ({ ...state, minPrice: event.target.value, page: 1 }))}
          />
        </label>

        <label>
          Maximum price
          <input
            type="number"
            min="0"
            value={filters.maxPrice}
            onChange={(event) => setFilters((state) => ({ ...state, maxPrice: event.target.value, page: 1 }))}
          />
        </label>

        <label className="checkbox-line">
          <input
            type="checkbox"
            checked={filters.featuredOnly}
            onChange={(event) => setFilters((state) => ({ ...state, featuredOnly: event.target.checked, page: 1 }))}
          />
          Featured items only
        </label>

        <label>
          Sort by
          <select
            value={filters.sort}
            onChange={(event) => setFilters((state) => ({ ...state, sort: event.target.value, page: 1 }))}
          >
            <option value="newest">Newest</option>
            <option value="price-asc">Price low-high</option>
            <option value="price-desc">Price high-low</option>
            <option value="rating">Top rated</option>
          </select>
        </label>

        <label>
          Items per page
          <select
            value={filters.limit}
            onChange={(event) => setFilters((state) => ({ ...state, limit: Number(event.target.value), page: 1 }))}
          >
            <option value={12}>12</option>
            <option value={24}>24</option>
            <option value={36}>36</option>
            <option value={48}>48</option>
          </select>
        </label>

        <button type="button" className="pill-button ghost" onClick={onReset}>
          Reset all filters
        </button>
      </div>
    </div>
  );
}

function ShopPage({ filters, setFilters, products, pagination, loading, categories, onAddToCart }) {
  const totalPages = pagination?.pages || 1;
  const page = pagination?.page || 1;
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    if (!drawerOpen) {
      document.body.style.overflow = '';
      return;
    }

    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, [drawerOpen]);

  const resetFilters = () => {
    setFilters((state) => ({
      ...state,
      category: 'All',
      minPrice: '',
      maxPrice: '',
      featuredOnly: false,
      sort: 'newest',
      page: 1,
    }));
  };

  return (
    <section className="page-wrap shop-page">
      <div className="section-head stack-mobile">
        <div>
          <h2>Shop all products</h2>
          <p>{pagination.total || 0} items available</p>
        </div>
        <div className="shop-actions">
          <button type="button" className="pill-button ghost mobile-drawer-trigger" onClick={() => setDrawerOpen(true)}>
            Filter & sort
          </button>
          <div className="inline-sort">
            <label>
              Sort
              <select
                value={filters.sort}
                onChange={(event) => setFilters((state) => ({ ...state, sort: event.target.value, page: 1 }))}
              >
                <option value="newest">Newest</option>
                <option value="price-asc">Price low-high</option>
                <option value="price-desc">Price high-low</option>
                <option value="rating">Top rated</option>
              </select>
            </label>
          </div>
        </div>
      </div>

      <div className="shop-layout">
        <FilterSidebar filters={filters} setFilters={setFilters} categories={categories} onReset={resetFilters} />

        <div>
          {loading ? <p className="empty-state">Loading products...</p> : null}
          {!loading && products.length === 0 ? <p className="empty-state">No products match the selected filters.</p> : null}

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
        </div>
      </div>

      <MobileFilterDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        filters={filters}
        setFilters={setFilters}
        categories={categories}
        onReset={resetFilters}
      />
    </section>
  );
}

function CategoryLandingPage({ categories, onAddToCart, categoryMetaByName }) {
  const { categorySlug } = useParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const resolvedCategory = useMemo(() => parseCategorySlug(categorySlug, categories), [categorySlug, categories]);
  const meta = resolvedCategory ? categoryMetaByName[resolvedCategory] : null;

  useEffect(() => {
    let active = true;

    const loadCategory = async () => {
      if (!resolvedCategory) {
        setProducts([]);
        setError('Collection not found.');
        return;
      }

      setLoading(true);
      setError('');
      try {
        const response = await productApi.list({ category: resolvedCategory, limit: 24, sort: 'rating' });
        if (active) {
          setProducts(response.products || []);
        }
      } catch (apiError) {
        if (active) {
          setError(apiError.message || 'Unable to load collection.');
          setProducts([]);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadCategory();

    return () => {
      active = false;
    };
  }, [resolvedCategory]);

  return (
    <section className="page-wrap collection-page">
      {resolvedCategory ? (
        <div className="collection-hero card-surface">
          <p className="eyebrow">Collection</p>
          <h2>{resolvedCategory}</h2>
          <p>{categoryDescriptions[resolvedCategory] || 'Curated pieces from this category.'}</p>
          {meta ? (
            <div className="collection-meta">
              <span>{meta.totalProducts} products</span>
              <span>{meta.featuredProducts} featured</span>
              <span>
                {formatCurrency(meta.minPrice)} - {formatCurrency(meta.maxPrice)}
              </span>
            </div>
          ) : null}
          <Link className="pill-button ghost" to="/shop">
            Back to shop
          </Link>
        </div>
      ) : null}

      {loading ? <p className="empty-state">Loading collection...</p> : null}
      {error ? <p className="empty-state">{error}</p> : null}

      <div className="product-grid">
        {products.map((product) => (
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
      <div className="detail-panel card-surface">
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
  const [tableQuery, setTableQuery] = useState('');
  const [tablePage, setTablePage] = useState(1);
  const [tablePageSize, setTablePageSize] = useState(15);

  const categories = useMemo(() => {
    const set = new Set(coreCategories);
    products.forEach((product) => {
      if (product.category) {
        set.add(product.category);
      }
    });
    return Array.from(set);
  }, [products]);

  const stats = useMemo(() => {
    if (!products.length) {
      return {
        total: 0,
        featured: 0,
        lowStock: 0,
        avgPrice: 0,
      };
    }

    const featured = products.filter((item) => item.featured).length;
    const lowStock = products.filter((item) => Number(item.stock || 0) < 10).length;
    const avgPrice = products.reduce((sum, item) => sum + Number(item.price || 0), 0) / products.length;

    return {
      total: products.length,
      featured,
      lowStock,
      avgPrice,
    };
  }, [products]);

  const filteredRows = useMemo(() => {
    const needle = tableQuery.trim().toLowerCase();
    if (!needle) {
      return products;
    }

    return products.filter((product) => {
      const haystack = `${product.name} ${product.slug} ${product.category}`.toLowerCase();
      return haystack.includes(needle);
    });
  }, [products, tableQuery]);

  const tablePages = useMemo(() => Math.max(Math.ceil(filteredRows.length / tablePageSize), 1), [filteredRows.length, tablePageSize]);
  const paginatedRows = useMemo(() => {
    const safePage = Math.min(tablePage, tablePages);
    const start = (safePage - 1) * tablePageSize;
    return filteredRows.slice(start, start + tablePageSize);
  }, [filteredRows, tablePage, tablePages, tablePageSize]);

  useEffect(() => {
    setTablePage(1);
  }, [tableQuery, tablePageSize, products.length]);

  const exportCsv = () => {
    const rows = filteredRows.map((product) => [
      product.name || '',
      product.slug || '',
      product.category || '',
      Number(product.price || 0).toFixed(2),
      String(product.stock ?? ''),
      product.featured ? 'yes' : 'no',
      product.image || '',
    ]);

    const header = ['name', 'slug', 'category', 'price', 'stock', 'featured', 'image'];
    const csvBody = [header, ...rows]
      .map((line) => line.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csvBody], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'ayanfe-products.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

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
    <section className="page-wrap admin-page">
      <div className="admin-stats-grid">
        <article className="stat-card card-surface">
          <span>Total products</span>
          <strong>{stats.total}</strong>
        </article>
        <article className="stat-card card-surface">
          <span>Featured products</span>
          <strong>{stats.featured}</strong>
        </article>
        <article className="stat-card card-surface">
          <span>Low stock (&lt; 10)</span>
          <strong>{stats.lowStock}</strong>
        </article>
        <article className="stat-card card-surface">
          <span>Average price</span>
          <strong>{formatCurrency(stats.avgPrice)}</strong>
        </article>
      </div>

      <div className="admin-layout">
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
          <label className="checkbox-line full-width">
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

        <div className="admin-table-wrap card-surface">
          <div className="section-head stack-mobile">
            <div>
              <h2>Catalog table</h2>
              <p>{filteredRows.length} visible rows</p>
            </div>
            <div className="table-toolbar">
              <label className="table-search">
                Search rows
                <input value={tableQuery} onChange={(event) => setTableQuery(event.target.value)} placeholder="Name, slug, category" />
              </label>
              <label className="table-page-size">
                Rows
                <select value={tablePageSize} onChange={(event) => setTablePageSize(Number(event.target.value))}>
                  <option value={10}>10</option>
                  <option value={15}>15</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
              </label>
              <button type="button" className="pill-button ghost" onClick={exportCsv}>
                Export CSV
              </button>
            </div>
          </div>

          <div className="table-scroll">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Featured</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedRows.map((product) => (
                  <tr key={product._id || product.slug}>
                    <td>{product.name}</td>
                    <td>{product.category}</td>
                    <td>{formatCurrency(product.price)}</td>
                    <td>{product.stock}</td>
                    <td>{product.featured ? 'Yes' : 'No'}</td>
                    <td>
                      <div className="row-actions">
                        <button type="button" onClick={() => startEdit(product)}>
                          Edit
                        </button>
                        <button type="button" onClick={() => remove(product._id)}>
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="table-pagination">
            <button type="button" disabled={tablePage <= 1} onClick={() => setTablePage((state) => Math.max(state - 1, 1))}>
              Previous
            </button>
            <span>
              Page {Math.min(tablePage, tablePages)} of {tablePages}
            </span>
            <button
              type="button"
              disabled={tablePage >= tablePages}
              onClick={() => setTablePage((state) => Math.min(state + 1, tablePages))}
            >
              Next
            </button>
          </div>
        </div>
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
    minPrice: '',
    maxPrice: '',
    featuredOnly: false,
    sort: 'newest',
    page: 1,
    limit: 24,
  });

  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0, limit: 24 });
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [categoryMetaByName, setCategoryMetaByName] = useState({});

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
    const set = new Set(coreCategories);
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
      if (nextFilters.minPrice !== '') {
        params.minPrice = nextFilters.minPrice;
      }
      if (nextFilters.maxPrice !== '') {
        params.maxPrice = nextFilters.maxPrice;
      }
      if (nextFilters.featuredOnly) {
        params.featured = true;
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

    const loadCategoryMeta = async () => {
      try {
        const response = await productApi.categoryMeta();
        if (!active) return;

        const map = {};
        (response.categories || []).forEach((item) => {
          if (item.category) {
            map[item.category] = item;
          }
        });

        setCategoryMetaByName(map);
      } catch {
        if (active) {
          setCategoryMetaByName({});
        }
      }
    };

    loadCategoryMeta();

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
          element={
            <HomePage
              featuredProducts={featuredProducts}
              loading={loadingFeatured}
              onAddToCart={addToCart}
              onRequireAuth={requireAuth}
              categories={categoryOptions}
            />
          }
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
          path="/collections/:categorySlug"
          element={
            <CategoryLandingPage
              categories={categoryOptions}
              onAddToCart={addToCart}
              categoryMetaByName={categoryMetaByName}
            />
          }
        />
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
