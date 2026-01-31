import { createRoot } from "react-dom/client";
import { useEffect } from "react";

import "./styles/output.css";

import { useRoute } from "./router";

import { Navbar } from "./components/Navbar";
import { Hero } from "./components/Hero";
import { Services } from "./components/Services";
import { HowItWorks } from "./components/HowItWorks";
import { Portfolio } from "./components/Portfolio";
import { About } from "./components/About";
import { CallToAction } from "./components/CallToAction";
import { Contact } from "./components/Contact";
import { Footer } from "./components/Footer";

import { PortfolioPage } from "./pages/PortfolioPage";
import { ProjectPage } from "./pages/ProjectPage";

function HomePage() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <Services />
        <HowItWorks />
        <Portfolio />
        <About />
        <CallToAction />
        <Contact />
      </main>
      <Footer />
    </>
  );
}

function App() {
  const path = useRoute();

  // Initialize scroll reveal observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("revealed");
            observer.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.08, rootMargin: "0px 0px -40px 0px" }
    );

    const elements = document.querySelectorAll(".reveal");
    elements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, [path]);

  if (path === "/portfolio") {
    return <PortfolioPage />;
  }

  if (path.startsWith("/project/")) {
    const slug = path.replace("/project/", "");
    return <ProjectPage slug={slug} />;
  }

  return <HomePage />;
}

const container = document.getElementById("root");
if (container) {
  createRoot(container).render(<App />);
}
