import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";

const DISMISS_KEY = "lsims-client-getting-started-dismissed";

const STEPS = [
  {
    step: 1,
    title: "Submit request",
    description: "Choose tests, name your samples, and send a job order to the lab.",
    to: "/client/requests",
    linkLabel: "New request",
  },
  {
    step: 2,
    title: "Pay invoice",
    description:
      "Finance clears your job for laboratory work once payment is recorded or waived.",
    to: "/client/requests",
    linkLabel: "View requests",
  },
  {
    step: 3,
    title: "Track samples",
    description: "Follow intake details and test progress on each sample.",
    to: "/client/results",
    linkLabel: "My results",
  },
  {
    step: 4,
    title: "Raise a complaint if needed",
    description: "Report payment, sample, or result issues for staff review.",
    to: "/client/complaints",
    linkLabel: "Complaints",
  },
] as const;

type Props = {
  /** When true, show full prominent card; otherwise collapsed/dismissible. */
  prominent?: boolean;
};

export function ClientGettingStartedCard({ prominent = false }: Props) {
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (prominent) return;
    setDismissed(localStorage.getItem(DISMISS_KEY) === "1");
  }, [prominent]);

  function handleDismiss() {
    localStorage.setItem(DISMISS_KEY, "1");
    setDismissed(true);
  }

  if (!prominent && dismissed) {
    return null;
  }

  const content = (
    <ol className="mt-4 space-y-3">
      {STEPS.map(({ step, title, description, to, linkLabel }) => (
        <li key={step} className="flex gap-3 text-sm">
          <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
            {step}
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-medium">{title}</p>
            <p className="mt-0.5 text-muted-foreground">{description}</p>
            <Link
              to={to}
              className="mt-1 inline-block text-xs font-medium text-primary hover:underline"
            >
              {linkLabel} →
            </Link>
          </div>
        </li>
      ))}
    </ol>
  );

  if (prominent) {
    return (
      <div className="rounded-xl border border-primary/30 bg-primary/[0.03] p-6 shadow-sm">
        <h3 className="font-medium">Getting started</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Welcome to LSIMS. Follow these steps to submit your first laboratory request.
        </p>
        {content}
      </div>
    );
  }

  return (
    <details className="group rounded-xl border border-border bg-card shadow-sm">
      <summary className="cursor-pointer list-none px-4 py-3 text-sm font-medium [&::-webkit-details-marker]:hidden">
        <span className="flex items-center justify-between gap-2">
          Getting started guide
          <span className="text-xs font-normal text-muted-foreground group-open:hidden">
            Show steps
          </span>
        </span>
      </summary>
      <div className="border-t border-border px-4 pb-4 pt-2">
        {content}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="mt-3 text-muted-foreground"
          onClick={handleDismiss}
        >
          Dismiss guide
        </Button>
      </div>
    </details>
  );
}
