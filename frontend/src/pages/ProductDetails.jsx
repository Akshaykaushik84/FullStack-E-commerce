import { useEffect, useState } from "react";
import { Heart, ShoppingCart, Star } from "lucide-react";
import { useParams } from "react-router-dom";
import Navbar from "../components/NavbarComp";
import { addToCart } from "../api/cartApi.jsx";
import { createProductReview, getSingleProduct } from "../api/productApi.jsx";
import { getWishlist, toggleWishlist } from "../api/wishlistApi.jsx";

const formatPrice = (price) => `Rs ${Number(price || 0).toFixed(0)}`;

const ProductDetails = () => {
  const { id } = useParams();
  const token = localStorage.getItem("token");
  const [product, setProduct] = useState(null);
  const [wishlisted, setWishlisted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: "" });

  useEffect(() => {
    Promise.all([
      getSingleProduct(id),
      token ? getWishlist(token).catch(() => ({ data: [] })) : Promise.resolve({ data: [] }),
    ])
      .then(([productRes, wishlistRes]) => {
        setProduct(productRes.data);
        setWishlisted((wishlistRes.data || []).some((item) => item._id === id));
      })
      .catch((err) => console.log(err))
      .finally(() => setLoading(false));
  }, [id, token]);

  const handleAddToCart = () => {
    if (!token) {
      window.location.href = "/login";
      return;
    }

    addToCart(id, token, 1)
      .then(() => alert("Product added to cart"))
      .catch((err) => alert(err.response?.data?.message || "Unable to add to cart"));
  };

  const handleWishlist = () => {
    if (!token) {
      window.location.href = "/login";
      return;
    }

    toggleWishlist(id, token)
      .then((res) => setWishlisted((res.data.items || []).some((item) => item._id === id)))
      .catch((err) => alert(err.response?.data?.message || "Unable to update wishlist"));
  };

  const handleReviewSubmit = (e) => {
    e.preventDefault();

    if (!token) {
      window.location.href = "/login";
      return;
    }

    createProductReview(id, reviewForm, token)
      .then((res) => {
        setProduct(res.data);
        setReviewForm({ rating: 5, comment: "" });
      })
      .catch((err) => alert(err.response?.data?.message || "Unable to submit review"));
  };

  if (loading) {
    return <div className="min-h-screen bg-slate-100"><Navbar /><div className="pt-28 text-center text-lg text-slate-600">Loading product...</div></div>;
  }

  if (!product) {
    return <div className="min-h-screen bg-slate-100"><Navbar /><div className="pt-28 text-center text-lg text-slate-600">Product not found.</div></div>;
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,var(--surface-50)_0%,#ffffff_100%)]">
      <Navbar />
      <div className="mx-auto max-w-7xl px-3 pb-28 pt-24 sm:px-5 sm:pt-28 lg:pb-16">
        <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr] lg:gap-8">
          <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
            <img src={product.image} alt={product.name} className="h-[280px] w-full object-cover sm:h-[420px] lg:h-full" />
          </div>

          <div className="space-y-5 rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-full bg-[var(--brand-50)] px-4 py-2 text-sm font-semibold text-[var(--brand-700)]">{product.category}</span>
              {product.featured ? <span className="rounded-full bg-[var(--ink-900)] px-4 py-2 text-sm font-semibold text-white">Featured</span> : null}
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900 sm:text-4xl">{product.name}</h1>
              <p className="mt-2 text-slate-500">{product.brand || "MyStore Select"}</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1 text-sm font-semibold text-amber-700">
                <Star size={16} fill="currentColor" />
                {Number(product.rating || 0).toFixed(1)}
              </div>
              <p className="text-sm text-slate-500">{product.numReviews || 0} reviews</p>
            </div>
            <p className="text-lg leading-8 text-slate-600">{product.description}</p>
            <div className="flex flex-col gap-4 rounded-[2rem] bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
              <div>
                <p className="text-3xl font-bold text-[var(--brand-700)]">{formatPrice(product.price)}</p>
                <p className="mt-1 text-sm text-slate-500">Stock available: {product.countInStock}</p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <button type="button" onClick={handleWishlist} className={`rounded-2xl px-4 py-3 text-sm font-semibold ${wishlisted ? "bg-rose-500 text-white" : "border border-slate-200 text-slate-700"}`}>
                  <span className="inline-flex items-center gap-2"><Heart size={16} fill={wishlisted ? "currentColor" : "none"} /> {wishlisted ? "Saved" : "Save"}</span>
                </button>
                <button type="button" onClick={handleAddToCart} className="rounded-2xl bg-[var(--brand-600)] px-5 py-3 text-sm font-semibold text-white">
                  <span className="inline-flex items-center gap-2"><ShoppingCart size={16} /> Add to Cart</span>
                </button>
              </div>
            </div>
            {product.tags?.length ? <p className="text-sm text-slate-500">Tags: {product.tags.join(", ")}</p> : null}
          </div>
        </div>

        <div className="mt-8 grid gap-6 lg:mt-10 lg:grid-cols-[0.95fr_1.05fr] lg:gap-8">
          <form onSubmit={handleReviewSubmit} className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
            <h2 className="text-2xl font-semibold text-slate-900">Write a review</h2>
            <div className="mt-5 space-y-4">
              <select value={reviewForm.rating} onChange={(e) => setReviewForm((prev) => ({ ...prev, rating: Number(e.target.value) }))} className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-[var(--brand-500)]">
                {[5,4,3,2,1].map((rating) => <option key={rating} value={rating}>{rating} Stars</option>)}
              </select>
              <textarea value={reviewForm.comment} onChange={(e) => setReviewForm((prev) => ({ ...prev, comment: e.target.value }))} className="min-h-32 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-[var(--brand-500)]" placeholder="Share your experience with this product" required />
              <button type="submit" className="rounded-2xl bg-[var(--brand-600)] px-5 py-3 text-sm font-semibold text-white">Submit Review</button>
            </div>
          </form>

          <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
            <h2 className="text-2xl font-semibold text-slate-900">Customer reviews</h2>
            <div className="mt-5 space-y-4">
              {(product.reviews || []).length ? (
                product.reviews.map((review) => (
                  <div key={review._id} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="font-semibold text-slate-900">{review.name}</p>
                        <p className="text-sm text-slate-500">{review.email || review.user?.email || "No email"}</p>
                      </div>
                      <p className="text-sm font-medium text-amber-700">{review.rating}/5</p>
                    </div>
                    <p className="mt-2 text-sm text-slate-600">{review.comment}</p>
                    <p className="mt-2 text-xs text-slate-400">{new Date(review.createdAt).toLocaleDateString()}</p>
                  </div>
                ))
              ) : (
                <p className="text-slate-500">No reviews yet. Be the first to review this product.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetails;
