import { blocksToParagraphs } from "@/features/cms/mappers/blocks";

import type { EventItem, StrapiEvent } from "@/features/cms/types";

export function mapEvent(data: StrapiEvent): EventItem {
  return {
    id: data.slug,
    slug: data.slug,
    title: data.title,
    description: data.description,
    date: data.date,
    time: data.time,
    location: data.location,
    status: data.eventStatus,
    body: blocksToParagraphs(data.body),
  };
}

export function mapEvents(items: StrapiEvent[]): EventItem[] {
  return items.map(mapEvent);
}
