import type { ContactDetailBlock } from "@/features/cms/types";

import { MARKETING_CARD_CLASS } from "@/pages/public/marketing-ui";

export function MarketingContactDetails({
  intro,
  details,
}: {
  intro: string;
  details: ContactDetailBlock[];
}) {
  return (
    <section aria-labelledby="contact-details-heading">
      <div className="mb-8">
        <h2
          id="contact-details-heading"
          className="text-2xl font-semibold tracking-tight sm:text-3xl"
        >
          Contact us
        </h2>
        <div className="mt-2 h-1 w-12 rounded-full bg-primary" aria-hidden />
        <p className="mt-4 max-w-2xl text-muted-foreground">{intro}</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {details.map((detail) => (
          <div key={detail.label} className={`${MARKETING_CARD_CLASS} p-5`}>
            <p className="text-sm font-medium text-muted-foreground">
              {detail.label}
            </p>
            <p className="mt-2 text-base font-medium">{detail.value}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
