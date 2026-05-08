import { IoLogOut } from "react-icons/io5";
import { MdDashboardCustomize, MdSchool, MdAssignment, MdPerson, MdChevronLeft, MdChevronRight, MdAdd, MdPeople } from "react-icons/md";
import { useNavigate, useLocation } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import useAxiosPrivate from "../hooks/useAxiosPrivate";

type NavItem = {
    icon: React.ReactNode;
    text: string;
    path: string;
    roles: string[];
};

const ALL_ROLES = [
    "ROLE_ADMIN",
    "ROLE_PRINCIPAL",
    "ROLE_NBA_COORDINATOR",
    "ROLE_HOD",
    "ROLE_NBA_COORDINATOR_DEPT",
    "ROLE_FACULTY",
];

const navItems: NavItem[] = [
    { icon: <MdDashboardCustomize size={22} />, text: "Dashboard", path: "/dashboard", roles: ALL_ROLES },
    { icon: <MdSchool size={22} />, text: "Institutes", path: "/institute", roles: ["ROLE_ADMIN"] },
    { icon: <MdPeople size={22} />, text: "Users", path: "/users", roles: ["ROLE_ADMIN"] },
    { icon: <MdPeople size={22} />, text: "Institute Users", path: "/principal/users", roles: ["ROLE_PRINCIPAL", "ROLE_NBA_COORDINATOR"] },
    { icon: <MdAssignment size={22} />, text: "Tasks", path: "/tasks", roles: ALL_ROLES },
    { icon: <MdPerson size={22} />, text: "Profile", path: "/profile", roles: ALL_ROLES },
];

type SidebarProps = {
    collapsed: boolean;
    onToggle: () => void;
};

export const Sidebar = ({ collapsed, onToggle }: SidebarProps) => {
    const navigate = useNavigate();
    const location = useLocation();
    const { auth, setAuth } = useAuth();
    const axiosPrivate = useAxiosPrivate();

    const handleLogout = async () => {
        try {
            await axiosPrivate.post("/auth/signout");
        } catch {
            // Proceed with local logout even if server call fails
        }
        setAuth(null);
        navigate("/login");
    };

    const visible = navItems.filter((item) =>
        item.roles.some((r) => auth?.roles?.includes(r))
    );

    const isActive = (path: string) => location.pathname.startsWith(path);

    return (
        <div
            className={`fixed top-0 left-0 h-screen flex flex-col bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white shadow-2xl border-r border-slate-700/50 transition-all duration-300 z-40 ${
                collapsed ? "w-[72px]" : "w-[240px]"
            }`}
        >
            {/* Logo */}
            <div className="flex items-center h-16 border-b border-slate-700/50 px-4 overflow-hidden shrink-0">
                <div className="w-9 h-9 min-w-[36px] bg-blue-600 rounded-lg flex items-center justify-center font-bold text-sm shrink-0 shadow-lg">
                    NBA
                </div>
                {!collapsed && (
                    <div className="ml-3 overflow-hidden">
                        <p className="text-white font-bold text-sm leading-tight whitespace-nowrap">NBA Portal</p>
                        <p className="text-slate-400 text-xs whitespace-nowrap">Accreditation System</p>
                    </div>
                )}
            </div>

            {/* Navigation */}
            <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
                {visible.map((item) => {
                    const active = isActive(item.path);
                    return (
                        <button
                            key={item.path}
                            onClick={() => navigate(item.path)}
                            title={collapsed ? item.text : undefined}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
                                active
                                    ? "bg-blue-600 text-white shadow-lg shadow-blue-900/40"
                                    : "text-slate-300 hover:bg-slate-700/70 hover:text-white"
                            }`}
                        >
                            <span className="shrink-0">{item.icon}</span>
                            {!collapsed && (
                                <span className="text-sm font-medium whitespace-nowrap">{item.text}</span>
                            )}
                        </button>
                    );
                })}

                {/* Quick Actions (admin only, expanded only) */}
                {!collapsed && auth?.roles?.includes("ROLE_ADMIN") && (
                    <div className="pt-4 mt-4 border-t border-slate-700/50">
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-3 mb-2">
                            Quick Actions
                        </p>
                        <button
                            onClick={() => navigate("/create-institute")}
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-300 hover:bg-slate-700/70 hover:text-white transition-all duration-200"
                        >
                            <MdAdd size={22} className="shrink-0 text-emerald-400" />
                            <span className="text-sm font-medium whitespace-nowrap">New Institute</span>
                        </button>
                    </div>
                )}
            </nav>

            {/* Bottom: user info + logout */}
            <div className="border-t border-slate-700/50 p-2 shrink-0">
                {!collapsed && (
                    <div className="px-3 py-2 mb-1">
                        <p
                            className="text-xs text-slate-300 font-medium truncate"
                            title={auth?.email}
                        >
                            {auth?.email}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">
                            {auth?.roles?.map((r) => r.replace("ROLE_", "")).join(", ")}
                        </p>
                    </div>
                )}
                <button
                    onClick={handleLogout}
                    title={collapsed ? "Logout" : undefined}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-red-400 hover:bg-red-900/30 hover:text-red-300 transition-all duration-200"
                >
                    <IoLogOut size={22} className="shrink-0" />
                    {!collapsed && <span className="text-sm font-medium">Logout</span>}
                </button>
            </div>

            {/* Collapse toggle */}
            <button
                onClick={onToggle}
                title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                className="absolute -right-3 top-20 w-6 h-6 bg-slate-700 hover:bg-slate-600 border border-slate-600 rounded-full flex items-center justify-center text-slate-300 hover:text-white transition-all duration-200 shadow-lg z-50"
            >
                {collapsed ? <MdChevronRight size={14} /> : <MdChevronLeft size={14} />}
            </button>
        </div>
    );
};

export default Sidebar;
