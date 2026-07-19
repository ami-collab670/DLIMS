import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";

import { useTrackedTabs } from "@/hooks/use-tracked-tabs";
import { Button } from "@/components/ui/button";
import { LimsPageIntro } from "@/pages/staff/lims-extensions/lims-page-intro";
import { StaffRoleBanner } from "@/pages/staff/lims-extensions/staff-role-banner";

import { StaffClientsComplaintsSection } from "./staff-clients-complaints-section";
import { StaffClientsDirectorySection } from "./staff-clients-directory-section";

export default function StaffClientsPage() {
  const [searchParams] = useSearchParams();
  const tabParam = searchParams.get("tab");
  const clientParam = searchParams.get("client")?.trim();
  const initialTab: "directory" | "complaints" =
    tabParam === "complaints" || Boolean(clientParam) ? "complaints" : "directory";

  const [activeTab, setActiveTab] = useTrackedTabs<"directory" | "complaints">(
    initialTab,
  );

  useEffect(() => {
    if (tabParam === "complaints" || tabParam === "directory") {
      setActiveTab(tabParam, { skipHistory: true });
    }
  }, [tabParam, setActiveTab]);

  return (
    <div className="space-y-8">
      <LimsPageIntro title="Clients">
        <p>
          Client directory, job history, and coordination. For jobs awaiting payment,
          use <strong>Check payment status</strong> to open Finance — clearance is
          handled by the finance desk, not from this page.
        </p>
      </LimsPageIntro>

      <StaffRoleBanner />

      <div className="flex flex-wrap gap-2 border-b pb-2">
        <Button
          type="button"
          size="sm"
          variant={activeTab === "directory" ? "default" : "ghost"}
          onClick={() => setActiveTab("directory")}
        >
          Directory
        </Button>
        <Button
          type="button"
          size="sm"
          variant={activeTab === "complaints" ? "default" : "ghost"}
          onClick={() => setActiveTab("complaints")}
        >
          Complaints
        </Button>
      </div>

      {activeTab === "directory" ? <StaffClientsDirectorySection /> : null}
      {activeTab === "complaints" ? <StaffClientsComplaintsSection /> : null}
    </div>
  );
}
