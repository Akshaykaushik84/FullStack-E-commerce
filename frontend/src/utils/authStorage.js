export const getStoredToken = () => sessionStorage.getItem("token") || "";

export const setStoredToken = (token) => {
  sessionStorage.setItem("token", token);
};

export const getStoredUser = () => {
  try {
    const rawUser = sessionStorage.getItem("user");

    if (!rawUser || rawUser === "undefined" || rawUser === "null") {
      return null;
    }

    return JSON.parse(rawUser);
  } catch {
    return null;
  }
};

export const setStoredUser = (user) => {
  sessionStorage.setItem("user", JSON.stringify(user));
};

export const clearStoredAuth = () => {
  sessionStorage.removeItem("token");
  sessionStorage.removeItem("user");
};
