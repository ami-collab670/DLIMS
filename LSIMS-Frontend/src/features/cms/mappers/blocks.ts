import type { StrapiBlock } from "@/features/cms/types";

export function blocksToParagraphs(
  blocks: StrapiBlock[] | null | undefined,
): string[] {
  if (!blocks?.length) {
    return [];
  }

  return blocks
    .filter((block) => block.type === "paragraph")
    .map((block) =>
      block.children
        .filter((child) => child.type === "text")
        .map((child) => child.text)
        .join(""),
    )
    .filter(Boolean);
}

export function mapSectionHeader(
  header: { eyebrow?: string | null; title?: string | null } | null | undefined,
): { eyebrow: string; title: string } | null {
  if (!header?.eyebrow || !header.title) {
    return null;
  }

  return { eyebrow: header.eyebrow, title: header.title };
}
