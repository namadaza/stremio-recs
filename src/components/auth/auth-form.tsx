"use client";

import { LoaderCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string>();
  const isSignup = mode === "signup";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsPending(true);
    setError(undefined);

    const form = new FormData(event.currentTarget);
    const email = String(form.get("email"));
    const password = String(form.get("password"));

    const result = isSignup
      ? await authClient.signUp.email({
        name: String(form.get("name")),
        email,
        password,
      })
      : await authClient.signIn.email({ email, password, rememberMe: true });

    if (result.error) {
      setError(result.error.message ?? "We could not complete that request.");
      setIsPending(false);
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="mt-9 space-y-5">
      {isSignup && (
        <Field label="Your name" name="name" type="text" autoComplete="name" />
      )}
      <Field label="Email address" name="email" type="email" autoComplete="email" />
      <Field
        label="Password"
        name="password"
        type="password"
        autoComplete={isSignup ? "new-password" : "current-password"}
        hint={isSignup ? "At least 8 characters" : undefined}
      />

      {error && (
        <p className="border-l border-red-400/60 pl-3 text-sm text-red-200" role="alert">
          {error}
        </p>
      )}

      <Button
        type="submit"
        size="lg"
        disabled={isPending}
        className="h-12 w-full rounded-full bg-stone-100 text-[11px] tracking-[0.16em] text-stone-950 uppercase hover:bg-amber-100"
      >
        {isPending && <LoaderCircle className="animate-spin" />}
        {isSignup ? "Create your account" : "Enter your screening room"}
      </Button>

      <p className="text-center text-xs text-stone-500">
        {isSignup ? "Already have an account?" : "New to Taste?"}{" "}
        <Link
          href={isSignup ? "/login" : "/signup"}
          className="text-amber-100/80 underline-offset-4 hover:underline"
        >
          {isSignup ? "Log in" : "Create an account"}
        </Link>
      </p>
    </form>
  );
}

function Field({
  label,
  hint,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: string }) {
  return (
    <label className="block">
      <span className="mb-2 flex justify-between text-[10px] font-medium tracking-[0.18em] text-stone-400 uppercase">
        {label}
        {hint && <span className="normal-case tracking-normal text-stone-600">{hint}</span>}
      </span>
      <input
        required
        className="h-12 w-full rounded-sm border border-white/10 bg-white/[0.035] px-4 text-sm text-stone-100 outline-none transition focus:border-amber-100/45 focus:ring-2 focus:ring-amber-100/10"
        {...props}
      />
    </label>
  );
}
