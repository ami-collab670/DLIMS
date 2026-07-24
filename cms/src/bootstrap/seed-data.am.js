const { blocksFromParagraphs } = require('./seed-data');

const HERO_SLIDES = [
  {
    slideKey: 'accredited-testing',
    title: 'ሙሉ የናሙና ትራስያብሊቲ ጋር የተረጋገጠ የቤተ-ሙከራ ምርመራ',
    subtitle:
      'ከመቀበል እስከ የተረጋገጠ ውጤት — LSIMS ደንበኞችንና ሰራተኞችን በደህንነት ለጂኦኬሚካል ትንተና፣ የቁሳቁስ ምርመራ እና የኮምፕላይንስ ሪፖርት ያገናኛል።',
    imageUrl: '/hero/slide-1.jpg',
    imageAlt: 'በቤተ-ሙከራ ውስጥ ናሙና የሚተኩ ቴክኒሻኖች',
    gradientFallbackClass: 'bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950',
    primaryCtaLabel: 'የደንበኛ መግቢያ',
    primaryCtaHref: '/login',
    secondaryCtaLabel: 'አገልግሎቶቻችን',
    secondaryCtaHref: '/services',
  },
  {
    slideKey: 'client-portal',
    title: 'ናሙናዎን ይከታተሉ፣ ውጤቶችንም በመስመር ላይ ያውርዱ',
    subtitle:
      'የስራ ጥያቄ ያስገቡ፣ ሂደቱን በቀጥታ ይከታተሉ እና የተረጋገጡ ሪፖርቶችን በደህንነት በደንበኛ መድረክ ይቀበሉ።',
    imageUrl: '/hero/slide-2.jpg',
    imageAlt: 'ደንበኛ በኮምፒዩተር የቤተ-ሙከራ ውጤቶችን የሚመለከት',
    gradientFallbackClass: 'bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900',
    primaryCtaLabel: 'ወደ ፖርታል ግቡ',
    primaryCtaHref: '/login',
    secondaryCtaLabel: 'አገልግሎቶችን ይመልከቱ',
    secondaryCtaHref: '/services',
  },
  {
    slideKey: 'quality-compliance',
    title: 'ለተረጋገጠ የቤተ-ሙከራ ክወና የተዘጋጀ',
    subtitle:
      'የQC ግምገማ፣ የኦዲት ትራስ እና የኮምፕላይንስ ሪፖርት — ከዝግጽ መጋዘን እስከ ሰርተፊኬት ተገቢ ለመመርመር ዝግጁ ክወና።',
    imageUrl: '/hero/slide-3.jpg',
    imageAlt: 'በተረጋገጠ ቤተ-ሙከራ ውስጥ የጥራት ቁጥጥር ግምገማ',
    gradientFallbackClass: 'bg-gradient-to-br from-slate-900 via-teal-950 to-slate-900',
    primaryCtaLabel: 'ያግኙን',
    primaryCtaHref: '/contact',
    secondaryCtaLabel: 'የቅርብ ጊዜ ዜና',
    secondaryCtaHref: '/news',
  },
];

