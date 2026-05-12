export const EMAIL_PATTERN =
  "^(?!.*\\.\\.)[A-Za-z0-9._%+-]+@(?:[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?\\.)+[A-Za-z]{2,}$";

export const isValidEmail = (value) =>
  new RegExp(EMAIL_PATTERN).test(String(value || "").trim());

export const isStrongPassword = (value) => String(value || "").length >= 6;

export const isValidName = (value, minLength = 2) =>
  String(value || "").trim().length >= minLength;

export const isValidIndianPhone = (value) =>
  /^[6-9]\d{9}$/.test(String(value || "").trim());

export const isValidPostalCode = (value) =>
  /^\d{6}$/.test(String(value || "").trim());

export const isValidHttpUrl = (value, allowEmpty = true) => {
  const rawValue = String(value || "").trim();

  if (!rawValue) return allowEmpty;

  try {
    const parsedUrl = new URL(rawValue);
    return parsedUrl.protocol === "http:" || parsedUrl.protocol === "https:";
  } catch {
    return false;
  }
};

export const isValidImageFile = (file, maxSizeMb = 2) => {
  if (!file) return true;

  return file.type.startsWith("image/") && file.size <= maxSizeMb * 1024 * 1024;
};
