import { ROUTES } from "@/lib/routing";
import { staffPath } from "@/lib/staff";
import { type RouteObject, Navigate } from "react-router-dom";

import { AdminOnlyRoute } from "@/components/auth/admin-only-route";
import { StaffRouteGate } from "@/components/auth/staff-route-gate";
import {
  ClientOnlyRoute,
  StaffOnlyRoute,
} from "@/components/auth/user-type-route";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { ClientDashboardLayout } from "@/components/layout/dashboard/client-dashboard-layout";
import { StaffDashboardLayout } from "@/components/layout/dashboard/staff-dashboard-layout";
import { RootLayout } from "@/components/layout/root-layout";
import ForgotPasswordPage from "@/pages/auth/ForgotPasswordPage";
import LoginPage from "@/pages/auth/LoginPage";
import SignupPage from "@/pages/auth/SignupPage";
import ClientDashboardHome from "@/pages/client/ClientDashboardHome";
import ClientComplaintsPage from "@/pages/client/ClientComplaintsPage";
import ClientNotificationsPage from "@/pages/client/ClientNotificationsPage";
import ClientRequestsPage from "@/pages/client/ClientRequestsPage";
import ClientResultsPage from "@/pages/client/results/ClientResultsPage";
import ClientNotFoundPage from "@/pages/errors/ClientNotFoundPage";
import PublicNotFoundPage from "@/pages/errors/PublicNotFoundPage";
import StaffNotFoundPage from "@/pages/errors/StaffNotFoundPage";
import Home from "@/pages/Home";
import { MarketingPage } from "@/pages/public/MarketingPage";
import ProfileManagementPage from "@/pages/profile/ProfileManagementPage";
import StaffClientsPage from "@/pages/staff/StaffClientsPage";
import StaffCompliancePage from "@/pages/staff/StaffCompliancePage";
import StaffDashboardHome from "@/pages/staff/StaffDashboardHome";
import StaffFinancePage from "@/pages/staff/StaffFinancePage";
import StaffInstrumentsPage from "@/pages/staff/StaffInstrumentsPage";
import StaffInventoryPage from "@/pages/staff/StaffInventoryPage";
import StaffLaboratoryPage from "@/pages/staff/StaffLaboratoryPage";
import StaffNotificationsPage from "@/pages/staff/StaffNotificationsPage";
import StaffQcLayout from "@/pages/staff/qc/StaffQcLayout";
import QcReviewDeskPage from "@/pages/staff/qc/desk/QcReviewDeskPage";
import QcHistoryPage from "@/pages/staff/qc/history/QcHistoryPage";
import QcRejectedPage from "@/pages/staff/qc/rejected/QcRejectedPage";
import StaffReportsPage from "@/pages/staff/StaffReportsPage";
import StaffResultsPage from "@/pages/staff/StaffResultsPage";
import StaffAnalystPage from "@/pages/staff/analyst/StaffAnalystPage";
import LabTechPrepPage from "@/pages/staff/prep/bench/LabTechPrepPage";
import StaffSchedulingPage from "@/pages/staff/StaffSchedulingPage";
import StaffSettingsPage from "@/pages/staff/StaffSettingsPage";
import StaffUserManagementPage from "@/pages/staff/StaffUserManagementPage";

