import { createContext, useState } from "react";
import type { ReactNode, Dispatch, SetStateAction } from "react";

type AuthState = {
  email?: string;
  roles?: string[];
  accessToken?: string;
  refreshToken?:string;
};

export type AuthContextType = {
  auth: AuthState | null;
  setAuth: Dispatch<SetStateAction<AuthState | null>>;
};

type AuthProviderProps = {
  children: ReactNode;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [auth, setAuth] = useState<AuthState | null>(null);

  return (
    <AuthContext.Provider value={{ auth, setAuth }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
