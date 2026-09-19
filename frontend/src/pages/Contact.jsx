import React, { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AlertCircle, ArrowUpRight, Check, Loader2, Mail, MapPin, Phone } from "lucide-react";
import PageHeader from "../components/PageHeader";
import Reveal from "../components/Reveal";
import Seo from "../components/Seo";
import api from "../lib/api";
import { ORG } from "../data/content";

// Mirrors the Pydantic model on the server. Keeping the two aligned is what
// stops a valid-looking submission bouncing back as an opaque 422.
const schema = z.object({
  firstName: z.string().trim().min(1, "Please tell us your first name.").max(80),
  lastName: z.string().trim().max(80).optional().or(z.literal("")),
  email: z.string().trim().min(1, "We need an email to reply to.").email("That doesn't look like a valid email."),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  role: z.string(),
  message: z
    .string()
    .trim()
    .min(10, "Please add a little more detail (at least 10 characters).")
    .max(5000, "That's longer than we can accept — please trim it a little."),
  website: z.string().max(200).optional(), // honeypot
});

const ROLES = [
  "Donor / funder",
  "Partner organization",
  "Volunteer",
  "Media / journalist",
  "Community member",
  "Other",
];

const inputClass =
  "mt-2 w-full px-5 py-4 rounded-full border bg-brand-bg focus:outline-none transition";
const fieldBorder = (hasError) =>
  hasError
    ? "border-brand-terracotta focus:border-brand-terracotta"
    : "border-brand-rule focus:border-brand-terracotta";

const FieldError = ({ children }) =>
  children ? (
    <p className="mt-2 px-5 text-sm text-brand-terracotta flex items-center gap-1.5">
      <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
      {children}
    </p>
  ) : null;

