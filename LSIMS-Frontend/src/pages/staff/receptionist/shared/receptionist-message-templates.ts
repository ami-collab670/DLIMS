import type { NotificationKind } from "@/types/notification";

export type ReceptionistMessageTemplate = {
  id: string;
  label: string;
  title: string;
  body: string;
  kind: NotificationKind;
};

export const RECEPTIONIST_MESSAGE_TEMPLATES: ReceptionistMessageTemplate[] = [
  {
    id: "payment-reminder",
    label: "Payment reminder",
    title: "Payment reminder for your laboratory job",
    body: "Hello,\n\nThis is a reminder that payment is still outstanding for your recent job order. Please contact our finance desk or visit the client portal to review invoice details.\n\nThank you.",
    kind: "message",
  },
  {
    id: "sample-received",
    label: "Sample received",
    title: "Sample received at the laboratory",
    body: "Hello,\n\nWe have received your sample(s) at the reception desk and registered them against your job order. You will be notified when testing progresses.\n\nThank you.",
    kind: "info",
  },
  {
    id: "finance-follow-up",
    label: "Finance follow-up",
    title: "Finance follow-up on your job order",
    body: "Hello,\n\nOur finance team is following up regarding invoicing or payment for your job order. Please reply if you have questions or need a copy of your invoice.\n\nThank you.",
    kind: "job",
  },
];
