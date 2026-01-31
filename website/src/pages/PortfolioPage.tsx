import { projects } from "../data/projects";
import { Link } from "../router";
import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";

export function PortfolioPage() {
  return (
    <>
      <Navbar />
      <main>
        {/* Hero */}
        <section className="pt-32 pb-16 md:pt-40 md:pb-20 bg-warm-white">
          <div className="max-w-6xl mx-auto px-6 lg:px-8">
            <div className="max-w-3xl">
              <div className="section-accent" />
              <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-semibold text-ink tracking-tight">
                Our portfolio
              </h1>
              <p className="mt-6 text-muted text-lg md:text-xl leading-relaxed">
                Every site we build is designed for one thing — turning visitors
                into customers. Here's a look at recent work across different
                industries.
              </p>
            </div>
          </div>
        </section>

        {/* Project grid */}
        <section className="pb-24 md:pb-32 bg-warm-white">
          <div className="max-w-6xl mx-auto px-6 lg:px-8">
            <div className="grid md:grid-cols-2 gap-8">
              {projects.map((project, i) => (
                <Link
                  key={project.slug}
                  to={`/project/${project.slug}`}
                  className="group block rounded-2xl overflow-hidden border border-sand/40 bg-white transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
                >
                  {/* Preview bar */}
                  <div
                    className="h-48 md:h-56 relative overflow-hidden"
                    style={{ backgroundColor: `${project.color}10` }}
                  >
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div
                        className="w-20 h-20 rounded-2xl opacity-20"
                        style={{ backgroundColor: project.color }}
                      />
                    </div>
                    <div className="absolute bottom-4 left-5">
                      <span
                        className="text-xs font-semibold tracking-widest uppercase px-3 py-1.5 rounded-full"
                        style={{
                          color: project.color,
                          backgroundColor: `${project.color}15`,
                        }}
                      >
                        {project.type}
                      </span>
                    </div>
                    {/* Arrow */}
                    <div className="absolute top-4 right-4 w-9 h-9 rounded-full border border-sand/60 bg-white flex items-center justify-center opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0 transition-all duration-300">
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <path d="M3 11L11 3M11 3H5M11 3V9" stroke="#1F1D1A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="p-5 md:p-6">
                    <h3 className="font-display text-xl font-semibold text-ink">
                      {project.name}
                    </h3>
                    <p className="text-muted text-sm mt-1">{project.location}</p>
                    <p className="text-muted text-sm mt-3 leading-relaxed line-clamp-2">
                      {project.description}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
