import { BrowserRouter as Router, useRoutes } from "react-router-dom";

import { appRoutes } from "@/routes/config";

function AppRoutes() {
  return useRoutes(appRoutes);
}

export default function App() {
  return (
    <Router>
      <AppRoutes />
    </Router>
  );
}