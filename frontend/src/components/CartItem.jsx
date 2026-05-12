const formatPrice = (price) => `Rs ${Number(price || 0).toFixed(0)}`;

const CartItem = ({ item, onUpdateQuantity, onRemove }) => {
  return (
    <div className="grid gap-3 rounded-[1.5rem] border border-slate-200 bg-white p-3 shadow-sm sm:gap-4 sm:rounded-[2rem] sm:p-5 md:grid-cols-[110px_1fr_auto] md:items-center lg:grid-cols-[120px_1fr_auto]">
      <img
        src={item.product?.image}
        alt={item.product?.name}
        className="h-36 w-full rounded-2xl object-cover sm:h-36 md:h-28"
      />

      <div className="min-w-0">
        <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400 sm:text-xs sm:tracking-[0.25em]">
          {item.product?.category || "General"}
        </p>
        <h3 className="mt-1.5 text-base font-semibold text-slate-900 sm:mt-2 sm:text-xl">{item.product?.name}</h3>
        <p className="mt-1 line-clamp-2 text-xs text-slate-600 sm:text-sm">{item.product?.description}</p>
        <p className="mt-2.5 text-base font-bold text-[var(--brand-700)] sm:mt-3 sm:text-lg">
          {formatPrice(item.product?.price)}
        </p>
      </div>

      <div className="flex flex-col items-stretch gap-3 md:items-end">
        <div className="flex items-center justify-between gap-3 rounded-full border border-slate-200 bg-slate-50 px-3 py-2">
          <button type="button" className="rounded-full px-2 py-1 text-base font-semibold" onClick={() => onUpdateQuantity(item.product?._id, item.quantity - 1)}>
            -
          </button>
          <span className="min-w-6 text-center text-sm font-semibold">{item.quantity}</span>
          <button type="button" className="rounded-full px-2 py-1 text-base font-semibold" onClick={() => onUpdateQuantity(item.product?._id, item.quantity + 1)}>
            +
          </button>
        </div>
        <p className="text-sm font-semibold text-slate-700 md:text-right">Line total: {formatPrice(item.lineTotal)}</p>
        <button
          type="button"
          onClick={() => onRemove(item.product?._id)}
          className="rounded-xl border border-rose-200 px-3 py-2 text-sm font-medium text-rose-600 hover:bg-rose-50 md:border-0 md:px-0 md:py-0 md:hover:bg-transparent"
        >
          Remove item
        </button>
      </div>
    </div>
  );
};

export default CartItem;
