import { z } from "zod";

import { optionalPhoneSchema } from "@/lib/phone-validation";

export const profileFormSchema = z.object({
  first_name: z.string().max(150),
  last_name: z.string().max(150),
  phone: optionalPhoneSchema,
  nationality: z.string().max(100),
  organization_name: z.string().max(255),
  organization_type: z.string().max(100),
});

export type ProfileFormValues = z.infer<typeof profileFormSchema>;
