const formatPrice = (price) => `Rs ${Number(price || 0).toFixed(0)}`;

const CartItem = ({ item, onUpdateQuantity, onRemove }) => {
  return (
    <div className="grid min-w-0 gap-3 rounded-[1.25rem] border border-slate-200 bg-white p-3 shadow-sm transition hover:border-[var(--brand-200)] hover:shadow-md sm:gap-4 sm:rounded-[1.5rem] sm:p-4 md:grid-cols-[104px_minmax(0,1fr)_auto] md:items-center lg:grid-cols-[112px_minmax(0,1fr)_auto]">
      <img
        src={item.product?.image}
        alt={item.product?.name}
        className="aspect-[4/3] h-auto w-full rounded-xl bg-slate-100 object-cover md:h-24 md:aspect-auto"
      />

      <div className="min-w-0">
        <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400 sm:text-xs sm:tracking-[0.25em]">
          {item.product?.category || "General"}
        </p>
        <h3 className="mt-1.5 line-clamp-2 text-base font-semibold leading-5 text-slate-900 sm:mt-2 sm:text-xl sm:leading-6">{item.product?.name}</h3>
        <p className="mt-1 line-clamp-2 text-xs text-slate-600 sm:text-sm">{item.product?.description}</p>
        <p className="mt-2 text-base font-bold text-[var(--brand-700)] sm:text-lg">
          {formatPrice(item.product?.price)}
        </p>
      </div>

      <div className="grid gap-3 rounded-2xl bg-slate-50 p-3 md:w-44 md:justify-items-stretch">
        <div className="grid h-10 grid-cols-[2.5rem_1fr_2.5rem] items-center rounded-full border border-slate-200 bg-white">
          <button type="button" className="h-full rounded-full text-base font-semibold text-slate-700 hover:bg-slate-100" onClick={() => onUpdateQuantity(item.product?._id, item.quantity - 1)}>
            -
          </button>
          <span className="min-w-6 text-center text-sm font-semibold">{item.quantity}</span>
          <button type="button" className="h-full rounded-full text-base font-semibold text-slate-700 hover:bg-slate-100" onClick={() => onUpdateQuantity(item.product?._id, item.quantity + 1)}>
            +
          </button>
        </div>
        <p className="min-h-5 text-sm font-semibold text-slate-700 md:text-right">{formatPrice(item.lineTotal)}</p>
        <button
          type="button"
          onClick={() => onRemove(item.product?._id)}
          className="h-10 rounded-xl border border-rose-200 bg-white px-3 text-sm font-medium text-rose-600 hover:bg-rose-50 md:h-9"
        >
          Remove
        </button>
      </div>
    </div>
  );
};

export default CartItem;