export const appRoutes: RouteObject[] = [
  {
    element: <RootLayout />,
    children: [
      // ── Public zone ──
      { path: ROUTES.home, element: <Home /> },
      { path: ROUTES.about, element: <MarketingPage slug="about" /> },
      { path: ROUTES.services, element: <MarketingPage slug="services" /> },
      { path: ROUTES.contact, element: <MarketingPage slug="contact" /> },

      // ── Auth zone ──
      { path: ROUTES.login, element: <LoginPage /> },
      { path: ROUTES.signup, element: <SignupPage /> },
      { path: ROUTES.forgotPassword, element: <ForgotPasswordPage /> },

      // ── Staff zone ──
      {
        path: ROUTES.staff.root,
        element: (
          <ProtectedRoute>
            <StaffOnlyRoute>
              <StaffDashboardLayout />
            </StaffOnlyRoute>
          </ProtectedRoute>
        ),
        children: [
          {
            index: true,
            element: (
              <StaffRouteGate routeKey="dashboard">
                <StaffDashboardHome />
              </StaffRouteGate>
            ),
          },
          {
            path: "laboratory",
            element: (
              <StaffRouteGate routeKey="laboratory">
                <StaffLaboratoryPage />
              </StaffRouteGate>
            ),
          },
          {
            path: "clients",
            element: (
              <StaffRouteGate routeKey="clients">
                <StaffClientsPage />
              </StaffRouteGate>
            ),
          },
          {
            path: "results",
            element: (
              <StaffRouteGate routeKey="results">
                <StaffResultsPage />
              </StaffRouteGate>
            ),
          },
          {
            path: "qc",
            element: (
              <StaffRouteGate routeKey="qc">
                <StaffQcLayout />
              </StaffRouteGate>
            ),
            children: [
              { index: true, element: <QcReviewDeskPage /> },
              { path: "history", element: <QcHistoryPage /> },
              { path: "rejected", element: <QcRejectedPage /> },
            ],
          },
          {
            path: "reports",
            element: (
              <StaffRouteGate routeKey="reports">
                <StaffReportsPage />
              </StaffRouteGate>
            ),
          },
          {
            path: "finance",
            element: (
              <StaffRouteGate routeKey="finance">
                <StaffFinancePage />
              </StaffRouteGate>
            ),
          },
          {
            path: "inventory",
            element: (
              <StaffRouteGate routeKey="inventory">
                <StaffInventoryPage />
              </StaffRouteGate>
            ),
          },
          {
            path: "instruments",
            element: (
              <StaffRouteGate routeKey="instruments">
                <StaffInstrumentsPage />
              </StaffRouteGate>
            ),
          },
          {
            path: "compliance",
            element: (
              <StaffRouteGate routeKey="compliance">
                <StaffCompliancePage />
              </StaffRouteGate>
            ),
          },
          {
            path: "scheduling",
            element: (
              <StaffRouteGate routeKey="scheduling">
                <StaffSchedulingPage />
              </StaffRouteGate>
            ),
          },
          {
            path: "notifications",
            element: (
              <StaffRouteGate routeKey="notifications">
                <StaffNotificationsPage />
              </StaffRouteGate>
            ),
          },
          {
            path: "users",
            element: (
              <StaffRouteGate routeKey="users">
                <AdminOnlyRoute>
                  <StaffUserManagementPage />
                </AdminOnlyRoute>
              </StaffRouteGate>
            ),
          },
          {
            path: "samples",
            element: <Navigate to={staffPath("analyst")} replace />,
          },
          {
            path: "analyst",
            element: (
              <StaffRouteGate routeKey="analyst">
                <StaffAnalystPage />
              </StaffRouteGate>
            ),
          },
          {
            path: "prep",
            element: (
              <StaffRouteGate routeKey="prep">
                <LabTechPrepPage />
              </StaffRouteGate>
            ),
          },
          {
            path: "profile",
            element: (
              <StaffRouteGate routeKey="profile">
                <ProfileManagementPage
                  staffProfile
                  title="Profile & settings"
                  description="Account identity, role permissions, contact details, and workspace preferences."
                />
              </StaffRouteGate>
            ),
          },
          {
            path: "settings",
            element: (
              <StaffRouteGate routeKey="settings">
                <StaffSettingsPage />
              </StaffRouteGate>
            ),
          },
          { path: "*", element: <StaffNotFoundPage /> },
        ],
      },

      // ── Client zone ──
      {
        path: ROUTES.client.root,
        element: (
          <ProtectedRoute>
            <ClientOnlyRoute>
              <ClientDashboardLayout />
            </ClientOnlyRoute>
          </ProtectedRoute>
        ),
        children: [
          { index: true, element: <ClientDashboardHome /> },
          { path: "requests", element: <ClientRequestsPage /> },
          { path: "complaints", element: <ClientComplaintsPage /> },
          { path: "results", element: <ClientResultsPage /> },
          { path: "notifications", element: <ClientNotificationsPage /> },
          {
            path: "profile",
            element: (
              <ProfileManagementPage
                title="Profile & settings"
                description="Keep your organization and contact details up to date, and manage appearance and session preferences."
              />
            ),
          },
          { path: "*", element: <ClientNotFoundPage /> },
        ],
      },

      // Public catch-all — must remain after all fixed paths
      { path: "*", element: <PublicNotFoundPage /> },
    ],
  },
];
