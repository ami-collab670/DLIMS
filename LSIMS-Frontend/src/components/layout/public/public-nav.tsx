import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ChevronDown, Menu, X } from "lucide-react";
import type { ReactNode } from "react";

import { ThemeToggler } from "@/components/ThemeToggler";
import { Button } from "@/components/ui/button";
import type { NavLink } from "@/features/cms/types";
import type { ServiceItem } from "@/features/cms/types";
import { ROUTES } from "@/lib/routing";
import { cn } from "@/lib/ui";

import { PublicServicesNavItem } from "./public-services-nav-item";

function isNavLinkActive(pathname: string, path: string) {
  if (path === ROUTES.home) {
    return pathname === ROUTES.home;
  }
  if (path.includes("#")) {
    return pathname === ROUTES.home;
  }
  return pathname === path || pathname.startsWith(`${path}/`);
}

type PublicNavSharedProps = {
  navLinks: NavLink[];
  services?: ServiceItem[];
  servicesOpen?: boolean;
  onServicesOpenChange?: (open: boolean) => void;
};

export function PublicNavDesktop({
  navLinks,
  servicesOpen = false,
  onServicesOpenChange,
}: PublicNavSharedProps) {
  const { pathname } = useLocation();
  const navRef = useRef<HTMLDivElement>(null);
  const linkRefs = useRef<Map<string, HTMLElement>>(new Map());
  const [indicator, setIndicator] = useState<{ left: number; width: number } | null>(
    null,
  );

  const measureLink = useCallback((path: string) => {
    const nav = navRef.current;
    const link = linkRefs.current.get(path);
    if (!nav || !link) return null;
    const navRect = nav.getBoundingClientRect();
    const linkRect = link.getBoundingClientRect();
    return {
      left: linkRect.left - navRect.left,
      width: linkRect.width,
    };
  }, []);

  const snapToActive = useCallback(() => {
    const activeLink = navLinks.find((link) => isNavLinkActive(pathname, link.path));
    if (!activeLink) {
      setIndicator(null);
      return;
    }
    const rect = measureLink(activeLink.path);
    if (rect) setIndicator(rect);
  }, [measureLink, navLinks, pathname]);

  useLayoutEffect(() => {
    snapToActive();
  }, [snapToActive]);

  useEffect(() => {
    const handleResize = () => snapToActive();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [snapToActive]);

  useEffect(() => {
    if (!servicesOpen) return;
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onServicesOpenChange?.(false);
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [onServicesOpenChange, servicesOpen]);

  const servicesPath = ROUTES.services.root;
  const isServicesActive = isNavLinkActive(pathname, servicesPath);

  return (
    <nav
      ref={navRef}
      className="relative hidden items-center justify-center gap-0.5 md:flex"
      onMouseLeave={() => {
        snapToActive();
      }}
    >
      {indicator ? (
        <span
          aria-hidden
          className="pointer-events-none absolute top-1/2 h-8 -translate-y-1/2 rounded-md bg-secondary transition-[left,width] duration-200 ease-out"
          style={{ left: indicator.left, width: indicator.width }}
        />
      ) : null}
      {navLinks.map((link) => {
        const isActive = isNavLinkActive(pathname, link.path);

        if (link.path === servicesPath) {
          return (
            <PublicServicesNavItem
              key={link.path}
              ref={(node) => {
                if (node) linkRefs.current.set(link.path, node);
                else linkRefs.current.delete(link.path);
              }}
              label={link.label}
              isActive={isServicesActive}
              isOpen={servicesOpen}
              onOpen={() => onServicesOpenChange?.(true)}
              onToggle={() => onServicesOpenChange?.(!servicesOpen)}
              onMouseEnterIndicator={() => {
                const rect = measureLink(link.path);
                if (rect) setIndicator(rect);
              }}
            />
          );
        }

        return (
          <Link
            key={link.path}
            ref={(node) => {
              if (node) linkRefs.current.set(link.path, node);
              else linkRefs.current.delete(link.path);
            }}
            to={link.path}
            onMouseEnter={() => {
              onServicesOpenChange?.(false);
              const rect = measureLink(link.path);
              if (rect) setIndicator(rect);
            }}
            className={cn(
              "relative z-10 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              isActive
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function PublicNavMobile({
  navLinks,
  services = [],
  mobileActions,
  onServicesOpenChange,
}: PublicNavSharedProps & { mobileActions?: ReactNode }) {
  const { pathname } = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileServicesExpanded, setMobileServicesExpanded] = useState(false);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  useEffect(() => {
    setMobileOpen(false);
    setMobileServicesExpanded(false);
    onServicesOpenChange?.(false);
  }, [pathname, onServicesOpenChange]);

  const servicesPath = ROUTES.services.root;

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="md:hidden"
        aria-expanded={mobileOpen}
        aria-label={mobileOpen ? "Close menu" : "Open menu"}
        onClick={() => setMobileOpen((open) => !open)}
      >
        {mobileOpen ? (
          <X className="size-5" aria-hidden />
        ) : (
          <Menu className="size-5" aria-hidden />
        )}
      </Button>

      {mobileOpen ? (
        <div className="fixed inset-x-0 top-14 z-40 border-b border-border bg-background md:hidden">
          <div className="mx-auto max-h-[calc(100dvh-3.5rem)] max-w-7xl overflow-y-auto px-4 py-4">
            <div className="flex flex-col gap-1">
              {navLinks.map((link) => {
                const isActive = isNavLinkActive(pathname, link.path);

                if (link.path === servicesPath) {
                  return (
                    <div key={link.path} className="flex flex-col gap-1">
                      <button
                        type="button"
                        aria-expanded={mobileServicesExpanded}
                        onClick={() =>
                          setMobileServicesExpanded((expanded) => !expanded)
                        }
                        className={cn(
                          "flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-base font-medium transition-colors",
                          isActive
                            ? "bg-secondary text-foreground"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground",
                        )}
                      >
                        {link.label}
                        <ChevronDown
                          className={cn(
                            "size-5 transition-transform duration-200",
                            mobileServicesExpanded && "rotate-180",
                          )}
                          aria-hidden
                        />
                      </button>
                      {mobileServicesExpanded ? (
                        <ul className="ml-2 flex flex-col gap-0.5 border-l border-border pl-3">
                          {services.map((service) => (
                            <li key={service.slug}>
                              <Link
                                to={service.href}
                                onClick={() => setMobileOpen(false)}
                                className="block rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                              >
                                {service.title}
                              </Link>
                            </li>
                          ))}
                          <li>
                            <Link
                              to={ROUTES.services.root}
                              onClick={() => setMobileOpen(false)}
                              className="block rounded-lg px-3 py-2 text-sm font-medium text-primary"
                            >
                              View all services
                            </Link>
                          </li>
                        </ul>
                      ) : null}
                    </div>
                  );
                }

                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "rounded-lg px-3 py-2.5 text-base font-medium transition-colors",
                      isActive
                        ? "bg-secondary text-foreground"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground",
                    )}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </div>
            {mobileActions ? (
              <div className="mt-4 border-t border-border pt-4">{mobileActions}</div>
            ) : null}
            <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
              <span className="text-sm font-medium text-muted-foreground">Theme</span>
              <ThemeToggler />
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
