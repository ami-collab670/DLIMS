import { Loader2 } from "lucide-react";
import { useCallback, useEffect, useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";

import { useBreadcrumbSegments } from "@/components/navigation/breadcrumb-segments-context";
import { useJobOrder } from "@/features/jobs/hooks";
import { useTrackedTabs } from "@/hooks/use-tracked-tabs";
import { shortJobId } from "@/lib/laboratory";
import { ROUTES } from "@/lib/routing";
import { isFinance, isReceptionist } from "@/lib/staff";
import { useAuthStore } from "@/stores/auth-store";
import { Button } from "@/components/ui/button";
import { FinanceJobDetailPanel } from "@/pages/staff/finance/job/finance-job-detail-panel";
import { FinancePaymentComplianceSection } from "@/pages/staff/finance/compliance/finance-payment-compliance-section";
import { FinanceReportsSection } from "@/pages/staff/finance/reports/finance-reports-section";

import { LimsPageIntro } from "../lims-page-intro";
import { StaffRoleBanner } from "../staff-role-banner";
import { FinanceDiscountsSection } from "./finance-discounts-section";
import { FinanceInvoicesSection } from "./finance-invoices-section";

type FinanceTab = "invoices" | "discounts" | "reports" | "compliance";

function FinancePageContent({
  activeTab,
  setActiveTab,
  finance,
  receptionist,
  onOpenJob,
  prefillJobId,
}: {
  activeTab: FinanceTab;
  setActiveTab: (tab: FinanceTab) => void;
  finance: boolean;
  receptionist: boolean;
  onOpenJob?: (id: string) => void;
  prefillJobId: string;
}) {
  return (
    <div className="space-y-10">
      <LimsPageIntro title="Finance">
        {receptionist ? (
          <p>
            View invoice and payment status for client jobs (read-only). Use{" "}
            <strong>Discount approvals</strong> to request a fee waiver — Finance and the lab
            director handle clearance; you cannot create or update invoices from the reception desk.
          </p>
        ) : finance ? (
          <p>
            Finance desk — create invoices, record payments, and submit discount requests. Job
            workflow status is managed by the backend; use the job panel for billing context only.
          </p>
        ) : (
          <p>
            Clear client jobs through <strong>Invoices</strong>: create a financial record, mark{" "}
            <code className="rounded bg-muted px-1">payment_status: paid</code>, or approve a
            discount waiver.
          </p>
        )}
      </LimsPageIntro>

      <StaffRoleBanner />

      {finance ? (
        <p className="text-xs text-muted-foreground">
          <Link to={ROUTES.staff.root} className="font-medium text-primary hover:underline">
            ← Finance desk home
          </Link>
        </p>
      ) : null}

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
        {finance ? (
          <>
            <Button
              type="button"
              size="sm"
              variant={activeTab === "reports" ? "default" : "ghost"}
              onClick={() => setActiveTab("reports")}
            >
              Reports
            </Button>
            <Button
              type="button"
              size="sm"
              variant={activeTab === "compliance" ? "default" : "ghost"}
              onClick={() => setActiveTab("compliance")}
            >
              Payment compliance
            </Button>
          </>
        ) : null}
      </div>

      {activeTab === "invoices" ? (
        <FinanceInvoicesSection onOpenJob={onOpenJob} />
      ) : null}
      {activeTab === "discounts" ? (
        <FinanceDiscountsSection prefillJobId={prefillJobId} />
      ) : null}
      {activeTab === "reports" && finance ? <FinanceReportsSection /> : null}
      {activeTab === "compliance" && finance ? <FinancePaymentComplianceSection /> : null}
    </div>
  );
}

export default function StaffFinancePage() {
  const user = useAuthStore((s) => s.user);
  const receptionist = isReceptionist(user);
  const finance = isFinance(user);
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get("tab");
  const selectedJobId = searchParams.get("job") ?? "";

  const initialTab: FinanceTab =
    tabParam === "discounts"
      ? "discounts"
      : tabParam === "compliance" && finance
        ? "compliance"
        : tabParam === "reports" && finance
          ? "reports"
          : "invoices";

  const [activeTab, setActiveTab] = useTrackedTabs<FinanceTab>(initialTab);

  useEffect(() => {
    if (tabParam === "discounts" || tabParam === "invoices") {
      setActiveTab(tabParam, { skipHistory: true });
    } else if (tabParam === "reports" && finance) {
      setActiveTab("reports", { skipHistory: true });
    } else if (tabParam === "compliance" && finance) {
      setActiveTab("compliance", { skipHistory: true });
    }
  }, [tabParam, setActiveTab, finance]);

  const openJob = useCallback(
    (id: string) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.set("job", id);
        return next;
      });
    },
    [setSearchParams],
  );

  const closeJob = useCallback(() => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete("job");
      return next;
    });
  }, [setSearchParams]);

  const {
    data: detailJob,
    isLoading: detailLoading,
    isError: detailError,
  } = useJobOrder(selectedJobId, {
    enabled: Boolean(selectedJobId) && !receptionist,
  });

  const jobDetailSegments = useMemo(() => {
    if (!selectedJobId) return [];
    return [
      {
        label: shortJobId(detailJob?.id ?? selectedJobId),
        onClick: closeJob,
      },
    ];
  }, [closeJob, detailJob?.id, selectedJobId]);
  useBreadcrumbSegments(jobDetailSegments, "finance-job-detail");

  const pageContent = (
    <FinancePageContent
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      finance={finance}
      receptionist={receptionist}
      onOpenJob={finance || !receptionist ? openJob : undefined}
      prefillJobId={selectedJobId}
    />
  );

  if (receptionist || !selectedJobId) {
    return pageContent;
  }

  return (
    <div className="flex min-h-[min(70vh,720px)] flex-col gap-6 lg:flex-row">
      <div className="min-w-0 flex-1">{pageContent}</div>
      <div className="fixed inset-0 z-50 flex lg:static lg:z-auto lg:w-[420px] lg:shrink-0 lg:self-start">
        <button
          type="button"
          className="flex-1 bg-background/80 backdrop-blur-sm lg:hidden"
          aria-label="Close job panel"
          onClick={closeJob}
        />
        <div className="w-full max-w-md overflow-y-auto border-l bg-card shadow-xl lg:max-h-[min(80vh,760px)] lg:max-w-none">
          {detailLoading && !detailJob ? (
            <div className="flex min-h-[200px] items-center justify-center">
              <Loader2 className="size-8 animate-spin text-muted-foreground" />
            </div>
          ) : detailError || !detailJob ? (
            <div className="p-4 text-sm text-destructive">Could not load job.</div>
          ) : (
            <FinanceJobDetailPanel
              job={detailJob}
              onClose={closeJob}
              onUpdated={() => {}}
            />
          )}
        </div>
      </div>
    </div>
  );
}
