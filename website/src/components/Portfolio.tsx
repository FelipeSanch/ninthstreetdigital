const placeholders = [
  {
    gradient: "linear-gradient(135deg, #FADDD3 0%, #F0EBE3 60%, #E8EDE4 100%)",
    label: "Restaurant Website",
  },
  {
    gradient: "linear-gradient(150deg, #E8EDE4 0%, #D4DDD0 50%, #F0EBE3 100%)",
    label: "Flower Shop",
  },
  {
    gradient: "linear-gradient(135deg, #F0EBE3 0%, #E4DDD4 60%, #FADDD3 100%)",
    label: "Plumbing Services",
  },
  {
    gradient: "linear-gradient(160deg, #E4DDD4 0%, #F0EBE3 40%, #E8EDE4 100%)",
    label: "Bakery & Cafe",
  },
  {
    gradient: "linear-gradient(140deg, #FADDD3 0%, #EDE4D8 70%, #E4DDD4 100%)",
    label: "Fitness Studio",
  },
  {
    gradient: "linear-gradient(135deg, #E8EDE4 0%, #F0EBE3 50%, #FADDD3 100%)",
    label: "Home Services",
  },
];

export function Portfolio() {
  return (
    <section id="portfolio" className="py-24 md:py-32 bg-warm-white">
      <div className="max-w-6xl mx-auto px-6 lg:px-8">
        {/* Section header */}
        <div className="reveal max-w-2xl">
          <div className="section-accent" />
          <h2 className="font-display text-3xl md:text-4xl font-semibold text-ink tracking-tight">
            Our work
          </h2>
          <p className="mt-4 text-muted text-lg leading-relaxed">
            We're building our portfolio right now. New projects are in the
            works — check back soon to see what we've been up to.
          </p>
        </div>

        {/* Placeholder grid */}
        <div className="mt-14 md:mt-16 grid sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
          {placeholders.map((item, i) => (
            <div
              key={item.label}
              className="reveal group relative aspect-[4/3] rounded-2xl overflow-hidden border border-sand/40"
              style={{ transitionDelay: `${i * 80}ms` }}
            >
              {/* Gradient background */}
              <div
                className="absolute inset-0"
                style={{ background: item.gradient }}
              />

              {/* Content overlay */}
              <div className="absolute inset-0 flex flex-col items-center justify-center p-6">
                {/* Abstract shape */}
                <div className="mb-4 opacity-20">
                  <svg
                    width="48"
                    height="48"
                    viewBox="0 0 48 48"
                    fill="none"
                    aria-hidden="true"
                  >
                    <rect
                      x="4"
                      y="4"
                      width="40"
                      height="40"
                      rx="6"
                      stroke="#1F1D1A"
                      strokeWidth="1.5"
                      strokeDasharray="4 3"
                    />
                  </svg>
                </div>

                <span className="text-ink/50 text-sm font-medium tracking-wide uppercase">
                  Coming Soon
                </span>
                <span className="text-ink/30 text-xs mt-1.5">
                  {item.label}
                </span>
              </div>

              {/* Hover state */}
              <div className="absolute inset-0 bg-ink/[0.02] group-hover:bg-ink/[0.05] transition-colors duration-300" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
