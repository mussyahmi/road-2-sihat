"use client";

import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { ThemeToggle } from "@/components/theme-toggle";
import { PWAInstallButton } from "@/components/pwa-install";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Activity, LogOut, ChevronDown } from "lucide-react";
import { version } from "../../package.json";

export function Navbar() {
  const { user, signOutUser } = useAuth();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/90 backdrop-blur-md">
      <div className="container mx-auto flex h-14 items-center justify-between px-4">

        <Link href="/dashboard" className="flex items-center gap-2.5 group">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-primary/25 bg-primary/10 transition-colors group-hover:bg-primary/15">
            <Activity className="h-4 w-4 text-primary" />
          </div>
          <span className="font-semibold text-sm tracking-tight">Road2Sihat</span>
          <span className="font-data text-[10px] text-muted-foreground/50">v{version}</span>
        </Link>

        <div className="flex items-center gap-1">
          <PWAInstallButton />
          <ThemeToggle />

          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 hover:bg-accent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ml-0.5">
              <Avatar className="h-6 w-6">
                <AvatarImage src={user?.photoURL ?? ""} alt={user?.displayName ?? "User"} />
                <AvatarFallback className="text-[10px] font-semibold bg-primary/15 text-primary">
                  {user?.displayName?.charAt(0).toUpperCase() ?? "U"}
                </AvatarFallback>
              </Avatar>
              <ChevronDown className="h-3 w-3 text-muted-foreground" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <div className="px-2.5 py-2.5">
                <p className="text-sm font-semibold truncate">{user?.displayName}</p>
                <p className="text-xs text-muted-foreground truncate mt-0.5">{user?.email}</p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={signOutUser}
                className="text-destructive focus:text-destructive cursor-pointer text-sm gap-2"
              >
                <LogOut className="h-3.5 w-3.5" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

      </div>
    </header>
  );
}
