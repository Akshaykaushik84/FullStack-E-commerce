import { useCallback, useEffect, useMemo, useState } from "react";
import Navbar from "../components/NavbarComp";
import Footer from "../components/Footer";
import {
  deleteAdminUser,
  exportSalesReport,
  getAdminCarts,
  getAdminStats,
  getAdminUserCart,
  getAdminUsers,
  getSalesReport,
} from "../api/adminApi.jsx";
import {
  createProduct,
  deleteProduct,
  getProducts,
  updateProduct,
} from "../api/productApi.jsx";
import {
  createCoupon,
  deleteCoupon,
  getCoupons,
  updateCoupon,
} from "../api/couponApi.jsx";
import { downloadInvoice, getUserOrders, updateOrderStatus } from "../api/orderApi.jsx";
import { getStoredToken, getStoredUser } from "../utils/authStorage.js";

const emptyProductForm = {
  name: "",
  price: "",
  category: "",
  brand: "",
  image: "",
  description: "",
  countInStock: "",
  discountPercentage: "",
  tags: "",
  featured: false,
};

const emptyCouponForm = {
  code: "",
  description: "",
  discountType: "percentage",
  discountValue: "",
  minimumOrderAmount: "",
  isActive: true,
};

const saveBlob = (blob, fileName) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

const StatCard = ({ label, value, details }) => (
  <div className="rounded-[2rem] border border-slate-100 bg-white p-5 shadow-xl sm:p-6">
    <p className="text-sm font-medium text-slate-500">{label}</p>
    <p className="mt-3 text-3xl font-bold text-slate-900">{value}</p>
    <p className="mt-3 text-sm text-slate-500">{details}</p>
  </div>
);

