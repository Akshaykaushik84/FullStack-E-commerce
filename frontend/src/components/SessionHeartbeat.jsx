import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { sendHeartbeat } from "../api/authApi.jsx";
import { releaseAuthTab } from "../utils/authSession";
import { clearStoredAuth, getStoredToken } from "../utils/authStorage.js";

const HEARTBEAT_INTERVAL_MS = 60 * 1000;

const SessionHeartbeat = ({ watchKey }) => {
  const navigate = useNavigate();

  useEffect(() => {
    const token = getStoredToken();

    if (!token) {
      return undefined;
    }

    const handleExpiredSession = () => {
      releaseAuthTab();
      clearStoredAuth();
      navigate("/login", {
        replace: true,
        state: { message: "Your session expired after 10 minutes of inactivity. Please login again." },
      });
    };

    const ping = () => {
      if (!getStoredToken()) {
        return;
      }

      sendHeartbeat().catch((err) => {
        if (err.response?.status === 401 || err.response?.status === 400) {
          handleExpiredSession();
        }
      });
    };

    ping();
    const timer = window.setInterval(ping, HEARTBEAT_INTERVAL_MS);

    return () => window.clearInterval(timer);
  }, [navigate, watchKey]);

  return null;
};

export default SessionHeartbeat;
