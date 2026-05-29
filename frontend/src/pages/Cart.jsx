import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CreditCard, LocateFixed, MapPin, PackageCheck, ShieldCheck, TicketPercent } from "lucide-react";
import Navbar from "../components/NavbarComp";
import Footer from "../components/Footer";
import CartItem from "../components/CartItem";
import { useToast } from "../hooks/useToast.js";
import { getCart, removeFromCart, updateCartQuantity } from "../api/cartApi.jsx";
import { placeOrder } from "../api/orderApi.jsx";
import { validateCoupon } from "../api/couponApi.jsx";
import { getStoredToken } from "../utils/authStorage.js";
import { isValidIndianPhone, isValidName, isValidPostalCode } from "../utils/formValidation.js";
import { buildMapLink, getCurrentPosition } from "../utils/locationUtils.js";

const initialCheckoutForm = {
  fullName: "",
  phone: "",
  addressLine: "",
  city: "",
  state: "",
  postalCode: "",
  country: "India",
  paymentMethod: "Cash on Delivery",
  location: {},
};

const formatPrice = (price) => `Rs ${Number(price || 0).toFixed(0)}`;

const paymentOptions = [
  { value: "Cash on Delivery", label: "Cash on Delivery", helper: "Pay in cash when your order arrives." },
  { value: "UPI", label: "UPI", helper: "Pay using Google Pay, PhonePe, Paytm, or any UPI app." },
  { value: "Debit/Credit Card", label: "Debit/Credit Card", helper: "Use Visa, Mastercard, RuPay, or credit card." },
  { value: "Net Banking", label: "Net Banking", helper: "Pay securely through your bank account." },
  { value: "Wallet", label: "Wallet", helper: "Pay using supported wallet balance." },
];

