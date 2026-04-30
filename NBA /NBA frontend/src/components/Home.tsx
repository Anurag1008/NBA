import { useNavigate } from "react-router-dom";

import useAuth from "../hooks/useAuth";
import Sidebar from "./Sidebar";
import { Outlet } from "react-router-dom";


const Home = () => {
    const { setAuth } = useAuth();
    const navigate = useNavigate();

    const logout = async () => {
        setAuth({});
        navigate('/linkpage');
    }

    return (
        <div className="flex min-h-screen">
            <div><Sidebar /></div>

            {/* Right side changes depending on child route */}
            <main className="ml-16  flex-1 bg-blue-300 p-6 ">
                <div className="h-screen flex items-center justify-center ">
                    <Outlet />
                </div>

            </main>

        </div>
    )
}

export default Home