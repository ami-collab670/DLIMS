import { z } from "zod";

/** One sample row created with a client self-service job (pre–lab intake). */
export const clientJobSampleSchema = z.object({
  sample_name: z
    .string()
    .trim()
    .min(1, "Each sample needs a name or label.")
    .max(200),
  notes: z.string().trim().max(4000).optional().default(""),
  packaging_type: z.string().max(100).optional().default(""),
});

export const clientJobRequestSchema = z.object({
  description: z
    .string()
    .trim()
    .min(10, "Please add a short description (at least 10 characters).")
    .max(16000),
<<<<<<< HEAD
  priority: z.enum(["normal", "urgent", ]),
=======
  priority: z.enum(["normal", "urgent", "critical"]),
>>>>>>> ab11eb2ffff845da9c0abb09db22510c1fe75fa9
  samples: z.array(clientJobSampleSchema).max(50).optional(),
});

export type ClientJobSampleValues = z.infer<typeof clientJobSampleSchema>;
export type ClientJobRequestValues = z.infer<typeof clientJobRequestSchema>;
