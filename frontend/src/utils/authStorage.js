export const AUTH_USER_CHANGED_EVENT = "mystore:user-updated";

const emitAuthUserChanged = () => {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(AUTH_USER_CHANGED_EVENT));
  }
};

export const getStoredToken = () => sessionStorage.getItem("token") || "";

export const setStoredToken = (token) => {
  sessionStorage.setItem("token", token);
  emitAuthUserChanged();
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
  emitAuthUserChanged();
};

export const clearStoredAuth = () => {
  sessionStorage.removeItem("token");
  sessionStorage.removeItem("user");
  emitAuthUserChanged();
};
