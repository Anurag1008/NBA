import { useContext, useDebugValue } from "react";
import AuthContext from "../context/AuthProvider";
import type { AuthContextType } from "../context/AuthProvider";

const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  const { auth } = context;
  useDebugValue(auth, (auth) => (auth?.email ? "Logged In" : "Logged Out"));

  return context;
};

export default useAuth;
