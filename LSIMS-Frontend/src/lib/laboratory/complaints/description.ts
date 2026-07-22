const COMPLAINT_REFERENCE_PREFIX = "Reference:";

/** Split stored description into optional reference line and body text. */
export function parseComplaintReference(description: string | null | undefined): {
  reference: string | null;
  body: string;
} {
  const text = description?.trim() ?? "";
  if (!text.startsWith(`${COMPLAINT_REFERENCE_PREFIX} `)) {
    return { reference: null, body: text };
  }

  const withoutPrefix = text.slice(COMPLAINT_REFERENCE_PREFIX.length + 1);
  const splitIndex = withoutPrefix.indexOf("\n\n");
  if (splitIndex === -1) {
    return { reference: withoutPrefix.trim() || null, body: "" };
  }

  return {
    reference: withoutPrefix.slice(0, splitIndex).trim() || null,
    body: withoutPrefix.slice(splitIndex + 2).trim(),
  };
}

/** Prefix optional reference for general complaints (no linked job). */
export function buildComplaintDescription(
  reference: string,
  body: string,
): string {
  const ref = reference.trim();
  const desc = body.trim();
  if (!ref) return desc;
  return `${COMPLAINT_REFERENCE_PREFIX} ${ref}\n\n${desc}`;
}

/** Description text for list cells (body only when reference prefix present). */
export function complaintDescriptionPreview(description: string | null | undefined): string {
  const { body, reference } = parseComplaintReference(description);
  if (body) return body;
  return reference ?? "";
}
