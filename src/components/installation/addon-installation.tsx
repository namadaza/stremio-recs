"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Copy, ExternalLink, KeyRound, LoaderCircle, RotateCcw, Tv } from "lucide-react";
import { useState } from "react";

import { getAddonInstallation, regenerateAddonInstallation } from "@/actions/addon-actions";
import { Button, buttonVariants } from "@/components/ui/button";
import { QUERY_KEYS } from "@/lib/query-keys";
import { cn } from "@/lib/utils";

export function AddonInstallation() {
  const queryClient = useQueryClient();
  const [copied, setCopied] = useState(false);
  const installation = useQuery({
    queryKey: QUERY_KEYS.addonInstallation,
    queryFn: getAddonInstallation,
  });
  const regenerate = useMutation({
    mutationFn: regenerateAddonInstallation,
    onSuccess: (data) => queryClient.setQueryData(QUERY_KEYS.addonInstallation, data),
  });

  async function copyManifest() {
    if (!installation.data) return;
    await navigator.clipboard.writeText(installation.data.manifestUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  if (installation.isPending) {
    return (
      <div className="mt-10 grid min-h-52 place-items-center border border-white/10 bg-white/[0.02] text-stone-600">
        <LoaderCircle className="size-5 animate-spin" />
      </div>
    );
  }

  if (installation.isError || !installation.data) {
    return (
      <p className="mt-10 border border-red-300/15 bg-red-300/[0.04] p-4 text-sm text-red-200/70">
        {installation.error instanceof Error ? installation.error.message : "Unable to prepare your add-on."}
      </p>
    );
  }

  const data = installation.data;

  return (
    <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_0.72fr]">
      <div className="border border-white/10 bg-white/[0.02] p-6 sm:p-8">
        <div className="flex items-start justify-between gap-5">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-full border border-amber-100/15 bg-amber-100/[0.04]">
              <Tv className="size-4 text-amber-100/65" />
            </span>
            <div>
              <p className="text-[9px] tracking-[0.18em] text-stone-600 uppercase">Your private catalog</p>
              <h2 className="mt-1 font-heading text-2xl text-stone-100">{data.catalogName}</h2>
            </div>
          </div>
          <span className="flex items-center gap-2 text-[9px] tracking-[0.14em] text-emerald-200/55 uppercase">
            <span className="size-1.5 rounded-full bg-emerald-300/70" /> Ready
          </span>
        </div>

        <div className="mt-7 break-all rounded-sm border border-white/8 bg-black/30 p-4 font-mono text-[11px] leading-5 text-stone-500">
          {data.manifestUrl}
        </div>

        {!data.isSecure && (
          <p className="mt-3 text-xs leading-5 text-amber-100/55">
            Stremio requires HTTPS unless this app is served from 127.0.0.1. Use your deployed URL for installation.
          </p>
        )}

        <div className="mt-5 flex flex-wrap gap-2">
          <a
            href={data.installUrl}
            className={cn(
              buttonVariants(),
              "h-10 rounded-full bg-stone-100 px-5 text-[10px] tracking-[0.14em] text-stone-950 uppercase hover:bg-amber-100",
            )}
          >
            <ExternalLink /> Open in Stremio
          </a>
          <Button
            type="button"
            variant="outline"
            onClick={copyManifest}
            className="h-10 rounded-full border-white/10 bg-white/[0.03] px-5 text-[10px] tracking-[0.14em] uppercase"
          >
            {copied ? <Check /> : <Copy />} {copied ? "Copied" : "Copy manifest URL"}
          </Button>
        </div>
      </div>

      <ol className="space-y-6 border-l border-white/8 pl-7">
        <InstallStep number="01" title="Install Stremio">
          Download Stremio on desktop, mobile, or TV and sign in to the account where you want this catalog.
        </InstallStep>
        <InstallStep number="02" title="Add your private manifest">
          Select <span className="text-stone-300">Open in Stremio</span>, then approve the add-on. If the app does not open, paste the copied URL into Stremio&apos;s add-on search bar.
        </InstallStep>
        <InstallStep number="03" title="Find your row">
          Return to Stremio&apos;s home screen. Your current recommendations appear in the movie row named <span className="text-stone-300">{data.catalogName}</span>.
        </InstallStep>
        <p className="pt-1 text-[10px] leading-5 text-stone-700">
          Each Taste user gets a different add-on ID, so multiple people can install their own Taste row into the same Stremio account.
        </p>
      </ol>

      <div className="lg:col-span-2 flex flex-col justify-between gap-4 border-t border-white/8 pt-6 sm:flex-row sm:items-center">
        <div className="flex gap-3">
          <KeyRound className="mt-0.5 size-4 shrink-0 text-stone-700" />
          <p className="max-w-xl text-xs leading-5 text-stone-600">
            This URL is a private key to your recommendations. If it is exposed, replace it here and reinstall the add-on in Stremio.
          </p>
        </div>
        <Button
          type="button"
          variant="ghost"
          disabled={regenerate.isPending}
          onClick={() => regenerate.mutate()}
          className="justify-start px-0 text-[9px] tracking-[0.14em] text-stone-600 uppercase hover:bg-transparent hover:text-stone-300 sm:justify-center"
        >
          {regenerate.isPending ? <LoaderCircle className="animate-spin" /> : <RotateCcw />}
          Replace private URL
        </Button>
      </div>
      {regenerate.isError && (
        <p className="text-xs text-red-200/70 lg:col-span-2">
          {regenerate.error instanceof Error ? regenerate.error.message : "Unable to replace the URL."}
        </p>
      )}
    </div>
  );
}

function InstallStep({ number, title, children }: { number: string; title: string; children: React.ReactNode }) {
  return (
    <li className="grid grid-cols-[2rem_1fr] gap-3">
      <span className="font-mono text-[9px] text-amber-100/40">{number}</span>
      <div>
        <h3 className="text-[10px] tracking-[0.16em] text-stone-300 uppercase">{title}</h3>
        <p className="mt-2 text-xs leading-6 text-stone-600">{children}</p>
      </div>
    </li>
  );
}
