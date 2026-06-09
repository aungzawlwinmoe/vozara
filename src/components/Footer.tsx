import { Link } from "react-router-dom";
import { 
  Phone, 
  Mail, 
  MapPin, 
  Clock, 
  ShieldCheck, 
  Facebook, 
  Twitter, 
  Linkedin, 
  Globe2,
  Lock
} from "lucide-react";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer id="corporate-footer" className="bg-brand-navy-dark text-white pt-16 pb-8 border-t border-brand-navy-light/20 relative overflow-hidden">
      
      {/* Dynamic Background Grid Decorator */}
      <div className="absolute inset-0 z-0 opacity-5 pointer-events-none">
        <svg viewBox="0 0 100 100" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <circle cx="90" cy="10" r="15" stroke="white" strokeWidth="0.5" fill="none" />
          <circle cx="10" cy="90" r="30" stroke="white" strokeWidth="0.5" fill="none" />
        </svg>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 md:gap-8 pb-12 border-b border-white/10">
          
          {/* Logo, tagline, and details */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <svg viewBox="0 0 100 100" className="w-9 h-9 flex-shrink-0">
                <defs>
                  <linearGradient id="swoopGradientFooter" x1="0%" y1="100%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#F26522" />
                    <stop offset="60%" stopColor="#FB8C00" />
                    <stop offset="100%" stopColor="#FFB300" />
                  </linearGradient>
                </defs>

                {/* 1. Main Serif Stem of 'V' (White) */}
                <path 
                  d="M 18,24 H 46 C 40.5,24 38.5,26.5 38,30 L 44,79 L 45,80 H 48.5 L 41.5,30 C 41,26.5 39,24 33.5,24 Z" 
                  fill="#FFFFFF" 
                />
                
                {/* 2. Globe nested behind Swoop (White lines) */}
                <g>
                  <circle cx="58" cy="46" r="13" fill="none" stroke="#FFFFFF" strokeWidth="2" />
                  <ellipse cx="58" cy="46" rx="8" ry="13" fill="none" stroke="#FFFFFF" strokeWidth="1.5" />
                  <ellipse cx="58" cy="46" rx="3.5" ry="13" fill="none" stroke="#FFFFFF" strokeWidth="1.5" />
                  <path d="M 45,46 H 71" stroke="#FFFFFF" strokeWidth="1.5" fill="none" />
                  <path d="M 47,39 Q 58,41 69,39" stroke="#FFFFFF" strokeWidth="1.2" fill="none" />
                  <path d="M 47,53 Q 58,51 69,53" stroke="#FFFFFF" strokeWidth="1.2" fill="none" />
                </g>

                {/* 3. Curved Swoop with Linear Gradient */}
                <path 
                  d="M 45,80 C 49,60 59,38 78,24.5 C 63,30 49,52 46,80 Z" 
                  fill="url(#swoopGradientFooter)" 
                />
              </svg>
              <div>
                <span className="font-serif text-2xl font-extrabold tracking-tight block">Vozara</span>
                <span className="text-[8px] uppercase tracking-[0.2em] text-gray-300 block">Language Services</span>
              </div>
            </div>
            
            <p className="text-gray-400 text-sm leading-relaxed max-w-xs">
              Universal language access since 2022. Connecting voices and cultures with uncompromising certified accuracy, HIPAA compliance, and 24/7 reliability.
            </p>

            <div className="flex items-center gap-3 pt-2">
              <a href="https://www.facebook.com/vozarals" target="_blank" rel="noreferrer" id="footer-social-fb" className="text-gray-400 hover:text-brand-orange transition-colors duration-200">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="https://x.com/vozarals" target="_blank" rel="noreferrer" id="footer-social-tw" className="text-gray-400 hover:text-brand-orange transition-colors duration-200">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="https://www.linkedin.com/company/vozarals/" target="_blank" rel="noreferrer" id="footer-social-li" className="text-gray-400 hover:text-brand-orange transition-colors duration-200">
                <Linkedin className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Group 1: Language Solutions */}
          <div>
            <h4 className="text-xs uppercase font-extrabold tracking-[0.15em] text-brand-orange mb-5">Language Solutions</h4>
            <ul id="footer-solutions-links" className="space-y-3">
              <li>
                <Link to="/services" className="text-gray-400 hover:text-white transition-colors duration-200 text-[13.5px] font-medium block">
                  Interpreter Staffing
                </Link>
              </li>
              <li>
                <Link to="/services" className="text-gray-400 hover:text-white transition-colors duration-200 text-[13.5px] font-medium block">
                  Translation Services
                </Link>
              </li>
              <li>
                <Link to="/services" className="text-gray-400 hover:text-white transition-colors duration-200 text-[13.5px] font-medium block">
                  Localization Solutions
                </Link>
              </li>
              <li>
                <Link to="/services" className="text-gray-400 hover:text-white transition-colors duration-200 text-[13.5px] font-medium block">
                  Remote Interpreting (OPI/VRI)
                </Link>
              </li>
              <li>
                <Link to="/services" className="text-gray-400 hover:text-white transition-colors duration-200 text-[13.5px] font-medium block">
                  Multilingual Support Services
                </Link>
              </li>
            </ul>
          </div>

          {/* Group 2: Company Info */}
          <div>
            <h4 className="text-xs uppercase font-extrabold tracking-[0.15em] text-brand-orange mb-5">Company Hub</h4>
            <ul id="footer-company-links" className="space-y-3">
              <li>
                <Link to="/about" className="text-gray-400 hover:text-white transition-colors duration-200 text-[13.5px] font-medium block">
                  About Vozara
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-gray-400 hover:text-white transition-colors duration-200 text-[13.5px] font-medium block">
                  Our Mission & Values
                </Link>
              </li>
              <li>
                <Link to="/careers" className="text-gray-400 hover:text-white transition-colors duration-200 text-[13.5px] font-medium block">
                  Careers & Openings
                </Link>
              </li>
              <li>
                <Link to="/careers/interpreter-apply" className="text-gray-400 hover:text-white transition-colors duration-200 text-[13.5px] font-medium block font-bold text-gray-300">
                  Join as an Interpreter
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-gray-400 hover:text-white transition-colors duration-200 text-[13.5px] font-medium block">
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>

          {/* Group 3: Contact & Support Info */}
          <div>
            <h4 className="text-xs uppercase font-extrabold tracking-[0.15em] text-brand-orange mb-5">Contact Operations</h4>
            <ul id="footer-contact-info" className="space-y-4">
              <li className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-brand-orange mt-0.5 flex-shrink-0" />
                <div>
                  <a href="tel:+12105482782" id="footer-phone-dial" className="text-[13.5px] font-bold text-gray-200 hover:text-white block">
                    +1 (210) 548-2782
                  </a>
                  <span className="text-[10px] text-gray-500 block mt-0.5 uppercase tracking-wide font-semibold">24/7 Operations Line</span>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-brand-orange mt-0.5 flex-shrink-0" />
                <div>
                  <a href="mailto:info@vozarals.com" id="footer-email-link" className="text-[13.5px] font-semibold text-gray-300 hover:text-white block">
                    info@vozarals.com
                  </a>
                  <span className="text-[10px] text-gray-500 block mt-0.5 uppercase tracking-wide font-semibold">1-Business-Day SLA</span>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-brand-orange mt-0.5 flex-shrink-0" />
                <span className="text-gray-400 text-xs leading-relaxed font-medium">
                  Headquarters:<br />
                  1200 Plaza Tower, Suite 400<br />
                  Seattle, WA 98101
                </span>
              </li>
            </ul>
          </div>

        </div>

        {/* Closing Credentials Section */}
        <div className="pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-center md:text-left text-gray-500 text-xs">
          <div>
            &copy; {currentYear} <strong>Vozara Language Services</strong>. Founded in 2022. All rights reserved. Registered trademark.
          </div>
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-1.5 hover:text-gray-300 transition-colors">
              <Clock className="w-4 h-4 text-brand-orange" />
              SLA Compliant
            </span>
            <span className="flex items-center gap-1.5 hover:text-gray-300 transition-colors">
              <ShieldCheck className="w-4 h-4 text-brand-orange" />
              HIPAA & Court Certified
            </span>
          </div>
        </div>

      </div>
    </footer>
  );
}