const Cart = () => {
  const token = getStoredToken();
  const navigate = useNavigate();
  const [cart, setCart] = useState({ items: [], subtotal: 0, totalItems: 0 });
  const [checkoutForm, setCheckoutForm] = useState(initialCheckoutForm);
  const [couponCode, setCouponCode] = useState("");
  const [couponData, setCouponData] = useState(null);
  const [couponMessage, setCouponMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [fetchingLocation, setFetchingLocation] = useState(false);
  const { showError, showSuccess } = useToast();

  const discountAmount = couponData?.discountAmount || 0;
  const discountedSubtotal = Math.max(cart.subtotal - discountAmount, 0);
  const shippingFee = useMemo(() => (discountedSubtotal >= 999 ? 0 : cart.items.length ? 79 : 0), [cart.items.length, discountedSubtotal]);
  const tax = useMemo(() => Number((discountedSubtotal * 0.08).toFixed(2)), [discountedSubtotal]);
  const grandTotal = useMemo(() => discountedSubtotal + shippingFee + tax, [discountedSubtotal, shippingFee, tax]);
  const selectedPaymentOption = paymentOptions.find((option) => option.value === checkoutForm.paymentMethod) || paymentOptions[0];

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    getCart(token)
      .then((res) => setCart(res.data))
      .catch((err) => {
        console.log(err);
        if (err.response?.status === 401) {
          navigate("/login");
        }
      })
      .finally(() => setLoading(false));
  }, [navigate, token]);

  const handleQuantityChange = (productId, quantity) => {
    updateCartQuantity(productId, quantity, token)
      .then((res) => {
        setCart(res.data);
        setCouponData(null);
      })
      .catch((err) => showError(err.response?.data?.message || "Unable to update cart"));
  };

  const handleRemove = (productId) => {
    removeFromCart(productId, token)
      .then((res) => {
        setCart(res.data);
        setCouponData(null);
      })
      .catch((err) => showError(err.response?.data?.message || "Unable to remove item"));
  };

  const handleCheckoutChange = (e) => {
    const { name, value } = e.target;
    setCheckoutForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleUseCurrentLocation = () => {
    setFetchingLocation(true);

    getCurrentPosition()
      .then((location) => {
        setCheckoutForm((prev) => ({
          ...prev,
          location: {
            ...location,
            mapUrl: buildMapLink(location.latitude, location.longitude),
          },
        }));
        showSuccess("Delivery location captured.");
      })
      .catch((err) => showError(err.message || "Unable to get current location."))
      .finally(() => setFetchingLocation(false));
  };

  const handleApplyCoupon = () => {
    setCouponMessage("");
    const normalizedCouponCode = couponCode.trim().toUpperCase();

    if (!/^[A-Z0-9]{3,20}$/.test(normalizedCouponCode)) {
      setCouponMessage("Enter a valid coupon code.");
      showError("Coupon code must be 3-20 letters or numbers.");
      return;
    }

    validateCoupon(normalizedCouponCode, cart.subtotal)
      .then((res) => {
        setCouponData(res.data);
        setCouponMessage(`${res.data.code} applied successfully.`);
        showSuccess(`${res.data.code} applied successfully.`);
      })
      .catch((err) => {
        setCouponData(null);
        setCouponMessage(err.response?.data?.message || "Invalid coupon code.");
        showError(err.response?.data?.message || "Invalid coupon code.");
      });
  };

  const handlePlaceOrder = (e) => {
    e.preventDefault();

    if (!isValidName(checkoutForm.fullName)) {
      showError("Please enter a valid full name.");
      return;
    }

    if (!isValidIndianPhone(checkoutForm.phone)) {
      showError("Please enter a valid 10 digit Indian phone number.");
      return;
    }

    if (!isValidName(checkoutForm.city) || !isValidName(checkoutForm.state)) {
      showError("Please enter a valid city and state.");
      return;
    }

    if (!isValidPostalCode(checkoutForm.postalCode)) {
      showError("Please enter a valid 6 digit postal code.");
      return;
    }

    if (checkoutForm.addressLine.trim().length < 8) {
      showError("Please enter a complete delivery address.");
      return;
    }

    setSubmitting(true);

    placeOrder(
      {
        shippingAddress: {
          fullName: checkoutForm.fullName,
          phone: checkoutForm.phone,
          addressLine: checkoutForm.addressLine,
          city: checkoutForm.city,
          state: checkoutForm.state,
          postalCode: checkoutForm.postalCode,
          country: checkoutForm.country,
          location: checkoutForm.location,
        },
        paymentMethod: checkoutForm.paymentMethod,
        couponCode: couponData?.code || couponCode,
      },
      token
    )
      .then(() => {
        setCheckoutForm(initialCheckoutForm);
        setCouponCode("");
        setCouponData(null);
        showSuccess("Order placed successfully.");
        navigate("/orders");
      })
      .catch((err) => showError(err.response?.data?.message || "Unable to place order"))
      .finally(() => setSubmitting(false));
  };

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,var(--surface-50)_0%,#ffffff_100%)]">
      <Navbar />
      <div className="mx-auto max-w-7xl px-3 pb-28 pt-24 sm:px-5 sm:pt-28 lg:pb-16">
        <div className="mb-6 overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-sm sm:mb-8">
          <div className="grid gap-4 p-5 sm:grid-cols-[1fr_auto] sm:items-center sm:p-6">
          <div>
            <p className="text-sm uppercase tracking-[0.35em] text-[var(--brand-500)]">Cart</p>
            <h1 className="mt-2 text-2xl font-bold text-slate-900 sm:text-4xl">Your shopping bag</h1>
            <p className="mt-2 text-sm text-slate-500">Review items, apply coupon, and complete checkout.</p>
          </div>
          <div className="min-h-[5.25rem] rounded-2xl border border-[var(--brand-100)] bg-[var(--brand-50)] px-5 py-4">
            <p className="text-sm text-slate-500">Items in cart</p>
            <p className="text-2xl font-bold text-[var(--brand-700)]">{cart.totalItems}</p>
          </div>
          </div>
          <div className="grid border-t border-slate-100 bg-slate-50 px-5 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 sm:grid-cols-3 sm:px-6">
            <span className="inline-flex items-center gap-2"><ShieldCheck size={14} /> Secure checkout</span>
            <span className="inline-flex items-center gap-2"><PackageCheck size={14} /> Stock checked</span>
            <span className="inline-flex items-center gap-2"><CreditCard size={14} /> Multiple payments</span>
          </div>
        </div>

        {loading ? (
          <div className="min-h-[18rem] rounded-[2rem] border border-slate-200 bg-white p-10 text-center text-slate-500 shadow-sm">Loading cart...</div>
        ) : cart.items.length ? (
          <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(22rem,0.85fr)] xl:items-start xl:gap-8">
            <div className="space-y-4">
              {cart.items.map((item) => (
                <CartItem key={item._id} item={item} onUpdateQuantity={handleQuantityChange} onRemove={handleRemove} />
              ))}
            </div>

            <div className="space-y-6 xl:sticky xl:top-24">
              <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-xl font-semibold text-slate-900 sm:text-2xl">Order summary</h2>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">{cart.totalItems} items</span>
                </div>
                <div className="mt-5 space-y-3 text-sm">
                  <div className="flex justify-between text-slate-600"><span>Subtotal</span><span>{formatPrice(cart.subtotal)}</span></div>
                  <div className="flex justify-between text-slate-600"><span>Discount</span><span>{discountAmount ? `- ${formatPrice(discountAmount)}` : "Rs 0"}</span></div>
                  <div className="flex justify-between text-slate-600"><span>Shipping</span><span>{shippingFee ? formatPrice(shippingFee) : "Free"}</span></div>
                  <div className="flex justify-between text-slate-600"><span>Tax</span><span>{formatPrice(tax)}</span></div>
                  <div className="rounded-2xl bg-slate-900 px-4 py-4 text-white">
                    <div className="flex justify-between text-base font-semibold"><span>Total</span><span>{formatPrice(grandTotal)}</span></div>
                  </div>
                </div>
                <div className="mt-5 space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="inline-flex items-center gap-2 text-sm font-semibold text-slate-900"><TicketPercent size={16} /> Have a coupon?</p>
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <input value={couponCode} onChange={(e) => setCouponCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))} placeholder="Enter coupon code" className="flex-1 rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-[var(--brand-500)]" minLength={3} maxLength={20} pattern="[A-Z0-9]{3,20}" title="Use 3-20 letters or numbers only" />
                    <button type="button" onClick={handleApplyCoupon} className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white">Apply</button>
                  </div>
                  <p className={`text-sm ${couponData ? "text-emerald-700" : "text-slate-500"}`}>{couponMessage || "Try WELCOME10 or SAVE150"}</p>
                </div>
              </div>

              <form onSubmit={handlePlaceOrder} className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                <h2 className="inline-flex items-center gap-2 text-xl font-semibold text-slate-900 sm:text-2xl"><MapPin size={20} /> Checkout details</h2>
                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  <input name="fullName" value={checkoutForm.fullName} onChange={handleCheckoutChange} placeholder="Full name" className="rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-[var(--brand-500)]" required minLength={2} maxLength={60} autoComplete="name" />
                  <input type="tel" name="phone" value={checkoutForm.phone} onChange={handleCheckoutChange} placeholder="10 digit phone" className="rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-[var(--brand-500)]" required inputMode="numeric" pattern="[6-9][0-9]{9}" title="Enter a valid 10 digit Indian phone number" />
                  <input name="city" value={checkoutForm.city} onChange={handleCheckoutChange} placeholder="City" className="rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-[var(--brand-500)]" required minLength={2} maxLength={50} />
                  <input name="state" value={checkoutForm.state} onChange={handleCheckoutChange} placeholder="State" className="rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-[var(--brand-500)]" required minLength={2} maxLength={50} />
                  <input name="postalCode" value={checkoutForm.postalCode} onChange={handleCheckoutChange} placeholder="6 digit postal code" className="rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-[var(--brand-500)]" required inputMode="numeric" pattern="[0-9]{6}" title="Enter a valid 6 digit postal code" />
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <label className="block text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                      Payment Method
                    </label>
                    <select name="paymentMethod" value={checkoutForm.paymentMethod} onChange={handleCheckoutChange} className="mt-2 w-full bg-transparent text-sm font-semibold text-slate-900 outline-none" required>
                      {paymentOptions.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                    <p className="mt-2 min-h-5 text-xs text-slate-500">{selectedPaymentOption.helper}</p>
                  </div>
                  <textarea name="addressLine" value={checkoutForm.addressLine} onChange={handleCheckoutChange} placeholder="Full address" className="min-h-28 rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-[var(--brand-500)] md:col-span-2" required minLength={8} maxLength={240} autoComplete="street-address" />
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 md:col-span-2">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="font-semibold text-slate-900">Delivery Location</p>
                        <p className="mt-1 text-sm text-slate-500">
                          {checkoutForm.location?.latitude && checkoutForm.location?.longitude
                            ? `${checkoutForm.location.latitude}, ${checkoutForm.location.longitude}`
                            : "Optional, but useful for delivery accuracy"}
                        </p>
                      </div>
                      <button type="button" onClick={handleUseCurrentLocation} disabled={fetchingLocation} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white disabled:opacity-60">
                        <LocateFixed size={16} />
                        {fetchingLocation ? "Getting..." : "Use current location"}
                      </button>
                    </div>
                    {checkoutForm.location?.mapUrl ? (
                      <a href={checkoutForm.location.mapUrl} target="_blank" rel="noreferrer" className="mt-3 inline-flex text-sm font-semibold text-[var(--brand-600)]">
                        View selected location on map
                      </a>
                    ) : null}
                  </div>
                </div>
                <button type="submit" disabled={submitting} className="mt-5 w-full rounded-2xl bg-[var(--brand-600)] px-5 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-100 transition hover:bg-[var(--brand-700)] disabled:opacity-60">
                  {submitting ? "Placing order..." : "Place order"}
                </button>
              </form>
            </div>
          </div>
        ) : (
          <div className="rounded-[2rem] border border-dashed border-slate-300 bg-white p-12 text-center shadow-sm">
            <h2 className="text-3xl font-semibold text-slate-900">Your cart is empty</h2>
            <p className="mt-3 text-slate-500">Add a few products from the home page to start checkout.</p>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default Cart;
