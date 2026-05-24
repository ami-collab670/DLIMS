import { Navigate } from "react-router-dom";

/** Legacy route — combined profile & settings live on /staff/profile. */
export default function StaffSettingsPage() {
  return <Navigate to="/staff/profile" replace />;
}
