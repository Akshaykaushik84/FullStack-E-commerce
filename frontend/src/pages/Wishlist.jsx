import { useEffect, useState } from "react";
import Navbar from "../components/NavbarComp";
import ProductCard from "../components/ProductCard";
import Pagination from "../components/Pagination";
import { getWishlist } from "../api/wishlistApi.jsx";

const Wishlist = () => {
  const token = localStorage.getItem("token");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  const itemsPerPage = 6;
  const totalPages = Math.max(Math.ceil(items.length / itemsPerPage), 1);
  const visibleItems = items.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => {
    if (!token) {
      window.location.href = "/login";
      return;
    }

    getWishlist(token)
      .then((res) => setItems(res.data || []))
      .catch((err) => console.log(err))
      .finally(() => setLoading(false));
  }, [token]);

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,var(--surface-50)_0%,#ffffff_100%)]">
      <Navbar />
      <div className="mx-auto max-w-7xl px-5 pb-16 pt-28">
        <div className="mb-8">
          <p className="text-sm uppercase tracking-[0.35em] text-[var(--brand-500)]">
            Wishlist
          </p>
          <h1 className="mt-2 text-4xl font-bold text-slate-900">
            Products you want to revisit
          </h1>
          <p className="mt-3 text-slate-500">
            Saved products stay here so you can compare and purchase them later.
          </p>
        </div>

        {loading ? (
          <div className="rounded-[2rem] border border-slate-200 bg-white p-10 text-center text-slate-500 shadow-sm">
            Loading wishlist...
          </div>
        ) : items.length ? (
          <div className="space-y-8">
            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {visibleItems.map((product) => (
                <ProductCard
                  key={product._id}
                  product={product}
                  isWishlisted
                  onWishlistChanged={(nextItems) => {
                    setItems(nextItems);
                    setCurrentPage(1);
                  }}
                />
              ))}
            </div>
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        ) : (
          <div className="rounded-[2rem] border border-dashed border-slate-300 bg-white p-12 text-center shadow-sm">
            <h2 className="text-3xl font-semibold text-slate-900">
              Your wishlist is empty
            </h2>
            <p className="mt-3 text-slate-500">
              Save products from the home page or product details page to see them
              here.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Wishlist;
