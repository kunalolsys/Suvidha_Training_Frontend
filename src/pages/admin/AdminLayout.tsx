import AdminSidebar from "@/components/feature/AdminSidebar";
import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import AdminHeader from "./AdminHeader";

// Optional: Dictionary to automatically map paths to header titles
const routeMeta: Record<string, { title: string; subtitle: string }> = {
    "/admin/dashboard": {
        title: "Admin Dashboard",
        subtitle: "Overview of your training portal",
    },
    "/admin/videos": {
        title: "Training Videos",
        subtitle: "Manage and assign video content",
    },
    "/admin/questions": {
        title: "Quiz Questions",
        subtitle: "Configure evaluation assessments",
    },
    "/admin/employees": {
        title: "Employee Directory",
        subtitle: "View employee profiles and progress",
    },
    "/admin/reports": {
        title: "Analytics & Reports",
        subtitle: "Export and review performance metrics",
    },
    "/admin/profile": {
        title: "Admin Profile",
        subtitle: "Manage your personal details & settings",
    },
    "/admin/vimeo": {
        title: "Vimeo Test",
        subtitle: "Test Vimeo video integration",
    },
};

export default function AdminLayout() {
    const [isMobileOpen, setIsMobileOpen] = useState(false);
    const location = useLocation();

    const currentMeta = routeMeta[location.pathname] || {
        title: "Admin Portal",
        subtitle: "STU Training Portal Management",
    };

    return (
        <div className="min-h-screen bg-background-50 flex">
            {/* 🧭 Shared Responsive Sidebar */}
            <AdminSidebar
                isMobileOpen={isMobileOpen}
                setIsMobileOpen={setIsMobileOpen}
            />

            {/* 🖥️ Main Region */}
            <div className="flex-1 min-w-0 flex flex-col min-h-screen">
                {/* 🔝 Shared Header */}
                <AdminHeader
                    title={currentMeta.title}
                    subtitle={currentMeta.subtitle}
                    isMobileOpen={isMobileOpen}
                    setIsMobileOpen={setIsMobileOpen}
                />

                {/* 📄 Active Route Render Area */}
                <div>
                    <Outlet />
                </div>
            </div>
        </div>
    );
}