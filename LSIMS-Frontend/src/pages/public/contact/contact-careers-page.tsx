import { useContactPage } from "@/features/cms/hooks";

import { ContactPageLayout } from "./contact-page-layout";
import { useContactTabLabels } from "./use-contact-tab-labels";

export function ContactCareersPage() {
  const contactPage = useContactPage("careers");
  const tabLabels = useContactTabLabels();

  return (
    <ContactPageLayout
      content={contactPage.data ?? undefined}
      tabLabels={tabLabels.labels}
      isLoading={contactPage.isLoading || tabLabels.isLoading}
      isError={contactPage.isError || tabLabels.isError}
      onRetry={() => {
        void contactPage.refetch();
        void tabLabels.refetch();
      }}
    />
  );
}
