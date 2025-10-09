"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { User, LayoutDashboard, Briefcase, Users } from "lucide-react";

import { Montserrat } from "next/font/google";

const monte = Montserrat({subsets: ['latin']})

const Sidebar = () => {
  const pathname = usePathname();

  const menu = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Job Posts", href: "/job-posts", icon: Briefcase },
    { name: "Candidates", href: "/candidates", icon: Users },
  ];

  return (
    <div className={`w-64 h-screen bg-white text-black flex flex-col p-4 shadow-lg ${monte.className}`}>
      <div>
        <h1 className="text-xl font-bold mb-6  text-black">HR Portal</h1>
        <div className="border-b"></div>
        <ul className="space-y-4 mt-6">
          {menu.map((item) => (
            <li key={item.name}>
              <Link
                href={item.href}
                className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 ${
                  pathname === item.href
                    ? "bg-black text-white"
                    : "text-black hover:bg-gray-100"
                }`}
              >
                <item.icon size={20} />
                <span className="font-medium">{item.name}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-4">
        <Link
          href="/profile"
          className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 ${
            pathname === "/profile"
              ? "bg-black text-white"
              : "text-black hover:bg-gray-100"
          }`}
        >
          <User size={20} />
          <span className="font-medium">Profile</span>
        </Link>
      </div>
    </div>
  );
};

export default Sidebar;
