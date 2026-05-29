import { createElement, useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Heart, Home, MapPin, Menu, Package, Shield, ShoppingCart, X } from "lucide-react";
import { logoutUser } from "../api/authApi.jsx";
import { releaseAuthTab } from "../utils/authSession";
import { AUTH_USER_CHANGED_EVENT, clearStoredAuth, getStoredToken, getStoredUser } from "../utils/authStorage.js";
import { getLocationLabel } from "../utils/locationUtils.js";

const DEFAULT_PROFILE_IMAGE = "https://www.pngall.com/wp-content/uploads/5/Profile-Transparent.png";

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

const readAuthSnapshot = () => ({
  token: getStoredToken(),
  user: getStoredUser(),
});

const NavbarComp = () => {
  const [{ token, user }, setAuthSnapshot] = useState(readAuthSnapshot);
  const routeLocation = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [avatarFailed, setAvatarFailed] = useState(false);
  const isLoggedIn = Boolean(token && user?.email);
  const profileImage = avatarFailed ? DEFAULT_PROFILE_IMAGE : user?.profileImage || DEFAULT_PROFILE_IMAGE;
  const locationLabel = isLoggedIn ? getLocationLabel(user?.location) : "";
  const locationLink = user?.location?.mapUrl || "";

  useEffect(() => {
    const syncAuthSnapshot = () => {
      setAvatarFailed(false);
      setAuthSnapshot(readAuthSnapshot());
    };

    window.addEventListener(AUTH_USER_CHANGED_EVENT, syncAuthSnapshot);
    window.addEventListener("storage", syncAuthSnapshot);

    return () => {
      window.removeEventListener(AUTH_USER_CHANGED_EVENT, syncAuthSnapshot);
      window.removeEventListener("storage", syncAuthSnapshot);
    };
  }, []);

  const handleLogout = () => {
    logoutUser()
      .catch(() => null)
      .finally(() => {
        releaseAuthTab();
        clearStoredAuth();
        window.location.href = "/login";
      });
  };

  const navItems = [{ to: "/", icon: Home, label: "Home", active: routeLocation.pathname === "/" }];

  if (isLoggedIn) {
    navItems.push(
      { to: "/orders", icon: Package, label: "Orders", active: routeLocation.pathname === "/orders" },
      { to: "/wishlist", icon: Heart, label: "Wishlist", active: routeLocation.pathname === "/wishlist" },
      { to: "/cart", icon: ShoppingCart, label: "Cart", active: routeLocation.pathname === "/cart" },
    );
  }

  if (isLoggedIn && user?.role === "admin") {
    navItems.push({
      to: "/admin",
      icon: Shield,
      label: "Admin",
      active: routeLocation.pathname === "/admin",
    });
  }

  return (
    <>
      <div className="fixed left-0 top-0 z-50 w-full border-b border-[var(--brand-100)] bg-white/88 backdrop-blur-xl shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-2 px-3 py-3 sm:gap-3 sm:px-5">
          <Link to="/" className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,var(--brand-600)_0%,var(--accent-500)_100%)] text-base font-bold text-white shadow-lg shadow-blue-200 sm:h-11 sm:w-11 sm:text-lg">
              CS
            </div>
            <div className="min-w-0">
              <p className="truncate text-base font-semibold text-slate-900 sm:text-lg">CartSphere</p>
              <p className="hidden text-xs text-slate-500 sm:block">Curated shopping, cleaner checkout</p>
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

          <div className="flex items-center gap-1.5 sm:gap-3">
            {isLoggedIn ? (
              <>
                {locationLabel ? (
                  <a
                    href={locationLink || undefined}
                    target={locationLink ? "_blank" : undefined}
                    rel={locationLink ? "noreferrer" : undefined}
                    className="hidden max-w-[190px] items-center gap-2 rounded-full border border-[var(--brand-100)] bg-[var(--brand-50)] px-3 py-2 text-xs font-semibold text-[var(--brand-700)] transition hover:border-[var(--brand-400)] hover:bg-white lg:flex"
                    title={locationLabel}
                  >
                    <MapPin size={15} className="shrink-0" />
                    <span className="truncate">{locationLabel}</span>
                  </a>
                ) : null}
                <Link
                  to="/profile"
                  className="group relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border-2 border-[var(--brand-100)] bg-[var(--brand-50)] transition hover:-translate-y-0.5 hover:border-[var(--brand-500)] sm:h-11 sm:w-11"
                >
                  <img
                    src={profileImage}
                    alt={user?.name || "Profile"}
                    className="h-full w-full object-cover"
                    onError={() => setAvatarFailed(true)}
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
                  className="rounded-full border border-[var(--brand-500)] px-2.5 py-2 text-xs font-medium text-[var(--brand-600)] transition hover:bg-[var(--brand-50)] sm:px-4 sm:text-sm"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="rounded-full bg-[var(--brand-600)] px-2.5 py-2 text-xs font-medium text-white transition hover:bg-[var(--brand-700)] sm:px-4 sm:text-sm"
                >
                  Register
                </Link>
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
              {isLoggedIn && locationLabel ? (
                <a
                  href={locationLink || undefined}
                  target={locationLink ? "_blank" : undefined}
                  rel={locationLink ? "noreferrer" : undefined}
                  className="flex items-center gap-3 rounded-2xl border border-[var(--brand-100)] bg-[var(--brand-50)] px-4 py-3 text-sm font-semibold text-[var(--brand-700)]"
                  onClick={() => setMenuOpen(false)}
                >
                  <MapPin size={18} />
                  <span className="truncate">{locationLabel}</span>
                </a>
              ) : null}
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
              {isLoggedIn ? (
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

      {isLoggedIn ? (
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
