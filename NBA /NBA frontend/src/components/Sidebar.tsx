import { IoHome, IoLogOut } from "react-icons/io5";
import { IoMdAddCircle } from "react-icons/io";
import { MdDashboardCustomize } from "react-icons/md";
import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import useAuth from "../hooks/useAuth";

export const Sidebar = () => {
    const navigate = useNavigate();

    const { auth, setAuth } = useAuth();

    const handleLogout = () => {
        setAuth(null); // clear context
        //todo !!!!
        // do a post request here. 
        navigate("/login");
    };

    return (
        <div className="fixed top-0 left-0 h-screen w-16 m-0 flex flex-col bg-white text-white">
            <div onClick={() => navigate("/")}>
                <SideBarIcon icon={<IoHome size={28} />} text="Home" />
            </div>
            <div onClick={() => navigate("/dashboard")}>
                <SideBarIcon icon={<MdDashboardCustomize size={28} />} text="Dashboard" />
            </div>

            {auth?.roles?.includes("ROLE_ADMIN") && (
                <div onClick={() => navigate("/create-institute")}>
                    <SideBarIcon icon={<IoMdAddCircle size={28} />} text="Create Institute" />
                </div>
            )}

            <div onClick={handleLogout}>
                <SideBarIcon icon={<IoLogOut size={28} />} text="Logout" />
            </div>
            

        </div >
    );
};

type SideBarIconProps = {
    icon: ReactNode;  // any valid JSX (like <IoHome />)
    text: string;
};

const SideBarIcon = ({ icon, text }: SideBarIconProps) => (
    <div className="sidebar-icon group">
        {icon}
        <span className="sidebar-tooltip group-hover:scale-100">{text}</span>
    </div>
);

export default Sidebar;
