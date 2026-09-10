"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";

import { authClient } from "@/lib/auth-client";

export function SignOutButton() {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={async () => {
        await authClient.signOut();
        router.push("/login");
        router.refresh();
      }}
      className="flex items-center gap-2 text-[10px] tracking-[0.16em] text-stone-500 uppercase transition hover:text-stone-200"
    >
      <LogOut className="size-3.5" />
      Sign out
    </button>
  );
}
