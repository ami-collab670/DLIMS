import { mapSectionHeader } from "@/features/cms/mappers/blocks";
import type {
  AboutAccreditationItem,
  AboutHighlight,
  AboutMilestone,
  AboutPageContent,
  AboutValue,
  StrapiAboutPage,
  StrapiAccreditationItem,
  StrapiHighlightStat,
  StrapiMilestone,
  StrapiValueProp,
} from "@/features/cms/types";

function mapHighlight(
  highlight: StrapiHighlightStat | null | undefined,
): AboutHighlight | null {
  if (!highlight?.label || !highlight.value || !highlight.context) {
    return null;
  }

  return {
    label: highlight.label,
    value: highlight.value,
    context: highlight.context,
  };
}

function mapValues(values: StrapiValueProp[] | null | undefined): AboutValue[] {
  if (!values?.length) {
    return [];
  }

  return values.map((value) => ({
    title: value.title,
    description: value.description,
    iconKey: value.iconKey,
  }));
}

function mapMilestones(
  milestones: StrapiMilestone[] | null | undefined,
): AboutMilestone[] {
  if (!milestones?.length) {
    return [];
  }

  return milestones.map((milestone) => ({
    year: milestone.year,
    title: milestone.title,
    description: milestone.description,
  }));
}

function mapAccreditation(
  items: StrapiAccreditationItem[] | null | undefined,
): AboutAccreditationItem[] {
  if (!items?.length) {
    return [];
  }

  return items.map((item) => ({
    title: item.title,
    description: item.description,
    iconKey: item.iconKey,
  }));
}

export function mapAboutPage(data: StrapiAboutPage): AboutPageContent {
  return {
    heroTitle: data.heroTitle,
    heroSubtitle: data.heroSubtitle,
    missionTitle: data.missionTitle,
    missionBody: data.missionBody,
    visionTitle: data.visionTitle,
    visionBody: data.visionBody,
    highlight: mapHighlight(data.highlight),
    valuesHeader: mapSectionHeader(data.valuesHeader),
    values: mapValues(data.values),
    milestonesHeader: mapSectionHeader(data.milestonesHeader),
    milestones: mapMilestones(data.milestones),
    accreditationHeader: mapSectionHeader(data.accreditationHeader),
    accreditation: mapAccreditation(data.accreditation),
    partnersHeader: mapSectionHeader(data.partnersHeader),
  };
}
