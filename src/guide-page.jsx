function StoreGuidePage() {
  const guide = storeCatalog.products.find(p => p.id === 1);
  if (!guide) return <StoreShell title="Reseller guide"><section className="container empty-state"><h1>The guide is currently unavailable.</h1><Ge className="button" to="/contact">Contact our team</Ge></section></StoreShell>;
  return <StoreShell title="Beginners Reselling Guide" description={guide.description}>
    <section className="guide-hero container">
      <div className="guide-cover"><StoreImage product={guide} eager /></div>
      <div className="guide-intro">
        <p className="eyebrow">Start with the basics</p>
        <h1>Your first step into reselling.</h1>
        <p className="guide-description">{guide.description}</p>
        <div className="guide-price"><strong>{storePrice(guide)}</strong><span>{storeAvailable(guide) ? 'Available' : 'Ask about availability'}</span></div>
        <div className="guide-actions"><Ge className="button" to={storeSlug(guide)}>View guide &amp; order <span aria-hidden="true">→</span></Ge><Ge className="button button-light" to="/contact">Ask a question</Ge></div>
      </div>
    </section>
    <section className="guide-information container">
      <article className="guide-checklist">
        <p className="eyebrow">Before your first sale</p>
        <h2>A practical starting checklist.</h2>
        <p>Build good habits from your first purchase. These steps can help you approach an unfamiliar product with more clarity.</p>
        <ol>
          <li><strong>Know what you are buying.</strong><span>Confirm the model, condition, included accessories and supplier details before paying.</span></li>
          <li><strong>Check the full cost.</strong><span>Allow for delivery, platform fees, packaging and potential returns when comparing prices.</span></li>
          <li><strong>Prepare an honest listing.</strong><span>Use clear photographs of the actual item and describe its condition accurately.</span></li>
          <li><strong>Keep your records organised.</strong><span>Track purchases, receipts, selling costs and customer conversations.</span></li>
        </ol>
        <p className="guide-note">Reselling outcomes vary with demand, condition, sourcing costs and selling fees. Educational guidance does not guarantee a profit.</p>
      </article>
      <aside className="guide-facts" aria-label="Guide ordering information">
        <div><h2>The guide</h2><p>{guide.name}. View the listing for the current price and ordering options.</p></div>
        <div><h2>Ordering</h2><p>Use the existing order flow to arrange your purchase with our team on Telegram.</p></div>
        <div><h2>Delivery &amp; access</h2><p>Confirm the format, delivery method and access details with our team before payment.</p></div>
        <div><h2>Need a hand?</h2><p>Ask us about the guide before placing your order.</p><Ge className="text-link" to="/contact">Contact our team →</Ge></div>
      </aside>
    </section>
  </StoreShell>;
}
