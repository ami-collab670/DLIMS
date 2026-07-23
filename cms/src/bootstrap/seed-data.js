function paragraphBlock(text) {
  return {
    type: 'paragraph',
    children: [{ type: 'text', text }],
  };
}

function blocksFromParagraphs(paragraphs) {
  return paragraphs.map(paragraphBlock);
}

const HERO_SLIDES = [
  {
    slideKey: 'accredited-testing',
    title: 'Accredited laboratory testing with full sample traceability',
    subtitle:
      'From intake to certified results, LSIMS connects clients and staff through a secure workflow for geochemical analysis, physical testing, and compliance reporting.',
    imageUrl: '/hero/slide-1.jpg',
    imageAlt: 'Laboratory technicians conducting sample analysis',
    gradientFallbackClass: 'bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950',
    primaryCtaLabel: 'Client login',
    primaryCtaHref: '/login',
    secondaryCtaLabel: 'Our services',
    secondaryCtaHref: '/services',
  },
  {
    slideKey: 'client-portal',
    title: 'Track samples and download results online',
    subtitle:
      'Submit job requests, monitor progress in real time, and receive certified reports through a secure client workspace.',
    imageUrl: '/hero/slide-2.jpg',
    imageAlt: 'Client reviewing laboratory results on a computer',
    gradientFallbackClass: 'bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900',
    primaryCtaLabel: 'Sign in to portal',
    primaryCtaHref: '/login',
    secondaryCtaLabel: 'View services',
    secondaryCtaHref: '/services',
  },
  {
    slideKey: 'quality-compliance',
    title: 'Built for accredited laboratory operations',
    subtitle:
      'QC review workflows, audit trails, and compliance reporting support inspection-ready operations from bench to certificate.',
    imageUrl: '/hero/slide-3.jpg',
    imageAlt: 'Quality control review in a certified laboratory',
    gradientFallbackClass: 'bg-gradient-to-br from-slate-900 via-teal-950 to-slate-900',
    primaryCtaLabel: 'Contact us',
    primaryCtaHref: '/contact',
    secondaryCtaLabel: 'Latest news',
    secondaryCtaHref: '/news',
  },
];

const SERVICES = [
  {
    slug: 'geochemical-analysis',
    title: 'Geochemical analysis',
    description:
      'Trace-element and bulk composition testing with validated methods and documented chain of custody.',
    longDescription:
      'Our geochemical laboratory provides trace-element and bulk composition analysis for exploration, mining, and environmental monitoring programs. Every sample is logged in LSIMS at intake, assigned a unique identifier, and tracked through preparation, analysis, QC review, and report issuance.',
    highlights: [
      'ICP-MS and XRF methods with accredited procedures',
      'Chain-of-custody documentation from intake to archive',
      'Digital certificates delivered through the client portal',
    ],
    iconKey: 'microscope',
    seoDescription: 'Accredited geochemical analysis with full sample traceability.',
    sortOrder: 0,
  },
  {
    slug: 'physical-testing',
    title: 'Physical testing',
    description:
      'Density, hardness, and material property assays aligned to client specifications and standards.',
    longDescription:
      'Physical testing supports material characterization for construction, industrial minerals, and metallurgical samples. Our team applies standardized and client-specified methods with full traceability in LSIMS.',
    highlights: [
      'Density, hardness, and particle size distribution',
      'Custom method alignment to client specifications',
      'Integrated QC checks before result release',
    ],
    iconKey: 'flask-conical',
    seoDescription: 'Physical property testing for industrial and research clients.',
    sortOrder: 1,
  },
  {
    slug: 'sample-logistics',
    title: 'Sample logistics',
    description:
      'Intake, labeling, routing, and storage tracking from reception through preparation and archive.',
    longDescription:
      'Sample logistics ensures that every specimen is received, labeled, routed, and stored according to laboratory SOPs. Reception staff register jobs in LSIMS and clients can monitor progress online.',
    highlights: [
      'Barcode and QR labeling at reception',
      'Prep, analyst, and archive routing in one system',
      'Storage location and retention tracking',
    ],
    iconKey: 'truck',
    seoDescription: 'End-to-end sample logistics and chain-of-custody tracking.',
    sortOrder: 2,
  },
  {
    slug: 'results-delivery',
    title: 'Results delivery',
    description:
      'Secure digital reports, notifications, and downloadable certificates through the client portal.',
    longDescription:
      'Once QC approves results, clients receive notifications and can download certificates from the portal. Historical results remain searchable by job, sample, and date range.',
    highlights: [
      'Email and in-app notifications on completion',
      'Downloadable PDF certificates',
      'Full results history in the client workspace',
    ],
    iconKey: 'globe',
    seoDescription: 'Secure digital delivery of certified laboratory results.',
    sortOrder: 3,
  },
  {
    slug: 'qc-compliance',
    title: 'QC & compliance',
    description:
      'Internal QC review, audit trails, and compliance workflows for accredited laboratory operations.',
    longDescription:
      'Quality control and compliance workflows are built into LSIMS. Analyst results pass through QC review desks, rejected runs are tracked, and audit trails support accreditation inspections.',
    highlights: [
      'Dedicated QC review and rejection queues',
      'Audit trails for method and instrument changes',
      'Compliance reporting for accreditation bodies',
    ],
    iconKey: 'shield-check',
    seoDescription: 'QC and compliance workflows for accredited laboratory operations.',
    sortOrder: 4,
  },
  {
    slug: 'client-portal',
    title: 'Client portal',
    description:
      'Submit requests, track sample progress, manage invoices, and raise complaints in one workspace.',
    longDescription:
      'The client portal is the primary interface for external organizations. Register job requests, upload manifests, track samples, view invoices, and submit feedback without calling the laboratory.',
    highlights: [
      'Online job request submission',
      'Real-time sample status tracking',
      'Complaints and support tickets',
    ],
    iconKey: 'clipboard-check',
    seoDescription: 'Client portal for job requests, tracking, and results.',
    sortOrder: 5,
  },
];

