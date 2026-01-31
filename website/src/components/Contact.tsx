import { useState, type FormEvent } from "react";

type FormState = "idle" | "sending" | "sent" | "error";

export function Contact() {
  const [state, setState] = useState<FormState>("idle");
  const [form, setForm] = useState({ name: "", email: "", message: "" });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setState("sending");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        setState("sent");
        setForm({ name: "", email: "", message: "" });
      } else {
        setState("error");
      }
    } catch {
      setState("error");
    }
  };

  return (
    <section id="contact" className="relative py-24 md:py-32 bg-ink overflow-hidden">
      {/* Decorative gradient wash */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div
          className="absolute -top-32 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full opacity-[0.06]"
          style={{
            background:
              "radial-gradient(ellipse, #C44D2A 0%, transparent 70%)",
          }}
        />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-14 lg:gap-20">
          {/* Left — CTA copy */}
          <div className="reveal">
            <div className="section-accent" />
            <h2 className="font-display text-3xl md:text-4xl font-semibold text-cream tracking-tight text-balance">
              Let's build something together
            </h2>
            <p className="mt-5 text-cream/60 text-lg leading-relaxed max-w-md">
              Tell us about your project and we'll get back to you within a
              day. No pressure, no obligations — just a conversation.
            </p>

            {/* Direct contact */}
            <div className="mt-10 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-cream/[0.06] flex items-center justify-center">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    aria-hidden="true"
                  >
                    <path
                      d="M2 4l6 4 6-4M2 4v8h12V4H2z"
                      stroke="#A39E98"
                      strokeWidth="1.5"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <a
                  href="mailto:jose@ninthstreetdigital.com"
                  className="text-cream/70 hover:text-terra-light transition-colors text-[0.95rem]"
                >
                  jose@ninthstreetdigital.com
                </a>
              </div>
            </div>
          </div>

          {/* Right — Form */}
          <div className="reveal" style={{ transitionDelay: "100ms" }}>
            {state === "sent" ? (
              <div className="bg-cream/[0.04] border border-cream/[0.08] rounded-2xl p-8 md:p-10 text-center">
                <div className="w-14 h-14 mx-auto mb-5 rounded-2xl bg-sage/20 flex items-center justify-center">
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-hidden="true"
                  >
                    <path
                      d="M5 13l4 4L19 7"
                      stroke="#6B7F5E"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <h3 className="font-display text-xl font-semibold text-cream mb-2">
                  Message sent
                </h3>
                <p className="text-cream/60 text-[0.95rem]">
                  We'll be in touch soon. Thanks for reaching out.
                </p>
                <button
                  onClick={() => setState("idle")}
                  className="mt-6 text-terra-light hover:text-terra text-sm font-medium transition-colors"
                >
                  Send another message
                </button>
              </div>
            ) : (
              <form
                onSubmit={handleSubmit}
                className="bg-cream/[0.03] border border-cream/[0.06] rounded-2xl p-7 md:p-9 space-y-5"
              >
                <div>
                  <label
                    htmlFor="contact-name"
                    className="block text-cream/50 text-sm mb-2"
                  >
                    Your name
                  </label>
                  <input
                    id="contact-name"
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) =>
                      setForm({ ...form, name: e.target.value })
                    }
                    className="form-input"
                    placeholder="Jane Smith"
                  />
                </div>

                <div>
                  <label
                    htmlFor="contact-email"
                    className="block text-cream/50 text-sm mb-2"
                  >
                    Email address
                  </label>
                  <input
                    id="contact-email"
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) =>
                      setForm({ ...form, email: e.target.value })
                    }
                    className="form-input"
                    placeholder="jane@yourbusiness.com"
                  />
                </div>

                <div>
                  <label
                    htmlFor="contact-message"
                    className="block text-cream/50 text-sm mb-2"
                  >
                    About your project
                  </label>
                  <textarea
                    id="contact-message"
                    required
                    rows={4}
                    value={form.message}
                    onChange={(e) =>
                      setForm({ ...form, message: e.target.value })
                    }
                    className="form-input resize-none"
                    placeholder="Tell us a bit about your business and what you're looking for..."
                  />
                </div>

                {state === "error" && (
                  <p className="text-red-400 text-sm">
                    Something went wrong. Please try again or email us directly.
                  </p>
                )}

                <button
                  type="submit"
                  disabled={state === "sending"}
                  className="w-full bg-terra text-white font-semibold py-3.5 rounded-full text-[0.95rem] hover:bg-terra-dark transition-colors duration-200 disabled:opacity-60 disabled:cursor-not-allowed shadow-[0_2px_12px_rgba(196,77,42,0.15)]"
                >
                  {state === "sending" ? "Sending..." : "Send Message"}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