const Contact = () => {
  const [sent, setSent] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  // Used by the server to reject submissions completed implausibly fast.
  const renderedAt = useRef(Date.now());

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { role: ROLES[0], website: "" },
  });

  const onSubmit = async (values) => {
    setSubmitError(null);
    try {
      await api.post("/messages", {
        ...values,
        pageRenderedAt: renderedAt.current,
      });
      setSent(true);
      reset({ role: ROLES[0], website: "" });
      renderedAt.current = Date.now();
    } catch (error) {
      // The previous version had no failure path at all: a dropped submission
      // looked exactly like a successful one.
      setSubmitError(
        error.status === 429
          ? "You've sent a few messages already. Please wait a moment before sending another."
          : error.message
      );
    }
  };

  return (
    <>
      <Seo
        title="Contact"
        description="Reach CASNAGGI at our Bayelsa head office. Email casnaggi@gmail.com or call +234 916 796 1355. Whether you're a donor, partner, journalist or volunteer — we'd love to hear from you."
        path="/contact"
      />
      <PageHeader
        eyebrow="Contact"
        title="Let's start a conversation."
        lede="Whether you're a funder, a partner, a journalist, or a volunteer—our team reads every message. Tell us how you'd like to engage."
        breadcrumbs={[{ label: "Contact" }]}
      />

      <section className="py-20 md:py-24" data-testid="contact-section">
        <div className="container-x grid md:grid-cols-12 gap-10 items-start">
          {/* Info column */}
          <Reveal className="md:col-span-5 space-y-10">
            <div>
              <p className="overline">Visit us</p>
              <div className="mt-4 flex items-start gap-4 text-lg">
                <MapPin className="h-5 w-5 mt-1 text-brand-terracotta flex-shrink-0" />
                <span className="font-display">{ORG.address}</span>
              </div>
            </div>
            <div>
              <p className="overline">Call</p>
              <div className="mt-4 space-y-3">
                {ORG.phones.map((p) => (
                  <a
                    key={p.tel}
                    href={`tel:${p.tel}`}
                    className="flex items-start gap-4 text-lg hover:text-brand-terracotta transition"
                    data-testid={`contact-phone-${p.label.toLowerCase()}`}
                  >
                    <Phone className="h-5 w-5 mt-1 text-brand-terracotta flex-shrink-0" />
                    <span className="font-display">{p.display}</span>
                  </a>
                ))}
              </div>
            </div>
            <div>
              <p className="overline">Email</p>
              <div className="mt-4 space-y-3">
                {ORG.emails.map((e) => (
                  <a
                    key={e.address}
                    href={`mailto:${e.address}`}
                    className="flex items-start gap-4 text-lg break-all hover:text-brand-terracotta transition"
                    data-testid={`contact-email-${e.label.toLowerCase().replace(/\s+/g, "-")}`}
                  >
                    <Mail className="h-5 w-5 mt-1 text-brand-terracotta flex-shrink-0" />
                    <span className="font-display">{e.address}</span>
                  </a>
                ))}
              </div>
            </div>

            <div className="pt-6 border-t border-brand-rule">
              <p className="overline">Follow the movement</p>
              <div className="mt-4 flex flex-wrap gap-3">
                {ORG.socials.map((s) => (
                  <a
                    key={s.label}
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 text-xs uppercase tracking-[0.2em] rounded-full border border-brand-rule hover:border-brand-terracotta hover:text-brand-terracotta transition"
                    data-testid={`contact-social-${s.label.toLowerCase()}`}
                  >
                    {s.label}
                  </a>
                ))}
              </div>
            </div>
          </Reveal>

          {/* Form */}
          <Reveal delay={0.1} className="md:col-span-7">
            <form
              onSubmit={handleSubmit(onSubmit)}
              className="card-tactile relative"
              noValidate
              data-testid="contact-form"
            >
              <h3 className="font-display text-2xl md:text-3xl font-medium">
                Send us a message
              </h3>
              <p className="mt-3 text-brand-ink/70">
                We'll respond within 2 business days.
              </p>

              {/* Honeypot. Positioned off-screen rather than display:none --
                  some bots skip hidden fields entirely, and aria-hidden plus
                  tabIndex keeps it away from screen readers and keyboards. */}
              <div className="absolute -left-[9999px] top-auto w-px h-px overflow-hidden" aria-hidden="true">
                <label htmlFor="website">Leave this field empty</label>
                <input
                  id="website"
                  type="text"
                  tabIndex={-1}
                  autoComplete="off"
                  {...register("website")}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
                <div>
                  <label className="overline text-brand-mute" htmlFor="firstName">
                    First name
                  </label>
                  <input
                    id="firstName"
                    type="text"
                    className={`${inputClass} ${fieldBorder(errors.firstName)}`}
                    aria-invalid={Boolean(errors.firstName)}
                    data-testid="contact-first-name"
                    {...register("firstName")}
                  />
                  <FieldError>{errors.firstName?.message}</FieldError>
                </div>
                <div>
                  <label className="overline text-brand-mute" htmlFor="lastName">
                    Last name
                  </label>
                  <input
                    id="lastName"
                    type="text"
                    className={`${inputClass} ${fieldBorder(errors.lastName)}`}
                    data-testid="contact-last-name"
                    {...register("lastName")}
                  />
                  <FieldError>{errors.lastName?.message}</FieldError>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="overline text-brand-mute" htmlFor="email">
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    className={`${inputClass} ${fieldBorder(errors.email)}`}
                    aria-invalid={Boolean(errors.email)}
                    data-testid="contact-email-input"
                    {...register("email")}
                  />
                  <FieldError>{errors.email?.message}</FieldError>
                </div>
                <div>
                  <label className="overline text-brand-mute" htmlFor="phone">
                    Phone
                  </label>
                  <input
                    id="phone"
                    type="tel"
                    className={`${inputClass} ${fieldBorder(errors.phone)}`}
                    data-testid="contact-phone-input"
                    {...register("phone")}
                  />
                  <FieldError>{errors.phone?.message}</FieldError>
                </div>
              </div>

              <div className="mt-4">
                <label className="overline text-brand-mute" htmlFor="role">
                  I'm reaching out as a…
                </label>
                <select
                  id="role"
                  className={`${inputClass} ${fieldBorder(false)} appearance-none`}
                  data-testid="contact-role"
                  {...register("role")}
                >
                  {ROLES.map((r) => (
                    <option key={r}>{r}</option>
                  ))}
                </select>
              </div>

              <div className="mt-4">
                <label className="overline text-brand-mute" htmlFor="message">
                  Your message
                </label>
                <textarea
                  id="message"
                  rows={5}
                  className={`mt-2 w-full px-5 py-4 rounded-2xl border bg-brand-bg focus:outline-none transition resize-none ${fieldBorder(
                    errors.message
                  )}`}
                  aria-invalid={Boolean(errors.message)}
                  data-testid="contact-message"
                  {...register("message")}
                />
                <FieldError>{errors.message?.message}</FieldError>
              </div>

              {submitError && (
                <div
                  className="mt-6 flex items-start gap-3 rounded-2xl border border-brand-terracotta/40 bg-brand-terracotta/5 px-5 py-4 text-sm"
                  role="alert"
                  data-testid="contact-error"
                >
                  <AlertCircle className="h-4 w-4 mt-0.5 text-brand-terracotta flex-shrink-0" />
                  <span>{submitError}</span>
                </div>
              )}

              {sent && (
                <div
                  className="mt-6 flex items-start gap-3 rounded-2xl border border-brand-forest/30 bg-brand-forest/5 px-5 py-4 text-sm"
                  role="status"
                  data-testid="contact-success"
                >
                  <Check className="h-4 w-4 mt-0.5 text-brand-forest flex-shrink-0" />
                  <span>
                    Thank you — your message has reached us. We'll be in touch within
                    2 business days.
                  </span>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-primary mt-6 disabled:opacity-60 disabled:cursor-not-allowed"
                data-testid="contact-submit"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Sending…
                  </>
                ) : (
                  <>
                    Send message <ArrowUpRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>
          </Reveal>
        </div>
      </section>
    </>
  );
};

export default Contact;
