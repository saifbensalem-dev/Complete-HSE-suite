"use client";

import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import { OrgSwitcher } from "@/components/org-switcher";
import { useOrg } from "@/components/org-context";
import { trpc } from "@/trpc/react";

const MAX_LOGO_BYTES = 256 * 1024;
const ACCEPTED_LOGO_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);

export default function CompanyProfilePage() {
  const { organizations, organizationId } = useOrg();
  const organization = useMemo(
    () => organizations.find((item) => item.id === organizationId) ?? null,
    [organizations, organizationId],
  );
  const utils = trpc.useUtils();
  const [name, setName] = useState("");
  const [legalName, setLegalName] = useState("");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [primaryColor, setPrimaryColor] = useState("#047857");
  const [locale, setLocale] = useState<"en" | "ar" | "fr">("en");
  const [countryCode, setCountryCode] = useState("");
  const [timezone, setTimezone] = useState("UTC");
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!organization) return;
    // Switching the active tenant must replace the complete editable draft.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setName(organization.name);
    setLegalName(organization.legalName ?? "");
    setLogoUrl(organization.logoUrl);
    setPrimaryColor(organization.primaryColor);
    setLocale((organization.locale as "en" | "ar" | "fr") ?? "en");
    setCountryCode(organization.countryCode ?? "");
    setTimezone(organization.timezone);
    setMessage(null);
  }, [organization]);

  const updateProfile = trpc.organization.updateProfile.useMutation({
    onSuccess: async () => {
      await utils.organization.mine.invalidate();
      setMessage("Company profile saved. The change is recorded in the audit trail.");
    },
    onError: (error) => setMessage(error.message),
  });

  function uploadLogo(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!ACCEPTED_LOGO_TYPES.has(file.type)) {
      setMessage("Use a PNG, JPEG, or WebP logo.");
      event.target.value = "";
      return;
    }
    if (file.size > MAX_LOGO_BYTES) {
      setMessage("Logo must be 256 KB or smaller.");
      event.target.value = "";
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setLogoUrl(typeof reader.result === "string" ? reader.result : null);
      setMessage("Logo loaded. Select Save company profile to apply it.");
    };
    reader.onerror = () => setMessage("The logo could not be read.");
    reader.readAsDataURL(file);
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!organizationId) return;
    setMessage(null);
    updateProfile.mutate({
      organizationId,
      name: name.trim(),
      legalName: legalName.trim() || null,
      logoUrl,
      primaryColor,
      locale,
      countryCode: countryCode.trim().toUpperCase() || null,
      timezone: timezone.trim(),
    });
  }

  if (!organizationId || !organization) {
    return (
      <section className="space-y-4">
        <h1 className="text-2xl font-semibold text-zinc-950">Company profile</h1>
        <OrgSwitcher />
        <p className="text-zinc-700">Select an organization to configure its identity.</p>
      </section>
    );
  }

  const inputClass =
    "min-h-11 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-base text-zinc-950 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600";

  return (
    <section className="space-y-5">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-950">Company profile</h1>
          <p className="mt-1 text-base text-zinc-700">
            Configure company-neutral branding for dashboards and controlled reports.
          </p>
        </div>
        <OrgSwitcher />
      </header>

      <form onSubmit={submit} className="grid gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(18rem,1fr)]">
        <div className="space-y-5 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-1.5 font-medium text-zinc-800">
              Display name
              <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} required maxLength={256} />
            </label>
            <label className="space-y-1.5 font-medium text-zinc-800">
              Legal name
              <input className={inputClass} value={legalName} onChange={(e) => setLegalName(e.target.value)} maxLength={256} />
            </label>
            <label className="space-y-1.5 font-medium text-zinc-800">
              Country code (ISO 2-letter)
              <input className={inputClass} value={countryCode} onChange={(e) => setCountryCode(e.target.value.toUpperCase())} maxLength={2} placeholder="SA" />
            </label>
            <label className="space-y-1.5 font-medium text-zinc-800">
              Time zone
              <input className={inputClass} value={timezone} onChange={(e) => setTimezone(e.target.value)} maxLength={64} placeholder="Asia/Riyadh" required />
            </label>
            <label className="space-y-1.5 font-medium text-zinc-800">
              Interface language
              <select className={inputClass} value={locale} onChange={(e) => setLocale(e.target.value as "en" | "ar" | "fr")}>
                <option value="en">English</option>
                <option value="ar">Arabic</option>
                <option value="fr">French</option>
              </select>
            </label>
            <label className="space-y-1.5 font-medium text-zinc-800">
              Primary brand color
              <span className="flex gap-2">
                <input aria-label="Choose primary brand color" type="color" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="h-11 w-16 rounded-md border border-zinc-300 bg-white p-1" />
                <input className={inputClass} value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} pattern="#[0-9A-Fa-f]{6}" required />
              </span>
            </label>
          </div>

          <fieldset className="space-y-2 rounded-lg border border-zinc-200 p-4">
            <legend className="px-1 font-semibold text-zinc-900">Company logo</legend>
            <input type="file" accept="image/png,image/jpeg,image/webp" onChange={uploadLogo} className="block w-full text-base text-zinc-700 file:mr-3 file:rounded-md file:border-0 file:bg-emerald-700 file:px-4 file:py-2 file:font-semibold file:text-white hover:file:bg-emerald-800" />
            <p className="text-sm text-zinc-600">PNG, JPEG, or WebP; maximum 256 KB. Transparent PNG is recommended.</p>
            {logoUrl && (
              <button type="button" onClick={() => setLogoUrl(null)} className="rounded-md border border-zinc-300 px-3 py-2 font-medium text-zinc-800 hover:bg-zinc-50">
                Remove logo
              </button>
            )}
          </fieldset>

          {message && <p role="status" className="rounded-md bg-zinc-100 p-3 text-zinc-800">{message}</p>}
          <button type="submit" disabled={updateProfile.isPending} className="min-h-11 rounded-md bg-emerald-700 px-5 py-2 font-semibold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60">
            {updateProfile.isPending ? "Saving…" : "Save company profile"}
          </button>
        </div>

        <aside className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
          <h2 className="font-semibold text-zinc-950">Brand preview</h2>
          <div className="mt-4 overflow-hidden rounded-lg border border-zinc-200">
            <div className="h-3" style={{ backgroundColor: primaryColor }} />
            <div className="space-y-3 p-5">
              {logoUrl ? (
                // Data-URL previews are intentionally local and cannot use the Next image optimizer.
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logoUrl} alt="Company logo preview" className="max-h-24 max-w-full object-contain" />
              ) : <div className="flex h-20 items-center justify-center rounded-md bg-zinc-100 text-zinc-500">No logo</div>}
              <p className="text-lg font-bold text-zinc-950">{name || "Company name"}</p>
              <p className="text-sm text-zinc-600">HSE Performance Report</p>
              <div className="h-1 rounded" style={{ backgroundColor: primaryColor }} />
              <p className="text-xs text-zinc-500">{countryCode || "Country"} · {timezone || "Time zone"}</p>
            </div>
          </div>
        </aside>
      </form>
    </section>
  );
}
