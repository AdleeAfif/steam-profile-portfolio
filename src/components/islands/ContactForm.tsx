import { useState, type SubmitEvent } from "react";
import { showToast } from "../../lib/client/toast";
import FormField, { Honeypot } from "../profile/FormField";
import { LIMITS, compactErrors, labelDetails, postJson, validateEmail, validateLength, type FieldErrors } from "../profile/form";

const EMPTY = { name: "", email: "", message: "", website: "" };

export default function ContactForm() {
  const [values, setValues] = useState(EMPTY);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [notice, setNotice] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const set = (key: keyof typeof EMPTY) => (value: string) => setValues((v) => ({ ...v, [key]: value }));

  async function onSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice(null);
    const local = compactErrors({
      name: validateLength("Name", values.name, LIMITS.name),
      email: validateEmail(values.email),
      message: validateLength("Message", values.message, LIMITS.message),
    });
    setErrors(local);
    if (Object.keys(local).length > 0) return;

    setSending(true);
    const result = await postJson("/api/contact", {
      name: values.name.trim(),
      email: values.email.trim(),
      message: values.message.trim(),
      website: values.website,
    });
    setSending(false);

    if (result.ok) {
      setValues(EMPTY);
      showToast({ title: "Message sent", body: "Thanks! Adlee will get back to you soon.", tone: "success" });
      return;
    }
    setErrors(labelDetails(result.details, { name: "Name", email: "Email", message: "Message" }));
    setNotice(result.message);
    if (result.status === 429) showToast({ title: "Slow down", body: result.message, tone: "error" });
  }

  return (
    <form noValidate onSubmit={onSubmit} className="relative space-y-3" aria-describedby={notice ? "contact-notice" : undefined}>
      <div className="grid gap-3 sm:grid-cols-2">
        <FormField
          id="contact-name"
          name="name"
          label="Your name"
          value={values.name}
          onChange={set("name")}
          error={errors.name}
          maxLength={LIMITS.name}
          autoComplete="name"
          disabled={sending}
        />
        <FormField
          id="contact-email"
          name="email"
          type="email"
          label="Your email"
          value={values.email}
          onChange={set("email")}
          error={errors.email}
          maxLength={LIMITS.email}
          autoComplete="email"
          disabled={sending}
        />
      </div>
      <FormField
        id="contact-message"
        name="message"
        label="Message"
        value={values.message}
        onChange={set("message")}
        error={errors.message}
        maxLength={LIMITS.message}
        multiline
        showCount
        disabled={sending}
      />
      <Honeypot idPrefix="contact" value={values.website} onChange={set("website")} />
      {notice && (
        <p id="contact-notice" role="alert" className="text-sm text-[#ff7b7b]">
          {notice}
        </p>
      )}
      <div className="flex justify-end">
        <button type="submit" className="btn-steam btn-green" disabled={sending}>
          {sending ? "Sending..." : "Send Message"}
        </button>
      </div>
    </form>
  );
}
