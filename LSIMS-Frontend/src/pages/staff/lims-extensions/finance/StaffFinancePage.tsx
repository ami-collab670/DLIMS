import { useState } from "react";

import { Button } from "@/components/ui/button";
import { LimsPageIntro } from "../lims-page-intro";
import { StaffRoleBanner } from "../staff-role-banner";
import { FinanceDiscountsSection } from "./finance-discounts-section";
import { FinanceInvoicesSection } from "./finance-invoices-section";

export default function StaffFinancePage() {
  const [activeTab, setActiveTab] = useState<"invoices" | "discounts">("invoices");

  return (
    <div className="space-y-10">
      <LimsPageIntro title="Finance">
        <p>
          Clear client jobs through <strong>Invoices</strong>: create a financial record, mark{" "}
          <code className="rounded bg-muted px-1">payment_status: paid</code>, or approve a
          discount waiver. Job workflow status is managed by the backend — do not PATCH job status
          from this UI.
        </p>
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
