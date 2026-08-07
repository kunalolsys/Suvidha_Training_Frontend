import React, { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/api/api";
import { API } from "@/api/endpoints";
import AdminSidebar from "@/components/feature/AdminSidebar";

export default function AdminProfilePage() {
    const { user, setUser } = useAuth(); // Auth context state
    const [sidebarOpen, setSidebarOpen] = useState(false);

    // Form states
    const [profile, setProfile] = useState({
        name: "",
        email: "",
        employeeId: "",
        role: "Admin",
        department: "",
    });

    const [passwords, setPasswords] = useState({
        oldPassword: "",
        newPassword: "",
        confirmPassword: "",
    });

    const [showPasswords, setShowPasswords] = useState({
        old: false,
        new: false,
        confirm: false,
    });

    // UI Loaders & Alerts
    const [pageLoading, setPageLoading] = useState(false);
    const [profileLoading, setProfileLoading] = useState(false);
    const [passLoading, setPassLoading] = useState(false);
    const [message, setMessage] = useState<{ type: "success" | "error" | ""; text: string }>({
        type: "",
        text: "",
    });

    // Helper to sync user state across Context & LocalStorage safely
    const syncUserState = (userData: any) => {
        if (!userData) return;

        if (setUser) {
            setUser((prevUser: any) => ({ ...prevUser, ...userData }));
        }

        const stored = localStorage.getItem("stu_emp");
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                localStorage.setItem("stu_emp", JSON.stringify({ ...parsed, ...userData }));
            } catch {
                localStorage.setItem("stu_emp", JSON.stringify(userData));
            }
        }
    };

    // Helper to merge new user data safely into profile state (prevents empty fields)
    const updateProfileState = (userData: any) => {
        if (!userData) return;

        setProfile((prev) => ({
            name: userData.name ?? prev.name,
            email: userData.email ?? prev.email,
            employeeId: userData.employeeId ?? prev.employeeId,
            role: userData.role ?? prev.role,
            department:
                userData.department?.name ||
                userData.designation?.name ||
                (typeof userData.department === "string" ? userData.department : prev.department),
        }));
    };

    // 0. Fetch Latest Profile Data on Mount
    const fetchLatestProfile = async () => {
        try {
            const res = await api.get(`${API.AUTH}/profile`);
            const freshUserData = res.data?.data || res.data?.user || res.data;

            if (freshUserData) {
                updateProfileState(freshUserData);
                syncUserState(freshUserData);
            }
        } catch (err: any) {
            console.error("Failed to fetch profile details:", err);
            // Fallback to auth context user
            if (user) {
                updateProfileState(user);
            }
        }
    };

    useEffect(() => {
        const init = async () => {
            setPageLoading(true);
            await fetchLatestProfile();
            setPageLoading(false);
        };
        init();
    }, []);

    const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setProfile((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPasswords((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    };

    // 1. Submit Profile Update (Name & Email)
    const handleProfileSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage({ type: "", text: "" });
        setProfileLoading(true);

        try {
            // Calls PUT /update-profile
            const res = await api.put(`${API.AUTH}/update-profile`, {
                name: profile.name,
                email: profile.email,
            });

            const updatedUser = res.data?.data || res.data?.user || res.data;

            // 🟢 Merge newly updated data into state immediately
            if (updatedUser) {
                updateProfileState(updatedUser);
                syncUserState(updatedUser);
            }

            // 🟢 Re-fetch to ensure complete sync with DB without wiping fields
            await fetchLatestProfile();

            setMessage({ type: "success", text: "Profile details updated successfully!" });
        } catch (err: any) {
            setMessage({
                type: "error",
                text: err?.message || err.response?.data?.message || "Failed to update profile.",
            });
        } finally {
            setProfileLoading(false);
        }
    };

    // 2. Submit Password Change
    const handlePasswordSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage({ type: "", text: "" });

        if (passwords.newPassword.length < 6) {
            setMessage({
                type: "error",
                text: "New password must be at least 6 characters long.",
            });
            return;
        }

        if (passwords.newPassword !== passwords.confirmPassword) {
            setMessage({ type: "error", text: "New passwords do not match." });
            return;
        }

        setPassLoading(true);

        try {
            await api.patch(`${API.AUTH}/change-password`, {
                oldPassword: passwords.oldPassword,
                newPassword: passwords.newPassword,
            });

            setMessage({ type: "success", text: "Password changed successfully!" });
            setPasswords({
                oldPassword: "",
                newPassword: "",
                confirmPassword: "",
            });
        } catch (err: any) {
            setMessage({
                type: "error",
                text: err?.message || err.response?.data?.message || "Failed to update password.",
            });
        } finally {
            setPassLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background-50 flex">
            {/* <AdminSidebar /> */}

            <main className="flex-1 min-w-0 flex flex-col">
                {/* Mobile Top Header */}
                {/* <header className="lg:hidden bg-background-50 border-b border-background-200 sticky top-0 z-30">
                    <div className="px-4 h-14 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setSidebarOpen(!sidebarOpen)}
                                className="p-2 rounded-lg text-foreground-600 hover:bg-background-100 transition-colors"
                                aria-label="Toggle Navigation Menu"
                            >
                                <i className="ri-menu-line text-xl"></i>
                            </button>
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg bg-primary-500 flex items-center justify-center">
                                    <i className="ri-graduation-cap-fill text-sm text-background-50"></i>
                                </div>
                                <span className="font-heading text-base font-semibold text-foreground-900">
                                    Admin Settings
                                </span>
                            </div>
                        </div>
                    </div>
                </header> */}

                {/* Desktop Page Title Banner */}
                {/* <div className="hidden lg:block px-8 pt-8 pb-2">
                    <h1 className="font-heading text-2xl text-foreground-900 mb-1">
                        Admin Profile & Settings
                    </h1>
                    <p className="text-sm text-foreground-500">
                        Manage your personal credentials, contact info, and security credentials.
                    </p>
                </div> */}

                {/* Content Container */}
                <div className="flex-1 px-4 md:px-8 py-6 max-w-6xl w-full mx-auto space-y-6">
                    {/* Global Alert Notification */}
                    {message.text && (
                        <div
                            className={`flex items-center gap-3 p-4 rounded-xl text-sm transition-all shadow-sm ${message.type === "success"
                                ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                                : "bg-rose-50 text-rose-800 border border-rose-200"
                                }`}
                        >
                            <i
                                className={
                                    message.type === "success"
                                        ? "ri-checkbox-circle-fill text-xl text-emerald-600"
                                        : "ri-error-warning-fill text-xl text-rose-600"
                                }
                            ></i>
                            <span className="font-medium">{message.text}</span>
                        </div>
                    )}

                    {pageLoading ? (
                        <div className="flex items-center justify-center py-16 bg-background-50 border border-background-200 rounded-2xl">
                            <i className="ri-loader-4-line animate-spin text-3xl text-primary-500 mr-3"></i>
                            <span className="text-sm text-foreground-600 font-medium">
                                Loading profile information...
                            </span>
                        </div>
                    ) : (
                        <>
                            {/* User Overview Summary Header */}
                            <div className="bg-background-50 border border-background-200 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row items-center gap-6">
                                <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-primary-500 to-primary-700 flex items-center justify-center text-background-50 text-3xl font-bold shadow-md shrink-0">
                                    {profile.name ? profile.name.charAt(0).toUpperCase() : "A"}
                                </div>
                                <div className="text-center md:text-left space-y-1.5">
                                    <div className="flex items-center justify-center md:justify-start gap-2.5">
                                        <h2 className="font-heading text-xl font-bold text-foreground-900">
                                            {profile.name || "Admin User"}
                                        </h2>
                                        <span className="px-3 py-0.5 text-xs font-semibold bg-primary-50 text-primary-600 rounded-full border border-primary-200">
                                            {profile.role}
                                        </span>
                                    </div>
                                    <p className="text-sm text-foreground-600">{profile.email || "N/A"}</p>
                                    {profile.employeeId && (
                                        <p className="text-xs text-foreground-400 font-mono">
                                            Employee Code: <span className="font-semibold">{profile.employeeId}</span>
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Form Grid Section */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Section 1: Basic Information */}
                                <div className="bg-background-50 border border-background-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
                                    <div>
                                        <div className="flex items-center gap-2.5 mb-6 pb-3 border-b border-background-200">
                                            <i className="ri-user-line text-xl text-primary-500"></i>
                                            <h3 className="font-heading text-base font-semibold text-foreground-900">
                                                Personal Details
                                            </h3>
                                        </div>

                                        <form id="profileForm" onSubmit={handleProfileSubmit} className="space-y-4">
                                            <div>
                                                <label className="block text-xs font-medium text-foreground-700 mb-1.5">
                                                    Full Name
                                                </label>
                                                <input
                                                    type="text"
                                                    name="name"
                                                    value={profile.name}
                                                    onChange={handleProfileChange}
                                                    className="w-full px-4 py-2.5 bg-background-50 border border-background-200 rounded-xl text-sm text-foreground-900 focus:outline-none focus:border-primary-400 transition-colors"
                                                    required
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-xs font-medium text-foreground-700 mb-1.5">
                                                    Email Address
                                                </label>
                                                <input
                                                    type="email"
                                                    name="email"
                                                    value={profile.email}
                                                    onChange={handleProfileChange}
                                                    className="w-full px-4 py-2.5 bg-background-50 border border-background-200 rounded-xl text-sm text-foreground-900 focus:outline-none focus:border-primary-400 transition-colors"
                                                    required
                                                />
                                            </div>

                                            <div className="grid grid-cols-1 gap-3">
                                                {/* <div>
                                                    <label className="block text-xs font-medium text-foreground-700 mb-1.5">
                                                        Department
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={profile.department}
                                                        disabled
                                                        className="w-full px-4 py-2.5 bg-background-100 border border-background-200 rounded-xl text-sm text-foreground-500 cursor-not-allowed"
                                                    />
                                                </div> */}
                                                <div>
                                                    <label className="block text-xs font-medium text-foreground-700 mb-1.5">
                                                        Employee Code
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={profile.employeeId || "N/A"}
                                                        disabled
                                                        className="w-full px-4 py-2.5 bg-background-100 border border-background-200 rounded-xl text-sm text-foreground-500 cursor-not-allowed"
                                                    />
                                                </div>
                                            </div>
                                        </form>
                                    </div>

                                    <div className="pt-6">
                                        <button
                                            type="submit"
                                            form="profileForm"
                                            disabled={profileLoading}
                                            className="w-full py-3 bg-primary-500 hover:bg-primary-600 text-background-50 font-semibold rounded-xl text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                                        >
                                            {profileLoading ? (
                                                <i className="ri-loader-4-line animate-spin text-lg"></i>
                                            ) : (
                                                <i className="ri-save-line text-lg"></i>
                                            )}
                                            Save Profile Changes
                                        </button>
                                    </div>
                                </div>

                                {/* Section 2: Password & Security */}
                                <div className="bg-background-50 border border-background-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
                                    <div>
                                        <div className="flex items-center gap-2.5 mb-6 pb-3 border-b border-background-200">
                                            <i className="ri-lock-password-line text-xl text-primary-500"></i>
                                            <h3 className="font-heading text-base font-semibold text-foreground-900">
                                                Security & Password
                                            </h3>
                                        </div>

                                        <form id="passwordForm" onSubmit={handlePasswordSubmit} className="space-y-4">
                                            {/* Old Password */}
                                            <div>
                                                <label className="block text-xs font-medium text-foreground-700 mb-1.5">
                                                    Current Password
                                                </label>
                                                <div className="relative">
                                                    <input
                                                        type={showPasswords.old ? "text" : "password"}
                                                        name="oldPassword"
                                                        value={passwords.oldPassword}
                                                        onChange={handlePasswordChange}
                                                        placeholder="Enter current password"
                                                        className="w-full px-4 py-2.5 bg-background-50 border border-background-200 rounded-xl text-sm text-foreground-900 focus:outline-none focus:border-primary-400 transition-colors pr-11"
                                                        required
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            setShowPasswords((prev) => ({ ...prev, old: !prev.old }))
                                                        }
                                                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-foreground-400 hover:text-foreground-600 transition-colors cursor-pointer"
                                                    >
                                                        <i
                                                            className={
                                                                showPasswords.old
                                                                    ? "ri-eye-off-line text-lg"
                                                                    : "ri-eye-line text-lg"
                                                            }
                                                        ></i>
                                                    </button>
                                                </div>
                                            </div>

                                            {/* New Password */}
                                            <div>
                                                <label className="block text-xs font-medium text-foreground-700 mb-1.5">
                                                    New Password
                                                </label>
                                                <div className="relative">
                                                    <input
                                                        type={showPasswords.new ? "text" : "password"}
                                                        name="newPassword"
                                                        value={passwords.newPassword}
                                                        onChange={handlePasswordChange}
                                                        placeholder="Enter new password"
                                                        className="w-full px-4 py-2.5 bg-background-50 border border-background-200 rounded-xl text-sm text-foreground-900 focus:outline-none focus:border-primary-400 transition-colors pr-11"
                                                        required
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            setShowPasswords((prev) => ({ ...prev, new: !prev.new }))
                                                        }
                                                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-foreground-400 hover:text-foreground-600 transition-colors cursor-pointer"
                                                    >
                                                        <i
                                                            className={
                                                                showPasswords.new
                                                                    ? "ri-eye-off-line text-lg"
                                                                    : "ri-eye-line text-lg"
                                                            }
                                                        ></i>
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Confirm Password */}
                                            <div>
                                                <label className="block text-xs font-medium text-foreground-700 mb-1.5">
                                                    Confirm New Password
                                                </label>
                                                <div className="relative">
                                                    <input
                                                        type={showPasswords.confirm ? "text" : "password"}
                                                        name="confirmPassword"
                                                        value={passwords.confirmPassword}
                                                        onChange={handlePasswordChange}
                                                        placeholder="Re-enter new password"
                                                        className="w-full px-4 py-2.5 bg-background-50 border border-background-200 rounded-xl text-sm text-foreground-900 focus:outline-none focus:border-primary-400 transition-colors pr-11"
                                                        required
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            setShowPasswords((prev) => ({ ...prev, confirm: !prev.confirm }))
                                                        }
                                                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-foreground-400 hover:text-foreground-600 transition-colors cursor-pointer"
                                                    >
                                                        <i
                                                            className={
                                                                showPasswords.confirm
                                                                    ? "ri-eye-off-line text-lg"
                                                                    : "ri-eye-line text-lg"
                                                            }
                                                        ></i>
                                                    </button>
                                                </div>
                                            </div>
                                        </form>
                                    </div>

                                    <div className="pt-6">
                                        <button
                                            type="submit"
                                            form="passwordForm"
                                            disabled={passLoading}
                                            className="w-full py-3 bg-foreground-900 hover:bg-foreground-800 text-background-50 font-semibold rounded-xl text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                                        >
                                            {passLoading ? (
                                                <i className="ri-loader-4-line animate-spin text-lg"></i>
                                            ) : (
                                                <i className="ri-key-2-line text-lg"></i>
                                            )}
                                            Update Password
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </main>
        </div>
    );
}