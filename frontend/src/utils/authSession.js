import { clearStoredAuth, getStoredUser } from "./authStorage.js";

const TAB_ID_KEY = "mystore_tab_id";
const ACTIVE_USERS_KEY = "mystore_active_users";

const readActiveUsers = () => {
  try {
    return JSON.parse(localStorage.getItem(ACTIVE_USERS_KEY) || "{}");
  } catch {
    return {};
  }
};

const writeActiveUsers = (value) => {
  localStorage.setItem(ACTIVE_USERS_KEY, JSON.stringify(value));
};

const normalizeIdentifier = (identifier) => String(identifier || "").trim().toLowerCase();

export const getTabId = () => {
  let tabId = sessionStorage.getItem(TAB_ID_KEY);

  if (!tabId) {
    tabId = `tab_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    sessionStorage.setItem(TAB_ID_KEY, tabId);
  }

  return tabId;
};

export const getActiveAuthOwner = (identifier) => {
  const normalized = normalizeIdentifier(identifier);
  const activeUsers = readActiveUsers();
  return normalized ? activeUsers[normalized] || "" : "";
};

export const hasAnotherActiveAuthTab = (identifier) => {
  const activeTab = getActiveAuthOwner(identifier);
  const currentTab = getTabId();

  return Boolean(activeTab && activeTab !== currentTab);
};

export const claimAuthTab = (identifier) => {
  const normalized = normalizeIdentifier(identifier);

  if (!normalized) {
    return getTabId();
  }

  const activeUsers = readActiveUsers();
  const currentTab = getTabId();
  activeUsers[normalized] = currentTab;
  writeActiveUsers(activeUsers);
  return currentTab;
};

export const releaseAuthTab = (identifier) => {
  const normalized = normalizeIdentifier(identifier || getStoredUser()?.email);

  if (!normalized) {
    return;
  }

  const activeUsers = readActiveUsers();
  const currentTab = getTabId();

  if (activeUsers[normalized] === currentTab) {
    delete activeUsers[normalized];
    writeActiveUsers(activeUsers);
  }
};

export const forceClearCurrentTabAuth = () => {
  releaseAuthTab();
  clearStoredAuth();
};
