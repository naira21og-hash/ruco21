/* Uses the recovered React/router runtime and the existing Telegram order form.
 * All inventory is loaded from /data/catalog.json; no catalog lives in UI code. */
const StoreHelmet = wr,
  StoreBag = up,
  StoreOrderForm = mE;
const storeSite = { name: "Ruco Supply", wordmark: "RUCO", suffix: "SUPPLY" };
const storeDeliveryDestinations = [
  "United Kingdom", "Australia", "Canada", "New Zealand", "United States",
  "Austria", "Belgium", "Bulgaria", "Croatia", "Cyprus", "Czechia", "Denmark",
  "Estonia", "Finland", "France", "Germany", "Greece", "Hungary", "Ireland",
  "Italy", "Latvia", "Lithuania", "Luxembourg", "Malta", "Netherlands", "Poland",
  "Portugal", "Romania", "Slovakia", "Slovenia", "Spain", "Sweden"
];
let storeCatalog = { categories: [], products: [] };
let storeCatalogError = false;
const storePropsLast = (a, b) => Number(a.id === 7) - Number(b.id === 7);
async function storeLoadCatalog() {
  try {
    const response = await fetch("/data/catalog.json", { cache: "no-cache" });
    if (!response.ok) throw new Error("Catalog unavailable");
    storeCatalog = await response.json();
    storeCatalog.products = storeCatalog.products.map((p) => ({
      ...p,
      image: p.images?.[0] || p.image,
      images: p.images?.length ? p.images : p.image ? [p.image] : [],
    }));
    storeCatalog.products.sort(storePropsLast);
    zx = storeCatalog.products;
  } catch (error) {
    storeCatalogError = true;
    console.error("Catalog could not be loaded", error);
  }
}
function StoreProducts() {
  return {
    products: storeCatalog.products,
    allProducts: storeCatalog.products,
    getProductById: (id) =>
      storeCatalog.products.find((p) => p.id === parseInt(id, 10)),
  };
}
const storeMoney = (value) =>
  window.__ruco_format_currency__
    ? window.__ruco_format_currency__(value)
    : new Intl.NumberFormat("en-GB", {
        style: "currency",
        currency: "GBP",
      }).format(value);
const storeCategory = (id) => storeCatalog.categories.find((c) => c.id === id);
const storeSlug = (p) =>
  `/product/${p.id}-${p.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-$/, "")}`;
const storeInCategory = (p, id) =>
  id === "high-ticket" ? p.price >= 2000 : p.category === id;
