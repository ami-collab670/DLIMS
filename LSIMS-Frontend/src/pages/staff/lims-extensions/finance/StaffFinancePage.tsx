import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";

import { useTrackedTabs } from "@/hooks/use-tracked-tabs";
import { isReceptionist } from "@/lib/staff-permissions";
import { useAuthStore } from "@/stores/auth-store";
import { Button } from "@/components/ui/button";
import { LimsPageIntro } from "../lims-page-intro";
import { StaffRoleBanner } from "../staff-role-banner";
import { FinanceDiscountsSection } from "./finance-discounts-section";
import { FinanceInvoicesSection } from "./finance-invoices-section";

export default function StaffFinancePage() {
  const user = useAuthStore((s) => s.user);
  const receptionist = isReceptionist(user);
  const [searchParams] = useSearchParams();
  const tabParam = searchParams.get("tab");
  const initialTab: "invoices" | "discounts" =
    tabParam === "discounts" ? "discounts" : "invoices";

  const [activeTab, setActiveTab] = useTrackedTabs<"invoices" | "discounts">(
    initialTab,
  );

  useEffect(() => {
    if (tabParam === "discounts" || tabParam === "invoices") {
      setActiveTab(tabParam, { skipHistory: true });
    }
  }, [tabParam, setActiveTab]);

  return (
    <div className="space-y-10">
      <LimsPageIntro title="Finance">
        {receptionist ? (
          <p>
            View invoice and payment status for client jobs (read-only). Use{" "}
            <strong>Discount approvals</strong> to request a fee waiver — Finance
            and the lab director handle clearance; you cannot create or update
            invoices from the reception desk.
          </p>
        ) : (
          <p>
            Clear client jobs through <strong>Invoices</strong>: create a financial record, mark{" "}
            <code className="rounded bg-muted px-1">payment_status: paid</code>, or approve a
            discount waiver. Job workflow status is managed by the backend — do not PATCH job status
            from this UI.
          </p>
        )}
      </LimsPageIntro>

      <StaffRoleBanner />

      <div className="flex flex-wrap gap-2 border-b pb-2">
        <Button
          type="button"
          size="sm"
          variant={activeTab === "invoices" ? "default" : "ghost"}
          onClick={() => setActiveTab("invoices")}
        >
          Invoices
        </Button>
        <Button
          type="button"
          size="sm"
          variant={activeTab === "discounts" ? "default" : "ghost"}
          onClick={() => setActiveTab("discounts")}
        >
          Discount approvals
        </Button>
      </div>

      {activeTab === "invoices" ? <FinanceInvoicesSection /> : null}
      {activeTab === "discounts" ? <FinanceDiscountsSection /> : null}
    </div>
  );
}
