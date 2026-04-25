"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, UtensilsCrossed, Users, User } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/leaderboard", label: "Leaderboard", icon: BarChart3 },
  { href: "/sessions", label: "Sessions", icon: UtensilsCrossed },
  { href: "/groups", label: "Groups", icon: Users },
  { href: "/profile", label: "Profile", icon: User },
];

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed bottom-0 inset-x-0 border-t border-gray-200 bg-white/95 backdrop-blur z-50">
      <ul className="mx-auto flex max-w-md items-stretch justify-around px-2 pb-[env(safe-area-inset-bottom)]">
        {items.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 py-2 text-xs font-medium",
                  active ? "text-brand" : "text-gray-500",
                )}
              >
                <Icon className="size-6" strokeWidth={active ? 2.5 : 2} />
                <span>{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