const SERVICES = [
  {
    slug: 'geochemical-analysis',
    title: 'ጂኦኬሚካል ትንተና',
    description:
      'የክፍል-ኤሌመንት እና የጅምላ ትርክብ ትንተና — በተረጋገጡ ዘዴዎች እና በሰነድ የተመዘገበ የናሙና ስርጭት ሰንሰል።',
    longDescription:
      'የጂኦኬሚካል ቤተ-ሙከራችን ለማሳሰቢያ፣ ለማዕድን እና ለአካባቢ ክትትል ፕሮግራሞች የክፍል-ኤሌመንት እና የጅምላ ትርክብ ትንተና ይሰጣል። እያንዳንዱ ናሙና በመቀበል ወቅት በLSIMS ይመዘገባል፣ ልዩ መለያ ይሰጠዋል እና ከዝግጽት፣ ትንተና፣ QC ግምገማ እስከ ሪፖርት ማውጣት ድረስ ይከታተላል።',
    highlights: [
      'ICP-MS እና XRF ዘዴዎች — በተረጋገጡ ሂደቶች',
      'ከመቀበል እስከ ማህደር — የሰነድ የናሙና ስርጭት',
      'የዲጂታል ሰርተፊኬቶች በደንበኛ ፖርታል',
    ],
    iconKey: 'microscope',
    seoDescription: 'ሙሉ የናሙና ትራስያብሊቲ ጋር የተረጋገጠ ጂኦኬሚካል ትንተና።',
    sortOrder: 0,
  },
  {
    slug: 'physical-testing',
    title: 'የቁሳቁስ ምርመራ',
    description:
      'ክፍቶ፣ ጥንካሬ እና የቁሳቁስ ባህሪ መለኪያ — ለደንበኛ መስፈርቶች እና መመዘኛዎች የተስማማ።',
    longDescription:
      'የቁሳቁስ ምርመራ ለግንባታ፣ ለኢንዱስትሪያል ማይነሮች እና ለሜታሎርጂካል ናሙናዎች የቁሳቁስ መለኪያ ይደግፋል። ቡድናችን በLSIMS ሙሉ ትራስያብሊቲ ጋር መደበኛ እና ለደንበኛ የተሰጡ ዘዴዎችን ይተገብራል።',
    highlights: [
      'ክፍቶ፣ ጥንካሬ እና የቅንጣት መጠን ስርጭት',
      'ለደንበኛ መስፈርት የተስማማ ብጁ ዘዴ',
      'ውጤት ከመውጣቱ በፊት የተዋሃደ QC ፍተሻ',
    ],
    iconKey: 'flask-conical',
    seoDescription: 'ለኢንዱስትሪ እና ለምርምር ደንበኞች የቁሳቁስ ባህሪ ምርመራ።',
    sortOrder: 1,
  },
  {
    slug: 'sample-logistics',
    title: 'የናሙና ሎጂስቲክስ',
    description:
      'መቀበል፣ መለያ ማድረግ፣ ማስተላለፍ እና ማከማቻ — ከመቀበያ እስከ ዝግጽት እና ማህደር።',
    longDescription:
      'የናሙና ሎጂስቲክስ እያንዳንዱ ናሙና በቤተ-ሙከራ SOP መሠረት እንዲቀበል፣ እንዲለያይ፣ እንዲሄድ እና እንዲቀመጥ ያረጋግጣል። የመቀበያ ሰራተኞች ስራዎችን በLSIMS ይመዘግባሉ፣ ደንበኞችም ሂደቱን በመስመር ላይ ይከታተላሉ።',
    highlights: [
      'በመቀበያ ባርኮድ እና QR መለያ',
      'ዝግጽት፣ ተንታኝ እና ማህደር — በአንድ ስርዓት',
      'የማከማቻ ቦታ እና የማቆየት ጊዜ መከታተያ',
    ],
    iconKey: 'truck',
    seoDescription: 'ከመጀመሪያ እስከ መጨረሻ የናሙና ሎጂስቲክስ እና የስርጭት ሰንሰል መከታተያ።',
    sortOrder: 2,
  },
  {
    slug: 'results-delivery',
    title: 'የውጤት ማስረከብ',
    description:
      'ደህንነቱ የተጠበቀ ዲጂታል ሪፖርት፣ ማሳወቂያ እና ሊሆኑ የሚችሉ ሰርተፊኬቶች — በደንበኛ ፖርታል።',
    longDescription:
      'QC ውጤቶችን ከፀደቀ በኋላ ደንበኞች ማሳወቂያ ይቀበላሉ እና ሰርተፊኬቶችን ከፖርታል ሊያውሱ ይችላሉ። ታሪካዊ ውጤቶች በስራ፣ በናሙና እና በቀን መሠረት ሊፈለጉ ይችላሉ።',
    highlights: [
      'ስራ ሲጠናቀቅ በኢሜይል እና በመተግበሪያ ማሳወቂያ',
      'PDF ሰርተፊኬት ማውረድ',
      'በደንበኛ መድረክ ሙሉ የውጤት ታሪክ',
    ],
    iconKey: 'globe',
    seoDescription: 'የተረጋገጡ የቤተ-ሙከራ ውጤቶችን በደህንነት ዲጂታል ማስረከብ።',
    sortOrder: 3,
  },
  {
    slug: 'qc-compliance',
    title: 'QC እና ኮምፕላይንስ',
    description:
      'ውስጣዊ QC ግምገማ፣ የኦዲት ትራስ እና የኮምፕላይንስ ስራ ፍሰት — ለተረጋገጠ የቤተ-ሙከራ ክወና።',
    longDescription:
      'የጥራት ቁጥጥር እና ኮምፕላይንስ ስራ ፍሰቶች በLSIMS መሠረት የተዋሃዱ ናቸው። የተንታኝ ውጤቶች በQC ግምገማ መጋዘን ያልፋሉ፣ የተሰደዱ ሙከራዎች ይከታተላሉ፣ የኦዲት ትራስም ለምስክር ወረቀት ግምገማ ይደግፋል።',
    highlights: [
      'ለQC ግምገማ እና ለተቀባይነት-ያልተሰጣቸው ጥያቄዎች ልዩ መስመሮች',
      'ለዘዴ እና ለመሣሪያ ለውጥ የኦዲት ትራስ',
      'ለምስክር ወረቀት አካላት የኮምፕላይንስ ሪፖርት',
    ],
    iconKey: 'shield-check',
    seoDescription: 'ለተረጋገጠ የቤተ-ሙከራ ክወና QC እና ኮምፕላይንስ ስራ ፍሰቶች።',
    sortOrder: 4,
  },
  {
    slug: 'client-portal',
    title: 'የደንበኛ ፖርታል',
    description:
      'ጥያቄ ማስገባት፣ የናሙና ሂደት መከታተያ፣ መጠየቂያ አስተዳደር እና ቅሬታ — በአንድ መድረክ።',
    longDescription:
      'የደንበኛ ፖርታል ለውጭ ድርጅቶች ዋናው መገናኛ ነው። የስራ ጥያቄ ይመዝግቡ፣ ማናፌስት ይስቀሉ፣ ናሙናዎችን ይከታተሉ፣ መጠየቂያዎችን ይመልከቱ እና ቅሬታ ያስገቡ — ቤተ-ሙከራውን ሳይደውሉ።',
    highlights: [
      'የስራ ጥያቄ በመስመር ማስገባት',
      'በቀጥታ የናሙና ሁኔታ መከታተያ',
      'ቅሬታ እና የድጋፍ ጥያቄ',
    ],
    iconKey: 'clipboard-check',
    seoDescription: 'ለስራ ጥያቄ፣ ለመከታተያ እና ለውጤት — የደንበኛ ፖርታል።',
    sortOrder: 5,
  },
];

