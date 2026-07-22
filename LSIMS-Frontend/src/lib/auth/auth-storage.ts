const ACCESS = "lsims_access";
const REFRESH = "lsims_refresh";

function store(): Storage {
  return window.sessionStorage;
}

export const authStorage = {
  getAccess(): string | null {
    return store().getItem(ACCESS);
  },
  getRefresh(): string | null {
    return store().getItem(REFRESH);
  },
  setTokens(access: string, refresh: string) {
    store().setItem(ACCESS, access);
    store().setItem(REFRESH, refresh);
  },
  setAccess(access: string) {
    store().setItem(ACCESS, access);
  },
  clear() {
    store().removeItem(ACCESS);
    store().removeItem(REFRESH);
  },
};
