import type { SupportedLocale } from "@/lib/i18n/locales";

const CMS_PREVIEW_STORAGE_KEY = "lsims-cms-preview";

export type CmsPreviewPublicationStatus = "draft" | "published";

type CmsPreviewState = {
  status: CmsPreviewPublicationStatus;
  locale?: SupportedLocale;
};

export function setCmsPreviewMode(
  status: CmsPreviewPublicationStatus,
  locale?: SupportedLocale,
): void {
  const state: CmsPreviewState = { status, locale };
  sessionStorage.setItem(CMS_PREVIEW_STORAGE_KEY, JSON.stringify(state));
}

export function clearCmsPreviewMode(): void {
  sessionStorage.removeItem(CMS_PREVIEW_STORAGE_KEY);
}

export function getCmsPreviewMode(): CmsPreviewState | null {
  try {
    const raw = sessionStorage.getItem(CMS_PREVIEW_STORAGE_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as CmsPreviewState;
    if (parsed.status === "draft" || parsed.status === "published") {
      return parsed;
    }

    return null;
  } catch {
    return null;
  }
}

export function getCmsPublicationStatus(): CmsPreviewPublicationStatus {
  return getCmsPreviewMode()?.status ?? "published";
}

export function getCmsPreviewLocale(): SupportedLocale | null {
  return getCmsPreviewMode()?.locale ?? null;
}

export function isCmsPreviewActive(): boolean {
  return getCmsPreviewMode() !== null;
}
