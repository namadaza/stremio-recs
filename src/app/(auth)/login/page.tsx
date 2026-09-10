import { AuthForm } from "@/components/auth/auth-form";

export default function LoginPage() {
  return (
    <>
      <p className="text-[10px] tracking-[0.24em] text-amber-100/55 uppercase">Private screening room</p>
      <h1 className="mt-3 font-heading text-4xl text-stone-50">Welcome back.</h1>
      <p className="mt-3 text-sm leading-6 text-stone-500">
        Sign in to return to your weekly selection.
      </p>
      <AuthForm mode="login" />
    </>
  );
}
