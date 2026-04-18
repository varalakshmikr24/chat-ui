"use client";

import { signOut, useSession } from "next-auth/react";
import { 
  LogOut, 
  Settings, 
  User as UserIcon,
  ChevronsUpDown,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function UserAccountNav({ isCollapsed = false }: { isCollapsed?: boolean }) {
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const user = session?.user;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!user) return null;

  const initials = user.name
    ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase()
    : user.email?.charAt(0).toUpperCase() || "U";

  const handleSignOut = () => {
    signOut({ callbackUrl: "/login" });
  };

  return (
    <div className="relative w-full" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-3 w-full rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 transition-all duration-200 group text-left",
          isCollapsed ? "justify-center p-2" : "p-2"
        )}
      >
        <div className="relative flex-shrink-0">
          {user.image ? (
            <img 
              src={user.image} 
              alt={user.name || "User"} 
              className="h-8 w-8 rounded-full border border-gray-200 dark:border-white/10 object-cover"
            />
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-white text-xs font-bold shadow-sm ring-2 ring-blue-500/20">
              {initials}
            </div>
          )}
          <div className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white dark:border-[#171717] bg-emerald-500" />
        </div>

        {!isCollapsed && (
          <>
            <div className="flex-1 min-w-0 pr-1">
              <div className="text-sm font-semibold truncate text-gray-900 dark:text-gray-100">
                {user.name || "User"}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {user.email}
              </div>
            </div>
            <ChevronsUpDown size={14} className="text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors" />
          </>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div 
          className={cn(
            "absolute z-50 w-64 bg-white dark:bg-[#212121] border border-gray-200 dark:border-white/10 rounded-xl shadow-2xl py-2 animate-in fade-in slide-in-from-bottom-2 duration-200",
            isCollapsed ? "left-12 bottom-0" : "bottom-full left-0 mb-3"
          )}
        >
          <div className="px-4 py-3 border-b border-gray-100 dark:border-white/5 mb-2">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Account</p>
            <p className="text-sm font-semibold mt-1 truncate dark:text-gray-100">{user.email}</p>
          </div>
          
          <button className="flex items-center gap-3 w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors">
            <UserIcon size={16} />
            <span>Profile settings</span>
          </button>
          
          <button className="flex items-center gap-3 w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors">
            <Settings size={16} />
            <span>Preferences</span>
          </button>

          <div className="my-2 border-t border-gray-100 dark:border-white/5" />
          
          <button 
            onClick={handleSignOut}
            className="flex items-center gap-3 w-full px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
          >
            <LogOut size={16} />
            <span>Log out</span>
          </button>
        </div>
      )}
    </div>
  );
}
