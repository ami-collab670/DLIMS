import { z } from "zod";

export const forgotPasswordConfirmSchema = z
  .object({
    email: z.string().email(),
    otp: z
      .string()
      .length(6, "OTP must be 6 digits")
      .regex(/^\d+$/, "OTP must be numeric"),
    new_password: z.string().min(8, "Password must be at least 8 characters"),
    confirm_password: z.string().min(1, "Confirm your new password"),
  })
  .refine((data) => data.new_password === data.confirm_password, {
    message: "Passwords do not match",
    path: ["confirm_password"],
  });

export type ForgotPasswordConfirmValues = z.infer<
  typeof forgotPasswordConfirmSchema
>;
