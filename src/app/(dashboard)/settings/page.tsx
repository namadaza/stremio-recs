import { ProfileSettings } from "@/components/settings/profile-settings";

export default function SettingsPage() {
  return (
    <section className="mx-auto w-full max-w-6xl">
      <p className="text-[10px] tracking-[0.22em] text-amber-100/55 uppercase">Account</p>
      <h1 className="mt-4 font-heading text-5xl text-stone-50 sm:text-6xl">Your settings.</h1>
      <p className="mt-5 max-w-xl text-sm leading-7 text-stone-500">
        Keep your profile details current and choose the name Stremio shows for your Taste catalog.
      </p>
      <ProfileSettings />
    </section>
  );
}
