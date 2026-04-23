const formatPrice = (price) => `Rs ${Number(price || 0).toFixed(0)}`;

const CartItem = ({ item, onUpdateQuantity, onRemove }) => {
  return (
    <div className="grid gap-4 rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm md:grid-cols-[120px_1fr_auto] md:items-center">
      <img
        src={item.product?.image}
        alt={item.product?.name}
        className="h-28 w-full rounded-2xl object-cover"
      />

      <div>
        <p className="text-xs uppercase tracking-[0.25em] text-slate-400">
          {item.product?.category || "General"}
        </p>
        <h3 className="mt-2 text-xl font-semibold text-slate-900">{item.product?.name}</h3>
        <p className="mt-1 text-sm text-slate-600">{item.product?.description}</p>
        <p className="mt-3 text-lg font-bold text-[var(--brand-700)]">
          {formatPrice(item.product?.price)}
        </p>
      </div>

      <div className="flex flex-col items-start gap-3 md:items-end">
        <div className="flex items-center gap-3 rounded-full border border-slate-200 bg-slate-50 px-3 py-2">
          <button type="button" onClick={() => onUpdateQuantity(item.product?._id, item.quantity - 1)}>
            -
          </button>
          <span className="min-w-6 text-center text-sm font-semibold">{item.quantity}</span>
          <button type="button" onClick={() => onUpdateQuantity(item.product?._id, item.quantity + 1)}>
            +
          </button>
        </div>
        <p className="text-sm font-semibold text-slate-700">Line total: {formatPrice(item.lineTotal)}</p>
        <button
          type="button"
          onClick={() => onRemove(item.product?._id)}
          className="text-sm font-medium text-rose-600 hover:text-rose-700"
        >
          Remove item
        </button>
      </div>
    </div>
  );
};

export default CartItem;
