import React, { useState } from 'react';
import { FaBars, FaTimes } from 'react-icons/fa';
import Logo from './Logo';

const NAV_LINKS = [
  { label: 'Home', id: 'home' },
  { label: 'About', id: 'about' },
  { label: 'Plans', id: 'plans' },
  { label: 'Contact', id: 'contact' },
];

const Navbar = () => {
  const [open, setOpen] = useState(false);

  const scrollTo = (id) => {
    setOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <nav className="fixed top-0 inset-x-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-100 dark:border-gray-800">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <button onClick={() => scrollTo('home')}>
          <Logo />
        </button>

        <div className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map((link) => (
            <button
              key={link.id}
              onClick={() => scrollTo(link.id)}
              className="text-sm font-semibold text-gray-600 dark:text-gray-300 hover:text-red-500 dark:hover:text-red-400 transition-colors"
            >
              {link.label}
            </button>
          ))}
          <button
            onClick={() => scrollTo('plans')}
            className="bg-gradient-to-r from-red-500 to-orange-500 text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:shadow-lg hover:shadow-red-500/30 transition-all"
          >
            Get Started
          </button>
        </div>

        <button
          className="md:hidden text-xl text-gray-700 dark:text-gray-200"
          onClick={() => setOpen((o) => !o)}
          aria-label="Toggle menu"
        >
          {open ? <FaTimes /> : <FaBars />}
        </button>
      </div>

      {open && (
        <div className="md:hidden bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 px-4 py-4 flex flex-col gap-3">
          {NAV_LINKS.map((link) => (
            <button
              key={link.id}
              onClick={() => scrollTo(link.id)}
              className="text-left text-base font-semibold text-gray-700 dark:text-gray-200 py-2"
            >
              {link.label}
            </button>
          ))}
          <button
            onClick={() => scrollTo('plans')}
            className="bg-gradient-to-r from-red-500 to-orange-500 text-white text-sm font-semibold px-5 py-3 rounded-xl mt-1"
          >
            Get Started
          </button>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
