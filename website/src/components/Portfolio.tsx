import { projects } from "../data/projects";
import { Link } from "../router";

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
            Real sites we've built for small businesses. Each one designed to
            convert visitors into customers.
          </p>
        </div>

        {/* Project grid */}
        <div className="mt-14 md:mt-16 grid sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
          {projects.map((project, i) => (
            <Link
              key={project.slug}
              to={`/project/${project.slug}`}
              className="reveal group relative aspect-[4/3] rounded-2xl overflow-hidden border border-sand/40"
              style={{ transitionDelay: `${i * 80}ms` }}
            >
              {/* Background */}
              <div
                className="absolute inset-0 opacity-10 group-hover:opacity-15 transition-opacity duration-300"
                style={{ backgroundColor: project.color }}
              />

              {/* Content */}
              <div className="absolute inset-0 flex flex-col justify-end p-6">
                <span
                  className="text-xs font-medium tracking-wide uppercase mb-1"
                  style={{ color: project.color }}
                >
                  {project.type}
                </span>
                <span className="text-ink text-lg font-semibold font-display">
                  {project.name}
                </span>
                <span className="text-muted text-sm mt-0.5">
                  {project.location}
                </span>

                {/* Arrow */}
                <div className="absolute top-5 right-5 w-8 h-8 rounded-full border border-sand/60 flex items-center justify-center opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0 transition-all duration-300">
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 14 14"
                    fill="none"
                    aria-hidden="true"
                  >
                    <path
                      d="M3 11L11 3M11 3H5M11 3V9"
                      stroke="#1F1D1A"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              </div>

              {/* Hover overlay */}
              <div className="absolute inset-0 bg-ink/[0.02] group-hover:bg-ink/[0.04] transition-colors duration-300" />
            </Link>
          ))}
        </div>

        {/* View all link */}
        <div className="mt-10 text-center">
          <Link
            to="/portfolio"
            className="inline-flex items-center gap-2 text-sm font-medium text-ink hover:text-accent transition-colors"
          >
            View all projects
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M3 7H11M11 7L7 3M11 7L7 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
}
