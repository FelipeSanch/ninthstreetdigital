export function About() {
  return (
    <section id="about" className="relative py-24 md:py-32 bg-ink text-cream overflow-hidden">
      {/* Subtle decorative elements */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div
          className="absolute top-0 right-0 w-[400px] h-[400px] rounded-full opacity-[0.04]"
          style={{
            background:
              "radial-gradient(circle, #C44D2A 0%, transparent 70%)",
          }}
        />
        <div
          className="absolute bottom-0 left-0 w-[300px] h-[300px] rounded-full opacity-[0.03]"
          style={{
            background:
              "radial-gradient(circle, #6B7F5E 0%, transparent 70%)",
          }}
        />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-start">
          {/* Left column */}
          <div className="reveal">
            <div className="section-accent" />
            <h2 className="font-display text-3xl md:text-4xl font-semibold text-cream tracking-tight">
              A small team that gets small business
            </h2>
          </div>

          {/* Right column */}
          <div className="reveal" style={{ transitionDelay: "120ms" }}>
            <div className="space-y-5 text-cream/70 text-[0.95rem] md:text-base leading-relaxed">
              <p>
                Ninth Street Digital is a web design studio built around one
                idea: small businesses deserve great websites. Not expensive,
                over-engineered platforms. Not cheap templates that all look the
                same. Something in between — custom, professional, and built with
                care.
              </p>
              <p>
                We know what it's like to run a business where every dollar
                counts. That's why we keep things straightforward: fair pricing,
                clear timelines, and a final product you'll actually be proud to
                share with your customers.
              </p>
              <p>
                No layers of account managers. No jargon-filled proposals. Just
                a small, focused team that takes the time to understand your
                business and builds something that works for it.
              </p>
            </div>

            {/* Accent detail */}
            <div className="mt-10 flex items-center gap-4">
              <div className="w-10 h-[2px] bg-terra/60 rounded-full" />
              <span className="text-cream/40 text-sm">
                Remote studio, US-based
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
