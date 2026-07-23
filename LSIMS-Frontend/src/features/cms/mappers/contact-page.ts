import type {
  ContactDetailBlock,
  ContactPageContent,
  StrapiContactDetail,
  StrapiContactPage,
} from "@/features/cms/types";

function mapDetails(
  details: StrapiContactDetail[] | null | undefined,
): ContactDetailBlock[] {
  if (!details?.length) {
    return [];
  }

  return details.map((detail) => ({
    label: detail.label,
    value: detail.value,
  }));
}

export function mapContactPage(data: StrapiContactPage): ContactPageContent {
  return {
    slug: data.slug,
    heroTitle: data.heroTitle,
    heroSubtitle: data.heroSubtitle,
    intro: data.intro,
    details: mapDetails(data.details),
  };
}
