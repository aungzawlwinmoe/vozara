import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, Globe, Calendar, Phone, Lock } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface NavbarProps {
  onOpenQuote: (service?: string) => void;
}

export default function Navbar({ onOpenQuote }: NavbarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const handleToggle = () => setIsOpen(!isOpen);
  const handleLinkClick = () => setIsOpen(false);

  const navLinks = [
    { label: "Home", path: "/" },
    { label: "Services", path: "/services" },
    { label: "About Us", path: "/about" },
    { label: "Careers", path: "/careers" },
    { label: "Contact", path: "/contact" }
  ];

  const isActive = (path: string) => {
    if (path === "/") {
      return location.pathname === "/";
    }
    return location.pathname.startsWith(path);
  };

  // Dedicated high-fidelity SVG Component of the premium Vozara Logo 
  const VozaraLogo = () => (
    <motion.div 
      className="flex items-center gap-3 group cursor-pointer"
      whileHover="hover"
      initial="initial"
    >
      <motion.div 
        className="relative w-10 h-10 flex-shrink-0"
        variants={{
          hover: {
            scale: [1, 1.06, 0.98, 1.04, 1],
            transition: {
              duration: 1.6,
              repeat: Infinity,
              ease: "easeInOut"
            }
          },
          initial: {
            scale: 1,
            transition: { duration: 0.3 }
          }
        }}
      >
        <svg viewBox="0 0 100 100" className="w-full h-full" filter="drop-shadow(0px 2px 2px rgba(27, 42, 107, 0.08))">
          <defs>
            <linearGradient id="swoopGradient" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#F26522" />
              <stop offset="60%" stopColor="#FB8C00" />
              <stop offset="100%" stopColor="#FFB300" />
            </linearGradient>
          </defs>

          {/* 1. Main Serif Stem of 'V' (Navy Blue) */}
          <path 
            d="M 22,24 H 46 C 41,24 38.5,26.5 38,32 L 44.5,76 C 44.8,78 45.3,79.5 46,80 L 29,32 C 28.5,26.5 26,24 22,24 Z" 
            fill="#1B2A6B" 
          />
          
          {/* 2. Globe nested behind Swoop */}
          <g>
            <circle cx="58" cy="46" r="13" fill="none" stroke="#1B2A6B" strokeWidth="2" />
            <ellipse cx="58" cy="46" rx="8" ry="13" fill="none" stroke="#1B2A6B" strokeWidth="1.5" />
            <ellipse cx="58" cy="46" rx="3.5" ry="13" fill="none" stroke="#1B2A6B" strokeWidth="1.5" />
            <path d="M 45,46 H 71" stroke="#1B2A6B" strokeWidth="1.5" fill="none" />
            <path d="M 47,39 Q 58,41 69,39" stroke="#1B2A6B" strokeWidth="1.2" fill="none" />
            <path d="M 47,53 Q 58,51 69,53" stroke="#1B2A6B" strokeWidth="1.2" fill="none" />
          </g>

          {/* 3. Curved Swoop with Linear Gradient */}
          <path 
            d="M 45,80 C 49,60 59,38 78,24.5 C 63,30 49,52 46,80 Z" 
            fill="url(#swoopGradient)" 
          />
        </svg>
      </motion.div>

      <div className="flex flex-col">
        <span className="font-serif text-2xl font-extrabold tracking-tight text-brand-navy leading-none group-hover:text-brand-orange transition-colors duration-300">
          Vozara
        </span>
        <div className="flex items-center gap-1.5 mt-0.5">
          <span className="h-[1px] w-2 bg-brand-orange" />
          <span className="text-[7.5px] uppercase font-bold tracking-[0.22em] text-gray-400 leading-none">
            Language Services
          </span>
          <span className="h-[1px] w-2 bg-brand-orange" />
        </div>
      </div>
    </motion.div>
  );

  return (
    <header className="sticky top-0 z-40 w-full bg-white/70 backdrop-blur-md border-b border-white/40 shadow-sm transition-all duration-300">
      {/* Upper Micro-Header for absolute credibility */}
      <div className="bg-brand-navy-dark/95 backdrop-blur-sm text-white text-[11px] py-1.5 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-1.5">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1 text-gray-300">
              <Globe className="w-3.5 h-3.5 text-brand-orange" />
              Global 24/7/365 Resource Hub
            </span>
            <span className="hidden sm:inline text-gray-500">|</span>
            <span className="flex items-center gap-1 text-gray-300">
              <Phone className="w-3.5 h-3.5 text-brand-orange" />
              Support: +1 (210) 548-2782
            </span>
          </div>
          <div className="text-gray-300">
            Founded 2022 &bull; <strong className="text-brand-orange">4+ Years of Excellence</strong>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 bg-[#f1f6fd]">
        <div className="flex items-center justify-between h-20">
          
          {/* Logo Brand Link */}
          <Link to="/" id="nav-logo-link" onClick={handleLinkClick}>
            <VozaraLogo />
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                id={`nav-${link.label.toLowerCase().replace(" ", "-")}`}
                to={link.path}
                className={`font-semibold text-[14.5px] tracking-wide transition-colors duration-200 py-2 relative group ${
                  isActive(link.path) 
                    ? "text-brand-navy" 
                    : "text-gray-600 hover:text-brand-orange"
                }`}
              >
                {link.label}
                <span 
                  className={`absolute bottom-0 left-0 h-0.5 bg-brand-orange transition-all duration-300 ${
                    isActive(link.path) ? "w-full" : "w-0 group-hover:w-full"
                  }`} 
                />
              </Link>
            ))}
          </nav>

          {/* Nav CTA Actions */}
          <div className="hidden lg:flex items-center gap-4">
            <Link 
              id="nav-quick-contact"
              to="/admin" 
              className="text-xs font-bold text-gray-500 hover:text-brand-orange tracking-wide uppercase transition-colors flex items-center gap-1.5"
            >
              <Lock className="w-3.5 h-3.5 text-brand-orange" />
              Admin Portal
            </Link>
            <button
              type="button"
              id="nav-cta-quote-btn"
              onClick={() => onOpenQuote()}
              className="bg-[#F26522] text-white px-6 py-2.5 rounded-sm font-bold text-sm tracking-wide hover:brightness-110 transition-all shadow-md select-none cursor-pointer"
            >
              GET A SERVICE
            </button>
          </div>

          {/* Hamburger Mobile Toggle */}
          <button
            type="button"
            id="mobile-menu-toggle"
            onClick={handleToggle}
            className="lg:hidden p-2 text-gray-500 hover:text-brand-orange hover:bg-gray-100 rounded-sm transition-colors cursor-pointer"
            aria-label="Toggle navigation menu"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>

        </div>
      </div>

      {/* Mobile Menu Drawer */}
      <div 
        id="mobile-navigation-drawer"
        className={`lg:hidden overflow-hidden transition-all duration-300 bg-white/90 backdrop-blur-lg border-t border-white/20 ${
          isOpen ? "max-h-screen opacity-100 pb-6 shadow-lg" : "max-h-0 opacity-0 pointer-events-none"
        }`}
      >
        <div className="px-4 pt-4 pb-3 space-y-1">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              id={`mobile-nav-${link.label.toLowerCase().replace(" ", "-")}`}
              to={link.path}
              onClick={handleLinkClick}
              className={`block px-4 py-3 rounded-sm font-bold tracking-wide transition-all ${
                isActive(link.path)
                  ? "bg-brand-navy/5 text-brand-navy pl-6 border-l-4 border-brand-navy"
                  : "text-gray-600 hover:bg-gray-50 hover:text-brand-orange"
              }`}
            >
              {link.label}
            </Link>
          ))}
          
          {/* Admin Portal Link */}
          <Link
            id="mobile-nav-admin"
            to="/admin"
            onClick={handleLinkClick}
            className={`block px-4 py-3 rounded-sm font-bold tracking-wide transition-all ${
              isActive("/admin")
                ? "bg-brand-navy/5 text-brand-navy pl-6 border-l-4 border-brand-navy"
                : "text-gray-500 hover:bg-gray-50 hover:text-brand-orange"
            }`}
          >
            <span className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-brand-orange" />
              Admin Portal
            </span>
          </Link>
          
          <div className="pt-4 px-4 space-y-3">
            <button
              type="button"
              id="mobile-nav-quote-btn"
              onClick={() => {
                handleLinkClick();
                onOpenQuote();
              }}
              className="w-full px-5 py-3 bg-[#F26522] text-white font-bold rounded-sm shadow-md hover:brightness-110 select-none text-center cursor-pointer text-sm block"
            >
              GET A SERVICE
            </button>
            <div className="text-center pt-2 text-xs text-gray-400">
              Need immediate help? Call <strong className="text-brand-navy text-xs font-semibold">+1 (210) 548-2782</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Global Running/Marquee Banner for Recruits & Candidates */}
      <div 
        id="currently-hiring-languages-ticker" 
        className="w-full bg-gradient-to-r from-brand-navy-dark to-[#162357] text-[#FAFAFB] border-t border-brand-orange/30 text-xs font-sans h-9 flex items-center relative overflow-hidden select-none shadow-[inset_0_-2px_4px_rgba(0,0,0,0.1)]"
      >
        {/* Dynamic Static Title Accent */}
        <div className="absolute left-0 top-0 bottom-0 px-4 bg-brand-orange text-white font-extrabold flex items-center gap-1.5 shadow-[4px_0_12px_rgba(0,0,0,0.25)] z-20 text-[10.5px] uppercase tracking-wider shrink-0 transition-opacity">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
          </span>
          <span className="font-sans font-bold whitespace-nowrap">Hiring Linguists</span>
        </div>

        {/* Endless Ticker Conveybelt */}
        <div className="w-full h-full pl-[135px] sm:pl-[145px] flex items-center overflow-hidden">
          <Link 
            to="/careers" 
            className="w-full flex items-center overflow-hidden hover:text-brand-orange transition-colors focus:outline-none"
            title="We are Actively Hiring! Click to submit your application."
          >
            <div className="animate-marquee whitespace-nowrap flex items-center gap-8 py-1.5 font-medium tracking-wide">
              {/* Iteration 1 */}
              <div className="flex items-center gap-4 shrink-0">
                <span>Active Openings for Translators & Interpreters:</span>
                <span className="font-bold text-brand-orange-light">Spanish</span> &bull; 
                <span className="font-bold text-brand-orange-light">Mandarin</span> &bull; 
                <span className="font-bold text-brand-orange-light">ASL (American Sign Language)</span> &bull; 
                <span className="font-bold text-brand-orange-light">Korean</span> &bull; 
                <span className="font-bold text-brand-orange-light">Japanese</span> &bull; 
                <span className="font-bold text-brand-orange-light">Arabic</span> &bull; 
                <span className="font-bold text-brand-orange-light">Karen</span> &bull; 
                <span className="font-bold text-brand-orange-light">Haka-Chin</span> &bull; 
                <span className="font-bold text-brand-orange-light">Russian</span> &bull; 
                <span className="font-bold text-brand-orange-light">Cambodian</span> &bull; 
                <span className="font-bold text-brand-orange-light">Nepali</span> &bull; 
                <span className="font-bold text-brand-orange-light">French</span> &bull; 
                <span className="font-bold text-brand-orange-light">Cantonese</span> &bull; 
                <span className="font-bold text-brand-orange-light">Ukrainian</span>
              </div>
              
              {/* Loop Spacer / Transition */}
              <span className="text-gray-400 font-extrabold shrink-0">❖</span>

              {/* Iteration 2 (Duplicate for flawless scroll overlay transition) */}
              <div className="flex items-center gap-4 shrink-0">
                <span>Active Openings for Translators & Interpreters:</span>
                <span className="font-bold text-brand-orange-light">Spanish</span> &bull; 
                <span className="font-bold text-brand-orange-light">Mandarin</span> &bull; 
                <span className="font-bold text-brand-orange-light">ASL (American Sign Language)</span> &bull; 
                <span className="font-bold text-brand-orange-light">Korean</span> &bull; 
                <span className="font-bold text-brand-orange-light">Japanese</span> &bull; 
                <span className="font-bold text-brand-orange-light">Arabic</span> &bull; 
                <span className="font-bold text-brand-orange-light">Karen</span> &bull; 
                <span className="font-bold text-brand-orange-light">Haka-Chin</span> &bull; 
                <span className="font-bold text-brand-orange-light">Russian</span> &bull; 
                <span className="font-bold text-brand-orange-light">Cambodian</span> &bull; 
                <span className="font-bold text-brand-orange-light">Nepali</span> &bull; 
                <span className="font-bold text-brand-orange-light">French</span> &bull; 
                <span className="font-bold text-brand-orange-light">Cantonese</span> &bull; 
                <span className="font-bold text-brand-orange-light">Ukrainian</span>
              </div>

              {/* Loop Spacer / Transition */}
              <span className="text-gray-400 font-extrabold shrink-0">❖</span>

              {/* Iteration 3 */}
              <div className="flex items-center gap-4 shrink-0">
                <span>Active Openings for Translators & Interpreters:</span>
                <span className="font-bold text-brand-orange-light">Spanish</span> &bull; 
                <span className="font-bold text-brand-orange-light">Mandarin</span> &bull; 
                <span className="font-bold text-brand-orange-light">ASL (American Sign Language)</span> &bull; 
                <span className="font-bold text-brand-orange-light">Korean</span> &bull; 
                <span className="font-bold text-brand-orange-light">Japanese</span> &bull; 
                <span className="font-bold text-brand-orange-light">Arabic</span> &bull; 
                <span className="font-bold text-brand-orange-light">Karen</span> &bull; 
                <span className="font-bold text-brand-orange-light">Haka-Chin</span> &bull; 
                <span className="font-bold text-brand-orange-light">Russian</span> &bull; 
                <span className="font-bold text-brand-orange-light">Cambodian</span> &bull; 
                <span className="font-bold text-brand-orange-light">Nepali</span> &bull; 
                <span className="font-bold text-brand-orange-light">French</span> &bull; 
                <span className="font-bold text-brand-orange-light">Cantonese</span> &bull; 
                <span className="font-bold text-brand-orange-light">Ukrainian</span>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </header>
  );
}
