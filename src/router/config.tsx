import type { RouteObject } from "react-router-dom";
import { Navigate } from "react-router-dom";

// Standard Pages
import NotFound from "@/pages/NotFound";
import LoginPage from "@/pages/login/page";
import DashboardPage from "@/pages/dashboard/page";
import LearnPage from "@/pages/learn/page";

// Admin Pages
import AdminLoginPage from "@/pages/admin/login/page";
import AdminDashboardPage from "@/pages/admin/dashboard/page";
import AdminVideosPage from "@/pages/admin/videos/page";
import AdminQuestionsPage from "@/pages/admin/questions/page";
import AdminEmployeesPage from "@/pages/admin/employees/page";
import AdminReportsPage from "@/pages/admin/reports/page";
import VimeoTest from "@/pages/admin/vimeo";
import AdminProfilePage from "@/pages/admin/profile/AdminProfilePage";
import AdminLayout from "@/pages/admin/AdminLayout";

// Shared Layout

const routes: RouteObject[] = [
  {
    path: "/",
    element: <LoginPage />,
  },
  {
    path: "/dashboard",
    element: <DashboardPage />,
  },
  {
    path: "/learn/:videoId",
    element: <LearnPage />,
  },
  {
    path: "/admin",
    element: <AdminLoginPage />,
  },
  {
    // 🟢 Protected Admin Wrapper Layout
    path: "/admin",
    element: <AdminLayout />,
    children: [
      {
        path: "dashboard",
        element: <AdminDashboardPage />,
      },
      {
        path: "videos",
        element: <AdminVideosPage />,
      },
      {
        path: "vimeo",
        element: <VimeoTest />,
      },
      {
        path: "questions",
        element: <AdminQuestionsPage />,
      },
      {
        path: "employees",
        element: <AdminEmployeesPage />,
      },
      {
        path: "reports",
        element: <AdminReportsPage />,
      },
      {
        path: "profile",
        element: <AdminProfilePage />,
      },
    ],
  },
  {
    path: "*",
    element: <NotFound />,
  },
];

export default routes;