"use client";

import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { ThemeToggle } from "@/components/theme-toggle";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Activity, LogOut } from "lucide-react";
import { version } from "../../package.json";

export function Navbar() {
  const { user, signOutUser } = useAuth();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-sm">
      <div className="container mx-auto flex h-14 items-center justify-between px-4">
        <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
          <Activity className="h-5 w-5 text-primary" />
          <span>Road 2 Sihat</span>
          <span className="text-xs text-muted-foreground font-normal">v{version}</span>
        </Link>

        <div className="flex items-center gap-2">
          <ThemeToggle />

          <DropdownMenu>
            <DropdownMenuTrigger className="relative h-8 w-8 rounded-full p-0 inline-flex items-center justify-center hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user?.photoURL ?? ""} alt={user?.displayName ?? "User"} />
                <AvatarFallback>
                  {user?.displayName?.charAt(0).toUpperCase() ?? "U"}
                </AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <div className="px-2 py-1.5 text-sm font-medium truncate">{user?.displayName}</div>
              <div className="px-2 pb-1.5 text-xs text-muted-foreground truncate">{user?.email}</div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={signOutUser} className="text-destructive cursor-pointer">
                <LogOut className="h-4 w-4 mr-2" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
