const services = [
  {
    title: "Custom Web Design",
    description:
      "A website designed around your brand, your goals, and your customers. No templates, no cookie-cutters — something built just for you.",
    accent: "bg-terra/8",
    shape: (
      <svg viewBox="0 0 48 48" className="w-10 h-10" aria-hidden="true">
        <rect
          x="6"
          y="6"
          width="36"
          height="36"
          rx="4"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          className="text-terra"
        />
        <rect
          x="14"
          y="14"
          width="20"
          height="20"
          rx="2"
          fill="currentColor"
          className="text-terra/20"
        />
      </svg>
    ),
  },
  {
    title: "Landing Pages",
    description:
      "Focused, high-impact pages built to convert visitors into paying customers. Perfect for promotions, launches, or lead generation.",
    accent: "bg-sage/10",
    shape: (
      <svg viewBox="0 0 48 48" className="w-10 h-10" aria-hidden="true">
        <polygon
          points="24,4 44,40 4,40"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinejoin="round"
          className="text-sage"
        />
        <polygon
          points="24,16 34,36 14,36"
          fill="currentColor"
          className="text-sage/20"
        />
      </svg>
    ),
  },
  {
    title: "Site Redesigns",
    description:
      "Already have a website that's not pulling its weight? We'll rebuild it into something modern, fast, and effective.",
    accent: "bg-terra/8",
    shape: (
      <svg viewBox="0 0 48 48" className="w-10 h-10" aria-hidden="true">
        <circle
          cx="24"
          cy="24"
          r="18"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          className="text-terra"
        />
        <path
          d="M16 24 a8 8 0 1 1 16 0"
          fill="currentColor"
          className="text-terra/20"
        />
      </svg>
    ),
  },
  {
    title: "SEO-Ready Sites",
    description:
      "Every site we build is optimized for search engines from day one, so your customers can actually find you online.",
    accent: "bg-sage/10",
    shape: (
      <svg viewBox="0 0 48 48" className="w-10 h-10" aria-hidden="true">
        <circle
          cx="20"
          cy="20"
          r="12"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          className="text-sage"
        />
        <line
          x1="29"
          y1="29"
          x2="42"
          y2="42"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          className="text-sage"
        />
        <circle cx="20" cy="20" r="6" fill="currentColor" className="text-sage/20" />
      </svg>
    ),
  },
];

export function Services() {
  return (
    <section id="services" className="py-24 md:py-32 bg-warm-white">
      <div className="max-w-6xl mx-auto px-6 lg:px-8">
        {/* Section header */}
        <div className="reveal max-w-2xl">
          <div className="section-accent" />
          <h2 className="font-display text-3xl md:text-4xl font-semibold text-ink tracking-tight">
            What we do
          </h2>
          <p className="mt-4 text-muted text-lg leading-relaxed">
            Everything you need to get your business online and growing.
          </p>
        </div>

        {/* Cards grid */}
        <div className="mt-14 md:mt-16 grid sm:grid-cols-2 gap-5 md:gap-6">
          {services.map((service, i) => (
            <div
              key={service.title}
              className="reveal group relative bg-cream rounded-2xl p-7 md:p-8 border border-sand/60 hover:border-terra/15 hover:shadow-[0_4px_24px_rgba(196,77,42,0.06)] transition-all duration-300"
              style={{ transitionDelay: `${i * 80}ms` }}
            >
              {/* Icon */}
              <div
                className={`w-14 h-14 rounded-xl ${service.accent} flex items-center justify-center mb-5`}
              >
                {service.shape}
              </div>

              {/* Content */}
              <h3 className="font-display text-xl font-semibold text-ink mb-3">
                {service.title}
              </h3>
              <p className="text-muted leading-relaxed text-[0.95rem]">
                {service.description}
              </p>

              {/* Hover accent line */}
              <div className="absolute bottom-0 left-8 right-8 h-[2px] bg-terra/0 group-hover:bg-terra/20 rounded-full transition-colors duration-300" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
