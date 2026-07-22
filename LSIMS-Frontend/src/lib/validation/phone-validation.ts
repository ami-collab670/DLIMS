import { isValidPhoneNumber } from "libphonenumber-js";
import { z } from "zod";

export const optionalPhoneSchema = z
  .string()
  .max(20)
  .refine((v) => !v || isValidPhoneNumber(v), "Enter a valid phone number");

export const phoneSchema = z
  .string()
  .min(1, "Phone is required")
  .max(20)
  .refine(isValidPhoneNumber, "Enter a valid phone number");
