import { useRef, useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import useAuth from '../hooks/useAuth';
import { useNavigate, } from 'react-router-dom'; //Location commmented out
import axios from '../api/axios';
import type { AxiosError } from 'axios';
import {jwtDecode} from "jwt-decode";

interface AccessTokenPayload {
  email: string;
  roles: string[];
}

const LOGIN_URL = '/auth/signin';

const Login: React.FC = () => {
  const { setAuth } = useAuth();
  const navigate = useNavigate();
  //   const location = useLocation();
  //   const from = (location.state as any)?.from?.pathname || "/";

  const userRef = useRef<HTMLInputElement>(null);
  const errRef = useRef<HTMLParagraphElement>(null);

  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [errMsg, setErrMsg] = useState<string>('');

  useEffect(() => {
    userRef.current?.focus();
  }, []);

  useEffect(() => {
    setErrMsg('');
  }, [email, password]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      const response = await axios.post(
        LOGIN_URL,
        JSON.stringify({ email, password }),
        {
          headers: { 'Content-Type': 'application/json' },
          withCredentials: true,
        }
      );

      const accessToken = response?.data?.accessToken;

      if (accessToken) {
        // Decode JWT to get user info
        const decoded: AccessTokenPayload = jwtDecode(accessToken);
        console.log(decoded);
        setAuth({
          email: decoded.email,
          roles: decoded.roles,
          accessToken,
        });

        setEmail("");
        setPassword("");
        navigate("/"); // redirect after login
      }
    } catch (err) {
      const axiosError = err as AxiosError;
      if (!axiosError?.response) {
        setErrMsg("No Server Response");
      } else if (axiosError.response.status === 400) {
        setErrMsg("Missing Username or Password");
      } else if (axiosError.response.status === 401) {
        setErrMsg("Unauthorized");
      } else {
        setErrMsg("Login Failed");
      }
      errRef.current?.focus();
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 p-4">
      <section className="bg-white shadow-lg rounded-lg p-8 w-full max-w-md">
        {/* Error message */}
        {errMsg && (
          <p
            ref={errRef}
            className="mb-4 text-red-600 font-semibold text-center"
            aria-live="assertive"
          >
            {errMsg}
          </p>
        )}

        <h1 className="text-2xl font-bold text-center mb-6">Sign In</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="Emial" className="block text-gray-700 mb-1">
              Email
            </label>
            <input
              type="text"
              id="username"
              ref={userRef}
              autoComplete="off"
              onChange={(e) => setEmail(e.target.value)}
              value={email}
              required
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              id="password"
              onChange={(e) => setPassword(e.target.value)}
              value={password}
              required
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition-colors"
          >
            Log In
          </button>
        </form>


      </section>
    </div>
  );
};

export default Login;
