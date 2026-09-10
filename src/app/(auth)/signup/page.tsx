import { AuthForm } from "@/components/auth/auth-form";

export default function SignupPage() {
  return (
    <>
      <p className="text-[10px] tracking-[0.24em] text-amber-100/55 uppercase">Begin your collection</p>
      <h1 className="mt-3 font-heading text-4xl text-stone-50">Shape your Taste.</h1>
      <p className="mt-3 text-sm leading-6 text-stone-500">
        Build a private catalog guided by the films you love.
      </p>
      <AuthForm mode="signup" />
    </>
  );
}
