import { useState, useEffect } from 'react';
import Hero from './components/Hero';
import Navigation from './components/Navigation';
import Architecture from './components/Architecture';
import Surveillance from './components/Surveillance';
import Privacy from './components/Privacy';
import Organization from './components/Organization';
import Risks from './components/Risks';
import NextSteps from './components/NextSteps';
import Pitch from './components/Pitch';
import Footer from './components/Footer';

export default function App() {
  const [activeSection, setActiveSection] = useState('hero');
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
      const sections = ['hero', 'architecture', 'surveillance', 'privacy', 'organization', 'risks', 'nextsteps', 'pitch'];
      for (const section of sections.reverse()) {
        const el = document.getElementById(section);
        if (el && el.getBoundingClientRect().top <= 200) {
          setActiveSection(section);
          break;
        }
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
      <Navigation activeSection={activeSection} scrollY={scrollY} />
      <Hero />
      <Architecture />
      <Surveillance />
      <Privacy />
      <Organization />
      <Risks />
      <NextSteps />
      <Pitch />
      <Footer />
    </div>
  );
}
