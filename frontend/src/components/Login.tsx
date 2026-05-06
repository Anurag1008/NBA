import { useRef, useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import useAuth from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import axios from '../api/axios';
import type { AxiosError } from 'axios';
import { jwtDecode } from "jwt-decode";
import { CircularProgress, Alert } from '@mui/material';
import { MdOutlineEmail, MdOutlineLock } from 'react-icons/md';

interface AccessTokenPayload {
  email: string;
  roles: string[];
}

const LOGIN_URL = '/auth/signin';

const Login: React.FC = () => {
  const { setAuth } = useAuth();
  const navigate = useNavigate();

  const userRef = useRef<HTMLInputElement>(null);
  const errRef = useRef<HTMLDivElement>(null);

  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [errMsg, setErrMsg] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    userRef.current?.focus();
  }, []);

  useEffect(() => {
    setErrMsg('');
  }, [email, password]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
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
        const decoded: AccessTokenPayload = jwtDecode(accessToken);
        setAuth({
          email: decoded.email,
          roles: decoded.roles,
          accessToken,
        });

        setEmail("");
        setPassword("");
        navigate("/");
      }
    } catch (err) {
      const axiosError = err as AxiosError;
      if (!axiosError?.response) {
        setErrMsg("No Server Response");
      } else if (axiosError.response.status === 400) {
        setErrMsg("Missing Email or Password");
      } else if (axiosError.response.status === 401) {
        setErrMsg("Invalid email or password");
      } else {
        setErrMsg("Login failed. Please try again.");
      }
      errRef.current?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-600 rounded-lg mb-4">
            <span className="text-white text-xl font-bold">NBA</span>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Welcome Back</h1>
          <p className="text-slate-600">Sign in to your account to continue</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-8 transition-all duration-300 hover:shadow-xl">
          {errMsg && (
            <div ref={errRef} className="mb-6 animate-in">
              <Alert severity="error" className="rounded-lg">
                {errMsg}
              </Alert>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-semibold text-slate-700">
                Email Address
              </label>
              <div className="relative">
                <MdOutlineEmail className="absolute left-3 top-3.5 text-slate-400 text-xl" />
                <input
                  type="email"
                  id="email"
                  ref={userRef}
                  autoComplete="off"
                  onChange={(e) => setEmail(e.target.value)}
                  value={email}
                  required
                  disabled={isLoading}
                  className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 disabled:bg-slate-50 disabled:text-slate-500"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-semibold text-slate-700">
                Password
              </label>
              <div className="relative">
                <MdOutlineLock className="absolute left-3 top-3.5 text-slate-400 text-xl" />
                <input
                  type="password"
                  id="password"
                  onChange={(e) => setPassword(e.target.value)}
                  value={password}
                  required
                  disabled={isLoading}
                  className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 disabled:bg-slate-50 disabled:text-slate-500"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-all duration-200 transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <CircularProgress size={20} sx={{ color: 'inherit' }} />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <p className="text-center text-sm text-slate-600 mt-6">
            Need help? Contact support for assistance.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
