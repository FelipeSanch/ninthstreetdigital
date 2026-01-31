const steps = [
  {
    number: "01",
    title: "Tell us about your business",
    description:
      "Send us a message. We'll talk about what you need, what you want, and what makes sense for your budget and timeline.",
  },
  {
    number: "02",
    title: "We design and build",
    description:
      "We get to work creating your site, keeping you involved with regular updates and feedback rounds along the way.",
  },
  {
    number: "03",
    title: "You go live",
    description:
      "We launch your new site and make sure everything runs smoothly. You focus on running your business — we handle the rest.",
  },
];

export function HowItWorks() {
  return (
    <section id="process" className="py-24 md:py-32 bg-sand/50 relative overflow-hidden grain">
      <div className="relative z-10 max-w-6xl mx-auto px-6 lg:px-8">
        {/* Section header */}
        <div className="reveal text-center max-w-2xl mx-auto mb-16 md:mb-20">
          <div className="section-accent-center" />
          <h2 className="font-display text-3xl md:text-4xl font-semibold text-ink tracking-tight">
            How it works
          </h2>
          <p className="mt-4 text-muted text-lg">
            Three steps. No surprises.
          </p>
        </div>

        {/* Steps */}
        <div className="grid md:grid-cols-3 gap-8 md:gap-6 lg:gap-10">
          {steps.map((step, i) => (
            <div
              key={step.number}
              className="reveal relative"
              style={{ transitionDelay: `${i * 120}ms` }}
            >
              {/* Connector line (desktop only) */}
              {i < steps.length - 1 && (
                <div
                  className="hidden md:block absolute top-8 left-[calc(50%+40px)] w-[calc(100%-40px)] h-[1px]"
                  aria-hidden="true"
                >
                  <div className="w-full h-full bg-gradient-to-r from-pebble/30 to-pebble/10" />
                </div>
              )}

              {/* Step content */}
              <div className="text-center md:text-left">
                {/* Number */}
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-cream border border-sand mb-6">
                  <span className="font-display text-2xl font-semibold text-terra">
                    {step.number}
                  </span>
                </div>

                <h3 className="font-display text-xl font-semibold text-ink mb-3">
                  {step.title}
                </h3>
                <p className="text-muted leading-relaxed text-[0.95rem] max-w-sm mx-auto md:mx-0">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
