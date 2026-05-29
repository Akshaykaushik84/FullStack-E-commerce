import { useEffect, useRef } from "react";
import { updateLocation } from "../api/authApi.jsx";
import { getStoredToken, getStoredUser, setStoredUser } from "../utils/authStorage.js";
import { buildMapLink, clearLocationWatch, hasLocationMoved, watchCurrentPosition } from "../utils/locationUtils.js";

const MIN_LOCATION_UPDATE_METERS = 120;
const MIN_LOCATION_UPDATE_INTERVAL_MS = 60000;

const LocationTracker = ({ watchKey }) => {
  const savingRef = useRef(false);
  const lastSyncedAtRef = useRef(0);
  const lastSyncedLocationRef = useRef(null);

  useEffect(() => {
    const token = getStoredToken();
    const user = getStoredUser();

    if (!token || !user?.email) {
      return undefined;
    }

    lastSyncedLocationRef.current = user.location || null;

    const syncLocation = (coords) => {
      const activeToken = getStoredToken();
      const activeUser = getStoredUser();

      if (!activeToken || !activeUser?.email || savingRef.current) {
        return;
      }

      const now = Date.now();
      const previousLocation = lastSyncedLocationRef.current || activeUser.location || {};
      const needsPlaceName = !activeUser.location?.placeName;
      const movedEnough = hasLocationMoved(previousLocation, coords, MIN_LOCATION_UPDATE_METERS);
      const throttled = lastSyncedAtRef.current && now - lastSyncedAtRef.current < MIN_LOCATION_UPDATE_INTERVAL_MS;

      if (!needsPlaceName && !movedEnough) {
        return;
      }

      if (throttled) {
        return;
      }

      savingRef.current = true;
      lastSyncedAtRef.current = now;
      lastSyncedLocationRef.current = coords;

      updateLocation({
        ...coords,
        mapUrl: buildMapLink(coords.latitude, coords.longitude),
      })
        .then((res) => {
          if (res.data?.user) {
            setStoredUser(res.data.user);
            lastSyncedLocationRef.current = res.data.user.location || coords;
          }
        })
        .catch(() => null)
        .finally(() => {
          savingRef.current = false;
        });
    };

    const watchId = watchCurrentPosition(syncLocation, () => null);

    return () => {
      clearLocationWatch(watchId);
    };
  }, [watchKey]);

  return null;
};

export default LocationTracker;
