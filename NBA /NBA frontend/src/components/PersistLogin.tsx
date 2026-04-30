import { useEffect, useRef } from "react";
import useRefreshToken from "../hooks/useRefreshToken";
import useAuth from "../hooks/useAuth";
import { useNavigate } from "react-router-dom";

const PersistLogin = ({ children }: { children: React.ReactNode }) => {
  const refresh = useRefreshToken();
  const { auth, setAuth } = useAuth();
  const navigate = useNavigate();
  const effectRan = useRef(false); // 👈 prevent double run in dev

  useEffect(() => {
    if (effectRan.current === true) return;

    const verifyRefreshToken = async () => {
      try {
        if (!auth?.accessToken) {
          const newAccessToken = await refresh();
          console.log("Restored session with new access token:", newAccessToken);
          navigate("/");
        }
      } catch (err) {
        console.error("No refresh token or refresh failed", err);
        setAuth({}); 
        navigate("/login");
      }
    };

    verifyRefreshToken();

    effectRan.current = true;
  }, []);

  return <>{children}</>;
};

export default PersistLogin;
