import { getProject } from "../data/projects";
import { Link } from "../router";
import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";

export function ProjectPage({ slug }: { slug: string }) {
  const project = getProject(slug);

  if (!project) {
    return (
      <>
        <Navbar />
        <main className="pt-40 pb-32 bg-warm-white text-center">
          <h1 className="font-display text-3xl text-ink">Project not found</h1>
          <Link to="/" className="text-accent mt-4 inline-block hover:underline">
            Back to home
          </Link>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main>
        {/* Hero */}
        <section className="pt-32 pb-12 md:pt-40 md:pb-16 bg-warm-white">
          <div className="max-w-5xl mx-auto px-6 lg:px-8">
            <Link
              to="/portfolio"
              className="inline-flex items-center gap-2 text-sm text-muted hover:text-ink transition-colors mb-8"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              All projects
            </Link>

            <div className="flex items-center gap-3 mb-4">
              <span
                className="text-xs font-semibold tracking-widest uppercase px-3 py-1.5 rounded-full"
                style={{
                  color: project.color,
                  backgroundColor: `${project.color}15`,
                }}
              >
                {project.type}
              </span>
              <span className="text-muted text-sm">{project.location}</span>
            </div>

            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-semibold text-ink tracking-tight">
              {project.name}
            </h1>
            <p className="mt-5 text-muted text-lg md:text-xl leading-relaxed max-w-3xl">
              {project.description}
            </p>

            <a
              href={project.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 mt-8 px-6 py-3 rounded-full text-sm font-medium text-white transition-all hover:opacity-90"
              style={{ backgroundColor: project.color }}
            >
              Visit live site
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M3 11L11 3M11 3H5M11 3V9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </a>
          </div>
        </section>

        {/* Site preview */}
        <section className="pb-16 bg-warm-white">
          <div className="max-w-5xl mx-auto px-6 lg:px-8">
            <div className="rounded-2xl overflow-hidden border border-sand/40 shadow-lg">
              {/* Browser chrome */}
              <div className="bg-stone-100 border-b border-sand/40 px-4 py-3 flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-stone-300" />
                  <div className="w-3 h-3 rounded-full bg-stone-300" />
                  <div className="w-3 h-3 rounded-full bg-stone-300" />
                </div>
                <div className="flex-1 mx-3">
                  <div className="bg-white rounded-md px-3 py-1.5 text-xs text-muted truncate max-w-md mx-auto text-center">
                    {project.url.replace("https://", "")}
                  </div>
                </div>
              </div>
              {/* iframe */}
              <iframe
                src={project.url}
                title={project.name}
                className="w-full h-[500px] md:h-[600px] bg-white"
                loading="lazy"
              />
            </div>
          </div>
        </section>

        {/* Details */}
        <section className="py-16 md:py-24 bg-warm-white">
          <div className="max-w-5xl mx-auto px-6 lg:px-8">
            <div className="grid md:grid-cols-2 gap-12 md:gap-16">
              {/* Challenge */}
              <div>
                <h2 className="font-display text-2xl font-semibold text-ink mb-4">
                  The challenge
                </h2>
                <p className="text-muted leading-relaxed">{project.challenge}</p>
              </div>

              {/* Solution */}
              <div>
                <h2 className="font-display text-2xl font-semibold text-ink mb-4">
                  Our approach
                </h2>
                <p className="text-muted leading-relaxed">{project.solution}</p>
              </div>
            </div>

            {/* Features */}
            <div className="mt-16">
              <h2 className="font-display text-2xl font-semibold text-ink mb-6">
                Key features
              </h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {project.features.map((feature) => (
                  <div
                    key={feature}
                    className="flex items-start gap-3 p-4 rounded-xl bg-white border border-sand/30"
                  >
                    <div
                      className="w-2 h-2 rounded-full mt-2 shrink-0"
                      style={{ backgroundColor: project.color }}
                    />
                    <span className="text-ink text-sm">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 md:py-20 bg-stone-50 border-t border-sand/30">
          <div className="max-w-3xl mx-auto px-6 lg:px-8 text-center">
            <h2 className="font-display text-3xl md:text-4xl font-semibold text-ink">
              Want something like this?
            </h2>
            <p className="mt-4 text-muted text-lg">
              We build sites like this for small businesses every day. Let's talk
              about yours.
            </p>
            <Link
              to="/"
              className="inline-flex items-center gap-2 mt-8 px-6 py-3 rounded-full text-sm font-medium bg-ink text-white hover:bg-ink/90 transition-colors"
            >
              Get in touch
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
