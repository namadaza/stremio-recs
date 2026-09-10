import { AddonInstallation } from "@/components/installation/addon-installation";

export default function InstallationPage() {
  return (
    <section className="mx-auto w-full max-w-6xl">
      <p className="text-[10px] tracking-[0.22em] text-amber-100/55 uppercase">Stremio add-on</p>
      <h1 className="mt-4 font-heading text-5xl text-stone-50 sm:text-6xl">
        Take Taste with you.
      </h1>
      <p className="mt-5 max-w-2xl text-sm leading-7 text-stone-500">
        Install your personal add-on to put this week&apos;s selection directly on your Stremio home screen. New Taste selections automatically replace the movies in your row.
      </p>
      <AddonInstallation />
    </section>
  );
}
