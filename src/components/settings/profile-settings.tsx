"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, LoaderCircle, UserRound } from "lucide-react";
import { FormEvent } from "react";

import { getSettings, saveSettings } from "@/actions/settings-actions";
import { Button } from "@/components/ui/button";
import { QUERY_KEYS } from "@/lib/query-keys";

export function ProfileSettings() {
  const queryClient = useQueryClient();
  const settings = useQuery({ queryKey: QUERY_KEYS.settings, queryFn: getSettings });
  const save = useMutation({
    mutationFn: saveSettings,
    onSuccess: async (data) => {
      queryClient.setQueryData(QUERY_KEYS.settings, (current: typeof settings.data) => ({
        ...current,
        ...data,
      }));
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.addonInstallation });
    },
  });

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    save.mutate({
      firstName: String(form.get("firstName")),
      lastName: String(form.get("lastName")),
    });
  }

  if (settings.isPending) {
    return <div className="mt-10 grid min-h-52 place-items-center border border-white/10"><LoaderCircle className="size-5 animate-spin text-stone-600" /></div>;
  }

  if (settings.isError || !settings.data) {
    return <p className="mt-10 border border-red-300/15 bg-red-300/[0.04] p-4 text-sm text-red-200/70">Unable to load your profile.</p>;
  }

  return (
    <form onSubmit={submit} className="mt-10 max-w-3xl border border-white/10 bg-white/[0.02] p-6 sm:p-8">
      <div className="flex items-center gap-3 border-b border-white/8 pb-6">
        <span className="grid size-10 place-items-center rounded-full border border-white/10 bg-white/[0.03]"><UserRound className="size-4 text-amber-100/55" /></span>
        <div>
          <h2 className="font-heading text-2xl text-stone-100">Personal details</h2>
          <p className="mt-1 text-xs text-stone-600">Your first name also names your Stremio catalog row.</p>
        </div>
      </div>

      <div className="mt-7 grid gap-5 sm:grid-cols-2">
        <Field label="First name" name="firstName" defaultValue={settings.data.firstName} autoComplete="given-name" />
        <Field label="Last name" name="lastName" defaultValue={settings.data.lastName} autoComplete="family-name" />
      </div>
      <label className="mt-5 block">
        <span className="mb-2 block text-[10px] font-medium tracking-[0.18em] text-stone-400 uppercase">Email address</span>
        <input disabled value={settings.data.email} className="h-12 w-full rounded-sm border border-white/8 bg-black/20 px-4 text-sm text-stone-600" />
      </label>

      {(save.isError || save.isSuccess) && (
        <p role="status" className={`mt-5 text-xs ${save.isError ? "text-red-200/70" : "text-emerald-200/65"}`}>
          {save.isError
            ? save.error instanceof Error ? save.error.message : "Unable to save your settings."
            : "Your profile and Stremio catalog name have been updated."}
        </p>
      )}

      <Button type="submit" disabled={save.isPending} className="mt-7 h-11 rounded-full bg-stone-100 px-6 text-[10px] tracking-[0.14em] text-stone-950 uppercase hover:bg-amber-100">
        {save.isPending ? <LoaderCircle className="animate-spin" /> : save.isSuccess ? <Check /> : null}
        {save.isPending ? "Saving" : "Save profile"}
      </Button>
    </form>
  );
}

function Field(props: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  const { label, ...inputProps } = props;
  return (
    <label className="block">
      <span className="mb-2 block text-[10px] font-medium tracking-[0.18em] text-stone-400 uppercase">{label}</span>
      <input required={inputProps.name === "firstName"} className="h-12 w-full rounded-sm border border-white/10 bg-white/[0.035] px-4 text-sm text-stone-100 outline-none transition focus:border-amber-100/45 focus:ring-2 focus:ring-amber-100/10" {...inputProps} />
    </label>
  );
}
