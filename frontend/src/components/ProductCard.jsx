import { useMemo, useState } from "react";
import { Heart, ShoppingBag, Star } from "lucide-react";
import { Link } from "react-router-dom";
import { addToCart } from "../api/cartApi.jsx";
import { useToast } from "../hooks/useToast.js";
import { toggleWishlist } from "../api/wishlistApi.jsx";
import { getStoredToken } from "../utils/authStorage.js";

const formatPrice = (price) => `Rs ${Number(price || 0).toFixed(0)}`;
const FALLBACK_IMAGE = "https://placehold.co/600x600/f8fafc/0f172a/png?text=Product";

const resolveImageUrl = (image) => {
  const rawImage = String(image || "").trim();

  if (!rawImage) return FALLBACK_IMAGE;
  if (rawImage.startsWith("/uploads")) return rawImage;
  if (typeof window === "undefined") return rawImage;

  try {
    const imageUrl = new URL(rawImage, window.location.origin);
    const isSameHost = imageUrl.host === window.location.host;

    if (window.location.protocol === "https:" && imageUrl.protocol === "http:" && isSameHost) {
      return `${window.location.origin}${imageUrl.pathname}`;
    }

    return imageUrl.href;
  } catch {
    return FALLBACK_IMAGE;
  }
};

const ProductCard = ({ product, onAdded, onWishlistChanged, isWishlisted = false }) => {
  const token = getStoredToken();
  const { showError, showSuccess } = useToast();
  const [imageFailed, setImageFailed] = useState(false);
  const imageUrl = useMemo(() => resolveImageUrl(product.image), [product.image]);
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
        } else {
          showSuccess(`${product.name} added to cart.`);
        }
      })
      .catch((err) => {
        showError(err.response?.data?.message || "Unable to add product to cart");
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
        showSuccess(isWishlisted ? "Removed from wishlist." : "Added to wishlist.");
      })
      .catch((err) => showError(err.response?.data?.message || "Unable to update wishlist"));
  };

  const originalPrice = product.discountPercentage
    ? product.price / (1 - product.discountPercentage / 100)
    : null;

  return (
    <div className="group flex h-full min-w-0 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition duration-300 hover:border-[var(--brand-200)] hover:shadow-[0_16px_34px_-22px_rgba(15,23,42,0.5)] sm:hover:-translate-y-1 sm:rounded-2xl">
      <div className="relative aspect-[1/0.78] overflow-hidden bg-white p-2 sm:aspect-square sm:p-3">
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-12 bg-gradient-to-t from-slate-100/70 to-transparent opacity-0 transition duration-300 group-hover:opacity-100" />
        <img
          src={imageFailed ? FALLBACK_IMAGE : imageUrl}
          alt={product.name}
          loading="lazy"
          onError={() => setImageFailed(true)}
          className="h-full w-full object-contain transition duration-500 group-hover:scale-105"
        />
        <div className="absolute left-1.5 top-1.5 flex max-w-[calc(100%-2.5rem)] flex-wrap gap-1 sm:left-3 sm:top-3 sm:max-w-[calc(100%-3rem)] sm:gap-2">
          {product.featured ? <span className="rounded-full bg-[var(--ink-900)] px-1.5 py-0.5 text-[9px] font-semibold text-white sm:px-2.5 sm:py-1 sm:text-[11px]">Featured</span> : null}
          {product.discountPercentage ? <span className="rounded-full bg-rose-500 px-1.5 py-0.5 text-[9px] font-semibold text-white sm:px-2.5 sm:py-1 sm:text-[11px]">{product.discountPercentage}% OFF</span> : null}
        </div>
        <button type="button" onClick={handleWishlist} aria-label="Toggle wishlist" className={`absolute right-1.5 top-1.5 rounded-full p-1.5 shadow-md transition sm:right-3 sm:top-3 sm:p-2.5 ${isWishlisted ? "bg-rose-500 text-white" : "bg-white text-slate-700"}`}>
          <Heart size={13} fill={isWishlisted ? "currentColor" : "none"} />
        </button>
      </div>

      <div className="flex flex-1 flex-col gap-1.5 p-2 sm:gap-2.5 sm:p-3.5">
        <div className="flex items-start justify-between gap-1.5 sm:gap-3">
          <div className="min-w-0">
            <p className="truncate text-[9px] uppercase tracking-[0.12em] text-slate-400 sm:text-[11px] sm:tracking-[0.22em]">{product.category}</p>
            <h3 className="mt-0.5 line-clamp-2 min-h-[2rem] text-[12px] font-semibold leading-4 text-slate-900 transition group-hover:text-[var(--brand-700)] sm:mt-1 sm:min-h-[2.5rem] sm:text-[15px] sm:leading-5">{product.name}</h3>
            <p className="mt-0.5 truncate text-[10px] text-slate-500 sm:mt-1 sm:text-xs">{product.brand || "CartSphere Select"}</p>
          </div>
          <div className="shrink-0 inline-flex items-center gap-1 rounded-full bg-amber-50 px-1.5 py-0.5 text-[9px] font-semibold text-amber-700 sm:px-2.5 sm:py-1 sm:text-[11px]">
            <Star size={10} fill="currentColor" />
            {Number(product.rating || 4.2).toFixed(1)}
          </div>
        </div>

        <p className="hidden line-clamp-2 text-[11px] leading-5 text-slate-600 md:block">{product.description}</p>

        <div className="mt-auto flex items-end justify-between gap-1.5 sm:gap-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-slate-950 sm:text-lg">{formatPrice(product.price)}</p>
            {originalPrice ? <p className="text-[10px] text-slate-400 line-through sm:text-xs">{formatPrice(originalPrice)}</p> : null}
          </div>
          <p className="shrink-0 text-[10px] text-slate-500 sm:text-xs">Stock: {availableStock}</p>
        </div>

        <div className="grid grid-cols-2 gap-1 sm:gap-2">
          <button type="button" onClick={handleAddToCart} disabled={availableStock <= 0} className="flex min-w-0 items-center justify-center gap-1 rounded-lg bg-[var(--brand-600)] px-1.5 py-1.5 text-[10px] font-semibold text-white transition hover:bg-[var(--brand-700)] disabled:cursor-not-allowed disabled:bg-slate-300 sm:gap-2 sm:rounded-xl sm:px-3 sm:py-2 sm:text-xs">
            <ShoppingBag size={12} />
            <span className="truncate">{availableStock > 0 ? "Cart" : "Out"}</span>
          </button>
          <Link to={`/products/${product._id}`} className="flex min-w-0 items-center justify-center rounded-lg border border-slate-200 px-1.5 py-1.5 text-[10px] font-semibold text-slate-700 transition hover:border-[var(--brand-300)] hover:text-[var(--brand-700)] sm:rounded-xl sm:px-3 sm:py-2 sm:text-xs">
            <span className="truncate">View</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