const NEWS_ARTICLES = [
  {
    slug: 'accreditation-renewal-2026',
    title: 'የቤተ-ሙከራ ምስክር ወረቀት ለ2026 አድሷል',
    description:
      'ISO መሠረት የተስማማ የጥራት አስተዳደር ስርዓታችን እንደገና ተረጋግጧል — ጂኦኬሚካል እና የቁሳቁስ ምርመራን ይካብል።',
    publishedDate: 'ጃንዩ 2026',
    category: 'ምስክር ወረቀት',
    body: blocksFromParagraphs([
      'ቤተ-ሙከራው ለ2026 የምስክር ወረቀቱን በተሳካ ሁኔታ አድሶ አረጋግጧል — ጂኦኬሚካል ትንተና፣ የቁሳቁስ ምርመራ እና ተያያዥ የጥራት አስተዳደር ሂደቶችን ይካብል።',
      'ግምገማው የLSIMS የኦዲት ትራስ፣ የQC ስራ ፍሰት እና የሰነድ ቁጥጥር ለምርመራ ቤተ-ሙከራዎች ዓለም አቀፍ መመዘኛ መሠረት እንደሚያሟላ አረጋግጧል።',
      'ደንበኞች የወሰን ሰርተፊኬቶችን ከደንበኛ ፖርታል ወይም ከዋናው ቤተ-ሙከራ ጽ/ቤት በመጠየቅ ሊያገኙ ይችላሉ።',
    ]),
    seoDescription: 'የቤተ-ሙከራ ምስክር ወረቀት ለ2026 አድሷል።',
  },
  {
    slug: 'bulk-sample-uploads',
    title: 'የደንበኛ ፖርታል ብዙ ናሙናዎችን በአንድ ጊዜ ማስገባት ይችላል',
    description:
      'የተመዘገቡ ደንበኞች ብዙ ናሙናዎችን ሲያስገቡ ማናፌስት እና የድጋፍ ሰነዶችን ሊያያዙ ይችላሉ።',
    publishedDate: 'ዲሴም 2025',
    category: 'የምርት ማሻሻያ',
    body: blocksFromParagraphs([
      'ደንበኞች አሁን ብዙ ናሙናዎችን የያዙ የስራ ጥያቄዎችን በፖርታል ሲፈጥሩ CSV ማናፌስት እና የድጋፍ ሰነዶችን ሊያስገቡ ይችላሉ።',
      'የመቀበያ መመሪያው ከመላክ በፊት የናሙና መረጃን ይፈትሻል — ከመቀበያ ሰራተኞች ጋር ድጋግ ማለትን ይቀንሳል።',
      'አሁን ያሉ ደንበኞች የናሙና ማስገቢያ መመሪያ በመጠቀም የማስገባት መሠረታቸውን መዘምን ይገባቸዋል — መመሪያው በአግኙን ገጽ ላይ አለ።',
    ]),
    seoDescription: 'በደንበኛ ፖርታል ብዙ ናሙናዎችን በአንድ ጊዜ ማስገባት አሁን ይቻላል።',
  },
  {
    slug: 'urgent-turnaround-targets',
    title: 'ለአስቸኳይ ጥያቄዎች የመዘጋጀት ጊዜ ተዘምኗል',
    description:
      'ለጊዜ የሚጠበቅባቸው የማሳሰቢያ ጥራዎች እና የኮምፕላይንስ መደበኛ ጊዜዎች — ቅድሚያ መቀበያ መስመር አለ።',
    publishedDate: 'ኖቬም 2025',
    category: 'ክወና',
    body: blocksFromParagraphs([
      'አስቸኳይ ጥያቄዎች አሁን ቅድሚያ መቀበያ መስመር ይከተላሉ፤ ዝግጽ መጋዘንና ተንታኝ መደብ በፍጥነት ይከናወናል።',
      'መደበኛው የመካከለኛ መዘጋጀት ጊዜ አምስት የስራ ቀናት ነው፤ አስቸኳይ ስራ ፍሰት ዘዴው ከፈቀደ በ72 ሰዓት ውስጥ ለማጠናቀቅ ይሞክራል።',
      'ለትልቅ ጥራዎች ወይም ለደንብ መደበኛ ጊዜዎች ቅድሚያ መስጠት ለመወያየት የደንበኛ ድጋፍን ያግኙ።',
    ]),
    seoDescription: 'ለአስቸኳይ የቤተ-ሙከራ ጥያቄዎች የመዘጋጀት ጊዜ ተዘምኗል።',
  },
];