const NEWS_ARTICLES = [
  {
    slug: 'accreditation-renewal-2026',
    title: 'Laboratory accreditation renewed for 2026',
    description:
      'Our ISO-aligned quality management system has been recertified, covering geochemical and physical testing scopes.',
    publishedDate: 'Jan 2026',
    category: 'Accreditation',
    body: blocksFromParagraphs([
      'The laboratory has successfully renewed its accreditation for 2026, covering geochemical analysis, physical testing, and associated quality management processes.',
      'The assessment confirmed that LSIMS audit trails, QC workflows, and document control meet international standards for testing laboratories.',
      'Clients can request copies of scope certificates through the client portal or by contacting the main laboratory office.',
    ]),
    seoDescription: 'Laboratory accreditation renewed for 2026.',
  },
  {
    slug: 'bulk-sample-uploads',
    title: 'Client portal now supports bulk sample uploads',
    description:
      'Registered clients can attach manifests and supporting documents when submitting multi-sample job requests.',
    publishedDate: 'Dec 2025',
    category: 'Product update',
    body: blocksFromParagraphs([
      'Clients can now upload CSV manifests and supporting documents when creating multi-sample job requests through the portal.',
      'The intake wizard validates sample metadata before submission, reducing back-and-forth with reception staff.',
      'Existing clients should update their submission templates using the sample submission guide on the contact page.',
    ]),
    seoDescription: 'Bulk sample uploads now available in the client portal.',
  },
  {
    slug: 'urgent-turnaround-targets',
    title: 'Updated turnaround targets for urgent requests',
    description:
      'Priority intake lanes are available for time-sensitive exploration campaigns and compliance deadlines.',
    publishedDate: 'Nov 2025',
    category: 'Operations',
    body: blocksFromParagraphs([
      'Urgent requests now follow a dedicated intake lane with expedited prep and analyst assignment.',
      'Standard median turnaround remains five business days; urgent workflows target completion within 72 hours where methods allow.',
      'Contact client support to discuss priority handling for large campaigns or regulatory deadlines.',
    ]),
    seoDescription: 'Updated turnaround targets for urgent laboratory requests.',
  },
];

