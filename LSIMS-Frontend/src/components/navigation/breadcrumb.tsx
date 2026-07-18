import { ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";

import {
  Breadcrumb as BreadcrumbRoot,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { cn } from "@/lib/utils";

export type BreadcrumbSegment = {
  label: string;
  href?: string;
  onClick?: () => void;
};

type AppBreadcrumbProps = {
  segments: BreadcrumbSegment[];
  className?: string;
};

export function Breadcrumb({ segments, className }: AppBreadcrumbProps) {
  if (segments.length === 0) return null;

  return (
    <BreadcrumbRoot className={cn("min-w-0 flex-1 overflow-x-auto", className)}>
      <BreadcrumbList className="flex-nowrap sm:flex-wrap">
        {segments.map((segment, index) => {
          const isLast = index === segments.length - 1;

          return (
            <span key={`${segment.label}-${index}`} className="contents">
              {index > 0 ? (
                <BreadcrumbSeparator>
                  <ChevronRight />
                </BreadcrumbSeparator>
              ) : null}
              <BreadcrumbItem>
                {isLast ? (
                  <BreadcrumbPage>{segment.label}</BreadcrumbPage>
                ) : segment.href ? (
                  <BreadcrumbLink asChild>
                    <Link to={segment.href}>{segment.label}</Link>
                  </BreadcrumbLink>
                ) : segment.onClick ? (
                  <BreadcrumbLink asChild>
                    <button type="button" onClick={segment.onClick}>
                      {segment.label}
                    </button>
                  </BreadcrumbLink>
                ) : (
                  <BreadcrumbPage>{segment.label}</BreadcrumbPage>
                )}
              </BreadcrumbItem>
            </span>
          );
        })}
      </BreadcrumbList>
    </BreadcrumbRoot>
  );
}
