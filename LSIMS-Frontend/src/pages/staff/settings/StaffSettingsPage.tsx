import { Navigate } from "react-router-dom";

import { staffPath } from "@/lib/staff";

/** Legacy route — combined profile & settings live on /staff/profile. */
export default function StaffSettingsPage() {
  return <Navigate to={staffPath("profile")} replace />;
}
