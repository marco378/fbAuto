"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Montserrat } from "next/font/google";
import { toast } from "sonner";
import axiosInstance from "../../../lib/axios";

const monte = Montserrat({ subsets: ["latin"] });

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        await axiosInstance.get("/auth/profile");
        router.push("/dashboard");
      } catch {
        // Not logged in
      } finally {
        setCheckingAuth(false);
      }
    };
    checkAuth();
  }, [router]);

  const handleLogin = async () => {
    if (!email || !password) return toast.error("Please fill all fields");

    setLoading(true);
    try {
      const response = await axiosInstance.post(
        "/auth/login",
        { email, password },
        { withCredentials: true }
      );
      console.log("Login successful:", response.data);
      toast.success("Logged in successfully!");
      router.push("/dashboard");
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  if (checkingAuth) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-black"></div>
      </div>
    );
  }

  return (
    <div
      className={`flex items-center justify-center min-h-screen bg-gray-100 ${monte.className}`}
    >
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-6">
        {/* Header */}
        <div className="flex justify-center mb-6">
          <h2 className="text-xl font-bold">Login to your account</h2>
        </div>

        {/* Form */}
        <div className="flex flex-col gap-4">
          {/* Email */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">Email</label>
            <input
              type="email"
              placeholder="m@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-[0.5px] focus:ring-neutral-600 focus:border-neutral-700"
            />
          </div>

          {/* Password */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">Password</label>
            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-[0.5px] focus:ring-neutral-600 focus:border-neutral-700"
            />
          </div>

          {/* Button */}
          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full bg-black text-white py-2 rounded-md flex items-center justify-center gap-2 hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
          >
            {loading && (
              <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-white" />
            )}
            {loading ? "Logging in..." : "Login"}
          </button>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center text-sm text-gray-600">
          Don't have an account?{" "}
          <Link
            href="/auth/signup"
            className="font-medium text-black hover:underline"
          >
            Sign up
          </Link>
        </div>
      </div>
    </div>
  );
}
