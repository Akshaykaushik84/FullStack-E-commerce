import { useEffect } from "react";
import {
  BrowserRouter as Router,
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Profile from "./pages/Profile";
import AdminDashboard from "./pages/AdminDashboard";
import Cart from "./pages/Cart";
import Orders from "./pages/Orders";
import ProductDetails from "./pages/ProductDetails";
import Wishlist from "./pages/Wishlist";
import LocationTracker from "./components/LocationTracker";
import SessionHeartbeat from "./components/SessionHeartbeat";
import { ToastProvider } from "./components/ToastProvider";
import { forceClearCurrentTabAuth, getActiveAuthOwner, getTabId, releaseAuthTab } from "./utils/authSession";
import { getStoredToken, getStoredUser } from "./utils/authStorage";

const RequireAuth = ({ children }) => {
  const token = getStoredToken();

  if (!token) {
    return <Navigate to="/login" replace state={{ message: "Please login first to continue." }} />;
  }

  return children;
};

const RequireAdmin = ({ children }) => {
  const token = getStoredToken();
  const user = getStoredUser();

  if (!token) {
    return <Navigate to="/login" replace state={{ message: "Please login as admin first." }} />;
  }

  if (user?.role !== "admin") {
    return <Navigate to="/" replace />;
  }

  return children;
};

const AuthTabGuard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const activeUser = getStoredUser();
  const locationWatchKey = `${getStoredToken()}-${activeUser?.email || "guest"}`;

  useEffect(() => {
    const currentTab = getTabId();

    const enforcePerUserTabLock = () => {
      const token = getStoredToken();
      const user = getStoredUser();
      const isAuthPage = location.pathname === "/login" || location.pathname === "/register";

      if (!token || !user?.email) {
        return;
      }

      const ownerTab = getActiveAuthOwner(user.email);

      if (ownerTab && ownerTab !== currentTab) {
        forceClearCurrentTabAuth();

        if (!isAuthPage) {
          navigate("/login", {
            replace: true,
            state: { message: "This account is already active in another tab." },
          });
        }
      }
    };

    const handleBeforeUnload = () => {
      releaseAuthTab();
    };

    const handleStorage = (event) => {
      if (event.key === "mystore_active_users") {
        enforcePerUserTabLock();
      }
    };

    enforcePerUserTabLock();
    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("storage", handleStorage);
    };
  }, [location.pathname, navigate]);

  return (
    <>
      <SessionHeartbeat watchKey={locationWatchKey} />
      <LocationTracker watchKey={locationWatchKey} />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/profile" element={<RequireAuth><Profile /></RequireAuth>} />
        <Route path="/cart" element={<RequireAuth><Cart /></RequireAuth>} />
        <Route path="/orders" element={<RequireAuth><Orders /></RequireAuth>} />
        <Route path="/wishlist" element={<RequireAuth><Wishlist /></RequireAuth>} />
        <Route path="/products/:id" element={<ProductDetails />} />
        <Route path="/admin" element={<RequireAdmin><AdminDashboard /></RequireAdmin>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
};

const App = () => {
  return (
    <ToastProvider>
      <Router>
        <AuthTabGuard />
      </Router>
    </ToastProvider>
  );
};

export default App;
