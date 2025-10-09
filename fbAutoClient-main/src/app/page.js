"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Montserrat } from "next/font/google";
const monte = Montserrat({subsets: ['latin']})

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    // Replace this with real auth check
    const isLoggedIn = localStorage.getItem("token"); // example: JWT in localStorage

    if (isLoggedIn) {
      router.replace("/dashboard"); // redirect to dashboard if logged in
    } else {
      router.replace("/auth/login"); // redirect to login if not
    }
  }, [router]);

  return (
    <div className={`flex items-center justify-center min-h-screen bg-black text-white ${monte.className}`}>
      <p>Loading...</p>
    </div>
  );
}
