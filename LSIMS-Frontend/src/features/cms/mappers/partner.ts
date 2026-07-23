import type { PartnerItem, StrapiPartner } from "@/features/cms/types";

export function mapPartner(data: StrapiPartner): PartnerItem {
  return {
    id: data.partnerKey,
    name: data.name,
    logoSrc: data.logoUrl,
    href: data.href ?? undefined,
  };
}

export function mapPartners(items: StrapiPartner[]): PartnerItem[] {
  return items.map(mapPartner);
}
