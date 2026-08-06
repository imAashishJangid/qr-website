import React from 'react';
import { FaPhoneAlt, FaEnvelope } from 'react-icons/fa';
import Logo from './Logo';

const Footer = () => (
  <footer className="bg-gray-900 text-gray-300 py-12 px-4 sm:px-6">
    <div className="max-w-6xl mx-auto grid sm:grid-cols-3 gap-10">
      <div>
        <Logo light />
        <p className="mt-4 text-sm text-gray-400 max-w-xs">
          Contactless QR menu & ordering system for restaurants and cafes — with a live dashboard
          and Android app for vendors.
        </p>
      </div>

      <div>
        <h4 className="font-semibold text-white mb-4">Contact</h4>
        <div className="space-y-2 text-sm">
          <a href="tel:+916378868503" className="flex items-center gap-2 hover:text-red-400 transition-colors">
            <FaPhoneAlt className="text-red-400" /> +91 63788 68503
          </a>
          <a href="tel:+919636402026" className="flex items-center gap-2 hover:text-red-400 transition-colors">
            <FaPhoneAlt className="text-red-400" /> +91 96364 02026
          </a>
          <a href="mailto:kumawath649@gmail.com" className="flex items-center gap-2 hover:text-red-400 transition-colors">
            <FaEnvelope className="text-red-400" /> kumawath649@gmail.com
          </a>
          <a href="mailto:ashishjangid006@gmail.com" className="flex items-center gap-2 hover:text-red-400 transition-colors">
            <FaEnvelope className="text-red-400" /> ashishjangid006@gmail.com
          </a>
        </div>
      </div>

      <div>
        <h4 className="font-semibold text-white mb-4">Quick Links</h4>
        <div className="flex flex-col gap-2 text-sm">
          <a href="#home" className="hover:text-red-400 transition-colors">Home</a>
          <a href="#about" className="hover:text-red-400 transition-colors">About</a>
          <a href="#plans" className="hover:text-red-400 transition-colors">Plans</a>
          <a href="#contact" className="hover:text-red-400 transition-colors">Contact</a>
        </div>
      </div>
    </div>

    <div className="max-w-6xl mx-auto border-t border-gray-800 mt-10 pt-6 text-center text-xs text-gray-500">
      © {new Date().getFullYear()} Smart QR Food. All rights reserved.
    </div>
  </footer>
);

export default Footer;