const ChartCard = ({ title, data, color = "bg-[var(--brand-600)]" }) => {
  const maxValue = Math.max(...(data || []).map((item) => item.value), 1);

  return (
    <div className="rounded-[2rem] border border-slate-100 bg-white p-5 shadow-xl sm:p-6">
      <h3 className="mb-5 text-xl font-semibold text-slate-900">{title}</h3>
      {(data || []).length ? (
        <div className="space-y-4">
          {data.map((item) => (
            <div key={item.label}>
              <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                <span className="text-slate-600">{item.label}</span>
                <span className="font-semibold text-slate-900">{item.value}</span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                <div
                  className={`h-full rounded-full ${color}`}
                  style={{ width: `${(item.value / maxValue) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-slate-500">No data available.</p>
      )}
    </div>
  );
};

const SectionTitle = ({ eyebrow, title, description }) => (
  <div className="mb-6">
    <p className="mb-2 text-sm font-semibold uppercase tracking-[0.25em] text-[var(--brand-500)]">
      {eyebrow}
    </p>
    <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">{title}</h2>
    <p className="mt-2 text-slate-600">{description}</p>
  </div>
);

const AdminDashboard = () => {
  const token = getStoredToken();
  const user = getStoredUser();
  const [stats, setStats] = useState({
    productsCount: 0,
    usersCount: 0,
    activeSessions: 0,
    ordersCount: 0,
    revenue: 0,
    lowStockProducts: 0,
  });
  const [charts, setCharts] = useState({
    orderStatus: [],
    recentUsers: [],
    salesTrend: [],
    topProducts: [],
  });
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [carts, setCarts] = useState([]);
  const [selectedCart, setSelectedCart] = useState(null);
  const [coupons, setCoupons] = useState([]);
  const [salesReport, setSalesReport] = useState({ summary: {}, rows: [] });
  const [productForm, setProductForm] = useState(emptyProductForm);
  const [couponForm, setCouponForm] = useState(emptyCouponForm);
  const [editingProductId, setEditingProductId] = useState("");
  const [editingCouponId, setEditingCouponId] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [userPage, setUserPage] = useState(1);
  const [userPagination, setUserPagination] = useState({ page: 1, totalPages: 1 });
  const [adminNotice, setAdminNotice] = useState("");

  const refreshAdminData = useCallback(() => {
    Promise.allSettled([
      getAdminStats(token),
      getProducts({ page: 1, limit: 50 }),
      getUserOrders(token),
      getAdminUsers(token, { page: userPage, limit: 8, search: userSearch }),
      getAdminCarts(token),
      getCoupons(token),
      getSalesReport(token),
    ])
      .then(([statsRes, productsRes, ordersRes, usersRes, cartsRes, couponsRes, salesRes]) => {
        const failures = [];

        if (statsRes.status === "fulfilled") {
          setStats(statsRes.value.data.summary || {});
          setCharts(statsRes.value.data.charts || {});
        } else {
          failures.push("stats");
        }

        if (productsRes.status === "fulfilled") {
          setProducts(productsRes.value.data.items || []);
        } else {
          failures.push("products");
        }

        if (ordersRes.status === "fulfilled") {
          setOrders(ordersRes.value.data || []);
        } else {
          failures.push("orders");
        }

        if (usersRes.status === "fulfilled") {
          setUsers(usersRes.value.data.items || []);
          setUserPagination(usersRes.value.data.pagination || { page: 1, totalPages: 1 });
        } else {
          failures.push("users");
        }

        if (cartsRes.status === "fulfilled") {
          setCarts(cartsRes.value.data || []);
        } else {
          failures.push("carts");
        }

        if (couponsRes.status === "fulfilled") {
          setCoupons(couponsRes.value.data || []);
        } else {
          failures.push("coupons");
        }

        if (salesRes.status === "fulfilled") {
          setSalesReport(salesRes.value.data || { summary: {}, rows: [] });
        } else {
          failures.push("sales report");
        }

        setAdminNotice(
          failures.length ? `Some admin sections could not load: ${failures.join(", ")}.` : ""
        );
      })
      .catch((err) => {
        console.log(err);
        setAdminNotice("Unable to load admin dashboard data right now.");
      });
  }, [token, userPage, userSearch]);

  useEffect(() => {
    if (token) {
      refreshAdminData();
    }
  }, [refreshAdminData, token]);

  const reviewsWithPhotos = useMemo(
    () =>
      products.flatMap((product) =>
        (product.reviews || [])
          .filter((review) => review.image)
          .map((review) => ({
            ...review,
            productName: product.name,
          }))
      ),
    [products]
  );

  const handleProductChange = (e) => {
    const { name, value, type, checked } = e.target;
    setProductForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const handleCouponChange = (e) => {
    const { name, value, type, checked } = e.target;
    setCouponForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const handleProductSubmit = (e) => {
    e.preventDefault();

    const payload = {
      ...productForm,
      price: Number(productForm.price),
      countInStock: Number(productForm.countInStock),
      discountPercentage: Number(productForm.discountPercentage || 0),
    };

    const request = editingProductId
      ? updateProduct(editingProductId, payload, token)
      : createProduct(payload, token);

    request
      .then(() => {
        setProductForm(emptyProductForm);
        setEditingProductId("");
        refreshAdminData();
      })
      .catch((err) => alert(err.response?.data?.message || "Unable to save product"));
  };

  const handleCouponSubmit = (e) => {
    e.preventDefault();

    const payload = {
      ...couponForm,
      discountValue: Number(couponForm.discountValue),
      minimumOrderAmount: Number(couponForm.minimumOrderAmount || 0),
    };

    const request = editingCouponId
      ? updateCoupon(editingCouponId, payload, token)
      : createCoupon(payload, token);

    request
      .then(() => {
        setCouponForm(emptyCouponForm);
        setEditingCouponId("");
        refreshAdminData();
      })
      .catch((err) => alert(err.response?.data?.message || "Unable to save coupon"));
  };

  const startEditProduct = (product) => {
    setEditingProductId(product._id);
    setProductForm({
      name: product.name || "",
      price: product.price || "",
      category: product.category || "",
      brand: product.brand || "",
      image: product.image || "",
      description: product.description || "",
      countInStock: product.countInStock || "",
      discountPercentage: product.discountPercentage || "",
      tags: Array.isArray(product.tags) ? product.tags.join(", ") : "",
      featured: Boolean(product.featured),
    });
  };

  const startEditCoupon = (coupon) => {
    setEditingCouponId(coupon._id);
    setCouponForm({
      code: coupon.code || "",
      description: coupon.description || "",
      discountType: coupon.discountType || "percentage",
      discountValue: coupon.discountValue || "",
      minimumOrderAmount: coupon.minimumOrderAmount || "",
      isActive: coupon.isActive !== false,
    });
  };

  const handleDeleteProduct = (productId) => {
    deleteProduct(productId, token)
      .then(() => refreshAdminData())
      .catch((err) => alert(err.response?.data?.message || "Unable to delete product"));
  };

  const handleDeleteCoupon = (couponId) => {
    deleteCoupon(couponId, token)
      .then(() => refreshAdminData())
      .catch((err) => alert(err.response?.data?.message || "Unable to delete coupon"));
  };

  const handleOrderStatus = (orderId, status) => {
    updateOrderStatus(orderId, status, token)
      .then(() => refreshAdminData())
      .catch((err) => alert(err.response?.data?.message || "Unable to update order status"));
  };

  const handleDeleteUser = (userId) => {
    deleteAdminUser(userId, token)
      .then(() => {
        if (selectedCart?.user?._id === userId) {
          setSelectedCart(null);
        }
        refreshAdminData();
      })
      .catch((err) => alert(err.response?.data?.message || "Unable to delete user"));
  };

  const handleViewCart = (userId) => {
    getAdminUserCart(userId, token)
      .then((res) => setSelectedCart(res.data))
      .catch((err) => alert(err.response?.data?.message || "Cart not found for this user"));
  };

  const handleExportSales = () => {
    exportSalesReport(token)
      .then((res) => saveBlob(res.data, "sales-report.csv"))
      .catch((err) => alert(err.response?.data?.message || "Unable to export report"));
  };

  const handleInvoiceDownload = (order) => {
    downloadInvoice(order._id, token)
      .then((res) => saveBlob(res.data, `${order.invoiceNumber || `invoice-${order._id}`}.html`))
      .catch((err) => alert(err.response?.data?.message || "Unable to download invoice"));
  };

  if (user?.role !== "admin") {
    return (
      <div className="min-h-screen bg-slate-100">
        <Navbar />
        <div className="pt-28 text-center text-lg text-slate-600">Admin access only.</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,var(--surface-50)_0%,var(--brand-50)_100%)]">
      <Navbar />
      <div className="mx-auto max-w-7xl space-y-6 px-3 pb-28 pt-24 sm:px-5 sm:pt-28 lg:space-y-8 lg:px-6 lg:pb-14">
        <div className="rounded-[2rem] bg-[var(--ink-900)] p-5 text-white shadow-2xl sm:p-8">
          <p className="mb-4 text-sm uppercase tracking-[0.35em] text-teal-300">Admin Console</p>
          <h1 className="mb-3 text-3xl font-bold sm:text-4xl md:text-5xl">
            Store operations, reports, and customer control
          </h1>
          <p className="text-base text-slate-300 sm:text-lg">
            Manage products, coupons, users, reviews, orders, carts, invoices, and sales reporting from one dashboard.
          </p>
          <div className="mt-6 text-sm text-slate-300">Admin login: admin@gmail.com / 123456</div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
          <StatCard label="Products" value={stats.productsCount || 0} details="Live product inventory" />
          <StatCard label="Users" value={stats.usersCount || 0} details="Registered customer accounts" />
          <StatCard label="Active Sessions" value={stats.activeSessions || 0} details="Users currently active" />
          <StatCard label="Orders" value={stats.ordersCount || 0} details="Tracked customer orders" />
          <StatCard label="Low Stock" value={stats.lowStockProducts || 0} details="Products needing restock" />
          <StatCard label="Revenue" value={`Rs ${Number(stats.revenue || 0).toFixed(0)}`} details="Current total sales" />
        </div>

        {adminNotice ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700">
            {adminNotice}
          </div>
        ) : null}

        <div className="grid gap-6 xl:grid-cols-2 xl:gap-8">
          <ChartCard title="Orders by Status" data={charts.orderStatus || []} />
          <ChartCard title="Recent User Signups" data={charts.recentUsers || []} color="bg-teal-500" />
          <ChartCard title="Sales Trend" data={charts.salesTrend || []} color="bg-amber-500" />
          <ChartCard title="Top Selling Products" data={charts.topProducts || []} color="bg-slate-800" />
        </div>

        <div className="grid items-start gap-6 xl:grid-cols-[0.95fr_1.05fr] xl:gap-8">
          <div className="rounded-[2rem] border border-slate-100 bg-white p-5 shadow-xl sm:p-8">
            <SectionTitle
              eyebrow="Catalog"
              title={editingProductId ? "Update Product" : "Add Product"}
              description="Create new products or edit existing ones from one form."
            />

            <form className="space-y-4" onSubmit={handleProductSubmit}>
              <input name="name" value={productForm.name} onChange={handleProductChange} className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-[var(--brand-500)]" placeholder="Product name" required />
              <div className="grid gap-4 md:grid-cols-2">
                <input type="number" name="price" value={productForm.price} onChange={handleProductChange} className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-[var(--brand-500)]" placeholder="Price" required />
                <input type="number" name="countInStock" value={productForm.countInStock} onChange={handleProductChange} className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-[var(--brand-500)]" placeholder="Stock" required />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <input name="category" value={productForm.category} onChange={handleProductChange} className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-[var(--brand-500)]" placeholder="Category" />
                <input name="brand" value={productForm.brand} onChange={handleProductChange} className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-[var(--brand-500)]" placeholder="Brand" />
              </div>
              <input name="image" value={productForm.image} onChange={handleProductChange} className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-[var(--brand-500)]" placeholder="Image URL" />
              <div className="grid gap-4 md:grid-cols-2">
                <input type="number" name="discountPercentage" value={productForm.discountPercentage} onChange={handleProductChange} className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-[var(--brand-500)]" placeholder="Discount %" />
                <input name="tags" value={productForm.tags} onChange={handleProductChange} className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-[var(--brand-500)]" placeholder="Tags comma separated" />
              </div>
              <textarea name="description" value={productForm.description} onChange={handleProductChange} className="min-h-28 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-[var(--brand-500)]" placeholder="Description" required />
              <label className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700">
                <input type="checkbox" name="featured" checked={productForm.featured} onChange={handleProductChange} />
                Mark as featured product
              </label>
              <div className="flex flex-col gap-3 sm:flex-row">
                <button type="submit" className="flex-1 rounded-2xl bg-[var(--brand-600)] py-3 font-semibold text-white">
                  {editingProductId ? "Update Product" : "Publish Product"}
                </button>
                {editingProductId ? (
                  <button
                    type="button"
                    className="rounded-2xl border border-slate-200 px-5 py-3"
                    onClick={() => {
                      setEditingProductId("");
                      setProductForm(emptyProductForm);
                    }}
                  >
                    Cancel
                  </button>
                ) : null}
              </div>
            </form>
          </div>

          <div className="rounded-[2rem] border border-slate-100 bg-white p-5 shadow-xl sm:p-8">
            <SectionTitle
              eyebrow="Inventory"
              title="Products"
              description="Edit, delete, and inspect catalog performance."
            />
            <div className="space-y-4">
              {products.map((product) => (
                <div key={product._id} className="rounded-[1.75rem] border border-slate-100 bg-slate-50 p-4">
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div className="flex min-w-0 items-start gap-4">
                      <img src={product.image} alt={product.name} className="h-20 w-20 rounded-2xl object-cover" />
                      <div className="min-w-0">
                        <p className="truncate text-lg font-semibold text-slate-900">{product.name}</p>
                        <p className="mt-1 text-sm text-slate-500">{product.category || "General"} | {product.brand || "MyStore Select"}</p>
                        <p className="mt-3 line-clamp-2 text-sm text-slate-600">{product.description}</p>
                        <div className="mt-3 flex flex-wrap gap-2 text-xs">
                          <span className="rounded-full bg-[var(--brand-50)] px-3 py-1 font-semibold text-[var(--brand-700)]">Rs {product.price}</span>
                          <span className="rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-700">Stock: {product.countInStock}</span>
                          <span className="rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-700">Reviews: {product.numReviews || 0}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      <button onClick={() => startEditProduct(product)} className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white">Edit</button>
                      <button onClick={() => handleDeleteProduct(product._id)} className="rounded-xl bg-rose-500 px-4 py-2 text-sm font-medium text-white">Delete</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid items-start gap-6 xl:grid-cols-[0.9fr_1.1fr] xl:gap-8">
          <div className="rounded-[2rem] border border-slate-100 bg-white p-5 shadow-xl sm:p-8">
            <SectionTitle
              eyebrow="Coupons"
              title={editingCouponId ? "Update Coupon" : "Coupon Panel"}
              description="Create, edit, activate, and remove coupon offers."
            />
            <form className="space-y-4" onSubmit={handleCouponSubmit}>
              <div className="grid gap-4 md:grid-cols-2">
                <input name="code" value={couponForm.code} onChange={handleCouponChange} className="w-full rounded-2xl border border-slate-200 px-4 py-3 uppercase outline-none focus:border-[var(--brand-500)]" placeholder="Code" required />
                <select name="discountType" value={couponForm.discountType} onChange={handleCouponChange} className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-[var(--brand-500)]">
                  <option value="percentage">Percentage</option>
                  <option value="flat">Flat</option>
                </select>
              </div>
              <textarea name="description" value={couponForm.description} onChange={handleCouponChange} className="min-h-24 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-[var(--brand-500)]" placeholder="Offer description" />
              <div className="grid gap-4 md:grid-cols-2">
                <input type="number" name="discountValue" value={couponForm.discountValue} onChange={handleCouponChange} className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-[var(--brand-500)]" placeholder="Discount value" required />
                <input type="number" name="minimumOrderAmount" value={couponForm.minimumOrderAmount} onChange={handleCouponChange} className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-[var(--brand-500)]" placeholder="Minimum order amount" />
              </div>
              <label className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700">
                <input type="checkbox" name="isActive" checked={couponForm.isActive} onChange={handleCouponChange} />
                Coupon is active
              </label>
              <div className="flex flex-col gap-3 sm:flex-row">
                <button type="submit" className="flex-1 rounded-2xl bg-[var(--brand-600)] py-3 font-semibold text-white">
                  {editingCouponId ? "Update Coupon" : "Save Coupon"}
                </button>
                {editingCouponId ? (
                  <button
                    type="button"
                    className="rounded-2xl border border-slate-200 px-5 py-3"
                    onClick={() => {
                      setEditingCouponId("");
                      setCouponForm(emptyCouponForm);
                    }}
                  >
                    Cancel
                  </button>
                ) : null}
              </div>
            </form>
          </div>

          <div className="rounded-[2rem] border border-slate-100 bg-white p-5 shadow-xl sm:p-8">
            <SectionTitle
              eyebrow="Offers"
              title="Saved Coupons"
              description="Monitor all coupon rules currently available in checkout."
            />
            <div className="space-y-4">
              {coupons.map((coupon) => (
                <div key={coupon._id} className="rounded-3xl border border-slate-100 bg-slate-50 p-4">
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-lg font-semibold text-slate-900">{coupon.code}</p>
                      <p className="mt-1 text-sm text-slate-500">{coupon.description || "No description"}</p>
                      <p className="mt-2 text-sm text-slate-600">
                        {coupon.discountType === "flat" ? `Rs ${coupon.discountValue}` : `${coupon.discountValue}%`} off | Min order Rs {coupon.minimumOrderAmount || 0}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      <span className={`rounded-full px-3 py-2 text-xs font-semibold ${coupon.isActive ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-600"}`}>
                        {coupon.isActive ? "Active" : "Inactive"}
                      </span>
                      <button onClick={() => startEditCoupon(coupon)} className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white">Edit</button>
                      <button onClick={() => handleDeleteCoupon(coupon._id)} className="rounded-xl bg-rose-500 px-4 py-2 text-sm font-medium text-white">Delete</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid items-start gap-6 xl:grid-cols-[1.1fr_0.9fr] xl:gap-8">
          <div className="rounded-[2rem] border border-slate-100 bg-white p-5 shadow-xl sm:p-8">
            <SectionTitle
              eyebrow="Customers"
              title="Users"
              description="Review customer accounts, active session state, and cart access."
            />
            <div className="mb-5 flex flex-col gap-3 sm:flex-row">
              <input
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="Search users"
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-[var(--brand-500)]"
              />
              <button type="button" onClick={() => { setUserPage(1); refreshAdminData(); }} className="rounded-2xl bg-[var(--brand-600)] px-4 py-3 text-sm font-semibold text-white">
                Search
              </button>
            </div>
            <div className="space-y-4">
              {users.map((account) => (
                <div key={account._id} className="flex flex-col gap-4 rounded-3xl border border-slate-100 bg-slate-50 p-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="font-semibold text-slate-900">{account.name}</p>
                    <p className="break-all text-sm text-slate-500">{account.email}</p>
                    <p className="mt-2 text-xs text-slate-500">Joined: {new Date(account.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${account.isSessionActive ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
                      {account.isSessionActive ? "Active" : "Offline"}
                    </span>
                    <button onClick={() => handleViewCart(account._id)} className="rounded-xl border border-slate-200 px-4 py-2">
                      View Cart
                    </button>
                    <button onClick={() => handleDeleteUser(account._id)} className="rounded-xl bg-rose-500 px-4 py-2 text-white">
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-5 flex flex-wrap items-center justify-end gap-3">
              <button type="button" disabled={userPagination.page <= 1} onClick={() => setUserPage((prev) => Math.max(prev - 1, 1))} className="rounded-2xl border border-slate-200 px-4 py-2 text-sm disabled:opacity-50">
                Previous
              </button>
              <span className="text-sm text-slate-500">Page {userPagination.page || 1} of {userPagination.totalPages || 1}</span>
              <button type="button" disabled={userPagination.page >= userPagination.totalPages} onClick={() => setUserPage((prev) => prev + 1)} className="rounded-2xl border border-slate-200 px-4 py-2 text-sm disabled:opacity-50">
                Next
              </button>
            </div>
          </div>

          <div className="space-y-6 xl:space-y-8">
            <div className="rounded-[2rem] border border-slate-100 bg-white p-5 shadow-xl sm:p-8">
              <SectionTitle
                eyebrow="Cart Review"
                title="Selected User Cart"
                description="Inspect items currently sitting in a customer's cart."
              />
              {selectedCart ? (
                <div className="space-y-4">
                  <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                    <p className="break-all font-semibold text-slate-900">
                      {selectedCart.user?.name} ({selectedCart.user?.email})
                    </p>
                  </div>
                  {(selectedCart.products || []).length ? (
                    selectedCart.products.map((item) => (
                      <div key={item._id} className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-white p-4">
                        <img src={item.product?.image} alt={item.product?.name} className="h-16 w-16 rounded-2xl object-cover" />
                        <div>
                          <p className="font-semibold text-slate-900">{item.product?.name}</p>
                          <p className="text-slate-500">Qty: {item.quantity}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-slate-500">This cart is empty.</p>
                  )}
                </div>
              ) : (
                <p className="text-slate-500">Choose a user to inspect the cart.</p>
              )}
            </div>

            <div className="rounded-[2rem] border border-slate-100 bg-white p-5 shadow-xl sm:p-8">
              <SectionTitle
                eyebrow="Cart List"
                title="All Carts"
                description="Quick overview of every stored cart."
              />
              <div className="max-h-[26rem] space-y-3 overflow-auto pr-2">
                {carts.map((cart) => (
                  <button key={cart._id} className="w-full rounded-2xl border border-slate-100 bg-slate-50 p-4 text-left hover:border-[var(--brand-100)]" onClick={() => setSelectedCart(cart)}>
                    <p className="font-semibold text-slate-900">{cart.user?.name || "Unknown User"}</p>
                    <p className="break-all text-sm text-slate-500">{cart.user?.email || "No email"} | {(cart.products || []).length} items</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr] xl:gap-8">
          <div className="rounded-[2rem] border border-slate-100 bg-white p-5 shadow-xl sm:p-8">
            <SectionTitle
              eyebrow="Reviews"
              title="Review Photos"
              description="Customer reviews that include uploaded images."
            />
            <div className="grid gap-4 sm:grid-cols-2">
              {reviewsWithPhotos.length ? (
                reviewsWithPhotos.map((review) => (
                  <div key={review._id} className="rounded-3xl border border-slate-100 bg-slate-50 p-4">
                    <img src={review.image} alt={review.productName} className="h-40 w-full rounded-2xl object-cover" />
                    <p className="mt-3 font-semibold text-slate-900">{review.productName}</p>
                    <p className="mt-1 text-sm text-slate-500">{review.name} | {review.rating}/5</p>
                    <p className="mt-2 text-sm text-slate-600">{review.comment}</p>
                  </div>
                ))
              ) : (
                <p className="text-slate-500">No photo reviews uploaded yet.</p>
              )}
            </div>
          </div>

          <div className="rounded-[2rem] border border-slate-100 bg-white p-5 shadow-xl sm:p-8">
            <SectionTitle
              eyebrow="Sales"
              title="Sales Report"
              description="Export revenue data and review order-level sales performance."
            />
            <div className="mb-5 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4">
                <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Revenue</p>
                <p className="mt-2 text-2xl font-bold text-slate-900">Rs {Number(salesReport.summary?.totalRevenue || 0).toFixed(0)}</p>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4">
                <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Orders</p>
                <p className="mt-2 text-2xl font-bold text-slate-900">{salesReport.summary?.totalOrders || 0}</p>
              </div>
            </div>
            <button onClick={handleExportSales} className="mb-5 rounded-2xl bg-[var(--brand-600)] px-5 py-3 text-sm font-semibold text-white">
              Export CSV
            </button>
            <div className="max-h-[24rem] overflow-auto rounded-2xl border border-slate-100">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 text-left text-slate-600">
                  <tr>
                    <th className="px-4 py-3">Invoice</th>
                    <th className="px-4 py-3">Customer</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {(salesReport.rows || []).slice(0, 12).map((row) => (
                    <tr key={row.orderId} className="border-t border-slate-100">
                      <td className="px-4 py-3">{row.invoiceNumber || "-"}</td>
                      <td className="px-4 py-3">{row.customerName}</td>
                      <td className="px-4 py-3">{row.status}</td>
                      <td className="px-4 py-3">Rs {Number(row.totalPrice || 0).toFixed(0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="rounded-[2rem] border border-slate-100 bg-white p-5 shadow-xl sm:p-8">
          <SectionTitle
            eyebrow="Fulfillment"
            title="Orders"
            description="Approve, ship, deliver, cancel, return, and download order invoices."
          />
          <div className="space-y-4">
            {orders.map((order) => (
              <div key={order._id} className="rounded-3xl border border-slate-100 bg-slate-50 p-5">
                <div className="mb-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
                  <div>
                    <p className="text-sm text-slate-500">Order ID</p>
                    <p className="break-all font-semibold text-slate-900">{order._id}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Customer</p>
                    <p className="break-all font-semibold text-slate-900">{order.user?.name || "Customer"}</p>
                    <p className="break-all text-xs text-slate-500">{order.user?.email || "No email"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Status</p>
                    <p className="font-semibold text-[var(--brand-600)]">{order.status}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Invoice</p>
                    <p className="font-semibold text-slate-900">{order.invoiceNumber || "Pending"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Total</p>
                    <p className="font-semibold text-slate-900">Rs {Number(order.totalPrice || 0).toFixed(0)}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-3">
                  {["Approved", "Shipped", "Delivered", "Cancelled", "Return Requested", "Returned"].map((status) => (
                    <button key={status} className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white" onClick={() => handleOrderStatus(order._id, status)}>
                      Mark {status}
                    </button>
                  ))}
                  <button className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700" onClick={() => handleInvoiceDownload(order)}>
                    Download Invoice
                  </button>
                </div>
                {order.cancelReason ? <p className="mt-3 text-sm text-rose-600">Cancel reason: {order.cancelReason}</p> : null}
                {order.returnReason ? <p className="mt-3 text-sm text-amber-600">Return reason: {order.returnReason}</p> : null}
              </div>
            ))}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default AdminDashboard;
