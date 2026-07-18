import { BrowserRouter as Router, useRoutes } from "react-router-dom";

import { NavigationHistoryProvider } from "@/providers/navigation-history-provider";
import { appRoutes } from "@/routes/config";

function AppRoutes() {
  return useRoutes(appRoutes);
}

export default function App() {
  return (
    <Router>
      <NavigationHistoryProvider>
        <AppRoutes />
      </NavigationHistoryProvider>
    </Router>
  );
}