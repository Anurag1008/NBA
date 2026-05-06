import { useState } from "react";
import Sidebar from "./Sidebar";
import { Outlet } from "react-router-dom";

const Home = () => {
    const [collapsed, setCollapsed] = useState(false);

    return (
        <div className="flex min-h-screen bg-slate-50">
            <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} />
            <main
                className={`flex-1 min-h-screen p-6 md:p-8 transition-all duration-300 ${
                    collapsed ? "ml-[72px]" : "ml-[240px]"
                }`}
            >
                <div className="max-w-7xl mx-auto">
                    <div className="animate-in fade-in duration-300">
                        <Outlet />
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Home;