const storeAvailable = storeProductAvailable;
const storeCondition = (p) => p.condition || "Condition to be confirmed";
const storeSearch = (p, q) =>
  [
    p.name,
    p.brand,
    storeCategory(p.category)?.name,
    p.subcategory,
    p.sku,
    ...(p.keywords || []),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
    .includes(q.toLowerCase().trim());
const storePrice = p => p.priceOnRequest ? "Price on request" : storeMoney(p.price);
function StoreMeta({ title, description, product }) {
  const path = Sr().pathname;
  const canonical = `https://rucosupply.store${product ? storeSlug(product) : path}`;
  const data = product
    ? {
        "@context": "https://schema.org",
        "@type": "Product",
        name: product.name,
        description: product.description,
        image: product.images.map((url) => new URL(url, canonical).href),
        ...(product.sku ? { sku: product.sku } : {}),
        ...(!product.priceOnRequest && { offers: {
          "@type": "Offer",
          price: product.price,
          priceCurrency: "GBP",
          url: canonical,
          availability: `https://schema.org/${storeAvailable(product) ? "InStock" : "OutOfStock"}`,
        }}),
      }
    : null;
  return (
    <StoreHelmet>
      <title>
        {title} | {storeSite.name}
      </title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonical} />
      <meta property="og:title" content={`${title} | ${storeSite.name}`} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonical} />
      <meta property="og:type" content={product ? "product" : "website"} />
      {product?.image && (
        <meta
          property="og:image"
          content={new URL(product.image, canonical).href}
        />
      )}
      {data && (
        <script type="application/ld+json">
          {JSON.stringify(data).replace(/</g, "\\u003c")}
        </script>
      )}
    </StoreHelmet>
  );
}
function StoreImage({ product, index = 0, eager = false, className = "" }) {
  const [failed, setFailed] = w.useState(false);
  const src = product.images?.[index] || product.image;
  w.useEffect(() => setFailed(false), [src]);
  return failed || !src ? (
    <div
      className={`image-fallback ${className}`}
      role="img"
      aria-label={`${product.name}: image unavailable`}
    >
      <span>{product.name}</span>
      <small>{src ? "Image unavailable" : "Photography to be added"}</small>
    </div>
  ) : (
    <img
      className={className}
      src={src}
      alt={`${product.name}${index ? ` — view ${index + 1}` : ""}`}
      loading={eager ? "eager" : "lazy"}
      decoding="async"
      onError={() => setFailed(true)}
    />
  );
}
function StoreDialog({ title, children, onClose, className = "" }) {
  const ref = w.useRef(null);
  w.useEffect(() => {
    const dialog = ref.current;
    const previous = document.activeElement;
    dialog.showModal();
    return () => {
      dialog.close();
      previous?.focus();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className={`store-dialog ${className}`}
      onCancel={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      aria-label={title}
    >
      <div className="dialog-inner">
        <div className="dialog-heading">
          <h2>{title}</h2>
          <button
            className="icon-button"
            onClick={onClose}
            aria-label={`Close ${title}`}
          >
            ×
          </button>
        </div>
        {children}
      </div>
    </dialog>
  );
}
function StoreCurrency() {
  return (
    <label className="currency-label">
      Display currency
      <select
        aria-label="Select currency"
        value={
          localStorage.getItem("ruco_selected_currency") ||
          sessionStorage.getItem("ruco_auto_currency") ||
          "GBP"
        }
        onChange={(e) => {
          localStorage.setItem("ruco_selected_currency", e.target.value);
          location.reload();
        }}
      >
        {["GBP", "EUR", "USD", "CAD", "AUD"].map((c) => (
          <option key={c}>{c}</option>
        ))}
      </select>
      <small>Orders use GBP. Converted prices are indicative.</small>
    </label>
  );
}
function StoreShell({ children, title, description, product }) {
  const location = Sr();
  w.useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);
  return (
    <>
      <StoreMeta title={title} description={description} product={product} />
      <StoreHeader />
      <main id="main" tabIndex={-1}>
        {storeCatalogError ? (
          <div className="container empty-state">
            <h1>We couldn’t load the collection.</h1>
            <p>Please refresh, or contact our team for current availability.</p>
            <Ge className="button" to="/contact">
              Contact the store
            </Ge>
          </div>
        ) : (
          children
        )}
      </main>
      <StoreFooter />
    </>
  );
}
function StoreFilterFields({ filters, update }) {
  const fieldId = w.useId();
  const products = storeCatalog.products;
  const categoryProducts = products.filter(
    (p) => !filters.category || storeInCategory(p, filters.category),
  );
  const choices = (key) =>
    [...new Set(categoryProducts.map((p) => p[key]).filter(Boolean))].sort();
  return (
    <div className="filter-fields">
      <label>
        Condition
        <select
          value={filters.condition}
          onChange={(e) => update({ condition: e.target.value })}
        >
          <option value="">All conditions</option>
          {choices("condition").map((v) => (
            <option key={v}>{v}</option>
          ))}
          <option value="unspecified">To be confirmed</option>
        </select>
      </label>
      {choices("brand").length > 0 && (
        <label>
          Brand
          <select
            value={filters.brand}
            onChange={(e) => update({ brand: e.target.value })}
          >
            <option value="">All brands</option>
            {choices("brand").map((v) => (
              <option key={v}>{v}</option>
            ))}
          </select>
        </label>
      )}
      <fieldset>
        <legend>Price range (GBP)</legend>
        <div className="price-inputs">
          <label className="sr-only" htmlFor={`${fieldId}-min`}>
            Minimum price
          </label>
          <input
            id={`${fieldId}-min`}
            type="number"
            min="0"
            placeholder="Min"
            value={filters.min}
            onChange={(e) => update({ min: e.target.value })}
          />
          <span>—</span>
          <label className="sr-only" htmlFor={`${fieldId}-max`}>
            Maximum price
          </label>
          <input
            id={`${fieldId}-max`}
            type="number"
            min="0"
            placeholder="Max"
            value={filters.max}
            onChange={(e) => update({ max: e.target.value })}
          />
        </div>
      </fieldset>
      <label className="checkbox-label">
        <input
          type="checkbox"
          checked={filters.stock === "available"}
          onChange={(e) =>
            update({ stock: e.target.checked ? "available" : "" })
          }
        />
        Available now
      </label>
    </div>
  );
}
function StoreCatalog() {
  const location = Sr(),
    params = Vk();
  const query = new URLSearchParams(location.search);
  const filters = Object.fromEntries(
    [
      "collection",
      "category",
      "subcategory",
      "condition",
      "brand",
      "min",
      "max",
      "stock",
      "sort",
      "q",
    ].map((key) => [key, query.get(key) || ""]),
  );
  filters.category = params.slug || filters.category;
  const [drawer, setDrawer] = w.useState(false);
  const navigate = Fk();
  const update = (changes) => {
    const next = { ...filters, ...changes };
    const search = new URLSearchParams(
      Object.entries(next).filter(([, value]) => value !== ""),
    );
    navigate(`/catalog?${search}`, { replace: true });
  };
  const activeCategory = storeCategory(filters.category);
  const collectionTitle = filters.collection === "new" ? "New at Ruco" : filters.collection === "best" ? "Best sellers" : "All products";
  let products = storeCatalog.products.filter(
    (p) =>
      (!filters.category || storeInCategory(p, filters.category)) &&
      (!filters.subcategory || p.subcategory === filters.subcategory) &&
      (!filters.condition ||
        (filters.condition === "unspecified"
          ? !p.condition
          : p.condition === filters.condition)) &&
      (!filters.brand || p.brand === filters.brand) &&
      (!filters.min || (p.price != null && p.price >= Number(filters.min))) &&
      (!filters.max || (p.price != null && p.price <= Number(filters.max))) &&
      (!filters.stock || storeAvailable(p)) &&
      storeSearch(p, filters.q),
  );
  if (filters.collection === "best") products = products.filter(p => p.bestSeller);
  products.sort((a, b) =>
    filters.sort === "price-low"
      ? Number(!!a.priceOnRequest) - Number(!!b.priceOnRequest) || a.price - b.price
      : filters.sort === "price-high"
        ? Number(!!a.priceOnRequest) - Number(!!b.priceOnRequest) || b.price - a.price
        : filters.sort === "featured"
          ? Number(!!b.featured) - Number(!!a.featured)
          : Number(b.id === 8) - Number(a.id === 8) || (b.createdAt || "").localeCompare(a.createdAt || "") || b.id - a.id,
  );
  products.sort(storePropsLast);
  const active = [
    "category",
    "subcategory",
    "condition",
    "brand",
    "min",
    "max",
    "stock",
    "q",
  ].filter((k) => filters[k]);
  if (params.slug === "resources") return <StoreGuidePage />;
  return (
    <StoreShell
      title={activeCategory?.name || collectionTitle}
      description={
        activeCategory?.description ||
        "Explore our current inventory. Filter by price, condition and availability."
      }
    >
      <section className="catalog-intro container">
        <p className="eyebrow">Discover something worth having</p>
        <h1>{activeCategory?.name || collectionTitle}</h1>
        <p className="muted">
          {activeCategory?.description ||
            "Technology, everyday finds and resources for your next resale. Browse current listings, available options and products awaiting confirmation."}
        </p>
      </section>
      <section className="catalog-section container">
        <div className="category-pills">
          {[['new', 'New at Ruco'], ['best', 'Best sellers'], ['', 'All products']].map(([id, label]) => (
            <Ge key={id} to={id ? '/catalog?collection=' + id : '/catalog'} className={filters.collection === id ? 'active' : ''}>{label}</Ge>
          ))}
        </div>
        <div className="catalog-toolbar">
          <div className="catalog-search">
            <label className="sr-only" htmlFor="catalog-search">
              Search products
            </label>
            <input
              id="catalog-search"
              type="search"
              value={filters.q}
              onChange={(e) => update({ q: e.target.value })}
              placeholder="Search products, brands and more"
            />
          </div>
          <label className="sort-label">
            Sort by
            <select
              value={filters.sort || "newest"}
              onChange={(e) => update({ sort: e.target.value })}
            >
              <option value="newest">Newest listed</option>
              <option value="price-low">Price: low to high</option>
              <option value="price-high">Price: high to low</option>
              <option value="featured">Featured</option>
            </select>
          </label>
        </div>
        <div className="catalog-layout">
          <details className="filter-sidebar">
            <summary>
              Refine the collection <span>+</span>
            </summary>
            <StoreFilterFields filters={filters} update={update} />
            {active.length > 0 && (
              <button
                className="text-link reset-filter"
                onClick={() => navigate("/catalog")}
              >
                Clear all filters ×
              </button>
            )}
          </details>
          <div>
            <p className="results-count">{products.length} matching products</p>
            <div className="active-filters">
              {active.map((key) => (
                <button
                  key={key}
                  onClick={() =>
                    update({
                      [key]: "",
                      ...(key === "category" ? { subcategory: "" } : {}),
                    })
                  }
                >
                  {key}:{" "}
                  {key === "category"
                    ? activeCategory?.name || filters[key]
                    : filters[key]}{" "}
                  <span>×</span>
                </button>
              ))}
            </div>
            {products.length ? (
              <div className="product-grid catalog-grid">
                {products.map((p) => (
                  <StoreCard key={p.id} product={p} />
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <span className="eyebrow">More to discover</span>
                <h2>
                  {active.length
                    ? "No finds here just yet."
                    : "The next collection is on its way."}
                </h2>
                <p>
                  {activeCategory
                    ? "This category has no matching inventory right now. Explore the current collection or ask our team about availability."
                    : "Try another search or adjust your filters."}
                </p>
                <button className="button" onClick={() => navigate("/catalog")}>
                  Explore all products ↗
                </button>
                <Ge className="text-link" to="/contact">
                  Ask about availability ↗
                </Ge>
              </div>
            )}
          </div>
        </div>
      </section>
      {drawer && (
        <StoreDialog
          title="Refine the collection"
          className="filter-dialog"
          onClose={() => setDrawer(false)}
        >
          <StoreFilterFields filters={filters} update={update} />
          <button className="button" onClick={() => setDrawer(false)}>
            Show {products.length} finds
          </button>
          <button
            className="text-link reset-filter"
            onClick={() => navigate("/catalog")}
          >
            Clear all filters ×
          </button>
        </StoreDialog>
      )}
    </StoreShell>
  );
}
function StoreDetails() {
  const { id } = Vk();
  const p = StoreProducts().getProductById(id);
  const { addItem, openCart } = Ch();
  const [image, setImage] = w.useState(0),
    [zoom, setZoom] = w.useState(false),
    [variants, setVariants] = w.useState({}),
    [quantity, setQuantity] = w.useState(p?.minOrder || 1),
    [message, setMessage] = w.useState("");
  w.useEffect(() => {
    setImage(0);
    setVariants({});
    setQuantity(p?.minOrder || 1);
    setMessage("");
  }, [id]);
  if (!p)
    return (
      <StoreShell
        title="Product not found"
        description="This listing is no longer available."
      >
        <div className="container empty-state">
          <h1>This find is no longer here.</h1>
          <p>Explore the current collection for something else.</p>
          <Ge className="button" to="/catalog">
            Back to the collection ↗
          </Ge>
        </div>
      </StoreShell>
    );
  const ready = (p.variants || []).every((v) => variants[v.type]);
  const included = Array.isArray(p.included)
    ? p.included.join(", ")
    : p.included;
  const details = [
    ["Overview", p.description],
    [
      "Key details",
      p.details
        ? Array.isArray(p.details)
          ? p.details.join(" · ")
          : p.details
        : "Ask our team for the exact specifications and compatibility of this listing before ordering.",
    ],
    [
      "Condition",
      p.conditionDescription ||
        (p.condition
          ? `Listed as ${p.condition}. Ask for current photographs and any specific condition details before payment.`
          : "Condition has not yet been supplied for this listing. Confirm the condition and request current photographs before ordering."),
    ],
    [
      "What’s included",
      included ||
        "Packaging, accessories and documentation have not yet been specified. Confirm the included items with our team before payment.",
    ],
    [
      "Delivery",
      p.delivery ||
        "UK delivery costs and estimated timing are confirmed with our team before payment. For international orders, ask about delivery availability, shipping costs and any applicable import charges.",
    ],
    [
      "Verification",
      p.verification ||
        "No verification record is published for this listing. Ask our team for the available product information and supporting documentation before making a purchase.",
    ],
    [
      "Warranty",
      p.warranty ||
        "Any applicable warranty and its coverage must be confirmed for this listing before payment. No additional warranty is stated here.",
    ],
    [
      "Returns",
      p.returns ||
        "Please review our terms and confirm the applicable return process with our team before ordering. Your statutory rights are not affected.",
    ],
  ];
  const related = storeCatalog.products
    .filter((other) => other.id !== p.id && other.category === p.category)
    .slice(0, 4);
  return (
    <StoreShell title={p.name} description={p.description} product={p}>
      <div className="container product-breadcrumb">
        <Ge to="/catalog">← Back to the collection</Ge>
      </div>
      <section className="product-layout container">
        <div className="gallery">
          <div className="gallery-stage">
            <button
              className="gallery-main"
              onClick={() => setZoom(true)}
              aria-label={`Enlarge image of ${p.name}`}
            >
              <StoreImage product={p} index={image} eager />
              <span>View closer +</span>
            </button>
            {p.images.length > 1 && (
              <div className="gallery-nav">
                <button
                  aria-label="Previous product image"
                  onClick={() =>
                    setImage((image + p.images.length - 1) % p.images.length)
                  }
                >
                  ‹
                </button>
                <button
                  aria-label="Next product image"
                  onClick={() => setImage((image + 1) % p.images.length)}
                >
                  ›
                </button>
              </div>
            )}
          </div>
          {p.images.length > 1 && (
            <div className="gallery-thumbnails">
              {p.images.map((src, i) => (
                <button
                  key={`${src}-${i}`}
                  onClick={() => setImage(i)}
                  className={image === i ? "selected" : ""}
                  aria-label={`View image ${i + 1}`}
                  aria-pressed={image === i}
                >
                  <StoreImage product={p} index={i} />
                </button>
              ))}
            </div>
          )}
          <p className="gallery-note">
            {p.imageType === "illustration"
              ? p.imageNote
              : "Listing imagery. Request current condition photographs before ordering."}
          </p>
        </div>
        <div className="purchase-info">
          {p.isNew && <p className="eyebrow product-release">New release</p>}
          <h1>{p.name}</h1>
          {p.descriptor && <p className="muted">{p.descriptor}</p>}
          <div className="detail-status">
            <span>{storeCondition(p)}</span>
            <span className={storeAvailable(p) ? "available" : "muted"}>
              {p.priceOnRequest ? "Availability to be confirmed" : storeAvailable(p) ? "Available" : "Currently unavailable"}
            </span>
          </div>
          <p className="detail-price">
            {storePrice(p)}
            {p.previousPrice > p.price && (
              <del>{storeMoney(p.previousPrice)}</del>
            )}
          </p>
          {(p.variants || []).map((v) => (
            <fieldset className="variant-options" key={v.type}>
              <legend>
                {v.type}
                <span>{variants[v.type] || "Select an option"}</span>
              </legend>
              <div>
                {v.options.map((option) => (
                  <button
                    type="button"
                    key={option}
                    className={variants[v.type] === option ? "selected" : ""}
                    onClick={() => {
                      setVariants((prev) => ({ ...prev, [v.type]: option }));
                      setMessage("");
                    }}
                    aria-pressed={variants[v.type] === option}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </fieldset>
          ))}
          <div className="purchase-row">
            <label className="quantity-label">
              Quantity
              <input
                aria-label="Quantity"
                type="number"
                min={p.minOrder || 1}
                max={p.maxPerOrder || p.inventory || 99}
                value={quantity}
                onChange={(e) =>
                  setQuantity(
                    Math.max(
                      p.minOrder || 1,
                      Math.min(
                        Number(e.target.value) || 1,
                        p.maxPerOrder || p.inventory || 99,
                      ),
                    ),
                  )
                }
              />
            </label>
            <button
              className="button"
              disabled={!storeAvailable(p) && !p.priceOnRequest}
              onClick={() => {
                if (p.priceOnRequest) {
                  window.open('https://t.me/rucodaog?text='+encodeURIComponent('Please confirm the price and availability of '+p.name+'.'), '_blank', 'noopener,noreferrer');
                  return;
                }
                if (!ready) {
                  setMessage(
                    "Please select each option before adding to your cart.",
                  );
                  return;
                }
                const result = addItem(p, quantity, variants);
                if (result.added) openCart();
                setMessage(
                  result.added
                    ? "Added to your cart. Review your selection to arrange the order."
                    : result.error,
                );
              }}
            >
              {p.priceOnRequest ? "Request price & availability" : storeAvailable(p) ? "Add to cart" : "Currently unavailable"}{" "}
              <span>↗</span>
            </button>
          </div>
          {p.minOrder > 1 && (
            <p className="muted small">Minimum order: {p.minOrder} units.</p>
          )}
          <p role="status" className="purchase-message">
            {message}
            {message.startsWith("Added") && (
              <button className="text-link inline-cart-link" onClick={openCart}>
                View cart ↗
              </button>
            )}
          </p>
          <p className="delivery-summary">
            {p.deliverySummary ||
              "Delivery cost and timing confirmed before payment. Ask about UK or international delivery."}
          </p>
          <p className="purchase-note">
            Your cart is an order enquiry. Availability, condition, delivery and
            payment are confirmed personally with our team.
          </p>
          <aside className="purchase-transparency">
            <h2>Know what you are ordering.</h2>
            <p>
              Confirm the condition, included items, delivery and any available
              verification with our team before payment.
            </p>
            <div>
              <Ge to="/terms">Delivery & returns</Ge>
              <Ge to="/contact">Product support</Ge>
            </div>
          </aside>
          <p className="detail-description">{p.description}</p>
          <Ge className="text-link product-question" to="/contact">
            A question about this find? Talk to us ↗
          </Ge>
          {p.marketRange && (
            <aside className="reseller-info">
              <p className="eyebrow">For your next resale</p>
              <dl>
                <div>
                  <dt>Your price</dt>
                  <dd>{storePrice(p)}</dd>
                </div>
                <div>
                  <dt>Typical market range</dt>
                  <dd>
                    {storeMoney(p.marketRange.min)}–
                    {storeMoney(p.marketRange.max)}
                  </dd>
                </div>
                <div>
                  <dt>Potential gross spread</dt>
                  <dd>
                    {storeMoney(p.marketRange.min - p.price)}–
                    {storeMoney(p.marketRange.max - p.price)}
                  </dd>
                </div>
              </dl>
              <p>
                Indicative only. Resale prices vary by market, platform,
                condition and demand. Gross spread excludes fees, delivery,
                taxes and other costs; profit is not guaranteed.
              </p>
              {p.marketRange.source && (
                <p>
                  Source: {p.marketRange.source}
                  {p.marketRange.asOf && ` · ${p.marketRange.asOf}`}
                </p>
              )}
            </aside>
          )}
        </div>
      </section>
      <div className="mobile-purchase">
        <div>
          <strong>{p.name}</strong>
          <span>{storePrice(p)}</span>
        </div>
        <button
          className="button"
          disabled={!storeAvailable(p) && !p.priceOnRequest}
          onClick={() => {
            document.querySelector(".purchase-row .button")?.click();
            if (!ready)
              document
                .querySelector(".variant-options")
                ?.scrollIntoView({ block: "center" });
          }}
        >
          {p.priceOnRequest ? "Request price" : "Add to cart"}
        </button>
      </div>
      <section className="product-information container">
        <div>
          <p className="eyebrow">The details matter</p>
          <h2>A closer look.</h2>
          <p className="muted">
            Everything available about this listing.
            <br />
            Anything else? Just ask.
          </p>
        </div>
        <div className="product-accordions">
          {details.map(([title, text], i) => (
            <details key={title} open>
              <summary>
                {title}
                <span aria-hidden="true">+</span>
              </summary>
              <div>
                <p>{text}</p>
                {title === "Returns" && (
                  <Ge className="text-link" to="/terms">
                    Read delivery & returns terms ↗
                  </Ge>
                )}
              </div>
            </details>
          ))}
          <details>
            <summary>
              Frequently asked<span aria-hidden="true">+</span>
            </summary>
            <div>
              {(
                p.faq || [
                  {
                    question: "How do I place an order?",
                    answer:
                      "Select your options, add the product to your cart, and continue to our team on Telegram. We confirm the details before payment.",
                  },
                  {
                    question: "Can I request more photographs?",
                    answer:
                      "Yes. Contact our team for the current photographs and condition information available for this listing.",
                  },
                ]
              ).map((f) => (
                <div className="faq-item" key={f.question}>
                  <h3>{f.question}</h3>
                  <p>{f.answer}</p>
                </div>
              ))}
            </div>
          </details>
        </div>
      </section>
      <StoreCollection
        eyebrow="Keep exploring"
        title="You might also like."
        products={related}
        link={`/category/${p.category}`}
      />
      {zoom && (
        <StoreDialog
          title={p.name}
          className="zoom-dialog"
          onClose={() => setZoom(false)}
        >
          <StoreImage product={p} index={image} eager />
          {p.images.length > 1 && (
            <div className="zoom-controls">
              <button
                className="text-link"
                onClick={() =>
                  setImage((image + p.images.length - 1) % p.images.length)
                }
              >
                ← Previous
              </button>
              <span>
                {image + 1} / {p.images.length}
              </span>
              <button
                className="text-link"
                onClick={() => setImage((image + 1) % p.images.length)}
              >
                Next →
              </button>
            </div>
          )}
        </StoreDialog>
      )}
    </StoreShell>
  );
}
function StoreCartProvider({ children }) {
  const [items, setItems] = w.useState(() => {
    try {
      return storeRestoreCart(
        JSON.parse(localStorage.getItem(OS) || "[]"),
        storeCatalog.products,
      );
    } catch {
      return [];
    }
  });
  const [cartOpen, setCartOpen] = w.useState(false);
  w.useEffect(() => {
    localStorage.setItem(OS, JSON.stringify(items));
  }, [items]);
  const addItem = (product, quantity, variants) => {
    const result = storeAddCartItem(items, product, quantity, variants);
    setItems(result.items);
    return result;
  };
  const value = {
    items,
    addItem,
    updateQuantity: (id, quantity) =>
      setItems((prev) => storeSetCartQuantity(prev, id, quantity)),
    removeItem: (id) =>
      setItems((prev) => prev.filter((item) => item.itemId !== id)),
    clearCart: () => setItems([]),
    cartOpen,
    openCart: () => setCartOpen(true),
    closeCart: () => setCartOpen(false),
    itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
    subtotal: items.reduce((sum, item) => sum + item.price * item.quantity, 0),
  };
  return <DS.Provider value={value}>{children}<StoreCartDrawer /></DS.Provider>;
}
function StoreCartDrawer() {
  const { items, subtotal, updateQuantity, removeItem, clearCart, cartOpen, closeCart } = Ch();
  const [destination, setDestination] = w.useState("");
  const [payment, setPayment] = w.useState("bank");
  w.useEffect(() => {
    if (!cartOpen) return;
    const closeOnEscape = (event) => event.key === "Escape" && closeCart();
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [cartOpen]);
  if (!cartOpen) return null;
  return <div className="cart-drawer-layer" role="presentation" onMouseDown={closeCart}>
    <aside className="cart-drawer" role="dialog" aria-modal="true" aria-label="Your cart" onMouseDown={(event) => event.stopPropagation()}>
      <header className="cart-drawer-header"><h2>Your cart</h2><button aria-label="Close cart" onClick={closeCart}>×</button></header>
      {!items.length ? <div className="cart-drawer-empty"><h3>Your cart is empty.</h3><p>Explore the collection to add a product.</p><button className="button" onClick={() => { closeCart(); window.location.href = "/catalog"; }}>Continue shopping</button></div> : <>
        <section className="drawer-items" aria-label="Cart items">
          {items.map(item => <article className="drawer-item" key={item.itemId}>
            <StoreImage product={storeCatalog.products.find(p => p.id === item.productId)} />
            <div><h3>{item.name}</h3>{item.variantLabel && <p>{item.variantLabel}</p>}<p>Unit price: {storeMoney(item.price)}</p><div className="drawer-item-controls"><div className="quantity-stepper"><button aria-label={`Decrease quantity of ${item.name}`} onClick={() => updateQuantity(item.itemId, item.quantity - 1)} disabled={item.quantity <= item.minOrder}>−</button><span>{item.quantity}</span><button aria-label={`Increase quantity of ${item.name}`} onClick={() => updateQuantity(item.itemId, item.quantity + 1)} disabled={item.quantity >= item.inventory}>+</button></div><strong>{storeMoney(item.price * item.quantity)}</strong></div></div>
            <button className="remove-cart-item" aria-label={`Remove ${item.name}`} onClick={() => removeItem(item.itemId)}>×</button>
          </article>)}
        </section>
        <section className="drawer-summary">
          <label>Delivery destination<select value={destination} onChange={event => setDestination(event.target.value)}><option value="">Select destination</option>{storeDeliveryDestinations.map(country => <option key={country}>{country}</option>)}</select></label>
          <fieldset className="payment-choice"><legend>Payment preference</legend><label><input type="radio" name="payment" checked={payment === "bank"} onChange={() => setPayment("bank")} /> Bank transfer</label><label><input type="radio" name="payment" checked={payment === "crypto"} onChange={() => setPayment("crypto")} /> Crypto transfer</label></fieldset>
          <dl><div><dt>Subtotal</dt><dd>{storeMoney(subtotal)}</dd></div><div><dt>Shipping</dt><dd>{destination ? "Confirmed with team" : "Choose destination"}</dd></div><div className="drawer-total"><dt>Current subtotal</dt><dd>{storeMoney(subtotal)}</dd></div></dl>
          <button className="button drawer-checkout" onClick={() => { closeCart(); window.location.href = "/checkout"; }}>Continue to checkout details</button>
          <button className="drawer-clear" onClick={clearCart}>Clear cart</button>
        </section>
      </>}
    </aside>
  </div>;
}
function StoreCheckout() {
  const { items, subtotal } = Ch();
  const navigate = Fk();
  const [method, setMethod] = w.useState("telegram");
  if (!items.length) return <StoreShell title="Checkout"><section className="container empty-state"><h1>Your cart is empty.</h1><Ge className="button" to="/catalog">Continue shopping</Ge></section></StoreShell>;
  const submit = (event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const customer = `${data.get("firstName")} ${data.get("lastName")}`.trim();
    const lines = items.map(item => `• ${item.name}${item.variantLabel ? ` (${item.variantLabel})` : ""} × ${item.quantity} — ${storeMoney(item.price * item.quantity)}`).join("\n");
    const message = `Order enquiry\n\nName: ${customer}\nEmail: ${data.get("email")}\nPhone: ${data.get("phone")}\nAddress: ${data.get("address")}, ${data.get("city")}, ${data.get("postcode")}, ${data.get("country")}\nPayment preference: ${data.get("payment")}\nNotes: ${data.get("notes") || "None"}\n\nItems:\n${lines}\n\nSubtotal: ${storeMoney(subtotal)}\n\nPlease confirm availability, shipping and final payment details.`;
    const url = method === "telegram" ? `https://t.me/rucodaog?text=${encodeURIComponent(message)}` : `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };
  return <StoreShell title="Checkout details" description="Provide your details and prepare an order enquiry for our team.">
    <main className="checkout-page container"><Ge className="checkout-back" to="/catalog">← Back to shopping</Ge><div className="checkout-layout"><form className="checkout-card" onSubmit={submit}><h1>Checkout details</h1><section><h2>Contact information</h2><div className="checkout-fields"><label>First name<input required name="firstName" autoComplete="given-name" /></label><label>Last name<input required name="lastName" autoComplete="family-name" /></label><label className="checkout-wide">Email address<input required name="email" type="email" autoComplete="email" /></label><label className="checkout-wide">Phone number<input required name="phone" type="tel" autoComplete="tel" /></label></div></section><section><h2>Shipping address</h2><div className="checkout-fields"><label className="checkout-wide">Street address<input required name="address" autoComplete="street-address" /></label><label>City<input required name="city" autoComplete="address-level2" /></label><label>Postal code<input required name="postcode" autoComplete="postal-code" /></label><label className="checkout-wide">Country<select required name="country" defaultValue=""><option value="" disabled>Select your delivery destination</option>{storeDeliveryDestinations.map(country => <option key={country}>{country}</option>)}</select></label></div></section><section><h2>How should we prepare your enquiry?</h2><label className="method-option"><input type="radio" checked={method === "telegram"} onChange={() => setMethod("telegram")} /> Prepare for Telegram</label><label className="method-option"><input type="radio" checked={method === "whatsapp"} onChange={() => setMethod("whatsapp")} /> Prepare for WhatsApp</label><label>Payment preference<select name="payment" defaultValue="Bank transfer"><option>Bank transfer</option><option>Crypto transfer</option></select></label><label>Customer notes <span>(optional)</span><textarea name="notes" rows="4" /></label></section><button className="button checkout-submit" type="submit">Prepare {method === "telegram" ? "Telegram" : "WhatsApp"} enquiry — {storeMoney(subtotal)}</button></form><aside className="checkout-order-summary"><h2>Order summary</h2>{items.map(item => <div key={item.itemId}><span>{item.name} × {item.quantity}</span><strong>{storeMoney(item.price * item.quantity)}</strong></div>)}<div className="checkout-summary-total"><span>Subtotal</span><strong>{storeMoney(subtotal)}</strong></div><p>Shipping and final payment are confirmed by our team before your order is accepted.</p></aside></div></main>
  </StoreShell>;
}
function StoreCart() {
  const { items, subtotal, updateQuantity, removeItem, clearCart } = Ch();
  return (
    <StoreShell
      title="Your selection"
      description="Review your selection and arrange your order with our team."
    >
      <div className="container cart-page">
        <p className="eyebrow">The next step</p>
        <h1>Your selection.</h1>
        {!items.length ? (
          <div className="empty-state">
            <h2>A little room for discovery.</h2>
            <p>Your cart is empty. Explore the current collection.</p>
            <Ge className="button" to="/catalog">
              Discover the collection ↗
            </Ge>
          </div>
        ) : (
          <div className="cart-layout">
            <section aria-label="Cart items">
              {items.map((item) => (
                <article className="cart-item" key={item.itemId}>
                  <Ge
                    to={storeSlug(
                      storeCatalog.products.find(
                        (p) => p.id === item.productId,
                      ),
                    )}
                  >
                    <StoreImage
                      product={storeCatalog.products.find(
                        (p) => p.id === item.productId,
                      )}
                    />
                  </Ge>
                  <div>
                    <Ge
                      className="product-name"
                      to={storeSlug(
                        storeCatalog.products.find(
                          (p) => p.id === item.productId,
                        ),
                      )}
                    >
                      {item.name}
                    </Ge>
                    <p className="muted small">{item.variantLabel}</p>
                    <label className="cart-quantity">
                      Quantity
                      <input
                        aria-label={`Quantity for ${item.name}`}
                        type="number"
                        min={item.minOrder}
                        max={item.inventory}
                        value={item.quantity}
                        onChange={(e) =>
                          updateQuantity(
                            item.itemId,
                            Number(e.target.value) || item.minOrder,
                          )
                        }
                      />
                    </label>
                    <button
                      className="text-link small"
                      onClick={() => removeItem(item.itemId)}
                    >
                      Remove
                    </button>
                  </div>
                  <p>{storeMoney(item.price * item.quantity)}</p>
                </article>
              ))}
              <Ge className="text-link" to="/catalog">
                ← Keep exploring
              </Ge>
            </section>
            <aside className="order-summary">
              <p className="eyebrow">Order enquiry</p>
              <div className="summary-total">
                <h2>Subtotal</h2>
                <span>{storeMoney(subtotal)}</span>
              </div>
              <p className="muted">
                Delivery costs, availability and final payment details are
                confirmed before your order is accepted.
              </p>
              <details className="checkout-details" open>
                <summary>Arrange your order +</summary>
                <StoreOrderForm cartItems={items} compact />
              </details>
              <p className="small muted">
                Opening Telegram prepares your enquiry. Your selection stays in
                the cart until you clear it.
              </p>
              <button className="text-link small" onClick={clearCart}>
                Clear selection
              </button>
            </aside>
          </div>
        )}
      </div>
    </StoreShell>
  );
}
function StoreReviews() {
  return <StoreShell title="Customer reviews" description="Visit our Telegram channel for customer reviews and community updates.">
    <section className="container reviews-page">
      <p className="eyebrow">From our community</p>
      <h1>Customer reviews.</h1>
      <p>Visit our Telegram channel to explore customer feedback and community updates before placing your order.</p>
      <a className="button" href="https://t.me/rucotheconqeurrorsupply" target="_blank" rel="noopener noreferrer">View reviews on Telegram ↗</a>
      <p className="small muted">Opens our Telegram channel in a new tab.</p>
    </section>
  </StoreShell>;
}
function StoreContact() {
  return (
    <StoreShell
      title="Contact & support"
      description="Ask about a product, condition, availability or delivery. Reach our team directly."
    >
      <section className="container contact-page">
        <p className="eyebrow">A conversation makes the difference</p>
        <h1>
          Let’s find
          <br />
          <em>your next thing.</em>
        </h1>
        <p className="intro-text">
          Questions about a listing? Need current photographs, delivery details
          or help arranging an order? Speak directly with our team.
        </p>
        <div className="contact-grid">
          <a
            href="https://t.me/rucodaog"
            target="_blank"
            rel="noopener noreferrer"
          >
            <span className="eyebrow">01 / Telegram</span>
            <h2>Talk to our team ↗</h2>
            <p>Product enquiries and order arrangements.</p>
          </a>
          <a
            href="https://wa.me/447347951228"
            target="_blank"
            rel="noopener noreferrer"
          >
            <span className="eyebrow">02 / WhatsApp</span>
            <h2>Start a conversation ↗</h2>
            <p>Questions, availability and personal support.</p>
          </a>
        </div>
        <p className="muted">
          Please include the product name and any options you’re interested in.
          Never send card PINs, passwords or private cryptocurrency keys.
        </p>
      </section>
    </StoreShell>
  );
}
function StoreAbout() {
  return (
    <StoreShell
      title="Our approach"
      description="A considered collection of technology, everyday finds and reseller resources."
    >
      <section className="container about-page">
        <p className="eyebrow">Our approach</p>
        <h1>
          Less noise.
          <br />
          <em>More discovery.</em>
        </h1>
        <p className="intro-text">
          A place to explore technology, everyday products and reseller
          resources, with a direct conversation at the heart of every order.
        </p>
        <div className="how-grid">
          <div>
            <span>01</span>
            <h2>A considered collection</h2>
            <p>
              Browse the current listings and discover what’s available across
              the collection.
            </p>
          </div>
          <div>
            <span>02</span>
            <h2>Details before decisions</h2>
            <p>
              Confirm condition, specifications, included items and delivery
              before payment. Ask for the information you need.
            </p>
          </div>
          <div>
            <span>03</span>
            <h2>People, not guesswork</h2>
            <p>
              Our team handles enquiries and order arrangements directly through
              Telegram or WhatsApp.
            </p>
          </div>
        </div>
        <Ge className="button" to="/catalog">
          Explore the collection ↗
        </Ge>
      </section>
    </StoreShell>
  );
}
_I = StoreHome;
RI = StoreCatalog;
cF = StoreDetails;
Vr = StoreHeader;
$r = StoreFooter;
Th = StoreProducts;
EI = StoreCartProvider;
u3 = StoreCart;
i3 = StoreContact;
a3 = StoreAbout;
