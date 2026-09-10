import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { Clock3, Compass, Search, SlidersHorizontal, Tv } from "lucide-react";

import { SignOutButton } from "@/components/auth/sign-out-button";
import { auth } from "@/lib/auth";

const navigation = [
  { href: "/", label: "This week", icon: Compass },
  { href: "/search", label: "Search", icon: Search },
  { href: "/algorithm", label: "Your algorithm", icon: SlidersHorizontal },
  { href: "/history", label: "Archive", icon: Clock3 },
  { href: "/installation", label: "Install add-on", icon: Tv },
];

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user) redirect("/login");

  return (
    <div className="cinema-shell relative isolate min-h-svh overflow-hidden text-foreground">
      <div className="cinema-grain" aria-hidden="true" />
      <div className="cinema-lines" aria-hidden="true" />
      <header className="relative z-20 flex h-17 items-center justify-between border-b border-white/8 px-5 sm:px-8 lg:px-12">
        <Link href="/" className="flex items-center gap-3">
          <span className="grid size-8 place-items-center rounded-full border border-white/15 bg-white/[0.04] font-heading text-sm italic">T</span>
          <span className="text-[11px] font-medium tracking-[0.28em] uppercase">Taste</span>
        </Link>
        <div className="flex items-center gap-5">
          <span className="hidden text-xs text-stone-600 sm:inline">{session.user.email}</span>
          <SignOutButton />
        </div>
      </header>

      <div className="relative z-10 mx-auto grid max-w-[1500px] lg:grid-cols-[220px_1fr]">
        <aside className="border-b border-white/8 px-5 py-4 lg:min-h-[calc(100svh-4.25rem)] lg:border-r lg:border-b-0 lg:px-7 lg:py-10">
          <nav className="flex gap-1 overflow-x-auto lg:flex-col lg:gap-2">
            {navigation.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className="flex shrink-0 items-center gap-3 rounded-sm px-3 py-2.5 text-[10px] tracking-[0.12em] text-stone-500 uppercase transition hover:bg-white/[0.04] hover:text-stone-100"
              >
                <Icon className="size-3.5 text-amber-100/55" strokeWidth={1.5} />
                {label}
              </Link>
            ))}
          </nav>
          <div className="mt-12 hidden border-t border-white/8 pt-6 lg:block">
            <p className="text-[9px] tracking-[0.18em] text-stone-700 uppercase">Next curation</p>
            <p className="mt-2 font-heading text-lg italic text-stone-400">Every Sunday</p>
          </div>
        </aside>
        <main className="min-w-0 px-5 py-10 sm:px-8 lg:px-12 lg:py-14">{children}</main>
      </div>
    </div>
  );
}
