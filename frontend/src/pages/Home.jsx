import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Search, Sparkles, TrendingUp } from "lucide-react";
import Navbar from "../components/NavbarComp";
import Sidebar from "../components/sidebar";
import ProductCard from "../components/ProductCard";
import { getProducts } from "../api/productApi.jsx";
import { getWishlist } from "../api/wishlistApi.jsx";
import Pagination from "../components/Pagination";

const heroSlides = [
  {
    eyebrow: "Season Edit",
    title: "A cleaner storefront for everyday shopping",
    subtitle:
      "Discover curated electronics, fashion, and home essentials with faster browsing and better filtering.",
    image:
      "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=1200&q=80",
  },
  {
    eyebrow: "Trending Now",
    title: "Find top-rated picks without the noise",
    subtitle:
      "Sort by value, rating, and newest drops while keeping wishlist and cart actions one tap away.",
    image:
      "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=1200&q=80",
  },
  {
    eyebrow: "Smart Shopping",
    title: "Built for searching, comparing, and ordering",
    subtitle:
      "A smoother catalog with stronger product discovery, cleaner layout, and sharper pagination.",
    image:
      "https://images.unsplash.com/photo-1606813909354-3e3d0c7f4c89?auto=format&fit=crop&w=1200&q=80",
  },
];

const initialFilters = {
  page: 1,
  limit: 8,
  search: "",
  category: "All",
  sort: "latest",
};

