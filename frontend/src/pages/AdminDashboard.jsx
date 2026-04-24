import { useCallback, useEffect, useMemo, useState } from "react";
import Navbar from "../components/NavbarComp";
import {
  deleteAdminUser,
  getAdminCarts,
  getAdminStats,
  getAdminUserCart,
  getAdminUsers,
} from "../api/adminApi.jsx";
import {
  createProduct,
  deleteProduct,
  getProducts,
  updateProduct,
} from "../api/productApi.jsx";
import { getUserOrders, updateOrderStatus } from "../api/orderApi.jsx";

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

const getStoredUser = () => {
  try {
    const rawUser = localStorage.getItem("user");

    if (!rawUser || rawUser === "undefined" || rawUser === "null") {
      return null;
    }

    return JSON.parse(rawUser);
  } catch {
    return null;
  }
};

const ChartCard = ({ title, data, tone = "brand" }) => {
  const safeData = Array.isArray(data) ? data : [];
  const maxValue = Math.max(...safeData.map((item) => item.value), 1);
  const barClass =
    tone === "teal"
      ? "bg-teal-500"
      : tone === "slate"
        ? "bg-slate-700"
        : "bg-[var(--brand-600)]";

  return (
    <div className="rounded-[2rem] border border-slate-100 bg-white p-5 shadow-xl sm:p-6">
      <h3 className="mb-5 text-xl font-semibold text-slate-900">{title}</h3>
      {safeData.length ? (
        <div className="space-y-4">
          {safeData.map((item) => (
            <div key={item.label}>
              <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                <span className="text-slate-600">{item.label}</span>
                <span className="font-semibold text-slate-900">{item.value}</span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                <div
                  className={`h-full rounded-full ${barClass}`}
                  style={{ width: `${(item.value / maxValue) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-slate-500">No chart data available yet.</p>
      )}
    </div>
  );
};

const StatCard = ({ label, value, details, accent = "slate", active, onClick }) => {
  const accentClasses =
    accent === "brand"
      ? "border-[var(--brand-600)] bg-[var(--brand-600)] text-white"
      : accent === "teal"
        ? "border-teal-600 bg-teal-600 text-white"
        : "border-slate-100 bg-white text-slate-900";

  const mutedTextClass = accent === "slate" ? "text-slate-500" : "text-white/75";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-[2rem] border p-5 text-left shadow-xl transition duration-200 sm:p-6 ${accentClasses} ${
        active
          ? "ring-4 ring-[var(--brand-200)] -translate-y-1"
          : "hover:-translate-y-1 hover:shadow-2xl"
      }`}
    >
      <p className={`mb-2 text-sm font-medium ${mutedTextClass}`}>{label}</p>
      <p className="text-3xl font-bold sm:text-4xl">{value}</p>
      {details ? <p className={`mt-3 text-sm ${mutedTextClass}`}>{details}</p> : null}
    </button>
  );
};

const AdminDashboard = () => {
  const token = localStorage.getItem("token");
  const user = getStoredUser();

  const [stats, setStats] = useState({
    productsCount: 0,
    usersCount: 0,
    activeSessions: 0,
    ordersCount: 0,
    revenue: 0,
    lowStockProducts: 0,
  });
  const [charts, setCharts] = useState({ orderStatus: [], recentUsers: [] });
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [carts, setCarts] = useState([]);
  const [selectedCart, setSelectedCart] = useState(null);
  const [productForm, setProductForm] = useState(emptyProductForm);
  const [editingProductId, setEditingProductId] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [userPage, setUserPage] = useState(1);
  const [userPagination, setUserPagination] = useState({ page: 1, totalPages: 1 });
  const [activeInsight, setActiveInsight] = useState("products");

  const refreshAdminData = useCallback(() => {
    Promise.all([
      getAdminStats(token),
      getProducts({ page: 1, limit: 50 }),
      getUserOrders(token),
      getAdminUsers(token, { page: userPage, limit: 8, search: userSearch }),
      getAdminCarts(token),
    ])
      .then(([statsRes, productsRes, ordersRes, usersRes, cartsRes]) => {
        setStats(statsRes.data.summary);
        setCharts(statsRes.data.charts);
        setProducts(productsRes.data.items || []);
        setOrders(ordersRes.data || []);
        setUsers(usersRes.data.items || []);
        setUserPagination(usersRes.data.pagination || { page: 1, totalPages: 1 });
        setCarts(cartsRes.data || []);
      })
      .catch((err) => console.log(err));
  }, [token, userPage, userSearch]);

  useEffect(() => {
    if (!token) return;
    refreshAdminData();
  }, [refreshAdminData, token]);

  const normalizedProducts = useMemo(
    () => products.filter((product) => product.isActive !== false),
    [products]
  );

  const lowStockItems = useMemo(
    () => normalizedProducts.filter((product) => Number(product.countInStock || 0) <= 5),
    [normalizedProducts]
  );

  const activeUsers = useMemo(
    () => users.filter((account) => account.isSessionActive),
    [users]
  );

  const statItems = useMemo(
    () => [
      {
        key: "products",
        label: "Products",
        value: stats.productsCount || normalizedProducts.length,
        details: `${normalizedProducts.length} visible products loaded`,
        accent: "slate",
      },
      {
        key: "users",
        label: "Users",
        value: stats.usersCount || userPagination.totalUsers || users.length,
        details: `${userPagination.totalUsers || users.length} registered customers`,
        accent: "slate",
      },
      {
        key: "activeSessions",
        label: "Active Sessions",
        value: stats.activeSessions || activeUsers.length,
        details: `${activeUsers.length} active users on this page`,
        accent: "teal",
      },
      {
        key: "orders",
        label: "Orders",
        value: stats.ordersCount || orders.length,
        details: `${orders.length} orders loaded right now`,
        accent: "slate",
      },
      {
        key: "lowStock",
        label: "Low Stock",
        value: stats.lowStockProducts || lowStockItems.length,
        details: `${lowStockItems.length} products need restocking`,
        accent: "slate",
      },
      {
        key: "revenue",
        label: "Revenue",
        value: `Rs ${Number(stats.revenue || 0).toFixed(0)}`,
        details: `${orders.length} orders contributing`,
        accent: "brand",
      },
    ],
    [
      stats,
      normalizedProducts.length,
      userPagination.totalUsers,
      users.length,
      activeUsers.length,
      orders.length,
      lowStockItems.length,
    ]
  );

  const insightContent = useMemo(() => {
    switch (activeInsight) {
      case "users":
        return {
          title: "Registered Users",
          description: "All customer accounts currently available in the system.",
          items: users.map((account) => ({
            id: account._id,
            title: account.name,
            subtitle: account.email,
            meta: `${account.isSessionActive ? "Active now" : "Offline"} • Joined ${new Date(
              account.createdAt
            ).toLocaleDateString()}`,
          })),
        };
      case "activeSessions":
        return {
          title: "Active Sessions",
          description: "Customers who are currently marked as online.",
          items: activeUsers.map((account) => ({
            id: account._id,
            title: account.name,
            subtitle: account.email,
            meta: `Last login ${
              account.lastLoginAt ? new Date(account.lastLoginAt).toLocaleString() : "not available"
            }`,
          })),
        };
      case "orders":
        return {
          title: "Recent Orders",
          description: "Latest orders and their current fulfillment state.",
          items: orders.map((order) => ({
            id: order._id,
            title: order.user?.name || "Customer",
            subtitle: order.user?.email || "No email",
            meta: `${order.status} • Rs ${Number(order.totalPrice || 0).toFixed(0)}`,
          })),
        };
      case "lowStock":
        return {
          title: "Low Stock Products",
          description: "Products that should be restocked soon.",
          items: lowStockItems.map((product) => ({
            id: product._id,
            title: product.name,
            subtitle: product.category || "General",
            meta: `Stock left: ${product.countInStock || 0} • Rs ${product.price}`,
          })),
        };
      case "revenue":
        return {
          title: "Revenue Snapshot",
          description: "Orders contributing to the current revenue total.",
          items: orders.map((order) => ({
            id: order._id,
            title: order._id,
            subtitle: order.user?.email || "No email",
            meta: `${order.paymentStatus} • Rs ${Number(order.totalPrice || 0).toFixed(0)}`,
          })),
        };
      case "products":
      default:
        return {
          title: "Product Inventory",
          description: "All active products currently listed in the storefront.",
          items: normalizedProducts.map((product) => ({
            id: product._id,
            title: product.name,
            subtitle: product.category || "General",
            meta: `Stock: ${product.countInStock || 0} • Rs ${product.price}`,
          })),
        };
    }
  }, [activeInsight, users, activeUsers, orders, lowStockItems, normalizedProducts]);

  const handleProductChange = (e) => {
    const { name, value, type, checked } = e.target;
    setProductForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
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

  const handleDeleteProduct = (productId) => {
    deleteProduct(productId, token)
      .then(() => refreshAdminData())
      .catch((err) => alert(err.response?.data?.message || "Unable to delete product"));
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
            Store operations and account control
          </h1>
          <p className="text-base text-slate-300 sm:text-lg">
            Manage products, monitor users, review carts, and track order performance from one
            dashboard.
          </p>
          <div className="mt-6 text-sm text-slate-300">
            Hardcoded admin login: admin@gmail.com / 123456
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6 xl:gap-5">
          {statItems.map((item) => (
            <StatCard
              key={item.key}
              label={item.label}
              value={item.value}
              details={item.details}
              accent={item.accent}
              active={activeInsight === item.key}
              onClick={() => setActiveInsight(item.key)}
            />
          ))}
        </div>

        <div className="rounded-[2rem] border border-slate-100 bg-white p-5 shadow-xl sm:p-8">
          <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="mb-2 text-sm font-semibold uppercase tracking-[0.25em] text-[var(--brand-500)]">
                Live Insight
              </p>
              <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">
                {insightContent.title}
              </h2>
              <p className="mt-2 text-slate-600">{insightContent.description}</p>
            </div>
            <p className="rounded-full bg-[var(--brand-50)] px-4 py-2 text-sm font-medium text-[var(--brand-700)]">
              {insightContent.items.length} records visible
            </p>
          </div>
          {insightContent.items.length ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {insightContent.items.slice(0, 12).map((item) => (
                <div
                  key={item.id}
                  className="rounded-3xl border border-slate-100 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] p-5 shadow-sm"
                >
                  <p className="font-semibold text-slate-900">{item.title}</p>
                  <p className="mt-1 break-all text-sm text-slate-500">{item.subtitle}</p>
                  <p className="mt-3 text-sm font-medium text-[var(--brand-700)]">{item.meta}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-500">No matching records available for this section yet.</p>
          )}
        </div>

        <div className="grid gap-6 xl:grid-cols-2 xl:gap-8">
          <ChartCard title="Orders by Status" data={charts.orderStatus} tone="brand" />
          <ChartCard title="Recent User Signups" data={charts.recentUsers} tone="teal" />
        </div>

        <div className="grid items-start gap-6 xl:grid-cols-[0.95fr_1.05fr] xl:gap-8">
          <div className="rounded-[2rem] border border-slate-100 bg-white p-5 shadow-xl sm:p-8">
            <h2 className="mb-2 text-2xl font-bold text-slate-900 sm:text-3xl">
              {editingProductId ? "Update Product" : "Add Product"}
            </h2>
            <p className="mb-6 text-slate-600">
              Create new products or edit existing ones from the same form.
            </p>

            <form className="space-y-4" onSubmit={handleProductSubmit}>
              <input
                type="text"
                name="name"
                value={productForm.name}
                onChange={handleProductChange}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-[var(--brand-500)]"
                placeholder="Product name"
                required
              />
              <div className="grid gap-4 md:grid-cols-2">
                <input
                  type="number"
                  name="price"
                  value={productForm.price}
                  onChange={handleProductChange}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-[var(--brand-500)]"
                  placeholder="Price"
                  required
                />
                <input
                  type="number"
                  name="countInStock"
                  value={productForm.countInStock}
                  onChange={handleProductChange}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-[var(--brand-500)]"
                  placeholder="Stock"
                  required
                />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <input
                  type="text"
                  name="category"
                  value={productForm.category}
                  onChange={handleProductChange}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-[var(--brand-500)]"
                  placeholder="Category"
                />
                <input
                  type="text"
                  name="brand"
                  value={productForm.brand}
                  onChange={handleProductChange}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-[var(--brand-500)]"
                  placeholder="Brand"
                />
              </div>
              <input
                type="url"
                name="image"
                value={productForm.image}
                onChange={handleProductChange}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-[var(--brand-500)]"
                placeholder="Image URL"
              />
              <div className="grid gap-4 md:grid-cols-2">
                <input
                  type="number"
                  name="discountPercentage"
                  value={productForm.discountPercentage}
                  onChange={handleProductChange}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-[var(--brand-500)]"
                  placeholder="Discount %"
                />
                <input
                  type="text"
                  name="tags"
                  value={productForm.tags}
                  onChange={handleProductChange}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-[var(--brand-500)]"
                  placeholder="Tags comma separated"
                />
              </div>
              <textarea
                name="description"
                value={productForm.description}
                onChange={handleProductChange}
                className="min-h-28 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-[var(--brand-500)]"
                placeholder="Description"
                required
              />
              <label className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700">
                <input
                  type="checkbox"
                  name="featured"
                  checked={productForm.featured}
                  onChange={handleProductChange}
                />
                Mark as featured product
              </label>
              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  type="submit"
                  className="flex-1 rounded-2xl bg-[var(--brand-600)] py-3 font-semibold text-white transition hover:bg-[var(--brand-700)]"
                >
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
            <h2 className="mb-2 text-2xl font-bold text-slate-900 sm:text-3xl">Products</h2>
            <p className="mb-6 text-slate-600">
              Edit, delete, or review all products currently listed in the store.
            </p>
            <div className="mb-6 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4">
                <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Total</p>
                <p className="mt-2 text-2xl font-bold text-slate-900">{products.length}</p>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4">
                <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Featured</p>
                <p className="mt-2 text-2xl font-bold text-slate-900">
                  {products.filter((product) => product.featured).length}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4">
                <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Low Stock</p>
                <p className="mt-2 text-2xl font-bold text-amber-600">
                  {products.filter((product) => Number(product.countInStock || 0) <= 5).length}
                </p>
              </div>
            </div>
            <div className="space-y-4">
              {products.map((product) => (
                <div
                  key={product._id}
                  className="rounded-[1.75rem] border border-slate-100 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] p-4 shadow-sm transition hover:border-[var(--brand-200)] hover:shadow-lg"
                >
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div className="flex min-w-0 items-start gap-4">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="h-20 w-20 rounded-2xl object-cover"
                      />
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate text-lg font-semibold text-slate-900">
                            {product.name}
                          </p>
                          {product.featured ? (
                            <span className="rounded-full bg-[var(--ink-900)] px-3 py-1 text-[11px] font-semibold text-white">
                              Featured
                            </span>
                          ) : null}
                          {Number(product.countInStock || 0) <= 5 ? (
                            <span className="rounded-full bg-amber-100 px-3 py-1 text-[11px] font-semibold text-amber-700">
                              Low Stock
                            </span>
                          ) : null}
                        </div>
                        <p className="mt-1 text-sm text-slate-500">
                          {product.category || "General"} • {product.brand || "MyStore Select"}
                        </p>
                        <p className="mt-3 line-clamp-2 text-sm text-slate-600">
                          {product.description}
                        </p>
                        <div className="mt-4 flex flex-wrap gap-2">
                          <span className="rounded-full bg-[var(--brand-50)] px-3 py-1 text-xs font-semibold text-[var(--brand-700)]">
                            Rs {product.price}
                          </span>
                          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                            Stock: {product.countInStock}
                          </span>
                          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                            Rating: {Number(product.rating || 0).toFixed(1)}
                          </span>
                          {product.discountPercentage ? (
                            <span className="rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-700">
                              {product.discountPercentage}% off
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </div>
                    <div className="flex shrink-0 flex-wrap items-center gap-3 md:justify-end">
                      <button
                        onClick={() => startEditProduct(product)}
                        className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(product._id)}
                        className="rounded-xl bg-rose-500 px-4 py-2 text-sm font-medium text-white"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid items-start gap-6 xl:grid-cols-[1.1fr_0.9fr] xl:gap-8">
          <div className="rounded-[2rem] border border-slate-100 bg-white p-5 shadow-xl sm:p-8">
            <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">Users</h2>
                <p className="text-slate-600">
                  Review customer accounts, active session state, and open cart details.
                </p>
              </div>
              <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
                <input
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="Search users"
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-[var(--brand-500)] sm:min-w-[220px]"
                />
                <button
                  type="button"
                  onClick={() => {
                    setUserPage(1);
                    refreshAdminData();
                  }}
                  className="rounded-2xl bg-[var(--brand-600)] px-4 py-3 text-sm font-semibold text-white"
                >
                  Search
                </button>
              </div>
            </div>
            <div className="space-y-4">
              {users.map((account) => (
                <div
                  key={account._id}
                  className="flex flex-col gap-4 rounded-3xl border border-slate-100 bg-slate-50 p-4 md:flex-row md:items-center md:justify-between"
                >
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900">{account.name}</p>
                    <p className="break-all text-sm text-slate-500">{account.email}</p>
                    <p className="mt-2 text-xs text-slate-500">
                      Joined: {new Date(account.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                        account.isSessionActive
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {account.isSessionActive ? "Active" : "Offline"}
                    </span>
                    <button
                      onClick={() => handleViewCart(account._id)}
                      className="rounded-xl border border-slate-200 px-4 py-2"
                    >
                      View Cart
                    </button>
                    <button
                      onClick={() => handleDeleteUser(account._id)}
                      className="rounded-xl bg-rose-500 px-4 py-2 text-white"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-5 flex flex-wrap items-center justify-end gap-3">
              <button
                type="button"
                disabled={userPagination.page <= 1}
                onClick={() => setUserPage((prev) => Math.max(prev - 1, 1))}
                className="rounded-2xl border border-slate-200 px-4 py-2 text-sm disabled:opacity-50"
              >
                Previous
              </button>
              <span className="text-sm text-slate-500">
                Page {userPagination.page || 1} of {userPagination.totalPages || 1}
              </span>
              <button
                type="button"
                disabled={userPagination.page >= userPagination.totalPages}
                onClick={() => setUserPage((prev) => prev + 1)}
                className="rounded-2xl border border-slate-200 px-4 py-2 text-sm disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>

          <div className="space-y-6 xl:space-y-8">
            <div className="rounded-[2rem] border border-slate-100 bg-white p-5 shadow-xl sm:p-8">
              <h2 className="mb-2 text-2xl font-bold text-slate-900 sm:text-3xl">Selected User Cart</h2>
              <p className="mb-6 text-slate-600">
                View the items currently present in a specific user&apos;s cart.
              </p>
              {selectedCart ? (
                <div className="space-y-4">
                  <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                    <p className="break-all font-semibold text-slate-900">
                      {selectedCart.user?.name} ({selectedCart.user?.email})
                    </p>
                  </div>
                  {(selectedCart.products || []).length ? (
                    selectedCart.products.map((item) => (
                      <div
                        key={item._id}
                        className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-white p-4"
                      >
                        <img
                          src={item.product?.image}
                          alt={item.product?.name}
                          className="h-16 w-16 rounded-2xl object-cover"
                        />
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-slate-900">{item.product?.name}</p>
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
              <h2 className="mb-2 text-2xl font-bold text-slate-900 sm:text-3xl">All Carts</h2>
              <p className="mb-6 text-slate-600">
                Quick overview of every cart currently stored in the system.
              </p>
              <div className="max-h-[26rem] space-y-3 overflow-auto pr-2">
                {carts.map((cart) => (
                  <button
                    key={cart._id}
                    className="w-full rounded-2xl border border-slate-100 bg-slate-50 p-4 text-left hover:border-[var(--brand-100)]"
                    onClick={() => setSelectedCart(cart)}
                  >
                    <p className="font-semibold text-slate-900">{cart.user?.name || "Unknown User"}</p>
                    <p className="break-all text-sm text-slate-500">
                      {cart.user?.email || "No email"} | {(cart.products || []).length} items
                    </p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-[2rem] border border-slate-100 bg-white p-5 shadow-xl sm:p-8">
          <h2 className="mb-2 text-2xl font-bold text-slate-900 sm:text-3xl">Orders</h2>
          <p className="mb-6 text-slate-600">
            Update fulfillment states and monitor all customer orders in one place.
          </p>
          <div className="space-y-4">
            {orders.map((order) => (
              <div key={order._id} className="rounded-3xl border border-slate-100 bg-slate-50 p-5">
                <div className="mb-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  <div>
                    <p className="text-sm text-slate-500">Order ID</p>
                    <p className="break-all font-semibold text-slate-900">{order._id}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Customer</p>
                    <p className="break-all font-semibold text-slate-900">
                      {order.user?.name || "Customer"} ({order.user?.email || "No email"})
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Status</p>
                    <p className="font-semibold text-[var(--brand-600)]">{order.status}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Total</p>
                    <p className="font-semibold text-slate-900">
                      Rs {Number(order.totalPrice || 0).toFixed(0)}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-3">
                  {["Approved", "Shipped", "Delivered", "Cancelled"].map((status) => (
                    <button
                      key={status}
                      className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white"
                      onClick={() => handleOrderStatus(order._id, status)}
                    >
                      Mark {status}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
