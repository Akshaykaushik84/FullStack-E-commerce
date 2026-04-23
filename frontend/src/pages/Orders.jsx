import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/NavbarComp";
import Pagination from "../components/Pagination";
import { getUserOrders } from "../api/orderApi.jsx";

const formatPrice = (price) => `Rs ${Number(price || 0).toFixed(0)}`;

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const token = localStorage.getItem("token");
  const navigate = useNavigate();

  const ordersPerPage = 4;
  const totalPages = Math.max(Math.ceil(orders.length / ordersPerPage), 1);
  const visibleOrders = orders.slice(
    (currentPage - 1) * ordersPerPage,
    currentPage * ordersPerPage
  );

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    getUserOrders(token)
      .then((res) => setOrders(res.data || []))
      .catch((err) => {
        console.log(err);
        if (err.response?.status === 401) {
          navigate("/login");
        }
      })
      .finally(() => setLoading(false));
  }, [navigate, token]);

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,var(--surface-50)_0%,#ffffff_100%)]">
      <Navbar />
      <div className="mx-auto max-w-7xl px-5 pb-16 pt-28">
        <div className="mb-8">
          <p className="text-sm uppercase tracking-[0.35em] text-[var(--brand-500)]">
            Orders
          </p>
          <h1 className="mt-2 text-4xl font-bold text-slate-900">
            Track your purchases
          </h1>
          <p className="mt-3 text-slate-500">
            Review your latest orders, delivery details, and payment summaries.
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
                const totalItems = (order.products || []).reduce(
                  (sum, item) => sum + item.quantity,
                  0
                );

                return (
                  <div
                    key={order._id}
                    className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm"
                  >
                    <div className="grid gap-4 border-b border-slate-100 pb-5 md:grid-cols-4">
                      <div>
                        <p className="text-sm text-slate-500">Order ID</p>
                        <p className="font-semibold text-slate-900">{order._id}</p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-500">Status</p>
                        <p className="font-semibold text-[var(--brand-700)]">
                          {order.status}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-500">Items</p>
                        <p className="font-semibold text-slate-900">{totalItems}</p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-500">Total</p>
                        <p className="font-semibold text-slate-900">
                          {formatPrice(order.totalPrice)}
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_280px]">
                      <div className="space-y-3">
                        {(order.products || []).map((item) => (
                          <div
                            key={item._id}
                            className="flex items-center gap-4 rounded-2xl bg-slate-50 p-4"
                          >
                            <img
                              src={item.image || item.product?.image}
                              alt={item.name || item.product?.name}
                              className="h-16 w-16 rounded-2xl object-cover"
                            />
                            <div>
                              <p className="font-semibold text-slate-900">
                                {item.name || item.product?.name}
                              </p>
                              <p className="text-sm text-slate-500">
                                Qty: {item.quantity}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                        <h3 className="text-lg font-semibold text-slate-900">
                          Delivery details
                        </h3>
                        <p className="mt-3 text-sm text-slate-600">
                          {order.shippingAddress?.fullName}
                        </p>
                        <p className="text-sm text-slate-600">
                          {order.shippingAddress?.phone}
                        </p>
                        <p className="mt-2 text-sm text-slate-600">
                          {order.shippingAddress?.addressLine},{" "}
                          {order.shippingAddress?.city},{" "}
                          {order.shippingAddress?.state} -{" "}
                          {order.shippingAddress?.postalCode}
                        </p>
                        <div className="mt-4 border-t border-slate-200 pt-4 text-sm text-slate-600">
                          <p>Payment: {order.paymentMethod}</p>
                          <p>Placed on: {new Date(order.createdAt).toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
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
              No orders yet
            </h2>
            <p className="mt-3 text-slate-500">
              Once you place an order, it will appear here with live status
              updates.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Orders;