const Home = () => {
  const token = localStorage.getItem("token");
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState(["All"]);
  const [wishlistIds, setWishlistIds] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
  const [filters, setFilters] = useState(initialFilters);
  const [searchInput, setSearchInput] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 4000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    getProducts(filters)
      .then((res) => {
        setProducts(res.data.items || []);
        setPagination(res.data.pagination || { page: 1, totalPages: 1 });
        setCategories(res.data.filters?.categories || ["All"]);
      })
      .catch((err) => console.log(err))
      .finally(() => setLoading(false));
  }, [filters]);

  useEffect(() => {
    if (!token) {
      return;
    }

    getWishlist(token)
      .then((res) => setWishlistIds((res.data || []).map((item) => item._id)))
      .catch(() => setWishlistIds([]));
  }, [token]);

  useEffect(() => {
    if (!notice) return;

    const timer = setTimeout(() => setNotice(""), 2500);
    return () => clearTimeout(timer);
  }, [notice]);

  const applyFilters = (updater) => {
    setLoading(true);
    setFilters((prev) =>
      typeof updater === "function" ? updater(prev) : updater
    );
  };

  const handleFilterChange = (key, value) => {
    applyFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
  };

  const activeSlide = useMemo(() => heroSlides[currentSlide], [currentSlide]);

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,var(--surface-50)_0%,#ffffff_45%,#eef7ff_100%)]">
      <Navbar />

      <div className="mx-auto max-w-[1440px] px-3 pb-28 pt-24 sm:px-4 sm:pt-28 lg:px-6 lg:pb-16">
        <section className="relative overflow-hidden rounded-[2rem] border border-white/20 bg-[linear-gradient(135deg,var(--ink-900)_0%,var(--brand-700)_46%,var(--accent-500)_100%)] text-white shadow-2xl sm:rounded-[2.5rem]">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.22),transparent_35%)]" />
          <div className="grid items-center gap-8 px-5 py-7 sm:px-7 sm:py-9 md:grid-cols-[1.05fr_0.95fr] md:px-10 md:py-12 lg:gap-10 lg:px-12 lg:py-14">
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs uppercase tracking-[0.3em] text-cyan-100">
                <Sparkles size={14} />
                {activeSlide.eyebrow}
              </div>
              <h1 className="mt-6 max-w-2xl text-3xl font-bold leading-tight sm:text-4xl md:text-5xl lg:text-6xl">
                {activeSlide.title}
              </h1>
              <p className="mt-5 max-w-xl text-sm text-slate-200 sm:text-base md:text-lg">
                {activeSlide.subtitle}
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <button
                  type="button"
                  onClick={() => handleFilterChange("featured", "true")}
                  className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-[var(--brand-700)] shadow-lg shadow-slate-900/10"
                >
                  Explore Featured
                  <ArrowRight size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSearchInput("");
                    applyFilters(initialFilters);
                  }}
                  className="rounded-full border border-white/25 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  Reset Filters
                </button>
              </div>
              <div className="mt-8 grid gap-4 sm:grid-cols-3">
                <div className="rounded-2xl bg-white/10 p-4 backdrop-blur-sm">
                  <p className="text-xs uppercase tracking-[0.25em] text-slate-200">Catalog</p>
                  <p className="mt-2 text-2xl font-bold">{pagination.totalProducts || 0}</p>
                  <p className="mt-1 text-sm text-slate-200">Products</p>
                </div>
                <div className="rounded-2xl bg-white/10 p-4 backdrop-blur-sm">
                  <p className="text-xs uppercase tracking-[0.25em] text-slate-200">Categories</p>
                  <p className="mt-2 text-2xl font-bold">{Math.max(categories.length - 1, 0)}</p>
                  <p className="mt-1 text-sm text-slate-200">Sections</p>
                </div>
                <div className="rounded-2xl bg-white/10 p-4 backdrop-blur-sm">
                  <p className="text-xs uppercase tracking-[0.25em] text-slate-200">Discovery</p>
                  <p className="mt-2 inline-flex items-center gap-2 text-2xl font-bold">
                    <TrendingUp size={20} />
                    Smart
                  </p>
                  <p className="mt-1 text-sm text-slate-200">Search and sort</p>
                </div>
              </div>
            </div>

            <div className="relative z-10">
              <div className="rounded-[2rem] border border-white/15 bg-white/10 p-3 shadow-xl backdrop-blur-sm">
                <img
                  src={activeSlide.image}
                  alt={activeSlide.title}
                  className="h-[220px] w-full rounded-[1.25rem] object-cover sm:h-[280px] md:h-[320px] lg:h-[340px] sm:rounded-[1.5rem]"
                />
              </div>
              <div className="mt-5 flex items-center gap-3">
                {heroSlides.map((slide, index) => (
                  <button
                    key={slide.title}
                    type="button"
                    onClick={() => setCurrentSlide(index)}
                    className={`h-3 rounded-full transition ${
                      currentSlide === index ? "w-12 bg-white" : "w-3 bg-white/35"
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-6 lg:mt-10 lg:grid-cols-[280px_1fr] lg:gap-8">
          <Sidebar
            categories={categories}
            selectedCategory={filters.category}
            onCategoryChange={(category) => handleFilterChange("category", category)}
          />

          <div className="space-y-8">
            <div className="rounded-[2rem] border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
              <div className="grid gap-3 lg:grid-cols-[1fr_220px_220px] lg:gap-4">
                <div className="relative">
                  <Search
                    size={18}
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="text"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleFilterChange("search", searchInput);
                      }
                    }}
                    className="w-full rounded-2xl border border-slate-200 py-3 pl-11 pr-4 outline-none focus:border-[var(--brand-500)]"
                    placeholder="Search by product name, brand, or description"
                  />
                </div>
                <select
                  value={filters.sort}
                  onChange={(e) => handleFilterChange("sort", e.target.value)}
                  className="rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-[var(--brand-500)]"
                >
                  <option value="latest">Latest arrivals</option>
                  <option value="priceAsc">Price: Low to high</option>
                  <option value="priceDesc">Price: High to low</option>
                  <option value="rating">Top rated</option>
                  <option value="name">Name A-Z</option>
                </select>
                <button
                  type="button"
                  onClick={() => handleFilterChange("search", searchInput)}
                  className="rounded-2xl bg-[var(--brand-600)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[var(--brand-700)]"
                >
                  Search Products
                </button>
              </div>
            </div>

            {notice ? (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
                {notice}
              </div>
            ) : null}

            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-[var(--brand-500)]">Catalog</p>
                <h2 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">Browse Products</h2>
                <p className="mt-2 text-sm text-slate-500">Category: {filters.category}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
                <p className="text-sm text-slate-500">Page status</p>
                <p className="mt-1 text-lg font-semibold text-slate-900">
                  {pagination.page || 1} / {pagination.totalPages || 1}
                </p>
              </div>
            </div>

            {loading ? (
              <div className="rounded-[2rem] border border-slate-200 bg-white p-10 text-center text-slate-500 shadow-sm">
                Loading products...
              </div>
            ) : products.length ? (
              <>
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  {products.map((product) => (
                    <ProductCard
                      key={product._id}
                      product={product}
                      onAdded={setNotice}
                      onWishlistChanged={(items) =>
                        setWishlistIds(items.map((item) => item._id))
                      }
                      isWishlisted={wishlistIds.includes(product._id)}
                    />
                  ))}
                </div>

                <div className="rounded-[2rem] border border-slate-200 bg-white px-5 py-5 shadow-sm">
                  <Pagination
                    currentPage={pagination.page || 1}
                    totalPages={pagination.totalPages || 1}
                    onPageChange={(page) =>
                      applyFilters((prev) => ({ ...prev, page }))
                    }
                  />
                </div>
              </>
            ) : (
              <div className="rounded-[2rem] border border-dashed border-slate-300 bg-white p-12 text-center shadow-sm">
                <h3 className="text-2xl font-semibold text-slate-900">No products found</h3>
                <p className="mt-3 text-slate-500">
                  Try a different search term or switch to another category.
                </p>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default Home;
