import { createElement, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Heart, Home, Menu, Package, Shield, ShoppingCart, User, X } from "lucide-react";
import { logoutUser } from "../api/authApi.jsx";
import { releaseAuthTab } from "../utils/authSession";

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
  <span className="pointer-events-none absolute -bottom-11 left-1/2 hidden -translate-x-1/2 rounded-full bg-[var(--ink-900)] px-3 py-1 text-xs font-medium whitespace-nowrap text-white opacity-0 shadow-lg transition duration-200 group-hover:opacity-100 md:block">
    {text}
  </span>
);

const NavbarComp = () => {
  const token = localStorage.getItem("token");
  const user = getStoredUser();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logoutUser()
      .catch(() => null)
      .finally(() => {
        releaseAuthTab();
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "/login";
      });
  };

  const navItems = [
    { to: "/", icon: Home, label: "Home", active: location.pathname === "/" },
    { to: "/orders", icon: Package, label: "Orders", active: location.pathname === "/orders" },
    { to: "/wishlist", icon: Heart, label: "Wishlist", active: location.pathname === "/wishlist" },
    { to: "/cart", icon: ShoppingCart, label: "Cart", active: location.pathname === "/cart" },
  ];

  if (user?.role === "admin") {
    navItems.push({
      to: "/admin",
      icon: Shield,
      label: "Admin",
      active: location.pathname === "/admin",
    });
  }

  return (
    <>
      <div className="fixed left-0 top-0 z-50 w-full border-b border-[var(--brand-100)] bg-white/88 backdrop-blur-xl shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-5">
          <Link to="/" className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[var(--brand-600)] text-base font-bold text-white shadow-lg shadow-blue-200 sm:h-11 sm:w-11 sm:text-lg">
              M
            </div>
            <div className="min-w-0">
              <p className="truncate text-base font-semibold text-slate-900 sm:text-lg">MyStore</p>
              <p className="hidden text-xs text-slate-500 sm:block">Shop smarter every day</p>
            </div>
          </Link>

          <div className="hidden items-center gap-3 md:flex">
            {navItems.map(({ to, icon: Icon, label, active }) => (
              <Link key={to} to={to} className={iconLinkClass(active)}>
                {createElement(Icon, { size: 18 })}
                <HoverLabel text={label} />
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {token ? (
              <>
                <Link
                  to="/profile"
                  className="group relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border-2 border-[var(--brand-100)] bg-[var(--brand-50)] transition hover:-translate-y-0.5 hover:border-[var(--brand-500)] sm:h-11 sm:w-11"
                >
                  <img
                    src={user?.profileImage || DEFAULT_PROFILE_IMAGE}
                    alt={user?.name || "Profile"}
                    className="h-full w-full object-cover"
                  />
                  <HoverLabel text="Profile" />
                </Link>
                <button
                  onClick={handleLogout}
                  className="hidden rounded-full bg-[var(--brand-600)] px-4 py-2 text-sm font-medium text-white transition hover:bg-[var(--brand-700)] sm:block"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="rounded-full border border-[var(--brand-500)] px-3 py-2 text-sm font-medium text-[var(--brand-600)] transition hover:bg-[var(--brand-50)] sm:px-4"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="rounded-full bg-[var(--brand-600)] px-3 py-2 text-sm font-medium text-white transition hover:bg-[var(--brand-700)] sm:px-4"
                >
                  Register
                </Link>
                <div className="hidden h-11 w-11 items-center justify-center rounded-full border border-slate-200 text-slate-500 sm:flex">
                  <User size={18} />
                </div>
              </>
            )}

            <button
              type="button"
              onClick={() => setMenuOpen((prev) => !prev)}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-700 md:hidden"
              aria-label="Toggle navigation"
            >
              {menuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>

        {menuOpen ? (
          <div className="border-t border-slate-200 bg-white px-4 py-4 md:hidden">
            <div className="grid gap-2">
              {navItems.map(({ to, icon: Icon, label, active }) => (
                <Link
                  key={to}
                  to={to}
                  onClick={() => setMenuOpen(false)}
                  className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition ${
                    active
                      ? "bg-[var(--brand-600)] text-white"
                      : "bg-slate-50 text-slate-700 hover:bg-[var(--brand-50)]"
                  }`}
                >
                  {createElement(Icon, { size: 18 })}
                  <span>{label}</span>
                </Link>
              ))}
              {token ? (
                <button
                  type="button"
                  onClick={handleLogout}
                  className="rounded-2xl bg-slate-900 px-4 py-3 text-left text-sm font-medium text-white"
                >
                  Logout
                </button>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>

      {token ? (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 px-3 py-2 backdrop-blur md:hidden">
          <div className={`mx-auto grid max-w-md gap-2 ${user?.role === "admin" ? "grid-cols-5" : "grid-cols-4"}`}>
            {navItems.map(({ to, icon: Icon, label, active }) => (
              <Link
                key={to}
                to={to}
                className={`flex flex-col items-center justify-center rounded-2xl px-2 py-2 text-[11px] font-medium transition ${
                  active ? "bg-[var(--brand-600)] text-white" : "text-slate-600"
                }`}
              >
                {createElement(Icon, { size: 17 })}
                <span className="mt-1 truncate">{label}</span>
              </Link>
            ))}
          </div>
        </div>
      ) : null}
    </>
  );
};

export default NavbarComp;
