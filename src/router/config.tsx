import type { RouteObject } from "react-router-dom";
import NotFound from "@/pages/NotFound";
import LoginPage from "@/pages/login/page";
import DashboardPage from "@/pages/dashboard/page";
import LearnPage from "@/pages/learn/page";
import AdminLoginPage from "@/pages/admin/login/page";
import AdminDashboardPage from "@/pages/admin/dashboard/page";
import AdminVideosPage from "@/pages/admin/videos/page";
import AdminQuestionsPage from "@/pages/admin/questions/page";

import AdminEmployeesPage from "@/pages/admin/employees/page";
import AdminReportsPage from "@/pages/admin/reports/page";
import VimeoTest from "@/pages/admin/vimeo";

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
    path: "/admin/dashboard",
    element: <AdminDashboardPage />,
  },
  {
    path: "/admin/videos",
    element: <AdminVideosPage />,
  },{
    path: "/admin/vimeo",
    element: <VimeoTest />,
  },
  {
    path: "/admin/questions",
    element: <AdminQuestionsPage />,
  },
  {
    path: "/admin/employees",
    element: <AdminEmployeesPage />,
  },
  {
    path: "/admin/reports",
    element: <AdminReportsPage />,
  },
  {
    path: "*",
    element: <NotFound />,
  },
];

export default routes;