export function CallToAction() {
  return (
    <section className="relative py-20 md:py-28 overflow-hidden">
      {/* Terracotta background with texture */}
      <div className="absolute inset-0 bg-terra" />
      <div className="absolute inset-0 grain" />

      {/* Decorative shapes */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div
          className="absolute -top-20 -right-20 w-[300px] h-[300px] rounded-full opacity-10"
          style={{
            background:
              "radial-gradient(circle, #fff 0%, transparent 70%)",
          }}
        />
        <div
          className="absolute -bottom-16 -left-16 w-[250px] h-[250px] rounded-full opacity-[0.07]"
          style={{
            background:
              "radial-gradient(circle, #fff 0%, transparent 70%)",
          }}
        />
      </div>

      <div className="relative z-10 max-w-3xl mx-auto px-6 lg:px-8 text-center">
        <div className="reveal">
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-semibold text-white tracking-tight text-balance leading-tight">
            Ready to get your business online?
          </h2>
          <p className="mt-5 text-white/70 text-lg max-w-xl mx-auto leading-relaxed">
            Let's have a conversation about what you need. No hard sell, no
            cookie-cutter pitch — just an honest chat about your goals.
          </p>
          <div className="mt-9 flex flex-wrap justify-center gap-4">
            <a
              href="#contact"
              className="inline-flex items-center justify-center bg-white text-terra font-semibold px-8 py-3.5 rounded-full text-[0.95rem] hover:bg-cream transition-colors duration-200 shadow-[0_2px_16px_rgba(0,0,0,0.1)]"
            >
              Start Your Project
            </a>
            <a
              href="mailto:jose@ninthstreetdigital.com"
              className="inline-flex items-center justify-center border-2 border-white/25 text-white font-semibold px-8 py-3.5 rounded-full text-[0.95rem] hover:border-white/40 hover:bg-white/[0.06] transition-all duration-200"
            >
              Email Us Directly
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
