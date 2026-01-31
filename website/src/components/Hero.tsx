export function Hero() {
  return (
    <section className="relative min-h-[92vh] flex items-center overflow-hidden bg-cream">
      {/* Decorative shapes */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        {/* Large warm blob — top right */}
        <div
          className="shape-float-slow absolute -top-24 -right-32 w-[500px] h-[500px] md:w-[650px] md:h-[650px] rounded-[60%_40%_55%_45%/45%_55%_45%_55%] opacity-30"
          style={{
            background:
              "linear-gradient(135deg, #FADDD3 0%, #F0EBE3 50%, #E8EDE4 100%)",
          }}
        />
        {/* Smaller sage blob — bottom left */}
        <div
          className="shape-float absolute -bottom-16 -left-20 w-[300px] h-[300px] md:w-[400px] md:h-[400px] rounded-[45%_55%_50%_50%/55%_45%_55%_45%] opacity-25"
          style={{
            background:
              "linear-gradient(200deg, #E8EDE4 0%, #F0EBE3 100%)",
          }}
        />
        {/* Small terra accent — mid left */}
        <div
          className="shape-float absolute top-1/3 left-[8%] w-20 h-20 md:w-28 md:h-28 rounded-[50%_50%_45%_55%/55%_50%_50%_45%] opacity-15"
          style={{
            background:
              "linear-gradient(160deg, #FADDD3 0%, #C44D2A33 100%)",
          }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-6xl mx-auto px-6 lg:px-8 pt-24 pb-16 md:pt-32 md:pb-24">
        <div className="max-w-3xl">
          {/* Eyebrow */}
          <p className="hero-animate text-terra font-semibold text-sm tracking-wide uppercase mb-5">
            Web design for small business
          </p>

          {/* Heading */}
          <h1 className="hero-animate-delay-1 font-display text-4xl sm:text-5xl md:text-6xl lg:text-[4.2rem] font-semibold text-ink leading-[1.1] tracking-tight text-balance">
            Your business deserves a website that works as hard as you do
          </h1>

          {/* Subhead */}
          <p className="hero-animate-delay-2 mt-6 md:mt-8 text-muted text-lg md:text-xl leading-relaxed max-w-2xl">
            We design and build custom websites for small businesses — sites
            that look great, load fast, and actually bring in customers. No
            templates. No headaches.
          </p>

          {/* CTAs */}
          <div className="hero-animate-delay-2 mt-9 md:mt-10 flex flex-wrap gap-4">
            <a
              href="#contact"
              className="inline-flex items-center justify-center bg-terra text-white font-semibold px-7 py-3.5 rounded-full text-[0.95rem] hover:bg-terra-dark transition-colors duration-200 shadow-[0_2px_12px_rgba(196,77,42,0.2)]"
            >
              Start Your Project
            </a>
            <a
              href="#process"
              className="inline-flex items-center justify-center border-2 border-ink/12 text-ink font-semibold px-7 py-3.5 rounded-full text-[0.95rem] hover:border-ink/25 hover:bg-ink/[0.03] transition-all duration-200"
            >
              See How It Works
            </a>
          </div>
        </div>

        {/* Decorative line */}
        <div className="hero-animate-delay-3 mt-16 md:mt-24 flex items-center gap-3">
          <div className="w-12 h-[2px] bg-terra/40 rounded-full" />
          <span className="text-pebble text-xs tracking-wider uppercase">
            Websites that grow with you
          </span>
        </div>
      </div>
    </section>
  );
}
