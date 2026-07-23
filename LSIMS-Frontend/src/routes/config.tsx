import { lazy, Suspense, type ReactNode } from "react";
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

const LoginPage = lazy(() => import("@/pages/auth/LoginPage"));
const SignupPage = lazy(() => import("@/pages/auth/SignupPage"));
const ForgotPasswordPage = lazy(() => import("@/pages/auth/ForgotPasswordPage"));

function AuthRouteFallback() {
  return (
    <div className="flex min-h-dvh items-center justify-center">
      <p className="text-sm text-muted-foreground">Loading…</p>
    </div>
  );
}

function withAuthSuspense(element: ReactNode) {
  return <Suspense fallback={<AuthRouteFallback />}>{element}</Suspense>;
}
import ClientDashboardHome from "@/pages/client/ClientDashboardHome";
import ClientComplaintsPage from "@/pages/client/ClientComplaintsPage";
import ClientNotificationsPage from "@/pages/client/ClientNotificationsPage";
import ClientRequestsPage from "@/pages/client/ClientRequestsPage";
import ClientResultsPage from "@/pages/client/results/ClientResultsPage";
import ClientNotFoundPage from "@/pages/errors/ClientNotFoundPage";
import PublicNotFoundPage from "@/pages/errors/PublicNotFoundPage";
import StaffNotFoundPage from "@/pages/errors/StaffNotFoundPage";
import Home from "@/pages/Home";
import { ContactCareersPage } from "@/pages/public/contact/contact-careers-page";
import { ContactCollectionPointsPage } from "@/pages/public/contact/contact-collection-points-page";
import { ContactMainPage } from "@/pages/public/contact/contact-main-page";
import { EventDetailPage } from "@/pages/public/events-detail-page";
import { EventsIndexPage } from "@/pages/public/events-index-page";
import { AboutPage } from "@/pages/public/about-page";
import { NewsDetailPage } from "@/pages/public/news-detail-page";
import { NewsIndexPage } from "@/pages/public/news-index-page";
import { ServiceDetailPage } from "@/pages/public/service-detail-page";
import { ServicesIndexPage } from "@/pages/public/services-index-page";
import { CmsPreviewPage } from "@/pages/preview/CmsPreviewPage";
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
      { path: ROUTES.about, element: <AboutPage /> },
      { path: ROUTES.services.root, element: <ServicesIndexPage /> },
      { path: `${ROUTES.services.root}/:slug`, element: <ServiceDetailPage /> },
      { path: ROUTES.news, element: <NewsIndexPage /> },
      { path: `${ROUTES.news}/:slug`, element: <NewsDetailPage /> },
      { path: ROUTES.events, element: <EventsIndexPage /> },
      { path: `${ROUTES.events}/:slug`, element: <EventDetailPage /> },
      { path: ROUTES.contact.root, element: <ContactMainPage /> },
      {
        path: ROUTES.contact.collectionPoints,
        element: <ContactCollectionPointsPage />,
      },
      { path: ROUTES.contact.careers, element: <ContactCareersPage /> },
      { path: ROUTES.preview, element: <CmsPreviewPage /> },

      // ── Auth zone (lazy-loaded so auth bundle errors cannot block public routes) ──
      {
        path: ROUTES.login,
        element: withAuthSuspense(<LoginPage />),
      },
      {
        path: ROUTES.signup,
        element: withAuthSuspense(<SignupPage />),
      },
      {
        path: ROUTES.forgotPassword,
        element: withAuthSuspense(<ForgotPasswordPage />),
      },

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
