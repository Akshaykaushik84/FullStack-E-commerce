import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronUp, Pencil, PackageOpen, Trash2 } from "lucide-react";
import Navbar from "../components/NavbarComp";
import Footer from "../components/Footer";
import { useToast } from "../hooks/useToast.js";
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
import { isValidHttpUrl, isValidImageFile, isValidName } from "../utils/formValidation.js";

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

const formatPaymentMethod = (method) => ({
  Card: "Debit/Credit Card",
  "Mock Gateway": "Online Payment",
}[method] || method || "Cash on Delivery");

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
  const [productImageFile, setProductImageFile] = useState(null);
  const [couponForm, setCouponForm] = useState(emptyCouponForm);
  const [editingProductId, setEditingProductId] = useState("");
  const [editingCouponId, setEditingCouponId] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [userPage, setUserPage] = useState(1);
  const [userPagination, setUserPagination] = useState({ page: 1, totalPages: 1 });
  const [adminNotice, setAdminNotice] = useState("");
  const [showProducts, setShowProducts] = useState(false);
  const [showUsers, setShowUsers] = useState(false);
  const [showCarts, setShowCarts] = useState(false);
  const [showReviews, setShowReviews] = useState(false);
  const [showSalesRows, setShowSalesRows] = useState(false);
  const [showOrders, setShowOrders] = useState(false);
  const [productSearch, setProductSearch] = useState("");
  const { showError, showSuccess } = useToast();

  const productPreviewUrl = useMemo(
    () => (productImageFile ? URL.createObjectURL(productImageFile) : ""),
    [productImageFile]
  );

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

  const filteredProducts = useMemo(() => {
    const search = productSearch.trim().toLowerCase();

    if (!search) return products;

    return products.filter((product) =>
      [product.name, product.category, product.brand]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(search))
    );
  }, [productSearch, products]);

  useEffect(() => {
    if (!productPreviewUrl) return undefined;

    return () => URL.revokeObjectURL(productPreviewUrl);
  }, [productPreviewUrl]);

  const handleProductChange = (e) => {
    const { name, value, type, checked } = e.target;
    setProductForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const handleCouponChange = (e) => {
    const { name, value, type, checked } = e.target;
    setCouponForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : name === "code" ? value.toUpperCase().replace(/[^A-Z0-9]/g, "") : value,
    }));
  };

  const handleProductImageChange = (e) => {
    const file = e.target.files?.[0] || null;

    if (file && !isValidImageFile(file, 4)) {
      showError("Please upload a valid product image under 4 MB.");
      e.target.value = "";
      setProductImageFile(null);
      return;
    }

    setProductImageFile(file);
  };

  const handleProductSubmit = (e) => {
    e.preventDefault();

    const price = Number(productForm.price);
    const stock = Number(productForm.countInStock);
    const discountPercentage = Number(productForm.discountPercentage || 0);
    const imageUrl = productForm.image.trim();

    if (!isValidName(productForm.name)) {
      showError("Product name must be at least 2 characters.");
      return;
    }

    if (!Number.isFinite(price) || price <= 0) {
      showError("Product price must be greater than 0.");
      return;
    }

    if (!Number.isInteger(stock) || stock < 0) {
      showError("Product stock must be a valid whole number.");
      return;
    }

    if (!isValidName(productForm.category)) {
      showError("Product category is required.");
      return;
    }

    if (!productImageFile && !imageUrl) {
      showError("Please upload a product image or enter an image URL.");
      return;
    }

    if (imageUrl && !isValidHttpUrl(imageUrl)) {
      showError("Please enter a valid product image URL.");
      return;
    }

    if (!productForm.description.trim() || productForm.description.trim().length < 8) {
      showError("Product description must be at least 8 characters.");
      return;
    }

    if (!Number.isFinite(discountPercentage) || discountPercentage < 0 || discountPercentage > 95) {
      showError("Discount must be between 0 and 95.");
      return;
    }

    const payload = {
      ...productForm,
      name: productForm.name.trim(),
      category: productForm.category.trim(),
      brand: productForm.brand.trim(),
      image: imageUrl,
      description: productForm.description.trim(),
      price,
      countInStock: stock,
      discountPercentage,
    };

    const requestPayload = new FormData();

    Object.entries(payload).forEach(([key, value]) => {
      requestPayload.append(key, value);
    });

    if (productImageFile) {
      requestPayload.append("productImage", productImageFile);
    }

    const request = editingProductId
      ? updateProduct(editingProductId, requestPayload, token)
      : createProduct(requestPayload, token);

    request
      .then(() => {
        setProductForm(emptyProductForm);
        setProductImageFile(null);
        setEditingProductId("");
        showSuccess(editingProductId ? "Product updated successfully." : "Product created successfully.");
        refreshAdminData();
      })
      .catch((err) => showError(err.response?.data?.message || "Unable to save product"));
  };

  const handleCouponSubmit = (e) => {
    e.preventDefault();

    const code = couponForm.code.trim().toUpperCase();
    const discountValue = Number(couponForm.discountValue);
    const minimumOrderAmount = Number(couponForm.minimumOrderAmount || 0);

    if (!/^[A-Z0-9]{3,20}$/.test(code)) {
      showError("Coupon code must be 3-20 letters or numbers.");
      return;
    }

    if (!Number.isFinite(discountValue) || discountValue <= 0) {
      showError("Discount value must be greater than 0.");
      return;
    }

    if (couponForm.discountType === "percentage" && discountValue > 95) {
      showError("Percentage discount must be between 1 and 95.");
      return;
    }

    if (!Number.isFinite(minimumOrderAmount) || minimumOrderAmount < 0) {
      showError("Minimum order amount must be 0 or more.");
      return;
    }

    if (couponForm.description.trim().length > 160) {
      showError("Coupon description must be 160 characters or less.");
      return;
    }

    const payload = {
      ...couponForm,
      code,
      description: couponForm.description.trim(),
      discountValue,
      minimumOrderAmount,
    };

    const request = editingCouponId
      ? updateCoupon(editingCouponId, payload, token)
      : createCoupon(payload, token);

    request
      .then(() => {
        setCouponForm(emptyCouponForm);
        setEditingCouponId("");
        showSuccess(editingCouponId ? "Coupon updated successfully." : "Coupon created successfully.");
        refreshAdminData();
      })
      .catch((err) => showError(err.response?.data?.message || "Unable to save coupon"));
  };

  const startEditProduct = (product) => {
    setEditingProductId(product._id);
    setProductImageFile(null);
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
      .then(() => {
        showSuccess("Product deleted successfully.");
        return refreshAdminData();
      })
      .catch((err) => showError(err.response?.data?.message || "Unable to delete product"));
  };

  const handleDeleteCoupon = (couponId) => {
    deleteCoupon(couponId, token)
      .then(() => {
        showSuccess("Coupon deleted successfully.");
        return refreshAdminData();
      })
      .catch((err) => showError(err.response?.data?.message || "Unable to delete coupon"));
  };

  const handleOrderStatus = (orderId, status) => {
    updateOrderStatus(orderId, status, token)
      .then(() => {
        showSuccess(`Order marked ${status}.`);
        return refreshAdminData();
      })
      .catch((err) => showError(err.response?.data?.message || "Unable to update order status"));
  };

  const handleDeleteUser = (userId) => {
    deleteAdminUser(userId, token)
      .then(() => {
        if (selectedCart?.user?._id === userId) {
          setSelectedCart(null);
        }
        showSuccess("User deleted successfully.");
        refreshAdminData();
      })
      .catch((err) => showError(err.response?.data?.message || "Unable to delete user"));
  };

  const handleViewCart = (userId) => {
    getAdminUserCart(userId, token)
      .then((res) => {
        setSelectedCart(res.data);
        showSuccess("Cart loaded successfully.");
      })
      .catch((err) => showError(err.response?.data?.message || "Cart not found for this user"));
  };

  const handleExportSales = () => {
    exportSalesReport(token)
      .then((res) => {
        saveBlob(res.data, "sales-report.csv");
        showSuccess("Sales report export started.");
      })
      .catch((err) => showError(err.response?.data?.message || "Unable to export report"));
  };

  const handleInvoiceDownload = (order) => {
    downloadInvoice(order._id, token)
      .then((res) => {
        saveBlob(res.data, `${order.invoiceNumber || `invoice-${order._id}`}.html`);
        showSuccess("Invoice download started.");
      })
      .catch((err) => showError(err.response?.data?.message || "Unable to download invoice"));
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
      <div className="mx-auto max-w-7xl space-y-5 px-3 pb-28 pt-22 sm:px-5 sm:pt-28 lg:space-y-8 lg:px-6 lg:pb-14">
        <div className="rounded-[2rem] bg-[var(--ink-900)] p-5 text-white shadow-2xl sm:p-8">
          <p className="mb-4 text-sm uppercase tracking-[0.35em] text-teal-300">Admin Console</p>
          <h1 className="mb-3 text-2xl font-bold leading-tight sm:text-4xl md:text-5xl">
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
              <input name="name" value={productForm.name} onChange={handleProductChange} className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-[var(--brand-500)]" placeholder="Product name" required minLength={2} maxLength={80} />
              <div className="grid gap-4 md:grid-cols-2">
                <input type="number" name="price" value={productForm.price} onChange={handleProductChange} className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-[var(--brand-500)]" placeholder="Price" required min="0" step="1" />
                <input type="number" name="countInStock" value={productForm.countInStock} onChange={handleProductChange} className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-[var(--brand-500)]" placeholder="Stock" required min="0" step="1" />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <input name="category" value={productForm.category} onChange={handleProductChange} className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-[var(--brand-500)]" placeholder="Category" maxLength={40} />
                <input name="brand" value={productForm.brand} onChange={handleProductChange} className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-[var(--brand-500)]" placeholder="Brand" maxLength={40} />
              </div>
              <div className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <input type="url" name="image" value={productForm.image} onChange={handleProductChange} className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-[var(--brand-500)]" placeholder="Image URL" pattern="https?://.+" title="Enter a valid http or https image URL" />
                <label className="grid gap-2 text-sm font-medium text-slate-700">
                  Upload product image
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleProductImageChange}
                    className="w-full rounded-xl border border-dashed border-slate-300 bg-white px-4 py-3 text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-900 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white"
                  />
                </label>
                <p className="text-xs text-slate-500">
                  {productImageFile ? `${productImageFile.name} will be used first.` : "Upload image has priority over URL."}
                </p>
                {productPreviewUrl || productForm.image ? (
                  <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                    <img
                      src={productPreviewUrl || productForm.image}
                      alt="Product preview"
                      className="aspect-[4/3] w-full object-cover"
                    />
                  </div>
                ) : null}
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <input type="number" name="discountPercentage" value={productForm.discountPercentage} onChange={handleProductChange} className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-[var(--brand-500)]" placeholder="Discount %" min="0" max="95" step="1" />
                <input name="tags" value={productForm.tags} onChange={handleProductChange} className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-[var(--brand-500)]" placeholder="Tags comma separated" maxLength={120} />
              </div>
              <textarea name="description" value={productForm.description} onChange={handleProductChange} className="min-h-28 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-[var(--brand-500)]" placeholder="Description" required minLength={8} maxLength={500} />
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
                      setProductImageFile(null);
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
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="mb-2 text-sm font-semibold uppercase tracking-[0.25em] text-[var(--brand-500)]">
                  Inventory
                </p>
                <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">Products</h2>
                <p className="mt-2 text-slate-600">Compact catalog controls for quick edits.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowProducts((value) => !value)}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-200 transition hover:bg-slate-800"
              >
                <PackageOpen size={17} />
                {showProducts ? "Hide Products" : "Show Products"}
                {showProducts ? <ChevronUp size={17} /> : <ChevronDown size={17} />}
              </button>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Loaded</p>
                <p className="mt-1 text-xl font-bold text-slate-900">{products.length}</p>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Low Stock</p>
                <p className="mt-1 text-xl font-bold text-slate-900">
                  {products.filter((product) => Number(product.countInStock || 0) <= 5).length}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Featured</p>
                <p className="mt-1 text-xl font-bold text-slate-900">
                  {products.filter((product) => product.featured).length}
                </p>
              </div>
            </div>

            <div className="mt-5 min-h-[28rem] rounded-2xl border border-slate-100 bg-slate-50 p-3">
            {showProducts ? (
              <div className="space-y-4">
                <div className="flex flex-col gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-3 sm:flex-row sm:items-center">
                  <input
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    placeholder="Search products by name, category, or brand"
                    className="min-h-11 flex-1 rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none focus:border-[var(--brand-500)]"
                  />
                  <span className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-slate-600">
                    {filteredProducts.length} shown
                  </span>
                </div>
              <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white">
                <div className="hidden max-h-[22rem] overflow-auto md:block">
                  <table className="min-w-full text-left text-sm">
                    <thead className="sticky top-0 z-10 bg-slate-50 text-xs uppercase tracking-[0.18em] text-slate-500">
                      <tr>
                        <th className="px-4 py-3">Product</th>
                        <th className="px-4 py-3">Category</th>
                        <th className="px-4 py-3">Price</th>
                        <th className="px-4 py-3">Stock</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredProducts.map((product) => (
                        <tr key={product._id} className="bg-white hover:bg-slate-50">
                          <td className="px-4 py-3">
                            <div className="flex min-w-0 items-center gap-3">
                              <img src={product.image} alt={product.name} className="h-12 w-12 rounded-xl object-cover" />
                              <div className="min-w-0">
                                <p className="truncate font-semibold text-slate-900">{product.name}</p>
                                <p className="truncate text-xs text-slate-500">{product.brand || "Store Select"}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-slate-600">{product.category || "General"}</td>
                          <td className="px-4 py-3 font-semibold text-slate-900">Rs {Number(product.price || 0).toFixed(0)}</td>
                          <td className="px-4 py-3">
                            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${Number(product.countInStock || 0) <= 5 ? "bg-rose-100 text-rose-700" : "bg-emerald-100 text-emerald-700"}`}>
                              {product.countInStock || 0}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => startEditProduct(product)}
                                className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-white transition hover:bg-slate-800"
                                title="Edit product"
                                aria-label={`Edit ${product.name}`}
                              >
                                <Pencil size={15} />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteProduct(product._id)}
                                className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-rose-500 text-white transition hover:bg-rose-600"
                                title="Delete product"
                                aria-label={`Delete ${product.name}`}
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="max-h-[22rem] space-y-3 overflow-auto bg-slate-50 p-3 md:hidden">
                  {filteredProducts.map((product) => (
                    <div key={product._id} className="rounded-2xl border border-slate-100 bg-white p-3">
                      <div className="flex gap-3">
                        <img src={product.image} alt={product.name} className="h-16 w-16 rounded-xl object-cover" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-semibold text-slate-900">{product.name}</p>
                          <p className="text-xs text-slate-500">{product.category || "General"} | Rs {Number(product.price || 0).toFixed(0)}</p>
                          <p className="mt-1 text-xs text-slate-500">Stock: {product.countInStock || 0}</p>
                        </div>
                      </div>
                      <div className="mt-3 grid grid-cols-2 gap-2">
                        <button type="button" onClick={() => startEditProduct(product)} className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-3 py-2 text-sm font-medium text-white">
                          <Pencil size={14} /> Edit
                        </button>
                        <button type="button" onClick={() => handleDeleteProduct(product._id)} className="inline-flex items-center justify-center gap-2 rounded-xl bg-rose-500 px-3 py-2 text-sm font-medium text-white">
                          <Trash2 size={14} /> Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              </div>
            ) : (
              <div className="flex min-h-[26rem] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white px-5 py-8 text-center">
                <PackageOpen className="mx-auto text-slate-400" size={34} />
                <p className="mt-3 font-semibold text-slate-900">Products are hidden</p>
                <p className="mt-1 text-sm text-slate-500">Use Show Products when you need to edit inventory.</p>
              </div>
            )}
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
                <input name="code" value={couponForm.code} onChange={handleCouponChange} className="w-full rounded-2xl border border-slate-200 px-4 py-3 uppercase outline-none focus:border-[var(--brand-500)]" placeholder="Code" required minLength={3} maxLength={20} pattern="[A-Za-z0-9]{3,20}" title="Use 3-20 letters or numbers only" />
                <select name="discountType" value={couponForm.discountType} onChange={handleCouponChange} className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-[var(--brand-500)]">
                  <option value="percentage">Percentage</option>
                  <option value="flat">Flat</option>
                </select>
              </div>
              <textarea name="description" value={couponForm.description} onChange={handleCouponChange} className="min-h-24 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-[var(--brand-500)]" placeholder="Offer description" maxLength={160} />
              <div className="grid gap-4 md:grid-cols-2">
                <input type="number" name="discountValue" value={couponForm.discountValue} onChange={handleCouponChange} className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-[var(--brand-500)]" placeholder="Discount value" required min="1" max={couponForm.discountType === "percentage" ? "95" : undefined} step="1" />
                <input type="number" name="minimumOrderAmount" value={couponForm.minimumOrderAmount} onChange={handleCouponChange} className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-[var(--brand-500)]" placeholder="Minimum order amount" min="0" step="1" />
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
                    <div className="grid w-full gap-2 sm:flex sm:w-auto sm:flex-wrap sm:gap-3">
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
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="mb-2 text-sm font-semibold uppercase tracking-[0.25em] text-[var(--brand-500)]">Customers</p>
                <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">Users</h2>
                <p className="mt-2 text-slate-600">Review customer accounts, active sessions, and cart access.</p>
              </div>
              <button type="button" onClick={() => setShowUsers((value) => !value)} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white">
                {showUsers ? "Hide Users" : "Show Users"}
                {showUsers ? <ChevronUp size={17} /> : <ChevronDown size={17} />}
              </button>
            </div>
            <div className="min-h-[30rem] rounded-2xl border border-slate-100 bg-slate-50 p-3">
            {showUsers ? (
            <>
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
            <div className="max-h-[20rem] space-y-4 overflow-auto pr-1">
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
            </>
            ) : (
              <div className="flex min-h-[28rem] items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white px-5 py-8 text-center text-sm text-slate-500">
                Users are hidden. Open them when you need account controls.
              </div>
            )}
            </div>
          </div>

          <div className="space-y-6 xl:space-y-8">
            <div className="rounded-[2rem] border border-slate-100 bg-white p-5 shadow-xl sm:p-8">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="mb-2 text-sm font-semibold uppercase tracking-[0.25em] text-[var(--brand-500)]">Carts</p>
                  <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">Cart Center</h2>
                  <p className="mt-2 text-slate-600">Inspect selected carts and all stored cart records.</p>
                </div>
                <button type="button" onClick={() => setShowCarts((value) => !value)} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white">
                  {showCarts ? "Hide Carts" : "Show Carts"}
                  {showCarts ? <ChevronUp size={17} /> : <ChevronDown size={17} />}
                </button>
              </div>
            </div>
            <div className="min-h-[30rem]">
            {showCarts ? (
            <>
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
            </>
            ) : (
              <div className="flex min-h-[30rem] items-center justify-center rounded-[2rem] border border-dashed border-slate-200 bg-white p-5 text-center text-sm text-slate-500 shadow-xl sm:p-8">
                Carts are hidden. Open them when you need cart inspection.
              </div>
            )}
            </div>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr] xl:gap-8">
          <div className="rounded-[2rem] border border-slate-100 bg-white p-5 shadow-xl sm:p-8">
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="mb-2 text-sm font-semibold uppercase tracking-[0.25em] text-[var(--brand-500)]">Reviews</p>
                <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">Review Photos</h2>
                <p className="mt-2 text-slate-600">Customer reviews that include uploaded images.</p>
              </div>
              <button type="button" onClick={() => setShowReviews((value) => !value)} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white">
                {showReviews ? "Hide Reviews" : "Show Reviews"}
                {showReviews ? <ChevronUp size={17} /> : <ChevronDown size={17} />}
              </button>
            </div>
            <div className="min-h-[24rem] rounded-2xl border border-slate-100 bg-slate-50 p-3">
            {showReviews ? (
            <div className="grid max-h-[22rem] gap-4 overflow-auto pr-1 sm:grid-cols-2">
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
            ) : (
              <div className="flex min-h-[22rem] items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white px-5 py-8 text-center text-sm text-slate-500">
                Reviews are hidden.
              </div>
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
            <div className="mb-5 flex flex-col gap-3 sm:flex-row">
              <button onClick={handleExportSales} className="rounded-2xl bg-[var(--brand-600)] px-5 py-3 text-sm font-semibold text-white">
                Export CSV
              </button>
              <button type="button" onClick={() => setShowSalesRows((value) => !value)} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white">
                {showSalesRows ? "Hide Table" : "Show Table"}
                {showSalesRows ? <ChevronUp size={17} /> : <ChevronDown size={17} />}
              </button>
            </div>
            <div className="min-h-[24rem] rounded-2xl border border-slate-100 bg-slate-50 p-3">
            {showSalesRows ? (
            <>
            <div className="hidden max-h-[22rem] overflow-auto rounded-2xl border border-slate-100 bg-white sm:block">
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
            <div className="max-h-[22rem] space-y-3 overflow-auto sm:hidden">
              {(salesReport.rows || []).slice(0, 8).map((row) => (
                <div key={row.orderId} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <p className="text-sm font-semibold text-slate-900">{row.invoiceNumber || "-"}</p>
                  <p className="mt-1 text-sm text-slate-600">{row.customerName}</p>
                  <div className="mt-3 flex items-center justify-between gap-3 text-sm">
                    <span className="text-slate-500">{row.status}</span>
                    <span className="font-semibold text-slate-900">Rs {Number(row.totalPrice || 0).toFixed(0)}</span>
                  </div>
                </div>
              ))}
            </div>
            </>
            ) : (
              <div className="flex min-h-[22rem] items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white px-5 py-8 text-center text-sm text-slate-500">
                Sales rows are hidden. Export remains available.
              </div>
            )}
            </div>
          </div>
        </div>

        <div className="rounded-[2rem] border border-slate-100 bg-white p-5 shadow-xl sm:p-8">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="mb-2 text-sm font-semibold uppercase tracking-[0.25em] text-[var(--brand-500)]">Fulfillment</p>
              <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">Orders</h2>
              <p className="mt-2 text-slate-600">Approve, ship, deliver, cancel, return, and download order invoices.</p>
            </div>
            <button type="button" onClick={() => setShowOrders((value) => !value)} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white">
              {showOrders ? "Hide Orders" : "Show Orders"}
              {showOrders ? <ChevronUp size={17} /> : <ChevronDown size={17} />}
            </button>
          </div>
          <div className="min-h-[32rem] rounded-2xl border border-slate-100 bg-slate-50 p-3">
          {showOrders ? (
          <div className="max-h-[30rem] space-y-4 overflow-auto pr-1">
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
                    <p className="mt-1 text-xs text-slate-500">{formatPaymentMethod(order.paymentMethod)}</p>
                  </div>
                </div>
                <div className="grid gap-2 sm:flex sm:flex-wrap sm:gap-3">
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
          ) : (
            <div className="flex min-h-[30rem] items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white px-5 py-8 text-center text-sm text-slate-500">
              Orders are hidden. Open them only when managing fulfillment.
            </div>
          )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default AdminDashboard;
