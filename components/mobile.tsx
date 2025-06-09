"use client"

import { Menu, Moon, Sun } from "lucide-react";
import { SidebarTrigger } from "./ui/sidebar";
import { Button } from "./ui/button";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export default function Mobile() {
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    // useEffect only runs on the client, so now we can safely show the UI
    useEffect(() => {
        setMounted(true);
    }, []);

    // Don't render theme toggle until after hydration
    if (!mounted) {
        return (
            <header className="flex md:hidden items-center justify-between p-4 border-b border-green-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                <div className="flex items-center gap-3">
                  <SidebarTrigger className="text-green-700 dark:text-white hover:bg-green-100 dark:hover:bg-slate-800">
                    <Menu className="w-5 h-5" />
                  </SidebarTrigger>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-green-600 rounded flex items-center justify-center">
                      <span className="text-white text-sm font-bold">AI</span>
                    </div>
                    <span className="font-semibold text-green-900 dark:text-white">AI.chat</span>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-green-700 hover:bg-green-100 dark:text-white dark:hover:bg-slate-800"
                  disabled
                >
                  <div className="w-4 h-4" /> {/* Placeholder to maintain layout */}
                </Button>
            </header>
        );
    }

    return (
        <header className="flex md:hidden items-center justify-between p-4 border-b border-green-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <div className="flex items-center gap-3">
              <SidebarTrigger className="text-green-700 dark:text-white hover:bg-green-100 dark:hover:bg-slate-800">
                <Menu className="w-5 h-5" />
              </SidebarTrigger>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-green-600 rounded flex items-center justify-center">
                  <span className="text-white text-sm font-bold">AI</span>
                </div>
                <span className="font-semibold text-green-900 dark:text-white">AI.chat</span>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="text-green-700 hover:bg-green-100 dark:text-white dark:hover:bg-slate-800"
            >
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </Button>
        </header>
    );
}