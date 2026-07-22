import type { ClientPathKey } from "@/lib/routing/app-routes";

export const CLIENT_GETTING_STARTED_DISMISS_KEY =
  "lsims-client-getting-started-dismissed";

export const CLIENT_GETTING_STARTED_STEPS: {
  step: number;
  title: string;
  description: string;
  routeKey: ClientPathKey;
  linkLabel: string;
}[] = [
  {
    step: 1,
    title: "Submit request",
    description:
      "Choose tests, name your samples, and send a job order to the lab.",
    routeKey: "requests",
    linkLabel: "New request",
  },
  {
    step: 2,
    title: "Pay invoice",
    description:
      "Finance clears your job for laboratory work once payment is recorded or waived.",
    routeKey: "requests",
    linkLabel: "View requests",
  },
  {
    step: 3,
    title: "Track samples",
    description: "Follow intake details and test progress on each sample.",
    routeKey: "results",
    linkLabel: "My results",
  },
  {
    step: 4,
    title: "Raise a complaint if needed",
    description: "Report payment, sample, or result issues for staff review.",
    routeKey: "complaints",
    linkLabel: "Complaints",
  },
];
