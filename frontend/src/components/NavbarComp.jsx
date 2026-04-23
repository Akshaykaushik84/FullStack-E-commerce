import { Link, useLocation } from "react-router-dom";
import { Heart, Home, Package, Shield, ShoppingCart, User } from "lucide-react";
import { logoutUser } from "../api/authApi.jsx";

const DEFAULT_PROFILE_IMAGE = "https://www.pngall.com/wp-content/uploads/5/Profile-Transparent.png";

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

const iconLinkClass = (isActive) =>
  `group relative flex h-11 w-11 items-center justify-center rounded-full border transition ${
    isActive
      ? "border-[var(--brand-600)] bg-[var(--brand-600)] text-white shadow-lg shadow-blue-100"
      : "border-slate-200 text-slate-700 hover:-translate-y-0.5 hover:border-[var(--brand-500)] hover:bg-[var(--brand-50)] hover:text-[var(--brand-700)]"
  }`;

const HoverLabel = ({ text }) => (
  <span className="pointer-events-none absolute -bottom-11 left-1/2 -translate-x-1/2 rounded-full bg-[var(--ink-900)] px-3 py-1 text-xs font-medium text-white opacity-0 shadow-lg transition duration-200 group-hover:opacity-100">
    {text}
  </span>
);

const NavbarComp = () => {
  const token = localStorage.getItem("token");
  const user = getStoredUser();
  const location = useLocation();

  const handleLogout = () => {
    logoutUser()
      .catch(() => null)
      .finally(() => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "/login";
      });
  };

  return (
    <div className="fixed left-0 top-0 z-50 w-full border-b border-[var(--brand-100)] bg-white/88 backdrop-blur-xl shadow-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-3">
        <Link to="/" className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--brand-600)] text-lg font-bold text-white shadow-lg shadow-blue-200">
            M
          </div>
          <div>
            <p className="text-lg font-semibold text-slate-900">MyStore</p>
            <p className="text-xs text-slate-500">Smart shopping platform</p>
          </div>
        </Link>

        <div className="hidden items-center gap-3 md:flex">
          <Link to="/" className={iconLinkClass(location.pathname === "/")}>
            <Home size={18} />
            <HoverLabel text="Home" />
          </Link>
          <Link to="/orders" className={iconLinkClass(location.pathname === "/orders")}>
            <Package size={18} />
            <HoverLabel text="Orders" />
          </Link>
          <Link to="/wishlist" className={iconLinkClass(location.pathname === "/wishlist")}>
            <Heart size={18} />
            <HoverLabel text="Wishlist" />
          </Link>
          <Link to="/cart" className={iconLinkClass(location.pathname === "/cart")}>
            <ShoppingCart size={18} />
            <HoverLabel text="Cart" />
          </Link>
          {user?.role === "admin" ? (
            <Link to="/admin" className={iconLinkClass(location.pathname === "/admin")}>
              <Shield size={18} />
              <HoverLabel text="Admin" />
            </Link>
          ) : null}
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {token ? (
            <>
              <Link to="/profile" className="group relative flex h-11 w-11 items-center justify-center overflow-hidden rounded-full border-2 border-[var(--brand-100)] bg-[var(--brand-50)] transition hover:-translate-y-0.5 hover:border-[var(--brand-500)]">
                <img src={user?.profileImage || DEFAULT_PROFILE_IMAGE} alt={user?.name || "Profile"} className="h-full w-full object-cover" />
                <HoverLabel text="Profile" />
              </Link>
              <button onClick={handleLogout} className="rounded-full bg-[var(--brand-600)] px-4 py-2 text-sm font-medium text-white transition hover:bg-[var(--brand-700)]">
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="rounded-full border border-[var(--brand-500)] px-4 py-2 text-sm font-medium text-[var(--brand-600)] transition hover:bg-[var(--brand-50)]">
                Login
              </Link>
              <Link to="/register" className="rounded-full bg-[var(--brand-600)] px-4 py-2 text-sm font-medium text-white transition hover:bg-[var(--brand-700)]">
                Register
              </Link>
              <div className="hidden h-11 w-11 items-center justify-center rounded-full border border-slate-200 text-slate-500 sm:flex">
                <User size={18} />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default NavbarComp;
