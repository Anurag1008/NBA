import axios from "../api/axios";
import useAuth from "./useAuth";
import { jwtDecode } from "jwt-decode";

const useRefreshToken = () => {
  const { setAuth } = useAuth();

  const refresh = async (): Promise<string> => {
    const response = await axios.get<{ accessToken: string }>("/auth/refreshtoken", {
      withCredentials: true,
    });

    setAuth((prev) => {
      const decoded: any = jwtDecode(response.data.accessToken);
      console.log(JSON.stringify(prev));
      console.log(response.data.accessToken);
      return {
        ...prev,
        email: decoded.email,
        roles: decoded.roles,
        accessToken: response.data.accessToken,
      };
    });

    return response.data.accessToken;
  };

  return refresh;
};

export default useRefreshToken;
