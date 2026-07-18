import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type MutableRefObject,
  type ReactNode,
} from "react";
import {
  useLocation,
  useNavigate,
  useNavigationType,
} from "react-router-dom";

const STAFF_PREFIX = "/staff";
const STAFF_HOME = "/staff";

export type NavigationHistoryEntry = {
  pathname: string;
  tabId?: string;
};

type PendingRestore = {
  pathname: string;
  tabId: string;
};

function isStaffPath(pathname: string): boolean {
  return pathname === STAFF_PREFIX || pathname.startsWith(`${STAFF_PREFIX}/`);
}

function normalizeStaffPath(pathname: string): string {
  if (pathname === STAFF_PREFIX || pathname === `${STAFF_PREFIX}/`) {
    return STAFF_HOME;
  }
  return pathname.replace(/\/+$/, "") || STAFF_HOME;
}

function entriesEqual(
  a: NavigationHistoryEntry,
  b: NavigationHistoryEntry,
): boolean {
  return a.pathname === b.pathname && a.tabId === b.tabId;
}

type NavigationHistoryContextValue = {
  canGoBack: boolean;
  goBack: () => void;
  previousPath: string | null;
  pushEntry: (entry: NavigationHistoryEntry) => void;
  ensureEntry: (entry: NavigationHistoryEntry) => void;
  registerTabRestorer: (
    pathname: string,
    restore: (tabId: string) => void,
  ) => () => void;
  isRestoringRef: MutableRefObject<boolean>;
};

const NavigationHistoryContext =
  createContext<NavigationHistoryContextValue | null>(null);

export function NavigationHistoryProvider({ children }: { children: ReactNode }) {
  const location = useLocation();
  const navigationType = useNavigationType();
  const navigate = useNavigate();
  const [stack, setStack] = useState<NavigationHistoryEntry[]>([]);
  const skipNextPushRef = useRef(false);
  const isRestoringRef = useRef(false);
  const tabRestorersRef = useRef(new Map<string, (tabId: string) => void>());
  const pendingRestoreRef = useRef<PendingRestore | null>(null);

  const restoreTab = useCallback((pathname: string, tabId: string) => {
    const restorer = tabRestorersRef.current.get(pathname);
    if (!restorer) {
      pendingRestoreRef.current = { pathname, tabId };
      return;
    }
    isRestoringRef.current = true;
    restorer(tabId);
    isRestoringRef.current = false;
  }, []);

  const pushEntry = useCallback((entry: NavigationHistoryEntry) => {
    const pathname = normalizeStaffPath(entry.pathname);
    const normalized: NavigationHistoryEntry = {
      pathname,
      tabId: entry.tabId,
    };

    setStack((current) => {
      const last = current[current.length - 1];
      if (last && entriesEqual(last, normalized)) return current;
      return [...current, normalized];
    });
  }, []);

  const ensureEntry = useCallback((entry: NavigationHistoryEntry) => {
    const pathname = normalizeStaffPath(entry.pathname);
    const normalized: NavigationHistoryEntry = {
      pathname,
      tabId: entry.tabId,
    };

    setStack((current) => {
      if (current.length === 0) return [normalized];
      const last = current[current.length - 1];
      if (last.pathname === pathname && !last.tabId) {
        return [...current.slice(0, -1), normalized];
      }
      if (entriesEqual(last, normalized)) return current;
      return current;
    });
  }, []);

  const registerTabRestorer = useCallback(
    (pathname: string, restore: (tabId: string) => void) => {
      const normalized = normalizeStaffPath(pathname);
      tabRestorersRef.current.set(normalized, restore);

      const pending = pendingRestoreRef.current;
      if (pending && pending.pathname === normalized) {
        pendingRestoreRef.current = null;
        isRestoringRef.current = true;
        restore(pending.tabId);
        isRestoringRef.current = false;
      }

      return () => {
        tabRestorersRef.current.delete(normalized);
      };
    },
    [],
  );

  useEffect(() => {
    const pathname = normalizeStaffPath(location.pathname);
    if (!isStaffPath(pathname)) return;

    if (skipNextPushRef.current) {
      skipNextPushRef.current = false;
      return;
    }

    const routeEntry: NavigationHistoryEntry = { pathname };

    if (navigationType === "REPLACE") {
      setStack((current) => {
        if (current.length === 0) return [routeEntry];
        const last = current[current.length - 1];
        if (last.pathname === pathname && !last.tabId) return current;
        if (entriesEqual(last, routeEntry)) return current;
        return [...current.slice(0, -1), routeEntry];
      });
      return;
    }

    if (navigationType === "POP") {
      setStack((current) => {
        let index = -1;
        for (let i = current.length - 1; i >= 0; i -= 1) {
          if (current[i].pathname === pathname) {
            index = i;
            break;
          }
        }
        if (index >= 0) return current.slice(0, index + 1);
        return [...current, routeEntry];
      });
      return;
    }

    setStack((current) => {
      const last = current[current.length - 1];
      if (last?.pathname === pathname && !last.tabId) return current;
      if (last && entriesEqual(last, routeEntry)) return current;
      return [...current, routeEntry];
    });
  }, [location.pathname, navigationType]);

  const previousPath =
    stack.length > 1 ? stack[stack.length - 2].pathname : null;
  const canGoBack = stack.length > 1;

  const goBack = useCallback(() => {
    const currentPathname = normalizeStaffPath(location.pathname);

    if (stack.length > 1) {
      const prev = stack[stack.length - 2];
      skipNextPushRef.current = true;
      setStack((current) => current.slice(0, -1));

      if (prev.pathname === currentPathname) {
        if (prev.tabId) {
          restoreTab(currentPathname, prev.tabId);
        }
        return;
      }

      if (prev.pathname !== currentPathname) {
        navigate(prev.pathname);
        if (prev.tabId) {
          restoreTab(prev.pathname, prev.tabId);
        }
        return;
      }

      navigate(STAFF_HOME);
      return;
    }

    navigate(STAFF_HOME);
  }, [location.pathname, navigate, restoreTab, stack]);

  return (
    <NavigationHistoryContext.Provider
      value={{
        canGoBack,
        goBack,
        previousPath,
        pushEntry,
        ensureEntry,
        registerTabRestorer,
        isRestoringRef,
      }}
    >
      {children}
    </NavigationHistoryContext.Provider>
  );
}

export function useNavigationHistory(): NavigationHistoryContextValue {
  const value = useContext(NavigationHistoryContext);
  if (!value) {
    throw new Error(
      "useNavigationHistory must be used within NavigationHistoryProvider",
    );
  }
  return value;
}

export function isStaffDashboardHome(pathname: string): boolean {
  return normalizeStaffPath(pathname) === STAFF_HOME;
}