const EVENTS = [
  {
    slug: 'laboratory-open-day-2026',
    title: 'የቤተ-ሙከራ ክፍት ቀን 2026',
    description:
      'መሣሪያዎቻችንን ይቃኙ፣ ተንታኞችን ይገናኙ፣ ናሙና ከመቀበል እስከ የተረጋገጠ ውጤት እንዴት እንደሚንቀሳቀስ ይረዱ።',
    date: 'ማርች 15, 2026',
    time: '09:00 – 16:00',
    location: 'ዋና ቤተ-ሙከራ፣ አዲስ አበባ',
    eventStatus: 'ቀጣይ',
    body: blocksFromParagraphs([
      'የመቀበያ፣ የዝግጽ መጋዘን፣ የትንተና መሣሪያዎች እና የQC ግምገማ መጋዘን — በመሪ ጉብኝት ይቀላቀሉን።',
      'ከ09:00 ጀምሮ በየሰዓት ክፍለ ጊዜዎች ይካሄዳሉ። ከአምስት ሰዎች በላይ ለቡድኖች ቅድመ-ምዝገባ ይመከራል።',
      'ለመመዝገብ ወይም ለተደራሽነት መገልገያ ለመጠየቅ የደንበኛ ድጋፍን በኢሜይል ያግኙ።',
    ]),
  },
  {
    slug: 'client-portal-workshop',
    title: 'የደንበኛ ፖርታል ስልጠና',
    description:
      'የስራ ጥያቄ ማስገባት፣ ናሙና መከታተያ እና ውጤት ማውረድ — በተግባር ላይ።',
    date: 'ኤፕሪል 8, 2026',
    time: '14:00 – 17:00',
    location: 'በመስመር (ቪዲዮ ኮንፈረንስ)',
    eventStatus: 'ቀጣይ',
    body: blocksFromParagraphs([
      'ይህ ስልጠና አዲስ የደንበኛ ተጠሪዎችን ስለመለያ መፍጠር፣ ስለስራ መስጠት እና ስለውጤት ማግኘት ይመራል።',
      'ተሳታፊዎች ከስልጠናው በፊት የተመዘገበ ፖርታል መለያ ሊኖራቸው ይገባል።',
      'ቁሳቁሶችና ቀረጻ ለተመዘገቡ ተሳታፊዎች ከዝግጅቱ በኋላ ይላካል።',
    ]),
  },
  {
    slug: 'qc-best-practices-seminar',
    title: 'የQC ጥሩ ልምድ ሴሚናር',
    description:
      'ሰራተኞችና አጋር ቤተ-ሙከራዎች — ውስጣዊ QC ዲዛይን፣ የቁጥጥር ገበታዎች እና ለምስክር ወረቀት መዘጋጀት።',
    date: 'ፌብሩ 20, 2026',
    time: '10:00 – 12:30',
    location: 'ዋና ቤተ-ሙከራ፣ የስልጠና ክፍል B',
    eventStatus: 'ተጠናቋል',
    body: blocksFromParagraphs([
      'ሴሚናሩ የQC ናሙና መግቢያ መጠን፣ የቁጥጥር ገበታ ትርጉም እና ከምስክር ወረቀት ግምገማዎች የተለመዱ ግኝቶችን ያዩ።',
      'ስላይዶች እና የማጣቀሻ SOPዎች ለተመዘገቡ ተሳታፊዎች በጥያቄ ሊሰጡ ይችላሉ።',
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
    name: 'የጂኦሎጂ ምርምር አጋር',
    logoUrl:
      'https://placehold.co/200x80/e2e8f0/475569/png?text=Geological+Survey&font=roboto',
    sortOrder: 1,
  },
  {
    partnerKey: 'mining-council',
    name: 'የማዕድን ኢንዱስትሪ ም/ማ',
    logoUrl:
      'https://placehold.co/200x80/e2e8f0/475569/png?text=Mining+Council&font=roboto',
    href: 'https://www.example.com/mining-industry-council',
    sortOrder: 2,
  },
  {
    partnerKey: 'university-lab',
    name: 'የዩኒቨርሲቲ ምርምር መረብ',
    logoUrl:
      'https://placehold.co/200x80/e2e8f0/475569/png?text=University+Research&font=roboto',
    href: 'https://www.example.com/university-research-network',
    sortOrder: 3,
  },
  {
    partnerKey: 'regional-lab',
    name: 'የክልል ቤተ-ሙከራ ጥምረት',
    logoUrl:
      'https://placehold.co/200x80/e2e8f0/475569/png?text=Regional+Lab+Alliance&font=roboto',
    sortOrder: 4,
  },
];

const CONTACT_PAGES = [
  {
    slug: 'main',
    heroTitle: 'ዋና ቤተ-ሙከራ',
    heroSubtitle: 'ለናሙና ማስረከብ፣ ለዘዴ ጥያቄ እና ለደንበኛ ድጋፍ ያግኙን።',
    intro:
      'ለአጠቃላይ ጥያቄ፣ ለምስክር ወረቀት ሰርተፊኬት እና ለደንበኛ መለያ ድጋፍ ዋናውን ቤተ-ሙከራ ያግኙ።',
    details: [
      { label: 'አድራሻ', value: 'ENGIS Laboratory Campus, Addis Ababa, Ethiopia' },
      { label: 'ስልክ', value: '+251 11 000 0000' },
      { label: 'ኢሜይል', value: 'lab@engis.example' },
      { label: 'ሰዓት', value: 'Mon–Fri 08:00–17:00 EAT' },
    ],
  },
  {
    slug: 'collection-points',
    heroTitle: 'የናሙና መላኪያ ቦታዎች',
    heroSubtitle: 'በክልሎች የናሙና መላኪያ ቦታዎች እና የመቀበያ ሰዓት።',
    intro:
      'ከዋናው ቤተ-ሙከራ ውጭ ናሙና ሲያስረክቡ የተፈቀደ መላኪያ ቦታ ይጠቀሙ።',
    details: [
      { label: 'ሰሜን ማእክል', value: 'Bahir Dar — Mon/Wed/Fri 09:00–14:00' },
      { label: 'ምስራቅ ማእክል', value: 'Dire Dawa — Tue/Thu 09:00–14:00' },
      { label: 'ደቡብ ማእክል', value: 'Hawassa — Mon/Wed 09:00–13:00' },
      { label: 'አስተባባሪ', value: 'logistics@engis.example' },
    ],
  },
  {
    slug: 'careers',
    heroTitle: 'ስራ እና ጨረታ',
    heroSubtitle: 'ክፍት የስራ ቦታ፣ የግዥ ማስታወቂያ እና የአጋርነት እድሎች።',
    intro:
      'ለቤተ-ሙከራ ጥራዎች፣ መሣሪያዎች እና አገልግሎቶች — ክፍት የስራ ቦታዎችን እና ጨረታ ማስታወቂያዎችን ይመልከቱ።',
    details: [
      { label: 'የሰው ሀብት ጥያቄ', value: 'careers@engis.example' },
      { label: 'ግዥ', value: 'tenders@engis.example' },
      { label: 'ክፍት ቦታዎች', value: 'Lab analyst, QC reviewer, reception specialist' },
      { label: 'ንቁ ጨረታዎች', value: 'Consumables Q2 2026 — closing Apr 30' },
    ],
  },
];

const SITE_SETTING_DATA = {
  siteName: 'LSIMS',
  footerTagline:
    'ለደንበኞችና ለሰራተኞች የተረጋገጠ የቤተ-ሙከራ ናሙና መረጃ አስተዳደር።',
  navLinks: [
    { label: 'መነሻ', path: '/' },
    { label: 'ስለ እኛ', path: '/about' },
    { label: 'አገልግሎቶች', path: '/services' },
    { label: 'ዜና', path: '/news' },
    { label: 'ዝግጅቶች', path: '/events' },
    { label: 'አግኙን', path: '/contact' },
  ],
  footerLinkGroups: [
    {
      title: 'ፈጣን አገናኞች',
      links: [
        { label: 'የቤተ-ሙከራ አገልግሎቶች', href: '/services' },
        { label: 'ስለ እኛ', href: '/about' },
        { label: 'ዜና እና ማሻሻያ', href: '/news' },
        { label: 'ዝግጅቶች', href: '/events' },
      ],
    },
    {
      title: 'መረጃ',
      links: [
        { label: 'ምስክር ወረቀት እና መመዘኛ', href: '/about' },
        { label: 'የምርመራ ዝርዝር', href: '/services' },
        { label: 'የናሙና ማስገቢያ መመሪያ', href: '/contact' },
        { label: 'የደንበኛ ፖርታል', href: '/login' },
      ],
    },
    {
      title: 'አግኙን',
      links: [
        { label: 'ዋና ቤተ-ሙከራ', href: '/contact' },
        { label: 'መላኪያ ቦታዎች', href: '/contact/collection-points' },
        { label: 'ተደጋጋሚ ጥያቄዎች', href: '/contact' },
        { label: 'የደንበኛ ድጋፍ', href: '/contact' },
        { label: 'ስራ እና ጨረታ', href: '/contact/careers' },
        { label: 'ግብረመልስ እና ቅሬታ', href: '/contact' },
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
    { label: 'የተሰሩ ናሙናዎች', value: '250K+', context: 'በLSIMS ከመጀመሪያ እስከ መጨረሻ' },
    { label: 'የምስክር ወረቀት ዓመታት', value: '15+', context: 'ቀጣይ የጥራት ዋስትና' },
    { label: 'መካከለኛ መዘጋጀት', value: '5 days', context: 'መደበኛ ቅድሚያ ስራ ፍሰት' },
    { label: 'ንቁ ደንበኛ ድርጅቶች', value: '120+', context: 'ማዕድን፣ ኢንዱስትሪ እና ምርምር' },
  ],
  servicesHeader: { eyebrow: 'ምን እንሰጣለን', title: 'የቤተ-ሙከራ አገልግሎቶች' },
  statsHeader: { eyebrow: 'በቁጥር', title: 'በክልሉ ደንበኞች የተረጋገጠ' },
  newsHeader: { eyebrow: 'ዜና እና ማሻሻያ', title: 'ከቤተ-ሙከራ የቅርብ ጊዜ' },
  eventsHeader: { eyebrow: 'ቀጣይ እንቅስቃሴ', title: 'ዝግጅቶች እና ስልጠና' },
  partnersHeader: {
    eyebrow: 'ምስክር ወረቀት እና አጋሮች',
    title: 'ከኢንዱስትሪ መሪዎች ጋር እንሰራለን',
  },
  servicesPageHeroTitle: 'አገልግሎቶቻችን',
  servicesPageHeroSubtitle:
    'ለቤተ-ሙከራ ደንበኞች — የተረጋገጠ ምርመራ፣ የናሙና ሎጂስቲክስ እና ዲጂታል ውጤት ማስረከብ።',
  newsPageHeroTitle: 'ዜና እና ማሻሻያ',
  newsPageHeroSubtitle:
    'የቤተ-ሙከራ ማስታወቂያ፣ የምስክር ወረቀት ዜና እና የፖርታል ማሻሻያ።',
  eventsPageHeroTitle: 'ዝግጅቶች',
  eventsPageHeroSubtitle:
    'ለደንበኞችና ለቤተ-ሙከራ አጋሮች — ክፍት ቀን፣ ስልጠና እና ሴሚናር።',
  newsIndexHeader: { eyebrow: 'የቅርብ ጊዜ', title: 'ሁሉም ዜና' },
  eventsIndexHeader: { eyebrow: 'ዝግጅቶች', title: 'ሁሉም ዝግጅቶች' },
  servicesMegaMenuEyebrow: 'የቤተ-ሙከራ አገልግሎቶች',
  servicesMegaMenuTitle: 'የተረጋገጠ ምርመራ እና ዲጂታል ውጤት',
  servicesMegaMenuDescription:
    'ለቤተ-ሙከራ ደንበኞች — ጂኦኬሚካል፣ የቁሳቁስ እና ኮምፕላይንስ አገልግሎቶችን በሙሉ ይመልከቱ።',
  processSteps: [
    {
      title: 'ጥያቄ',
      description:
        'በደንበኛ ፖርታል የስራ ጥያቄ ያስገቡ ወይም ለዘዴ መመሪያ ዋናውን ቤተ-ሙከራ ያግኙ።',
    },
    {
      title: 'ናሙና መቀበል',
      description:
        'ናሙና ወደ መቀበያ ወይም መላኪያ ቦታ ያስረክቡ። ሰራተኞች እያንዳንዱን በLSIMS ከስርጭት መለያ ጋር ይመዘግባሉ።',
    },
    {
      title: 'ትንተና',
      description:
        'ናሙና በዝግጽት እና በተንታኝ ስራ ፍሰት ይሄዳል — በእያንዳንዱ ደረጃ QC ፍተሻ እስከ ውጤት መፀደቅ ድረስ።',
    },
    {
      title: 'ሪፖርት ማስረከብ',
      description:
        'የተረጋገጡ ውጤቶች በፖርታል ዲጂታል ይወጣሉ — ለድርጅትዎ ማሳወቂያም ሊሰጥ ይችላል።',
    },
  ],
  valueProps: [
    {
      title: 'ግልጽነት',
      description:
        'ግልጽ ዋጋ፣ የመዘጋጀት ጊዜ ግምት እና በመስመር የሁኔታ መከታተያ — በምርመራ ሂደት ሁሉ።',
      iconKey: 'shield-check',
    },
    {
      title: 'ቅልጥፍና',
      description:
        'የተሻለ መቀበያ እና ዲጂታል ስራ ፍሰት — የእጅ ማስተላለፍንና የሪፖርት መዘግየትን ይቀንሳል።',
      iconKey: 'zap',
    },
    {
      title: 'ቴክኒካል ብቃት',
      description:
        'የተረጋገጡ ዘዴዎች፣ ባለሞያ ተንታኞች እና ለተጠራቀመ ውጤት የሰነድ QC።',
      iconKey: 'users',
    },
  ],
  processHeader: { eyebrow: 'እንዴት እንሰራለን', title: 'ከጥያቄ እስከ የተረጋገጠ ውጤት' },
  valuePropsHeader: { eyebrow: 'ለእውቀት ቁርጠኝነት', title: 'ደንበኞች ለምን ይመርጡናል' },
  featuredBannerTitle: 'የመጀመሪያ ናሙናዎን ለመላክ ዝግጁ ነዎት?',
  featuredBannerDescription:
    'የደንበኛ መለያ ይፍጠሩ — የስራ ጥያቄ ይመዝግቡ፣ ናሙና በቤተ-ሙከራ ሂደት ይከታተሉ እና ውጤት በመስመር ይቀበሉ።',
  featuredBannerCtaLabel: 'ይጀምሩ',
  featuredBannerCtaHref: '/signup',
};

const ABOUT_PAGE_DATA = {
  heroTitle: 'ስለ እኛ',
  heroSubtitle:
    'የተረጋገጠ ቤተ-ሙከራ — የሚከታተል ምርመራ፣ ጥራት ዋስትና እና በLSIMS ዲጂታል የደንበኛ አገልግሎት።',
  missionTitle: 'ተልዕኳችን',
  missionBody:
    'የተረጋገጠ ጂኦኬሚካል እና የቁሳቁስ ምርመራ — ሙሉ የናሙና ትራስያብሊቲ ጋር፣ ደንበኞችንና ሰራተኞችን በደህንነት ከመቀበል እና ዝግጽት እስከ የተረጋገጠ ውጤት ድረስ።',
  visionTitle: 'ራዕያችን',
  visionBody:
    'በክልሉ ለማዕድን፣ ኢንዱስትሪ እና ምርምር ደንበኞች የታመነ የማጣቀሻ ቤተ-ሙከራ መሆን — የሚከራከር ውሰት፣ ግልጽ አገልግሎት እና ለምርመራ ዝግጁ ጥራት አስተዳደር።',
  highlight: {
    label: 'የምስክር ወረቀት ዓመታት',
    value: '15+',
    context:
      'ለጂኦኬሚካል እና የቁሳቁስ ምርመራ — ቀጣይ ISO-aligned ጥራት ዋስትና።',
  },
  valuesHeader: { eyebrow: 'ምን እናምናለን', title: 'የእኛ እሴቶች' },
  values: [
    {
      title: 'ሐብነት',
      description:
        'ግልጽ ያልተደረገበት ምርመራ፣ የሰነድ የናሙና ስርጭት እና ግልጽ ግንኙነት — በስራ ፍሰት ሁሉ።',
      iconKey: 'scale',
    },
    {
      title: 'ትክክለኛነት',
      description:
        'የተረጋገጡ ዘዴዎች፣ የተሳካ መሣሪያዎች እና የተዋቀረ QC — በግምገማ እና በሪፖርት የሚከራከር ውጤት።',
      iconKey: 'target',
    },
    {
      title: 'ተጠያቂነት',
      description:
        'የኦዲት ትራስ፣ በሚና የተመሠረተ ፍቃድ እና የሚከታተል መዝገቦች — ከመደክ እስከ ሰርተፊኬት።',
      iconKey: 'award',
    },
    {
      title: 'የደንበኛ አጋርነት',
      description:
        'ተገቢ የመዘጋጀት ጊዜ፣ በመስመር መከታተያ እና ፈጣን ድጋፍ — ከቡድንዎ ጋር።',
      iconKey: 'handshake',
    },
  ],
  milestonesHeader: { eyebrow: 'ጉዞያችን', title: 'ወሳኝ ጊዜያት' },
  milestones: [
    {
      year: '2010',
      title: 'ቤተ-ሙከራ ተመሠረተ',
      description:
        'ENGIS የቤተ-ሙከራ ክወና — ለማሳሰቢያ እና ኢንዱስትሪ ደንበኞች ጂኦኬሚካል ትንተና።',
    },
    {
      year: '2015',
      title: 'የመጀመሪያ ምስክር ወረቀት',
      description:
        'ISO-aligned ጥራት ስርዓት — ለዋና ጂኦኬሚካል እና የቁሳቁስ ምርመራ ዘዴዎች መደበኛ ምስክር ወረቀት።',
    },
    {
      year: '2020',
      title: 'ዲጂታል የደንበኛ ፖርታል',
      description:
        'LSIMS ፖርታል — በመስመር ስራ ጥያቄ፣ ናሙና መከታተያ እና ዲጂታል ሰርተፊኬት ማስረከብ።',
    },
    {
      year: '2024',
      title: 'የአገልግሎት ወሰን ሰፋ',
      description:
        'ተጨማሪ ዝግጽት ስራ ፍሰት፣ ኮምፕላይንስ ሪፖርት እና ክልላዊ መላኪያ ቦታዎች — ለተጨማሪ ደንበኞች።',
    },
    {
      year: '2026',
      title: 'ምስክር ወረቀት አድሷል',
      description:
        'ጥራት አስተዳደር ስርዓት — ጂኦኬሚካል ትንተና፣ የቁሳቁስ ምርመራ እና ተያያዥ ሂደቶች እንደገና ተረጋግጧል።',
    },
  ],
  accreditationHeader: { eyebrow: 'ጥራት ዋስትና', title: 'ምስክር ወረቀት እና ኮምፕላይንስ' },
  accreditation: [
    {
      title: 'ISO 17025 ወሰን',
      description:
        'የተረጋገጠ ምርመራ — ጂኦኬሚካል ትንተና፣ የቁሳቁስ ባህሪ እና ተያያዥ ጥራት አስተዳደር ሂደቶች።',
      iconKey: 'shield-check',
    },
    {
      title: 'የተዋቀረ QC ስራ ፍሰት',
      description:
        'የቁጥጥር ናሙናዎች፣ የግምገማ መጋዘን እና የሰነድ ፊርማ — ውጤት ዘዴ እና ምስክር ወረቀት መስፈርት እንዲያሟላ።',
      iconKey: 'flask-conical',
    },
    {
      title: 'ለግምገማ ዝግጁ ሰነድ',
      description:
        'ኤሌክትሮኒክ መዝገቦች፣ መሣሪያ ምዝግብ ማስታወሻ እና የክትትል ሪፖርት — ለግምገማ እና የደንበኛ መመዝገቢያ።',
      iconKey: 'file-check',
    },
  ],
  partnersHeader: { eyebrow: 'ትብብር', title: 'አጋሮቻችን እና ምስክር ወረቀት አካላት' },
};

const AUTH_PAGE_DATA = {
  loginTitle: 'ግባ',
  loginDescription: 'የ LSIMS መለያ ኢሜይልዎን እና የይለፍ ቃልዎን ይጠቀሙ።',
  loginEmailLabel: 'ኢሜይል',
  loginPasswordLabel: 'የይለፍ ቃል',
  loginForgotPasswordLabel: 'የይለፍ ቃል ረሱ?',
  loginSubmitLabel: 'ግባ',
  loginSubmittingLabel: 'በመግባት ላይ…',
  loginFooterPrompt: 'መለያ የለዎትም?',
  loginFooterLinkLabel: 'መለያ ይፍጠሩ',
  loginEmailPlaceholder: 'you@organization.com',
  signupTitle: 'መለያ ይፍጠሩ',
  signupDescription: 'ለ LSIMS የውጭ ደንበኛ ምዝገባ።',
  signupAccountSectionTitle: 'መለያ',
  signupDetailsSectionTitle: 'የእርስዎ ዝርዝሮች',
  signupEmailLabel: 'ኢሜይል',
  signupPasswordLabel: 'የይለፍ ቃል',
  signupPasswordConfirmLabel: 'የይለፍ ቃል ያረጋግጡ',
  signupFirstNameLabel: 'የመጀመሪያ ስም',
  signupLastNameLabel: 'የአያት ስም',
  signupOrganizationLabel: 'ድርጅት (አማራጭ)',
  signupPhoneLabel: 'ስልክ (አማራጭ)',
  signupSubmitLabel: 'መለያ ይፍጠሩ',
  signupSubmittingLabel: 'መለያ በመፍጠር ላይ…',
  signupFooterPrompt: 'መለያ አለዎት?',
  signupFooterLinkLabel: 'ግባ',
  signupEmailPlaceholder: 'you@organization.com',
  signupPasswordsMismatchLabel: 'የይለፍ ቃሎች አይዛመዱም',
  forgotTitle: 'የይለፍ ቃል ረሱ',
  forgotRequestDescription:
    'አንድ ጊዜ የሚያገለግል የማጣራ ኮድ ለመቀበል የመለያ ኢሜይልዎን ያስገቡ።',
  forgotConfirmDescription: 'ወደ ኢሜይልዎ የተላከውን 6-አሃዝ ኮድ ያስገቡ።',
  forgotEmailLabel: 'ኢሜይል',
  forgotOtpLabel: 'አንድ ጊዜ ኮድ',
  forgotNewPasswordLabel: 'አዲስ የይለፍ ቃል',
  forgotConfirmPasswordLabel: 'አዲስ የይለፍ ቃል ያረጋግጡ',
  forgotSendCodeLabel: 'ማጣራ ኮድ ላክ',
  forgotSendingLabel: 'በመላክ ላይ…',
  forgotResetLabel: 'የይለፍ ቃል ይቀይሩ',
  forgotUpdatingLabel: 'በመዘምን ላይ…',
  forgotBackToSignInLabel: 'ወደ መግቢያ ተመለስ',
  forgotDifferentEmailLabel: 'ሌላ ኢሜይል ይጠቀሙ',
  forgotEmailPlaceholder: 'you@organization.com',
  forgotOtpPlaceholder: '000000',
  loginBrandEyebrow: 'የደንበኛ እና የሰራተኛ ፖርታል',
  loginBrandTagline:
    'የላቦራቶሪ ስራ ፍሰቶችን ለማስተዳደር፣ ጥያቄዎችን ለመላክ እና የተረጋገጡ ውጤቶችን ለመድረስ ይግቡ።',
  signupBrandEyebrow: 'የደንበኛ ምዝገባ',
  signupBrandTagline:
    'ናሙናዎችን ለመላክ እና ውጤቶችን በመስመር ለመቀበል የድርጅት መለያ ይፍጠሩ።',
  forgotBrandEyebrow: 'መለያ መልሶ ማግኘት',
  forgotBrandTagline:
    'ወደ የተመዘገበ ኢሜይልዎ የተላከ አንድ ጊዜ ኮድ በመጠቀም የይለፍ ቃልዎን በደህንነት ይቀይሩ።',
  trustBullets: [
    {
      title: 'የተረጋገጠ የላቦራቶሪ ምርመራ',
      description: 'የተረጋገጡ ዘዴዎች እና የሰንሰለት ቁጥጥር ሰነድ።',
      iconKey: 'shield-check',
    },
    {
      title: 'ሙሉ የናሙና ክትትል',
      description: 'ናሙናዎችን ከመቀበል እስከ የተረጋገጠ ውጤት ድረስ ይከታተሉ።',
      iconKey: 'flask-conical',
    },
    {
      title: 'ደህንነቱ የተጠበቀ የደንበኛ ፖርታል',
      description: 'ለሥራ ጥያቄዎች፣ ውጤቶች እና ሪፖርቶች የተጠበቀ መዳረሻ።',
      iconKey: 'lock',
    },
  ],
};

module.exports = {
  SITE_SETTING_DATA,
  HOME_PAGE_DATA,
  ABOUT_PAGE_DATA,
  AUTH_PAGE_DATA,
  SERVICES,
  NEWS_ARTICLES,
  EVENTS,
  PARTNERS,
  CONTACT_PAGES,
};
