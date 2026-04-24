import { Heart, ShoppingBag, Star } from "lucide-react";
import { Link } from "react-router-dom";
import { addToCart } from "../api/cartApi.jsx";
import { toggleWishlist } from "../api/wishlistApi.jsx";

const formatPrice = (price) => `Rs ${Number(price || 0).toFixed(0)}`;

const ProductCard = ({ product, onAdded, onWishlistChanged, isWishlisted = false }) => {
  const token = localStorage.getItem("token");
  const availableStock = Number.isFinite(Number(product.countInStock))
    ? Number(product.countInStock)
    : 25;

  const handleAddToCart = () => {
    if (!token) {
      window.location.href = "/login";
      return;
    }

    addToCart(product._id, token, 1)
      .then(() => {
        if (onAdded) {
          onAdded(`${product.name} added to cart.`);
        }
      })
      .catch((err) => {
        alert(err.response?.data?.message || "Unable to add product to cart");
      });
  };

  const handleWishlist = () => {
    if (!token) {
      window.location.href = "/login";
      return;
    }

    toggleWishlist(product._id, token)
      .then((res) => {
        if (onWishlistChanged) {
          onWishlistChanged(res.data.items || []);
        }
      })
      .catch((err) => alert(err.response?.data?.message || "Unable to update wishlist"));
  };

  const originalPrice = product.discountPercentage
    ? product.price / (1 - product.discountPercentage / 100)
    : null;

  return (
    <div className="group overflow-hidden rounded-[1.4rem] border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1.5 hover:border-[var(--brand-200)] hover:shadow-[0_24px_60px_-24px_rgba(36,62,168,0.35)] sm:rounded-[1.6rem]">
      <div className="relative overflow-hidden bg-slate-50">
        <div className="pointer-events-none absolute inset-0 z-10 bg-[linear-gradient(180deg,transparent_55%,rgba(15,23,42,0.08)_100%)] opacity-0 transition duration-300 group-hover:opacity-100" />
        <img src={product.image} alt={product.name} loading="lazy" className="h-40 w-full object-cover transition duration-500 group-hover:scale-105 sm:h-44 xl:h-48" />
        <div className="absolute left-3 top-3 flex gap-2">
          {product.featured ? <span className="rounded-full bg-[var(--ink-900)] px-2.5 py-1 text-[11px] font-semibold text-white">Featured</span> : null}
          {product.discountPercentage ? <span className="rounded-full bg-rose-500 px-2.5 py-1 text-[11px] font-semibold text-white">{product.discountPercentage}% OFF</span> : null}
        </div>
        <button type="button" onClick={handleWishlist} className={`absolute right-3 top-3 rounded-full p-2.5 shadow-md transition ${isWishlisted ? "bg-rose-500 text-white" : "bg-white text-slate-700"}`}>
          <Heart size={16} fill={isWishlisted ? "currentColor" : "none"} />
        </button>
      </div>

      <div className="space-y-3 p-3.5 sm:p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] uppercase tracking-[0.22em] text-slate-400">{product.category}</p>
            <h3 className="mt-1.5 line-clamp-1 text-base font-semibold text-slate-900 transition group-hover:text-[var(--brand-700)]">{product.name}</h3>
            <p className="mt-1 text-xs text-slate-500">{product.brand || "MyStore Select"}</p>
          </div>
          <div className="flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700">
            <Star size={12} fill="currentColor" />
            {Number(product.rating || 4.2).toFixed(1)}
          </div>
        </div>

        <p className="line-clamp-2 text-xs leading-5 text-slate-600">{product.description}</p>

        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-xl font-bold text-[var(--brand-700)]">{formatPrice(product.price)}</p>
            {originalPrice ? <p className="text-xs text-slate-400 line-through">{formatPrice(originalPrice)}</p> : null}
          </div>
          <p className="text-xs text-slate-500">Stock: {availableStock}</p>
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          <button type="button" onClick={handleAddToCart} disabled={availableStock <= 0} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--brand-600)] px-3 py-2.5 text-xs font-semibold text-white transition hover:bg-[var(--brand-700)] disabled:cursor-not-allowed disabled:bg-slate-300">
            <ShoppingBag size={14} />
            {availableStock > 0 ? "Add to Cart" : "Out of Stock"}
          </button>
          <Link to={`/products/${product._id}`} className="flex w-full items-center justify-center rounded-2xl border border-slate-200 px-3 py-2.5 text-xs font-semibold text-slate-700 transition hover:border-[var(--brand-300)] hover:text-[var(--brand-700)]">
            View Details
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
