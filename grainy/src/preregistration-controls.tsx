"use client";

import { createRoot } from "react-dom/client";
import { flushSync } from "react-dom";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";

// The native dialog and form keep ownership of history, focus and submission.
// Upgrade only the controls after the first modal opening.
export function enhancePreregistrationForm(form: HTMLFormElement) {
  const values = new FormData(form);
  const nameInput = form.querySelector<HTMLInputElement>('[name="name"]')!;
  const example = nameInput.placeholder;
  const member = nameInput.dataset.exampleMember;
  const labels = Object.fromEntries([...form.querySelectorAll<HTMLElement>('[data-i18n]')].map(element => [element.dataset.i18n!, element.textContent]));
  const active = form.contains(document.activeElement) ? (document.activeElement as HTMLElement).id : undefined;
  const status = form.querySelector<HTMLElement>('[data-preregistration-status]')!;
  const error = status.hidden ? "" : status.textContent;
  const root = createRoot(form);
  flushSync(() => root.render(
    <FieldGroup>
      <Field className="preregistration-field">
        <FieldLabel htmlFor="preregistration-name" data-i18n="preregistrationName">{labels.preregistrationName}</FieldLabel>
        <Input id="preregistration-name" name="name" autoComplete="name" maxLength={80} required defaultValue={String(values.get("name") || "")} placeholder={example} data-member-name-placeholder="" data-example-member={member} />
      </Field>
      <Field className="preregistration-field">
        <FieldLabel htmlFor="preregistration-email" data-i18n="preregistrationEmail">{labels.preregistrationEmail}</FieldLabel>
        <Input id="preregistration-email" name="email" type="email" autoComplete="email" maxLength={254} required defaultValue={String(values.get("email") || "")} placeholder="name@example.com" />
      </Field>
      <Field className="preregistration-field">
        <FieldLabel htmlFor="preregistration-phone" data-i18n="preregistrationPhone">{labels.preregistrationPhone}</FieldLabel>
        <Input id="preregistration-phone" name="phone" type="tel" inputMode="tel" autoComplete="tel" minLength={10} maxLength={32} required defaultValue={String(values.get("phone") || "")} placeholder="010-1234-5678" />
      </Field>
      <Field orientation="horizontal" className="preregistration-consent">
        <Checkbox id="preregistration-consent" name="consent" value="on" required defaultChecked={values.get("consent") === "on"} />
        <FieldLabel htmlFor="preregistration-consent" data-i18n="preregistrationConsent">{labels.preregistrationConsent}</FieldLabel>
      </Field>
      <p className="preregistration-status" data-preregistration-status="" role="status" hidden={!error}>{error}</p>
      <Button size="serial" type="submit" className="w-full"><span data-preregistration-submit-label="" data-i18n="preregistrationSubmit">{labels.preregistrationSubmit}</span></Button>
    </FieldGroup>
  ));
  form.dataset.ui = "shadcn";
  if (active) form.querySelector<HTMLElement>(`#${active}`)?.focus({ preventScroll: true });
}
