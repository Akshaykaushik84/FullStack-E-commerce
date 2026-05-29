export const buildMapLink = (latitude, longitude) => {
  if (!Number.isFinite(Number(latitude)) || !Number.isFinite(Number(longitude))) {
    return "";
  }

  return `https://www.google.com/maps?q=${latitude},${longitude}`;
};

const normalizePosition = (position) => ({
  latitude: Number(position.coords.latitude.toFixed(6)),
  longitude: Number(position.coords.longitude.toFixed(6)),
  accuracy: Number.isFinite(position.coords.accuracy) ? Math.round(position.coords.accuracy) : null,
});

export const getCurrentPosition = () =>
  new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Location is not supported by this browser."));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve(normalizePosition(position));
      },
      () => reject(new Error("Location permission was denied or unavailable.")),
      {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 60000,
      }
    );
  });

export const watchCurrentPosition = (onChange, onError = () => null) => {
  if (!navigator.geolocation) {
    onError(new Error("Location is not supported by this browser."));
    return null;
  }

  return navigator.geolocation.watchPosition(
    (position) => onChange(normalizePosition(position)),
    () => onError(new Error("Location permission was denied or unavailable.")),
    {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 30000,
    }
  );
};

export const clearLocationWatch = (watchId) => {
  if (watchId !== null && navigator.geolocation) {
    navigator.geolocation.clearWatch(watchId);
  }
};

const toRadians = (value) => (Number(value) * Math.PI) / 180;

export const getDistanceInMeters = (firstLocation = {}, secondLocation = {}) => {
  const firstLatitude = Number(firstLocation.latitude);
  const firstLongitude = Number(firstLocation.longitude);
  const secondLatitude = Number(secondLocation.latitude);
  const secondLongitude = Number(secondLocation.longitude);

  if (
    !Number.isFinite(firstLatitude) ||
    !Number.isFinite(firstLongitude) ||
    !Number.isFinite(secondLatitude) ||
    !Number.isFinite(secondLongitude)
  ) {
    return Number.POSITIVE_INFINITY;
  }

  const earthRadiusInMeters = 6371000;
  const latitudeDistance = toRadians(secondLatitude - firstLatitude);
  const longitudeDistance = toRadians(secondLongitude - firstLongitude);
  const startLatitude = toRadians(firstLatitude);
  const endLatitude = toRadians(secondLatitude);

  const haversine =
    Math.sin(latitudeDistance / 2) ** 2 +
    Math.cos(startLatitude) * Math.cos(endLatitude) * Math.sin(longitudeDistance / 2) ** 2;

  return earthRadiusInMeters * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
};

export const hasLocationMoved = (previousLocation, nextLocation, minimumMeters = 120) =>
  getDistanceInMeters(previousLocation, nextLocation) >= minimumMeters;

export const getLocationLabel = (location = {}) => {
  const placeName = String(location.placeName || "").trim();

  if (placeName) {
    return placeName;
  }

  if (Number.isFinite(Number(location.latitude)) && Number.isFinite(Number(location.longitude))) {
    return "Current location";
  }

  return "";
};
