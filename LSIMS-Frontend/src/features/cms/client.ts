import axios from "axios";

import { env } from "@/config/env";

export const cmsClient = axios.create({
  baseURL: env.cmsApiBaseUrl || undefined,
  headers: {
    Accept: "application/json",
  },
});
