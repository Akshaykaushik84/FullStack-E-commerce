const footerLinks = [
  "Smart shopping",
  "Fast checkout",
  "Track orders",
  "Wishlist favorites",
];

const Footer = () => {
  return (
    <footer className="mt-12 border-t border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#eef4ff_100%)]">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1.2fr_0.8fr_0.8fr]">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--brand-600)] text-sm font-bold text-white shadow-lg shadow-blue-200">
              CS
            </div>
            <div>
              <p className="text-lg font-semibold text-slate-900">CartSphere</p>
              <p className="text-sm text-slate-500">Curated shopping for modern essentials</p>
            </div>
          </div>
          <p className="mt-4 max-w-xl text-sm leading-6 text-slate-600">
            Explore fashion, electronics, home, gaming, beauty, and more with a cleaner shopping
            experience, reliable checkout flow, and admin-ready inventory tools.
          </p>
        </div>

        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[var(--brand-500)]">
            Store
          </p>
          <div className="mt-4 space-y-3 text-sm text-slate-600">
            {footerLinks.map((item) => (
              <p key={item}>{item}</p>
            ))}
          </div>
        </div>

        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[var(--brand-500)]">
            Support
          </p>
          <div className="mt-4 space-y-3 text-sm text-slate-600">
            <p>Secure account management</p>
            <p>Responsive shopping experience</p>
            <p>Admin catalog and order controls</p>
            <p>Built for desktop, tablet, and mobile</p>
          </div>
        </div>
      </div>
      <div className="border-t border-slate-200 px-4 py-4 text-center text-xs text-slate-500">
        CartSphere © 2026. Built for polished everyday commerce.
      </div>
    </footer>
  );
};

export default Footer;
