/**
 * Client-facing service catalog (indicative pricing in ETB).
 * Structure matches the laboratory’s published menus; backend job order stores a text summary.
 */

export type ServiceCatalogItem = {
  name: string;
  price: number;
};

export type ServiceCatalogCategory = {
  category: string;
  items: ServiceCatalogItem[];
};

export type ClientServiceCatalog = {
  geochemical_services: ServiceCatalogCategory[];
  mineralogy_services: ServiceCatalogCategory[];
  physical_and_geotechnical_analysis: ServiceCatalogCategory[];
  mineral_processing_services: ServiceCatalogCategory[];
};

export const CLIENT_SERVICE_CATALOG: ClientServiceCatalog = {
  geochemical_services: [
    {
      category: "Sample Preparation",
      items: [
        { name: "Geo-chemical sample preparation", price: 45.0 },
        { name: "Soil sample preparation", price: 35.0 },
        { name: "Clay sample preparation", price: 50.0 },
        { name: "Tantalum sample preparation", price: 120.0 },
      ],
    },
    {
      category: "Select Sample Analysis",
      items: [
        { name: "Complete select analysis", price: 250.0 },
        { name: "Chlorine analysis", price: 65.0 },
        { name: "Iron-oxide analysis", price: 55.0 },
        { name: "Beryllium analysis", price: 85.0 },
        { name: "Sulfur oxide analysis", price: 70.0 },
        { name: "XRF major element analysis", price: 140.0 },
        { name: "XRF trace element analysis", price: 160.0 },
        { name: "EDXRF precious minerals analysis", price: 210.0 },
      ],
    },
    {
      category: "Hydrocarbon Analysis",
      items: [
        { name: "Proximate analysis", price: 180.0 },
        { name: "Ultimate analysis", price: 225.0 },
        { name: "Distillation analysis", price: 310.0 },
        { name: "Sulfur analysis", price: 60.0 },
        { name: "Organic carbon analysis", price: 95.0 },
        { name: "Kerogen analysis", price: 450.0 },
        { name: "Graphitic carbon analysis", price: 110.0 },
        { name: "Calorific value", price: 130.0 },
        { name: "Total analysis", price: 500.0 },
        { name: "Specific gravity measure analysis", price: 75.0 },
        { name: "Dry density", price: 40.0 },
      ],
    },
    {
      category: "Gold & Silver Analysis",
      items: [
        { name: "Gold chemical analysis", price: 45.0 },
        { name: "Gold fire assay analysis", price: 55.0 },
        { name: "Silver analysis", price: 40.0 },
        { name: "Platinum analysis", price: 85.0 },
        { name: "Palladium analysis", price: 85.0 },
        { name: "Forensic analysis", price: 600.0 },
        { name: "VGA vapor formation", price: 190.0 },
      ],
    },
    {
      category: "Trace Element & Base Metal",
      items: [
        { name: "Base metal analysis", price: 120.0 },
        { name: "Lithium analysis", price: 95.0 },
      ],
    },
    {
      category: "Water Analysis",
      items: [
        { name: "Water physical analysis", price: 50.0 },
        { name: "Water chemical analysis", price: 115.0 },
        { name: "Trace metal analysis", price: 145.0 },
      ],
    },
  ],
  mineralogy_services: [
    {
      category: "Mineralogy Sample Preparation",
      items: [
        { name: "Standard thin section preparation", price: 65.0 },
        { name: "Green mount thin section preparation", price: 85.0 },
        { name: "Soil thin section preparation", price: 95.0 },
        { name: "Polished section preparation", price: 75.0 },
        { name: "Green mount polished section preparation", price: 105.0 },
        { name: "Polished thin section preparation", price: 120.0 },
        { name: "Dimension stone cut preparation", price: 200.0 },
        { name: "Core sample slice preparation", price: 150.0 },
      ],
    },
    {
      category: "Mineralogy Analysis",
      items: [
        { name: "Petrography analysis", price: 350.0 },
        { name: "Micro-photography", price: 120.0 },
        { name: "Staining petrography for carbonates", price: 180.0 },
        { name: "Heavy minerals analysis", price: 275.0 },
        { name: "Jewelry minerals analysis", price: 400.0 },
        { name: "XRD mineralogy analysis", price: 220.0 },
        { name: "Heavy density magnetic identification", price: 195.0 },
      ],
    },
  ],
  physical_and_geotechnical_analysis: [
    {
      category: "Physical Tests",
      items: [
        { name: "Moisture content test", price: 25.0 },
        { name: "Dry sieve grain size distribution test", price: 80.0 },
        { name: "Wet sieve grain size distribution test", price: 110.0 },
        { name: "Soil water absorption test", price: 55.0 },
        { name: "Rock water absorption test", price: 65.0 },
        { name: "PPT grain size distribution test", price: 140.0 },
        { name: "Soil linear fire shrinkage test", price: 120.0 },
        { name: "Linear dry shrinkage test", price: 90.0 },
        { name: "Dry density tests", price: 45.0 },
        { name: "Porosity test", price: 85.0 },
        { name: "Specific gravity test", price: 70.0 },
        { name: "Color test", price: 15.0 },
        { name: "Atterberg limit test", price: 130.0 },
        { name: "Free swell test", price: 60.0 },
        { name: "Soil bulk density test", price: 50.0 },
        { name: "Rock bulk density test", price: 55.0 },
      ],
    },
    {
      category: "Geotechnical Tests",
      items: [
        { name: "Soil uniaxial compressive strength test", price: 320.0 },
        { name: "Soil consolidation property test", price: 450.0 },
        { name: "Direct shear strength test", price: 280.0 },
      ],
    },
  ],
  mineral_processing_services: [
    {
      category: "Processing & Testing",
      items: [
        { name: "Comminution process", price: 500.0 },
        { name: "Gravity separation analysis", price: 350.0 },
        { name: "Magnetic separation", price: 250.0 },
        { name: "Froth floatation", price: 600.0 },
        { name: "Leaching test", price: 750.0 },
      ],
    },
  ],
};

export type CatalogSectionMeta = {
  key: keyof ClientServiceCatalog;
  title: string;
};

export const CATALOG_SECTIONS: CatalogSectionMeta[] = [
  { key: "geochemical_services", title: "Geochemical services" },
  { key: "mineralogy_services", title: "Mineralogy services" },
  { key: "physical_and_geotechnical_analysis", title: "Physical & geotechnical" },
  { key: "mineral_processing_services", title: "Mineral processing" },
];

export function itemKey(
  sectionKey: keyof ClientServiceCatalog,
  category: string,
  name: string,
): string {
  return `${sectionKey}::${category}::${name}`;
}

export function parseItemKey(key: string): {
  sectionKey: keyof ClientServiceCatalog;
  category: string;
  name: string;
} | null {
  const parts = key.split("::");
  if (parts.length < 3) return null;
  const [sectionKey, ...rest] = parts;
  const name = rest.pop()!;
  const category = rest.join("::");
  if (!(sectionKey in CLIENT_SERVICE_CATALOG)) return null;
  return {
    sectionKey: sectionKey as keyof ClientServiceCatalog,
    category,
    name,
  };
}

export function lookupItemPrice(key: string): number | null {
  const parsed = parseItemKey(key);
  if (!parsed) return null;
  const groups = CLIENT_SERVICE_CATALOG[parsed.sectionKey];
  for (const g of groups) {
    if (g.category !== parsed.category) continue;
    const item = g.items.find((i) => i.name === parsed.name);
    if (item) return item.price;
  }
  return null;
}
