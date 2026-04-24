const TAB_ID_KEY = "mystore_tab_id";
const ACTIVE_AUTH_TAB_KEY = "mystore_active_auth_tab";

export const getTabId = () => {
  let tabId = sessionStorage.getItem(TAB_ID_KEY);

  if (!tabId) {
    tabId = `tab_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    sessionStorage.setItem(TAB_ID_KEY, tabId);
  }

  return tabId;
};

export const getActiveAuthTab = () => localStorage.getItem(ACTIVE_AUTH_TAB_KEY) || "";

export const hasAnotherActiveAuthTab = () => {
  const activeTab = getActiveAuthTab();
  const currentTab = getTabId();

  return Boolean(activeTab && activeTab !== currentTab);
};

export const claimAuthTab = () => {
  const currentTab = getTabId();
  localStorage.setItem(ACTIVE_AUTH_TAB_KEY, currentTab);
  return currentTab;
};

export const releaseAuthTab = () => {
  const currentTab = getTabId();
  const activeTab = getActiveAuthTab();

  if (activeTab === currentTab) {
    localStorage.removeItem(ACTIVE_AUTH_TAB_KEY);
  }
};

export const clearStoredAuth = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
};
