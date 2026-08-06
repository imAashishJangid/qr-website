import React from 'react';
import { Toaster } from 'react-hot-toast';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import About from './components/About';
import Screenshots from './components/Screenshots';
import Plans from './components/Plans';
import ContactSection from './components/ContactSection';
import Footer from './components/Footer';

const App = () => (
  <div className="min-h-screen bg-white dark:bg-gray-900">
    <Toaster position="top-center" />
    <Navbar />
    <Hero />
    <About />
    <Screenshots />
    <Plans />
    <ContactSection />
    <Footer />
  </div>
);

export default App;