const EVENTS = [
  {
    slug: 'laboratory-open-day-2026',
    title: 'Laboratory open day 2026',
    description:
      'Tour our facilities, meet analysts, and learn how samples move from intake to certified results.',
    date: 'Mar 15, 2026',
    time: '09:00 – 16:00',
    location: 'Main Laboratory, Addis Ababa',
    eventStatus: 'Upcoming',
    body: blocksFromParagraphs([
      'Join us for a guided tour of reception, preparation benches, analytical instruments, and the QC review desk.',
      'Sessions run hourly from 09:00. Registration is recommended for groups larger than five people.',
      'Email client support to register or request accessibility accommodations.',
    ]),
  },
  {
    slug: 'client-portal-workshop',
    title: 'Client portal workshop',
    description:
      'Hands-on training for submitting job requests, tracking samples, and downloading results.',
    date: 'Apr 8, 2026',
    time: '14:00 – 17:00',
    location: 'Online (video conference)',
    eventStatus: 'Upcoming',
    body: blocksFromParagraphs([
      'This workshop walks new client contacts through account setup, job submission, and results retrieval.',
      'Participants should have a registered portal account before the session.',
      'Materials and a recording will be shared with registered attendees after the event.',
    ]),
  },
  {
    slug: 'qc-best-practices-seminar',
    title: 'QC best practices seminar',
    description:
      'Staff and partner labs discuss internal QC design, control charts, and accreditation preparedness.',
    date: 'Feb 20, 2026',
    time: '10:00 – 12:30',
    location: 'Main Laboratory, Training room B',
    eventStatus: 'Completed',
    body: blocksFromParagraphs([
      'The seminar reviewed QC sample insertion rates, control chart interpretation, and common findings from accreditation audits.',
      'Slides and reference SOPs are available to registered participants upon request.',
    ]),
  },
];

const PARTNERS = [
  {
    partnerKey: 'iso',
    name: 'ISO 17025',
    logoUrl:
      'https://placehold.co/200x80/e2e8f0/475569/png?text=ISO+17025&font=roboto',
    href: 'https://www.iso.org/ISO-IEC-17025-testing-and-calibration-laboratories.html',
    sortOrder: 0,
  },
  {
    partnerKey: 'gse',
    name: 'Geological Survey Partner',
    logoUrl:
      'https://placehold.co/200x80/e2e8f0/475569/png?text=Geological+Survey&font=roboto',
    sortOrder: 1,
  },
  {
    partnerKey: 'mining-council',
    name: 'Mining Industry Council',
    logoUrl:
      'https://placehold.co/200x80/e2e8f0/475569/png?text=Mining+Council&font=roboto',
    href: 'https://www.example.com/mining-industry-council',
    sortOrder: 2,
  },
  {
    partnerKey: 'university-lab',
    name: 'University Research Network',
    logoUrl:
      'https://placehold.co/200x80/e2e8f0/475569/png?text=University+Research&font=roboto',
    href: 'https://www.example.com/university-research-network',
    sortOrder: 3,
  },
  {
    partnerKey: 'regional-lab',
    name: 'Regional Lab Alliance',
    logoUrl:
      'https://placehold.co/200x80/e2e8f0/475569/png?text=Regional+Lab+Alliance&font=roboto',
    sortOrder: 4,
  },
];

const CONTACT_PAGES = [
  {
    slug: 'main',
    heroTitle: 'Main Laboratory',
    heroSubtitle: 'Contact us for sample submission, method inquiries, and client support.',
    intro:
      'Reach the main laboratory for general inquiries, accreditation certificates, and client account assistance.',
    details: [
      { label: 'Address', value: 'ENGIS Laboratory Campus, Addis Ababa, Ethiopia' },
      { label: 'Phone', value: '+251 11 000 0000' },
      { label: 'Email', value: 'lab@engis.example' },
      { label: 'Hours', value: 'Mon–Fri 08:00–17:00 EAT' },
    ],
  },
  {
    slug: 'collection-points',
    heroTitle: 'Collection Points',
    heroSubtitle: 'Regional sample drop-off locations and reception hours.',
    intro:
      'Use an authorized collection point when submitting samples outside the main laboratory campus.',
    details: [
      { label: 'Northern hub', value: 'Bahir Dar — Mon/Wed/Fri 09:00–14:00' },
      { label: 'Eastern hub', value: 'Dire Dawa — Tue/Thu 09:00–14:00' },
      { label: 'Southern hub', value: 'Hawassa — Mon/Wed 09:00–13:00' },
      { label: 'Coordinator', value: 'logistics@engis.example' },
    ],
  },
  {
    slug: 'careers',
    heroTitle: 'Careers & Tenders',
    heroSubtitle: 'Vacancies, procurement notices, and partnership opportunities.',
    intro:
      'View current vacancies and tender announcements for laboratory supplies, instruments, and services.',
    details: [
      { label: 'HR inquiries', value: 'careers@engis.example' },
      { label: 'Procurement', value: 'tenders@engis.example' },
      { label: 'Open roles', value: 'Lab analyst, QC reviewer, reception specialist' },
      { label: 'Active tenders', value: 'Consumables Q2 2026 — closing Apr 30' },
    ],
  },
];

