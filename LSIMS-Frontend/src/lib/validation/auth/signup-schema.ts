import { z } from "zod";

import { optionalPhoneSchema } from "@/lib/validation";

export const signupSchema = z
  .object({
    email: z.string().email("Enter a valid email"),
    password: z.string().min(8, "At least 8 characters"),
    passwordConfirm: z.string().min(8, "Confirm your password"),
    first_name: z.string().optional(),
    last_name: z.string().optional(),
    organization_name: z.string().optional(),
    phone: optionalPhoneSchema,
  })
  .refine((data) => data.password === data.passwordConfirm, {
    message: "Passwords do not match",
    path: ["passwordConfirm"],
  });

export type SignupValues = z.infer<typeof signupSchema>;
