import type { Schema, Struct } from '@strapi/strapi';

export interface HeroHeroSlide extends Struct.ComponentSchema {
  collectionName: 'components_hero_hero_slides';
  info: {
    displayName: 'Hero Slide';
    icon: 'picture';
  };
  attributes: {
    gradientFallbackClass: Schema.Attribute.String & Schema.Attribute.Required;
    imageAlt: Schema.Attribute.String & Schema.Attribute.Required;
    imageUrl: Schema.Attribute.String & Schema.Attribute.Required;
    primaryCtaHref: Schema.Attribute.String;
    primaryCtaLabel: Schema.Attribute.String;
    secondaryCtaHref: Schema.Attribute.String;
    secondaryCtaLabel: Schema.Attribute.String;
    slideKey: Schema.Attribute.String & Schema.Attribute.Required;
    subtitle: Schema.Attribute.Text & Schema.Attribute.Required;
    title: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface MarketingAccreditationItem extends Struct.ComponentSchema {
  collectionName: 'components_marketing_accreditation_items';
  info: {
    displayName: 'Accreditation Item';
    icon: 'shield';
  };
  attributes: {
    description: Schema.Attribute.Text & Schema.Attribute.Required;
    iconKey: Schema.Attribute.String & Schema.Attribute.Required;
    title: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface MarketingContactDetail extends Struct.ComponentSchema {
  collectionName: 'components_marketing_contact_details';
  info: {
    displayName: 'Contact Detail';
    icon: 'phone';
  };
  attributes: {
    label: Schema.Attribute.String & Schema.Attribute.Required;
    value: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface MarketingHighlightStat extends Struct.ComponentSchema {
  collectionName: 'components_marketing_highlight_stats';
  info: {
    displayName: 'Highlight Stat';
    icon: 'chartBubble';
  };
  attributes: {
    context: Schema.Attribute.Text & Schema.Attribute.Required;
    label: Schema.Attribute.String & Schema.Attribute.Required;
    value: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface MarketingMilestone extends Struct.ComponentSchema {
  collectionName: 'components_marketing_milestones';
  info: {
    displayName: 'Milestone';
    icon: 'clock';
  };
  attributes: {
    description: Schema.Attribute.Text & Schema.Attribute.Required;
    title: Schema.Attribute.String & Schema.Attribute.Required;
    year: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface MarketingProcessStep extends Struct.ComponentSchema {
  collectionName: 'components_marketing_process_steps';
  info: {
    displayName: 'Process Step';
    icon: 'bulletList';
  };
  attributes: {
    description: Schema.Attribute.Text & Schema.Attribute.Required;
    title: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface MarketingSectionHeader extends Struct.ComponentSchema {
  collectionName: 'components_marketing_section_headers';
  info: {
    displayName: 'Section Header';
    icon: 'heading';
  };
  attributes: {
    eyebrow: Schema.Attribute.String & Schema.Attribute.Required;
    title: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface MarketingStatItem extends Struct.ComponentSchema {
  collectionName: 'components_marketing_stat_items';
  info: {
    displayName: 'Stat Item';
    icon: 'chartPie';
  };
  attributes: {
    context: Schema.Attribute.String & Schema.Attribute.Required;
    label: Schema.Attribute.String & Schema.Attribute.Required;
    value: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface MarketingValueProp extends Struct.ComponentSchema {
  collectionName: 'components_marketing_value_props';
  info: {
    displayName: 'Value Prop';
    icon: 'star';
  };
  attributes: {
    description: Schema.Attribute.Text & Schema.Attribute.Required;
    iconKey: Schema.Attribute.String & Schema.Attribute.Required;
    title: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface NavigationFooterLink extends Struct.ComponentSchema {
  collectionName: 'components_navigation_footer_links';
  info: {
    displayName: 'Footer Link';
    icon: 'link';
  };
  attributes: {
    href: Schema.Attribute.String & Schema.Attribute.Required;
    label: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface NavigationFooterLinkGroup extends Struct.ComponentSchema {
  collectionName: 'components_navigation_footer_link_groups';
  info: {
    displayName: 'Footer Link Group';
    icon: 'layer';
  };
  attributes: {
    links: Schema.Attribute.Component<'navigation.footer-link', true>;
    title: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface NavigationNavLink extends Struct.ComponentSchema {
  collectionName: 'components_navigation_nav_links';
  info: {
    displayName: 'Nav Link';
    icon: 'link';
  };
  attributes: {
    label: Schema.Attribute.String & Schema.Attribute.Required;
    path: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface NavigationSocialLink extends Struct.ComponentSchema {
  collectionName: 'components_navigation_social_links';
  info: {
    displayName: 'Social Link';
    icon: 'earth';
  };
  attributes: {
    href: Schema.Attribute.String & Schema.Attribute.Required;
    label: Schema.Attribute.String & Schema.Attribute.Required;
    platformId: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

declare module '@strapi/strapi' {
  export namespace Public {
    export interface ComponentSchemas {
      'hero.hero-slide': HeroHeroSlide;
      'marketing.accreditation-item': MarketingAccreditationItem;
      'marketing.contact-detail': MarketingContactDetail;
      'marketing.highlight-stat': MarketingHighlightStat;
      'marketing.milestone': MarketingMilestone;
      'marketing.process-step': MarketingProcessStep;
      'marketing.section-header': MarketingSectionHeader;
      'marketing.stat-item': MarketingStatItem;
      'marketing.value-prop': MarketingValueProp;
      'navigation.footer-link': NavigationFooterLink;
      'navigation.footer-link-group': NavigationFooterLinkGroup;
      'navigation.nav-link': NavigationNavLink;
      'navigation.social-link': NavigationSocialLink;
    }
  }
}
