"use client";

import { useState, useEffect } from "react";
import axiosInstance from "../../lib/axios";
import Sidebar from "../components/Sidebar";
import { Montserrat } from "next/font/google";
import { Eye, EyeOff } from "lucide-react";

const monte = Montserrat({ subsets: ['latin'] });

export default function Profile() {
  const [showPassword, setShowPassword] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await axiosInstance.get("/auth/profile");
        setUser(res.data);
      } catch (err) {
        console.error("Failed to fetch profile:", err);
        setError("Failed to load profile data");
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen bg-gray-100">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-black">Loading profile...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen bg-gray-100">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-red-600">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex h-screen bg-gray-100 ${monte.className}`}>
      <Sidebar />
      <div className="flex-1 flex items-center justify-center p-4">
        <div
          className={`w-full max-w-lg bg-white p-8 rounded-xl shadow-[0_1px_1px_rgba(0,0,0,0.05),0_4px_6px_rgba(34,42,53,0.04),0_24px_68px_rgba(47,48,55,0.05),0_2px_3px_rgba(0,0,0,0.04)]`}
        >
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Username</label>
              <p className="font-medium text-black text-lg">{user?.username}</p>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Email</label>
              <p className="font-medium text-black text-lg">{user?.email}</p>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Facebook Credentials</label>
              {user?.facebookCredentials ? (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Facebook Email</label>
                    <p className="font-medium text-black">{user.facebookCredentials.email}</p>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Facebook Password</label>
                    <div className="flex items-center gap-2 border border-gray-300 px-3 py-2 rounded-lg bg-white">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={user.facebookCredentials.password}
                        readOnly
                        className="flex-1 bg-transparent outline-none text-black"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="text-gray-600 hover:text-black transition-colors "
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-gray-600">No Facebook credentials found</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