const SITE_SETTING_DATA = {
  siteName: 'LSIMS',
  footerTagline:
    'Accredited laboratory sample information management for clients and staff.',
  navLinks: [
    { label: 'Home', path: '/' },
    { label: 'About', path: '/about' },
    { label: 'Services', path: '/services' },
    { label: 'News', path: '/news' },
    { label: 'Events', path: '/events' },
    { label: 'Contact', path: '/contact' },
  ],
  footerLinkGroups: [
    {
      title: 'Quick Links',
      links: [
        { label: 'Laboratory Services', href: '/services' },
        { label: 'About', href: '/about' },
        { label: 'News & Updates', href: '/news' },
        { label: 'Events', href: '/events' },
      ],
    },
    {
      title: 'Resources',
      links: [
        { label: 'Accreditation & Standards', href: '/about' },
        { label: 'Test Catalog', href: '/services' },
        { label: 'Sample Submission Guide', href: '/contact' },
        { label: 'Client Portal', href: '/login' },
      ],
    },
    {
      title: 'Contact',
      links: [
        { label: 'Main Laboratory', href: '/contact' },
        { label: 'Collection Points', href: '/contact/collection-points' },
        { label: 'FAQ', href: '/contact' },
        { label: 'Client Support', href: '/contact' },
        { label: 'Careers', href: '/contact/careers' },
        { label: 'Feedback & Complaints', href: '/contact' },
      ],
    },
  ],
  socialLinks: [
    { label: 'LinkedIn', platformId: 'linkedin', href: '#' },
    { label: 'Twitter', platformId: 'twitter', href: '#' },
    { label: 'YouTube', platformId: 'youtube', href: '#' },
  ],
};

const HOME_PAGE_DATA = {
  heroSlides: HERO_SLIDES,
  stats: [
    { label: 'Samples processed', value: '250K+', context: 'Tracked end-to-end in LSIMS' },
    { label: 'Years accredited', value: '15+', context: 'Continuous quality assurance' },
    { label: 'Median turnaround', value: '5 days', context: 'Standard priority workflows' },
    { label: 'Active client orgs', value: '120+', context: 'Mining, industrial, and research' },
  ],
  servicesHeader: { eyebrow: 'What we offer', title: 'Laboratory services' },
  statsHeader: { eyebrow: 'By the numbers', title: 'Trusted by clients across the region' },
  newsHeader: { eyebrow: 'News & Updates', title: 'Latest from the laboratory' },
  eventsHeader: { eyebrow: 'Upcoming activities', title: 'Events & workshops' },
  partnersHeader: {
    eyebrow: 'Accreditation & partners',
    title: 'Working with industry leaders',
  },
  servicesPageHeroTitle: 'Our services',
  servicesPageHeroSubtitle:
    'Accredited testing, sample logistics, and digital results delivery for laboratory clients.',
  newsPageHeroTitle: 'News & updates',
  newsPageHeroSubtitle:
    'Laboratory announcements, accreditation news, and portal updates.',
  eventsPageHeroTitle: 'Events',
  eventsPageHeroSubtitle:
    'Open days, workshops, and seminars for clients and laboratory partners.',
  newsIndexHeader: { eyebrow: 'Latest', title: 'All news' },
  eventsIndexHeader: { eyebrow: 'Events', title: 'All events' },
  servicesMegaMenuEyebrow: 'Laboratory services',
  servicesMegaMenuTitle: 'Accredited testing & digital results',
  servicesMegaMenuDescription:
    'Explore our full catalog of geochemical, physical, and compliance services for laboratory clients.',
  processSteps: [
    {
      title: 'Inquiry',
      description:
        'Submit a job request through the client portal or contact the main laboratory for method guidance.',
    },
    {
      title: 'Sample intake',
      description:
        'Deliver samples to reception or a collection point. Staff register each specimen in LSIMS with chain-of-custody labels.',
    },
    {
      title: 'Analysis',
      description:
        'Samples move through prep and analyst workflows with QC checks at each stage until results are approved.',
    },
    {
      title: 'Report delivery',
      description:
        'Certified results are released digitally through the portal with optional notification to your organization.',
    },
  ],
  valueProps: [
    {
      title: 'Transparency',
      description:
        'Clear pricing, turnaround expectations, and online status tracking throughout the testing lifecycle.',
      iconKey: 'shield-check',
    },
    {
      title: 'Efficiency',
      description:
        'Streamlined intake and digital workflows reduce manual handoffs and reporting delays.',
      iconKey: 'zap',
    },
    {
      title: 'Technical expertise',
      description:
        'Accredited methods, experienced analysts, and documented QC for defensible results.',
      iconKey: 'users',
    },
  ],
  processHeader: { eyebrow: 'How it works', title: 'From inquiry to certified results' },
  valuePropsHeader: { eyebrow: 'Commitment to excellence', title: 'Why clients choose us' },
  featuredBannerTitle: 'Ready to submit your first sample?',
  featuredBannerDescription:
    'Create a client account to register job requests, track samples through the laboratory workflow, and receive results online.',
  featuredBannerCtaLabel: 'Get started',
  featuredBannerCtaHref: '/signup',
};

