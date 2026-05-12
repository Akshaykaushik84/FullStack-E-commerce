import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/NavbarComp";
import Footer from "../components/Footer";
import Pagination from "../components/Pagination";
import { useToast } from "../components/ToastProvider.jsx";
import {
  cancelOrder,
  downloadInvoice,
  getUserOrders,
  requestReturn,
} from "../api/orderApi.jsx";
import { getStoredToken } from "../utils/authStorage.js";

const formatPrice = (price) => `Rs ${Number(price || 0).toFixed(0)}`;

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

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [reasonDrafts, setReasonDrafts] = useState({});
  const token = getStoredToken();
  const navigate = useNavigate();
  const { showError, showSuccess } = useToast();

  const ordersPerPage = 4;
  const totalPages = Math.max(Math.ceil(orders.length / ordersPerPage), 1);
  const visibleOrders = useMemo(
    () => orders.slice((currentPage - 1) * ordersPerPage, currentPage * ordersPerPage),
    [currentPage, orders]
  );

  const refreshOrders = () =>
    getUserOrders(token).then((res) => setOrders(res.data || []));

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    refreshOrders()
      .catch((err) => {
        console.log(err);
        if (err.response?.status === 401) {
          navigate("/login");
        }
      })
      .finally(() => setLoading(false));
  }, [navigate, token]);

  const handleReasonChange = (orderId, value) => {
    setReasonDrafts((prev) => ({ ...prev, [orderId]: value }));
  };

  const handleCancel = (orderId) => {
    cancelOrder(orderId, reasonDrafts[orderId] || "", token)
      .then(() => {
        showSuccess("Order cancelled successfully.");
        return refreshOrders();
      })
      .catch((err) => showError(err.response?.data?.message || "Unable to cancel order"));
  };

  const handleReturn = (orderId) => {
    requestReturn(orderId, reasonDrafts[orderId] || "", token)
      .then(() => {
        showSuccess("Return request submitted successfully.");
        return refreshOrders();
      })
      .catch((err) => showError(err.response?.data?.message || "Unable to request return"));
  };

  const handleInvoiceDownload = (order) => {
    downloadInvoice(order._id, token)
      .then((res) => {
        const fileName = `${order.invoiceNumber || `invoice-${order._id}`}.html`;
        saveBlob(res.data, fileName);
        showSuccess("Invoice download started.");
      })
      .catch((err) => showError(err.response?.data?.message || "Unable to download invoice"));
  };

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,var(--surface-50)_0%,#ffffff_100%)]">
      <Navbar />
      <div className="mx-auto max-w-7xl px-3 pb-28 pt-22 sm:px-5 sm:pt-28 lg:pb-16">
        <div className="mb-8">
          <p className="text-sm uppercase tracking-[0.35em] text-[var(--brand-500)]">Orders</p>
          <h1 className="mt-2 text-2xl font-bold text-slate-900 sm:text-4xl">Track your purchases</h1>
          <p className="mt-3 text-slate-500">
            Review your latest orders, download invoices, and request cancellation or return when allowed.
          </p>
        </div>

        {loading ? (
          <div className="rounded-[2rem] border border-slate-200 bg-white p-10 text-center text-slate-500 shadow-sm">
            Loading orders...
          </div>
        ) : orders.length ? (
          <div className="space-y-8">
            <div className="space-y-6">
              {visibleOrders.map((order) => {
                const totalItems = (order.products || []).reduce((sum, item) => sum + item.quantity, 0);
                const reasonValue = reasonDrafts[order._id] || "";
                const canCancel = ["Pending", "Approved"].includes(order.status);
                const canReturn = order.status === "Delivered";

                return (
                  <div
                    key={order._id}
                    className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm"
                  >
                    <div className="grid gap-4 border-b border-slate-100 pb-5 sm:grid-cols-2 xl:grid-cols-5">
                      <div>
                        <p className="text-sm text-slate-500">Order ID</p>
                        <p className="font-semibold text-slate-900">{order._id}</p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-500">Invoice</p>
                        <p className="font-semibold text-slate-900">{order.invoiceNumber || "Pending"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-500">Status</p>
                        <p className="font-semibold text-[var(--brand-700)]">{order.status}</p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-500">Items</p>
                        <p className="font-semibold text-slate-900">{totalItems}</p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-500">Total</p>
                        <p className="font-semibold text-slate-900">{formatPrice(order.totalPrice)}</p>
                      </div>
                    </div>

                    <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_300px]">
                      <div className="space-y-3">
                        {(order.products || []).map((item) => (
                          <div
                            key={item._id}
                            className="flex flex-col gap-4 rounded-2xl bg-slate-50 p-4 sm:flex-row sm:items-center"
                          >
                            <img
                              src={item.image || item.product?.image}
                              alt={item.name || item.product?.name}
                              className="h-16 w-16 rounded-2xl object-cover"
                            />
                            <div>
                              <p className="font-semibold text-slate-900">{item.name || item.product?.name}</p>
                              <p className="text-sm text-slate-500">Qty: {item.quantity}</p>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                        <h3 className="text-lg font-semibold text-slate-900">Delivery details</h3>
                        <p className="mt-3 text-sm text-slate-600">{order.shippingAddress?.fullName}</p>
                        <p className="text-sm text-slate-600">{order.shippingAddress?.phone}</p>
                        <p className="mt-2 text-sm text-slate-600">
                          {order.shippingAddress?.addressLine}, {order.shippingAddress?.city},{" "}
                          {order.shippingAddress?.state} - {order.shippingAddress?.postalCode}
                        </p>
                        <div className="mt-4 border-t border-slate-200 pt-4 text-sm text-slate-600">
                          <p>Payment: {order.paymentMethod}</p>
                          <p>Payment status: {order.paymentStatus}</p>
                          <p>Placed on: {new Date(order.createdAt).toLocaleString()}</p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 grid gap-3 lg:grid-cols-[1fr_auto] lg:items-end">
                      <textarea
                        value={reasonValue}
                        onChange={(e) => handleReasonChange(order._id, e.target.value)}
                        placeholder="Reason for cancel or return request"
                        className="min-h-24 rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-[var(--brand-500)]"
                      />
                      <div className="flex flex-wrap gap-3">
                        <button
                          type="button"
                          onClick={() => handleInvoiceDownload(order)}
                          className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700"
                        >
                          Download Invoice
                        </button>
                        {canCancel ? (
                          <button
                            type="button"
                            onClick={() => handleCancel(order._id)}
                            className="rounded-2xl bg-rose-500 px-4 py-3 text-sm font-semibold text-white"
                          >
                            Cancel Order
                          </button>
                        ) : null}
                        {canReturn ? (
                          <button
                            type="button"
                            onClick={() => handleReturn(order._id)}
                            className="rounded-2xl bg-amber-500 px-4 py-3 text-sm font-semibold text-white"
                          >
                            Request Return
                          </button>
                        ) : null}
                      </div>
                    </div>

                    {order.cancelReason ? (
                      <p className="mt-3 text-sm text-rose-600">Cancel reason: {order.cancelReason}</p>
                    ) : null}
                    {order.returnReason ? (
                      <p className="mt-3 text-sm text-amber-600">Return reason: {order.returnReason}</p>
                    ) : null}
                  </div>
                );
              })}
            </div>
            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
          </div>
        ) : (
          <div className="rounded-[2rem] border border-dashed border-slate-300 bg-white p-12 text-center shadow-sm">
            <h2 className="text-3xl font-semibold text-slate-900">No orders yet</h2>
            <p className="mt-3 text-slate-500">
              Once you place an order, it will appear here with live status updates.
            </p>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default Orders;
