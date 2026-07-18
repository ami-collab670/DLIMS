import type { DepartmentRecord } from "@/types/account-admin";
import type { TestCatalogItem } from "@/types/laboratory";

const DEMO_TIMESTAMP = "2026-01-01T00:00:00.000Z";

export const DEMO_DEPT_SAMPLE_PREP = "demo-dept-sample-prep";
export const DEMO_DEPT_GEO_CHEM = "demo-dept-geo-chem";
export const DEMO_DEPT_GEO_PHYS = "demo-dept-geo-phys";
export const DEMO_DEPT_OTHER = "demo-dept-other";

const DEMO_DEPARTMENTS: DepartmentRecord[] = [
  {
    id: DEMO_DEPT_SAMPLE_PREP,
    name: "Sample preparation dept",
    description: "Sample preparation services",
    created_at: DEMO_TIMESTAMP,
    updated_at: DEMO_TIMESTAMP,
  },
  {
    id: DEMO_DEPT_GEO_CHEM,
    name: "Geo-chemical analysis dept",
    description: "Geo-chemical analysis services",
    created_at: DEMO_TIMESTAMP,
    updated_at: DEMO_TIMESTAMP,
  },
  {
    id: DEMO_DEPT_GEO_PHYS,
    name: "Geo-physical analysis",
    description: "Geo-physical analysis services",
    created_at: DEMO_TIMESTAMP,
    updated_at: DEMO_TIMESTAMP,
  },
  {
    id: DEMO_DEPT_OTHER,
    name: "Other",
    description: "Other laboratory services",
    created_at: DEMO_TIMESTAMP,
    updated_at: DEMO_TIMESTAMP,
  },
];

const DEMO_TESTS: TestCatalogItem[] = [
  {
    id: "demo-test-spc001",
    test_name: "crushing",
    test_code: "SPC001",
    description: "Sample crushing",
    unit: "kg",
    price: "0.00",
    department: DEMO_DEPT_SAMPLE_PREP,
    is_active: true,
    created_at: DEMO_TIMESTAMP,
    updated_at: DEMO_TIMESTAMP,
  },
  {
    id: "demo-test-spts001",
    test_name: "standard thin section preparation",
    test_code: "SPTS001",
    description: "Standard thin section preparation",
    unit: "per sample",
    price: "0.00",
    department: DEMO_DEPT_SAMPLE_PREP,
    is_active: true,
    created_at: DEMO_TIMESTAMP,
    updated_at: DEMO_TIMESTAMP,
  },
  {
    id: "demo-test-spd002",
    test_name: "drying",
    test_code: "SPD002",
    description: "Sample drying",
    unit: "per sample",
    price: "0.00",
    department: DEMO_DEPT_SAMPLE_PREP,
    is_active: true,
    created_at: DEMO_TIMESTAMP,
    updated_at: DEMO_TIMESTAMP,
  },
  {
    id: "demo-test-geo001",
    test_name: "rare earth elements",
    test_code: "Geo001",
    description: "Rare earth elements analysis",
    unit: "per sample",
    price: "0.00",
    department: DEMO_DEPT_GEO_CHEM,
    is_active: true,
    created_at: DEMO_TIMESTAMP,
    updated_at: DEMO_TIMESTAMP,
  },
  {
    id: "demo-test-geo002",
    test_name: "copper analysis",
    test_code: "Geo002",
    description: "Copper analysis",
    unit: "ppm",
    price: "0.00",
    department: DEMO_DEPT_GEO_CHEM,
    is_active: true,
    created_at: DEMO_TIMESTAMP,
    updated_at: DEMO_TIMESTAMP,
  },
  {
    id: "demo-test-geo003",
    test_name: "gold analysis",
    test_code: "Geo003",
    description: "Gold analysis",
    unit: "g/t",
    price: "0.00",
    department: DEMO_DEPT_GEO_CHEM,
    is_active: true,
    created_at: DEMO_TIMESTAMP,
    updated_at: DEMO_TIMESTAMP,
  },
  {
    id: "demo-test-gphy001",
    test_name: "bulk density",
    test_code: "Gphy001",
    description: "Bulk density measurement",
    unit: "kg/m3",
    price: "0.00",
    department: DEMO_DEPT_GEO_PHYS,
    is_active: true,
    created_at: DEMO_TIMESTAMP,
    updated_at: DEMO_TIMESTAMP,
  },
  {
    id: "demo-test-gphy002",
    test_name: "moisture",
    test_code: "Gphy002",
    description: "Moisture content",
    unit: "%",
    price: "0.00",
    department: DEMO_DEPT_GEO_PHYS,
    is_active: true,
    created_at: DEMO_TIMESTAMP,
    updated_at: DEMO_TIMESTAMP,
  },
];

export function getDemoClientServiceCatalog(): {
  tests: TestCatalogItem[];
  departments: DepartmentRecord[];
} {
  return {
    tests: DEMO_TESTS,
    departments: DEMO_DEPARTMENTS,
  };
}
