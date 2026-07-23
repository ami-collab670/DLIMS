const CMS_PREVIEW_STORAGE_KEY = "lsims-cms-preview";

export type CmsPreviewPublicationStatus = "draft" | "published";

type CmsPreviewState = {
  status: CmsPreviewPublicationStatus;
};

export function setCmsPreviewMode(status: CmsPreviewPublicationStatus): void {
  const state: CmsPreviewState = { status };
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

/** Strapi REST `status` param for collection types when preview mode is active. */
export function getCmsPublicationStatus(): CmsPreviewPublicationStatus {
  return getCmsPreviewMode()?.status ?? "published";
}

export function isCmsPreviewActive(): boolean {
  return getCmsPreviewMode() !== null;
}
