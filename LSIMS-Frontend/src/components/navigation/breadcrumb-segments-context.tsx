import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import type { BreadcrumbSegment } from "@/components/navigation/breadcrumb";

type SegmentRegistration = {
  id: string;
  segments: BreadcrumbSegment[];
};

type BreadcrumbSegmentsContextValue = {
  extraSegments: BreadcrumbSegment[];
  registerSegments: (
    id: string,
    segments: BreadcrumbSegment[],
  ) => () => void;
};

const BreadcrumbSegmentsContext =
  createContext<BreadcrumbSegmentsContextValue | null>(null);

export function BreadcrumbSegmentsProvider({ children }: { children: ReactNode }) {
  const [registrations, setRegistrations] = useState<SegmentRegistration[]>([]);

  const registerSegments = useCallback(
    (id: string, segments: BreadcrumbSegment[]) => {
      setRegistrations((current) => {
        const next = current.filter((entry) => entry.id !== id);
        if (segments.length > 0) {
          next.push({ id, segments });
        }
        return next;
      });

      return () => {
        setRegistrations((current) =>
          current.filter((entry) => entry.id !== id),
        );
      };
    },
    [],
  );

  const extraSegments = useMemo(
    () => registrations.flatMap((entry) => entry.segments),
    [registrations],
  );

  return (
    <BreadcrumbSegmentsContext.Provider
      value={{ extraSegments, registerSegments }}
    >
      {children}
    </BreadcrumbSegmentsContext.Provider>
  );
}

export function useBreadcrumbSegments(
  segments: BreadcrumbSegment[],
  id = "default",
) {
  const context = useContext(BreadcrumbSegmentsContext);
  if (!context) {
    throw new Error(
      "useBreadcrumbSegments must be used within BreadcrumbSegmentsProvider",
    );
  }

  const { registerSegments } = context;

  useEffect(() => {
    return registerSegments(id, segments);
  }, [id, registerSegments, segments]);
}

export function useMergedBreadcrumbSegments(
  routeSegments: BreadcrumbSegment[],
): BreadcrumbSegment[] {
  const context = useContext(BreadcrumbSegmentsContext);
  const extraSegments = context?.extraSegments ?? [];

  return useMemo(
    () => [...routeSegments, ...extraSegments],
    [routeSegments, extraSegments],
  );
}
