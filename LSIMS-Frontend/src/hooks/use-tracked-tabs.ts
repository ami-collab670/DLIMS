import { useCallback, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

import { useNavigationHistory } from "@/providers/navigation-history-provider";

type SetTrackedTabOptions = {
  skipHistory?: boolean;
};

export function useTrackedTabs<T extends string>(
  initialTab: T,
): [T, (tab: T, options?: SetTrackedTabOptions) => void] {
  const location = useLocation();
  const pathname = location.pathname;
  const {
    pushEntry,
    ensureEntry,
    registerTabRestorer,
    isRestoringRef,
  } = useNavigationHistory();
  const [tab, setTabState] = useState<T>(initialTab);

  useEffect(() => {
    return registerTabRestorer(pathname, (tabId) => {
      setTabState(tabId as T);
    });
  }, [pathname, registerTabRestorer]);

  useEffect(() => {
    ensureEntry({ pathname, tabId: initialTab });
  }, [ensureEntry, initialTab, pathname]);

  const setTab = useCallback(
    (next: T, options?: SetTrackedTabOptions) => {
      setTabState(next);

      if (options?.skipHistory || isRestoringRef.current) {
        return;
      }

      pushEntry({ pathname, tabId: next });
    },
    [isRestoringRef, pathname, pushEntry],
  );

  return [tab, setTab];
}
