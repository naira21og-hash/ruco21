function StoreHeader() {
  const { itemCount, openCart } = Ch();
  const location = Sr();
  const [menu, setMenu] = w.useState(false),
    [search, setSearch] = w.useState(false),
    [query, setQuery] = w.useState("");
  w.useEffect(() => {
    setMenu(false);
    setSearch(false);
  }, [location.pathname, location.search]);
  const links = [
    ["Home", "/"],
    ["Shop", "/catalog"],
    ["Reviews", "/reviews"],
    ["Reseller guide", "/reselling-guide"],
    ["About", "/about"],
    ["Contact", "/contact"],
  ];
  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <header className="store-header">
        <div className="header-inner container">
          <Ge className="wordmark" to="/">
            {storeSite.wordmark}
            <span>{storeSite.suffix}</span>
          </Ge>
          <nav className="desktop-nav" aria-label="Primary navigation">
            {links.map(([text, url]) => (
              <Ge key={url} to={url}>
                {text}
              </Ge>
            ))}
          </nav>
          <div className="header-actions">
            <div className="desktop-currency">
              <StoreCurrency />
            </div>
            <button
              className="icon-button"
              aria-label="Search products"
              onClick={() => setSearch(true)}
            >
              <Lb size={20} />
            </button>
            <button
              className="cart-link"
              aria-label={`Open cart with ${itemCount} items`}
              onClick={openCart}
            >
              <StoreBag size={20} />
              {itemCount > 0 && <span className="cart-count">{itemCount}</span>}
            </button>
            <button
              className="icon-button menu-toggle"
              aria-label={
                menu ? "Close navigation menu" : "Open navigation menu"
              }
              aria-expanded={menu}
              onClick={() => setMenu(!menu)}
            >
              {menu ? "×" : <IA size={20} />}
            </button>
          </div>
        </div>
        {menu && (
          <div className="mobile-menu container">
            <StoreCurrency />
            <nav className="mobile-nav" aria-label="Main navigation">
              {links.map(([text, url]) => (
                <Ge
                  key={url}
                  to={url}
                  className={location.pathname === url ? "active" : ""}
                >
                  {text}
                </Ge>
              ))}
            </nav>
          </div>
        )}
      </header>
      {location.pathname === "/" && <div className="brand-stripe" />}
      {search && (
        <StoreDialog
          title="Search the collection"
          onClose={() => setSearch(false)}
          className="search-dialog"
        >
          <form action="/catalog">
            <div className="search-field">
              <input
                aria-label="Search products"
                autoFocus
                name="q"
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Product, brand, category or SKU"
              />
              <button className="text-link">Search →</button>
            </div>
          </form>
          <div className="search-results">
            {storeCatalog.products
              .filter((p) => storeSearch(p, query))
              .slice(0, 5)
              .map((p) => (
                <Ge key={p.id} to={storeSlug(p)}>
                  <StoreImage product={p} />
                  <span>
                    {p.name}
                    <small>{storePrice(p)}</small>
                  </span>
                </Ge>
              ))}
          </div>
          {!storeCatalog.products.some((p) => storeSearch(p, query)) && (
            <p>No matching products.</p>
          )}
        </StoreDialog>
      )}
    </>
  );
}
function StoreFooter() {
  return (
    <footer className="store-footer">
      <div className="container">
        <div className="community">
          <h2>Stay close to the collection.</h2>
          <p>
            Get in touch for current availability, new finds and support with
            your next order.
          </p>
          <a
            className="button"
            href="https://t.me/rucodaog"
            target="_blank"
            rel="noopener noreferrer"
          >
            Connect on Telegram ↗
          </a>
        </div>
        <div className="footer-top">
          <div>
            <Ge className="wordmark" to="/">
              {storeSite.wordmark}
              <span>{storeSite.suffix}</span>
            </Ge>
            <p>
              Technology, everyday finds and resources for your next resale.
              Explore the collection and order with personal support.
            </p>
            <div id="store-language-slot" />
          </div>
          <div>
            <h3>Explore</h3>
            <Ge to="/">Home</Ge>
            <Ge to="/catalog">Shop the collection</Ge>
            <Ge to="/reviews">Reviews</Ge>
            <Ge to="/reselling-guide">Reseller resources</Ge>
            <Ge to="/about">About us</Ge>
            <Ge to="/contact">Contact</Ge>
          </div>
          <div>
            <h3>Information</h3>
            <Ge to="/terms">Terms & conditions</Ge>
            <Ge to="/terms">Delivery & returns</Ge>
            <Ge to="/privacy">Privacy policy</Ge>
            <Ge to="/contact">Customer support</Ge>
            <StoreCurrency />
          </div>
        </div>
        <div className="footer-bottom">
          © {new Date().getFullYear()} {storeSite.name}. Availability and order
          details confirmed before payment.
        </div>
      </div>
    </footer>
  );
}
function StoreCard({ product: p }) {
  return (
    <article className="product-card">
      <Ge
        to={storeSlug(p)}
        className="product-picture"
        aria-label={`View ${p.name}`}
      >
        <StoreImage product={p} />
        {p.isNew && <span className="product-new-label">New</span>}
        {p.images.length > 1 && (
          <StoreImage product={p} index={1} className="alternate-image" />
        )}
        <span className="availability-label">
          {p.priceOnRequest ? "On request" : storeAvailable(p) ? "Available" : "Unavailable"}
        </span>
        {p.images.length > 1 && (
          <span className="image-count">{p.images.length} images</span>
        )}
        <span className="card-arrow">↗</span>
      </Ge>
      <div className="card-topline">{storeCategory(p.category)?.name}</div>
      <Ge className="product-name" to={storeSlug(p)}>
        {p.name}
      </Ge>
      <p className="card-descriptor">{p.descriptor || p.subcategory}</p>
      <p className="card-condition">{storeCondition(p)}</p>
      <Ge className="text-link card-view" to={storeSlug(p)}>
        View product
      </Ge>
      <p className="product-price">
        {storePrice(p)}
        {p.previousPrice > p.price && <del>{storeMoney(p.previousPrice)}</del>}
      </p>
      <p className="stock-note">
        {p.deliverySummary || "Delivery confirmed before payment"}
      </p>
    </article>
  );
}
function StoreCollection({
  title,
  eyebrow,
  products,
  link = "/catalog",
  description,
  className = "",
}) {
  if (!products.length) return null;
  return (
    <section className={`collection-section ${className}`}>
      <div className="container">
        <div className="section-heading">
          <div>
            <p className="eyebrow">{eyebrow}</p>
            <h2>{title}</h2>
          </div>
          {description ? (
            <p className="muted">{description}</p>
          ) : (
            <Ge className="text-link" to={link}>
              View all →
            </Ge>
          )}
        </div>
        <div className="product-grid">
          {products.map((p) => (
            <StoreCard key={p.id} product={p} />
          ))}
        </div>
      </div>
    </section>
  );
}
function StoreHome() {
  const products = storeCatalog.products;
  const latest = [...products].sort(
    (a, b) =>
      storePropsLast(a, b) || (b.createdAt || "").localeCompare(a.createdAt || "") || b.id - a.id,
  );
  const featured = products.filter(p => p.bestSeller);

  return (
    <StoreShell
      title="Discover the collection"
      description="Technology, everyday finds and reseller resources. Browse our changing collection and arrange your order with personal support."
    >
      <section className="hero container">
        <div className="hero-copy">
          <p className="eyebrow">
            <span className="red-dot" />
            Curated finds. Personal service.
          </p>
          <h1>
            <span>RUCO</span>
            <span><b>SUPPLY</b></span>
          </h1>
          <h2>Find your next opportunity.</h2>
          <p>
            Discover technology, everyday products and reseller resources in one
            changing collection.
          </p>
          <div className="hero-ctas">
            <Ge className="button" to="/catalog?sort=newest">
              Shop the collection →
            </Ge>
            <Ge className="button button-light" to="/catalog">
              Explore all
            </Ge>
          </div>
        </div>
        <div className="hero-product">
          <img src="/images/ruco-supply-hero.jpg" alt="Ruco Supply artwork with phones and pound notes" width="1280" height="870" loading="eager" decoding="async" fetchPriority="high" />
        </div>
      </section>
      <div className="trust-strip">
        <div className="container">
          <span>◇ Clear product information</span>
          <span>□ Delivery arranged with our team</span>
          <span>↗ Personal order support</span>
        </div>
      </div>
      <StoreCollection eyebrow="Recently added" title="New at Ruco." products={latest.slice(0, 4)} link="/catalog?collection=new" />
      <StoreCollection eyebrow="Explore the selection" title="Best sellers." products={featured} link="/catalog?collection=best" />
      <StoreCollection eyebrow="The complete collection" title="All products." products={products} link="/catalog" />
      <section className="reseller-cta container">
        <div>
          <p className="eyebrow">Your next step</p>
          <h2>Start with the right information.</h2>
          <p>
            Explore our reseller resources, or speak to our team about a product
            before ordering.
          </p>
        </div>
        <Ge className="button" to="/reselling-guide">
          Explore the resources →
        </Ge>
      </section>
    </StoreShell>
  );
}
