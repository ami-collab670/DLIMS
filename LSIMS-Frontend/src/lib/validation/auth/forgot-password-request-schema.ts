import { z } from "zod";

export const forgotPasswordRequestSchema = z.object({
  email: z.string().email("Enter a valid email address"),
});

export type ForgotPasswordRequestValues = z.infer<
  typeof forgotPasswordRequestSchema
>;
