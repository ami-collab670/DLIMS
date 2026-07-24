import type { AuthUser } from "@/types/auth";

import type { SupportedLocale } from "@/lib/i18n/locales";
import { localizePath } from "@/lib/i18n/localize-path";

import { ROUTES, type ClientPathKey } from "./app-routes";
import { withQuery } from "./with-query";

export function clientPath(
  segment: ClientPathKey,
  query?: Record<string, string>,
): string {
  return withQuery(ROUTES.client[segment], query);
}

export function clientResultsJobUrl(jobId: string): string {
  return clientPath("results", { job: jobId });
}

export function clientComplaintsUrl(params?: {
  job?: string | null;
  sample?: string | null;
  complaint?: string | null;
}): string {
  const query: Record<string, string> = {};
  if (params?.job) query.job = params.job;
  if (params?.sample) query.sample = params.sample;
  if (params?.complaint) query.complaint = params.complaint;
  return clientPath("complaints", query);
}

export function getDashboardPath(
  user: AuthUser,
): typeof ROUTES.staff.root | typeof ROUTES.client.root {
  return user.user_type === "internal" ? ROUTES.staff.root : ROUTES.client.root;
}

export function getNotificationsPath(
  user: AuthUser,
): typeof ROUTES.staff.notifications | typeof ROUTES.client.notifications {
  return user.user_type === "internal"
    ? ROUTES.staff.notifications
    : ROUTES.client.notifications;
}

export function servicePath(slug: string, locale: SupportedLocale): string {
  return localizePath(`${ROUTES.services.root}/${slug}`, locale);
}

export function newsPath(slug: string, locale: SupportedLocale): string {
  return localizePath(`${ROUTES.news}/${slug}`, locale);
}

export function eventPath(slug: string, locale: SupportedLocale): string {
  return localizePath(`${ROUTES.events}/${slug}`, locale);
}