const ABOUT_PAGE_DATA = {
  heroTitle: 'About us',
  heroSubtitle:
    'An accredited laboratory committed to traceable testing, quality assurance, and digital client service through LSIMS.',
  missionTitle: 'Our mission',
  missionBody:
    'To deliver accredited geochemical and physical testing with full sample traceability, connecting clients and laboratory staff through secure digital workflows—from intake and preparation to certified results.',
  visionTitle: 'Our vision',
  visionBody:
    'To be the trusted reference laboratory for mining, industrial, and research clients across the region, recognized for defensible data, transparent service, and inspection-ready quality management.',
  highlight: {
    label: 'Years accredited',
    value: '15+',
    context:
      'Continuous ISO-aligned quality assurance for geochemical and physical testing scopes.',
  },
  valuesHeader: { eyebrow: 'What we stand for', title: 'Our values' },
  values: [
    {
      title: 'Integrity',
      description:
        'We maintain impartial testing, documented chain-of-custody, and clear communication at every stage of the workflow.',
      iconKey: 'scale',
    },
    {
      title: 'Precision',
      description:
        'Validated methods, calibrated instruments, and structured QC ensure results you can defend in audits and reporting.',
      iconKey: 'target',
    },
    {
      title: 'Accountability',
      description:
        'Audit trails, role-based approvals, and traceable records support accredited operations from bench to certificate.',
      iconKey: 'award',
    },
    {
      title: 'Client partnership',
      description:
        'We work alongside your teams with predictable turnaround, online status tracking, and responsive support.',
      iconKey: 'handshake',
    },
  ],
  milestonesHeader: { eyebrow: 'Our journey', title: 'Milestones' },
  milestones: [
    {
      year: '2010',
      title: 'Laboratory established',
      description:
        'ENGIS laboratory operations begin with a focus on geochemical analysis for exploration and industrial clients.',
    },
    {
      year: '2015',
      title: 'Initial accreditation',
      description:
        'Formal accreditation achieved for core geochemical and physical testing methods under an ISO-aligned quality system.',
    },
    {
      year: '2020',
      title: 'Digital client portal',
      description:
        'LSIMS client portal launches, enabling online job requests, sample tracking, and digital delivery of certified results.',
    },
    {
      year: '2024',
      title: 'Expanded service scope',
      description:
        'Additional prep workflows, compliance reporting, and regional collection points extend reach to more client organizations.',
    },
    {
      year: '2026',
      title: 'Accreditation renewed',
      description:
        'Quality management system recertified for geochemical analysis, physical testing, and associated laboratory processes.',
    },
  ],
  accreditationHeader: { eyebrow: 'Quality assurance', title: 'Accreditation & compliance' },
  accreditation: [
    {
      title: 'ISO 17025 scope',
      description:
        'Accredited testing covers geochemical analysis, physical properties, and supporting quality management processes.',
      iconKey: 'shield-check',
    },
    {
      title: 'Structured QC workflows',
      description:
        'Control samples, review desks, and documented sign-off ensure results meet method and accreditation requirements.',
      iconKey: 'flask-conical',
    },
    {
      title: 'Audit-ready documentation',
      description:
        'Electronic records, instrument logs, and traceability reports support inspections and client due diligence.',
      iconKey: 'file-check',
    },
  ],
  partnersHeader: { eyebrow: 'Collaboration', title: 'Our partners & accreditors' },
};

module.exports = {
  paragraphBlock,
  blocksFromParagraphs,
  SITE_SETTING_DATA,
  HOME_PAGE_DATA,
  ABOUT_PAGE_DATA,
  SERVICES,
  NEWS_ARTICLES,
  EVENTS,
  PARTNERS,
  CONTACT_PAGES,
};
