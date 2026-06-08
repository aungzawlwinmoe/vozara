import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { submitContactFormDirect, submitInterpreterAppDirect } from "./firebase";
import { 
  BrowserRouter as Router, 
  Routes, 
  Route, 
  Link, 
  useLocation, 
  useNavigate 
} from "react-router-dom";
import { 
  Users, 
  FileText, 
  Video, 
  PhoneCall, 
  Stethoscope, 
  Briefcase, 
  Building2, 
  GraduationCap, 
  TrendingUp, 
  CheckCircle2, 
  Globe, 
  ShieldCheck, 
  Clock, 
  ArrowRight, 
  ChevronDown, 
  ChevronUp, 
  MapPin, 
  Mail, 
  Laptop, 
  Wifi, 
  Headphones, 
  Check, 
  Loader2, 
  Send, 
  Sparkles, 
  FlameKindling,
  AlertCircle
} from "lucide-react";

// Types and static data parameters
import { 
  servicesData, 
  industriesData, 
  homeHomeStats, 
  aboutStats, 
  whyVozaraData, 
  testimonialsData, 
  valuesData, 
  timelineData, 
  perksData, 
  careerRolesData 
} from "./data";

// Shared page components
// @ts-ignore
import regeneratedImage from "./assets/images/regenerated_image_1780857849933.png";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import AnimatedCounter from "./components/AnimatedCounter";
import QuoteModal from "./components/QuoteModal";
import AdminPortalView from "./components/AdminPortalView";

/* Helper Component: Restores scroll position to 0 on route transitions & sets document pages titles */
const pageVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" } },
  exit: { opacity: 0, y: -12, transition: { duration: 0.25, ease: "easeIn" } }
};

function PageWrapper({ title, children }: { title: string; children: React.ReactNode }) {
  const location = useLocation();
  
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    document.title = `${title} | Vozara Language Services`;
  }, [location.pathname, title]);

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="w-full"
    >
      {children}
    </motion.div>
  );
}

// Maps icon name strings to Lucide elements safely
function IconRenderer({ name, className = "w-6 h-6" }: { name: string; className?: string }) {
  const mapping: { [key: string]: any } = {
    Users,
    FileText,
    Video,
    PhoneCall,
    Stethoscope,
    Briefcase,
    FileShield: ShieldCheck,
    Building2,
    GraduationCap,
    TrendingUp,
    CheckCircle2,
    Globe,
    ShieldCheck,
    Clock,
    Laptop,
    Wifi,
    Headphones,
    FlameKindling
  };

  const Component = mapping[name] || Globe;
  return <Component className={className} />;
}

/* ==========================================
   1. HOME SCREEN / VIEW
   ========================================= */
function HomeView({ onOpenQuote }: { onOpenQuote: (service?: string) => void }) {
  const [activeTestimonial, setActiveTestimonial] = useState(0);

  // Auto-rotating testimonials mechanism (every 5 seconds)
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveTestimonial((prev) => (prev + 1) % testimonialsData.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative animate-fade-in">
      
      {/* Hero Section Container */}
      <section className="relative bg-brand-navy-dark text-white overflow-hidden py-24 lg:py-32 xl:py-36 border-b border-brand-orange/10">
        {/* Abstract Background Design Elements */}
        <div className="absolute inset-0 opacity-15 pointer-events-none">
          <div className="absolute -top-1/4 -right-1/10 w-96 h-96 bg-brand-orange rounded-full filter blur-3xl" />
          <div className="absolute -bottom-1/5 -left-1/10 w-96 h-96 bg-brand-navy-light rounded-full filter blur-3xl" />
          <div className="absolute inset-0 overlay-pattern" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Content */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 p-1 px-3 bg-brand-navy-light/40 border border-brand-navy-light/50 rounded-sm">
                <Sparkles className="w-3.5 h-3.5 text-brand-orange" />
                <span className="text-[11px] uppercase font-bold tracking-wider text-brand-orange-light">Universal Language Access</span>
              </div>
              
              <h1 className="font-serif text-4.5xl sm:text-5xl md:text-6xl font-black text-white leading-[1.1]">
                Connecting <span className="text-brand-orange">Voices</span> <br />
                Across Languages.
              </h1>

              <p className="text-base sm:text-lg text-gray-300 max-w-xl leading-relaxed">
                Empowering clinical teams, government agencies, court rooms, and global enterprises with highly certified on-site interpreters, professional translators, and remote OPI/VRI experts since 2022.
              </p>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2">
                <button
                  type="button"
                  id="hero-contact-btn"
                  onClick={() => onOpenQuote()}
                  className="px-8 py-4 bg-brand-orange hover:brightness-110 text-white font-bold rounded-sm shadow-md transition-all duration-200 text-center cursor-pointer text-sm uppercase tracking-wider"
                >
                  CONTACT US
                </button>
                <Link
                  to="/services"
                  id="hero-services-link"
                  className="px-8 py-4 bg-transparent hover:bg-white hover:text-brand-navy border-2 border-white text-white font-bold rounded-sm transition-all duration-200 text-center text-sm uppercase tracking-wider"
                >
                  OUR SERVICES
                </Link>
              </div>

              {/* Trust Indicators */}
              <div className="pt-6 grid grid-cols-3 gap-4 border-t border-white/10 max-w-lg">
                <div>
                  <h4 className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-widest leading-none">EVERY LANGUAGE</h4>
                  <p className="text-[9px] sm:text-[10px] text-brand-orange font-bold mt-1 uppercase">100+ COVERED</p>
                </div>
                <div className="border-l border-white/10 pl-4">
                  <h4 className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-widest leading-none">EVERY CULTURE</h4>
                  <p className="text-[9px] sm:text-[10px] text-brand-orange font-bold mt-1 uppercase">VETTED LINGUISTS</p>
                </div>
                <div className="border-l border-white/10 pl-4">
                  <h4 className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-widest leading-none">ONE CONNECTION</h4>
                  <p className="text-[9px] sm:text-[10px] text-brand-orange font-bold mt-1 uppercase">VOZARA UNIFIED</p>
                </div>
              </div>
            </div>

            {/* Right Abstract Card Visual */}
            <div className="lg:col-span-5 relative min-h-[420px] lg:min-h-[500px] bg-[#1B2A6B] rounded-sm border border-white/10 shadow-2xl overflow-hidden flex items-center justify-center">
              {/* Background Remote Interpreter Image */}
              <img 
                src={regeneratedImage}
                alt="Active remote language interpreter supporting video connection"
                className="absolute inset-0 w-full h-full object-cover opacity-35"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 opacity-40 mix-blend-overlay bg-gradient-to-br from-[#1B2A6B] to-[#F26522]" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] h-[90%] border border-white/20" />
              
              <div className="absolute top-[15%] left-8 select-none">
                <span className="text-[120px] md:text-[160px] font-black text-white/5 leading-none font-serif block">
                  VOZ
                </span>
              </div>

              {/* Floating Testimonial/Quote Card with nested Circle Badge */}
              <div className="absolute bottom-12 right-[6%] w-[78%] z-10 max-w-sm h-[147.188px]">
                <div className="bg-white/85 backdrop-blur-md p-6 sm:p-8 shadow-2xl rounded-sm text-left border border-white/40 relative h-[187.188px] w-[251.766px]">
                  <div className="text-[#F26522] mb-3">
                    <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z" />
                      <path d="M15 7v2a4 4 0 01-4 4H9.828l-1.766 1.767c.28.149.599.233.938.233h2l3 3v-3h2a2 2 0 002-2V9a2 2 0 00-2-2h-1z" />
                    </svg>
                  </div>
                  <p className="text-xs sm:text-sm md:text-[14.5px] italic text-gray-700 font-sans leading-relaxed font-medium text-center">
                    "Language should never be a barrier to access, opportunity, or understanding."
                  </p>
                  <div className="mt-4 h-1.5 w-14 bg-[#F26522] mx-auto" />

                  {/* Overlapping Badge positioned perfectly at bottom-left corner of global quote card */}
                  <div className="absolute -bottom-8 -left-8 bg-[#F26522] text-white rounded-full h-[93.672px] w-[94.672px] flex flex-col items-center justify-center text-center shadow-2xl z-20 border-2 border-white/25 transform hover:scale-105 transition-transform duration-300 select-none">
                    <span className="text-xl sm:text-2xl font-black leading-none">4+</span>
                    <span className="text-[8px] sm:text-[9px] font-extrabold uppercase tracking-widest mt-1 max-w-[70px] leading-tight">
                      Years of<br />Excellence
                    </span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Stats Band Section */}
      <section className="bg-brand-navy py-12 border-b border-white/10 relative z-10 -mt-1 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {homeHomeStats.map((stat) => (
              <AnimatedCounter
                key={stat.id}
                value={stat.value}
                number={stat.number}
                suffix={stat.suffix}
                label={stat.label}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Services Preview Grid */}
      <section className="py-20 md:py-28 bg-[#dae8ff]" id="services-preview-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-16 md:mb-20">
            <span className="text-xs uppercase font-extrabold tracking-[0.2em] text-brand-orange-light block">Our Capability Portfolio</span>
            <h2 className="font-serif text-3.5xl md:text-5xl font-extrabold text-brand-navy tracking-tight leading-tight">
              Professional Language Solutions
            </h2>
            <div className="w-16 h-1.5 bg-brand-orange mx-auto rounded-full" />
            <p className="text-gray-600 text-sm md:text-base leading-relaxed">
              We deliver customized solutions meticulously matched to the unique operational timelines, legal protocols, and patient-care requirements of our enterprise stakeholders.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
            {servicesData.map((service) => (
              <div 
                key={service.id}
                className="bg-[#d1ddef] hover:bg-[#d1ddef]/90 border border-white/10 rounded-sm p-6 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between group"
              >
                <div>
                  <div className="w-12 h-12 rounded-sm bg-brand-navy/5 border border-brand-navy/10 flex items-center justify-center text-brand-navy mb-5 group-hover:bg-brand-orange group-hover:text-white transition-colors duration-300">
                    <IconRenderer name={service.iconName} className="w-6 h-6" />
                  </div>
                  <h3 className="font-serif text-[18.2px] font-bold text-brand-navy group-hover:text-brand-orange transition-colors duration-300 tracking-tight leading-snug">
                    {service.title}
                  </h3>
                  <p className="mt-3 text-xs text-gray-500 leading-relaxed line-clamp-4">
                    {service.description}
                  </p>
                </div>
                
                <div className="pt-6 border-t border-gray-50 mt-6 flex items-center justify-between">
                  <span className="text-[10px] text-brand-orange font-extrabold uppercase tracking-widest">{service.tagline.split(".")[0]}...</span>
                  <Link 
                    to="/services" 
                    className="flex items-center gap-1 text-xs font-bold text-brand-navy group-hover:gap-2 group-hover:text-brand-orange transition-all"
                  >
                    Learn more
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* Why Vozara Split Block Section */}
      <section className="py-20 md:py-28 bg-[#dae8ff] border-t border-b border-gray-200/50 relative overflow-hidden" id="why-vozara-block">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Graphics Accent Card */}
            <div className="lg:col-span-5 relative">
              <div className="relative bg-[#1B2A6B]/90 backdrop-blur-md text-white rounded-sm overflow-hidden p-8 border border-white/20 shadow-xl space-y-10">
                {/* Grid Overlay */}
                <div className="absolute inset-0 overlay-pattern z-0 opacity-10" />

                <div className="relative z-10 space-y-4">
                  <span className="text-xs font-extrabold uppercase tracking-wide text-brand-orange">Trusted Network</span>
                  <h3 className="font-serif text-2.5xl md:text-3.5xl font-extrabold tracking-tight">Vetted For Human Integrity</h3>
                  <p className="text-xs text-gray-300 leading-relaxed">Our staffing agency protocols operate with multi-layer compliance verification to match human translators in courts and pediatric campuses.</p>
                </div>

                <div className="relative z-10 grid grid-cols-2 gap-px bg-white/10 pt-px">
                  <div className="bg-[#1B2A6B] p-4 text-center">
                    <p className="font-serif text-2xl font-bold text-brand-orange">4+</p>
                    <p className="text-[9px] uppercase tracking-wider text-gray-300 font-semibold mt-1">Years Operations</p>
                  </div>
                  <div className="bg-[#1B2A6B] p-4 text-center">
                    <p className="font-serif text-2xl font-bold text-brand-orange">98%</p>
                    <p className="text-[9px] uppercase tracking-wider text-gray-300 font-semibold mt-1">SLA Efficiency</p>
                  </div>
                </div>

                {/* Badge Overlay */}
                <div className="absolute top-4 right-4 bg-brand-orange text-white text-[10px] font-extrabold px-3 py-1.5 rounded-sm shadow-md border border-white/10 uppercase tracking-widest leading-none">
                  4+ Years of Excellence
                </div>
              </div>
            </div>

            {/* Right Differentiators Grid */}
            <div className="lg:col-span-7 space-y-8">
              <div className="space-y-4">
                <span className="text-xs uppercase font-extrabold tracking-[0.2em] text-brand-orange block">Our Competitive Edge</span>
                <h2 className="font-serif text-3xl md:text-4.5xl font-extrabold text-brand-navy tracking-tight leading-tight">
                  Why Leading Networks Partner with Vozara
                </h2>
                <p className="text-gray-600 text-sm leading-relaxed max-w-2xl">
                  We don't simply translate words; we connect professional pathways. From medical confidentiality to fast-turnaround software localization, the values of Connection are baked directly into our corporate code.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
                {whyVozaraData.map((item) => (
                  <div key={item.number} className="flex gap-4 p-4 bg-[#d1ddef] rounded-sm hover:border-gray-300 transition-all duration-200 border border-white/10 shadow-sm">
                    <span className="font-serif text-2xl font-black text-brand-orange/30 group-hover:text-brand-orange transition-colors">
                      {item.number}
                    </span>
                    <div className="space-y-1.5">
                      <h4 className="font-serif text-[16px] font-bold text-brand-navy leading-snug">{item.title}</h4>
                      <p className="text-xs text-gray-500 leading-relaxed">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* Testimonials Carousel Section */}
      <section className="py-20 md:py-28 bg-[#dae8ff] border-b border-gray-100" id="testimonials-carousel-section">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          
          <div className="space-y-4 mb-12">
            <span className="text-xs uppercase font-extrabold tracking-[0.2em] text-brand-orange block">Executive Endorsements</span>
            <h2 className="font-serif text-2.5xl md:text-4.5xl font-extrabold text-brand-navy tracking-tight">Partner Experiences</h2>
            <div className="w-12 h-1 bg-brand-orange mx-auto rounded-full" />
          </div>

          {/* Testimonial Active Slider Card */}
          <div className="relative min-h-[300px] bg-[#d1ddef] border border-gray-100 rounded-sm p-6 sm:p-12 md:p-16 shadow-md flex flex-col justify-between items-center transition-all duration-500 ease-in-out transform">
            <div className="text-brand-orange opacity-15 text-7xl font-serif leading-none absolute top-4 left-6 select-none">“</div>
            
            <p className="relative z-10 font-serif text-md sm:text-lg md:text-xl text-gray-700 italic leading-relaxed max-w-3xl mx-auto mt-4">
              {testimonialsData[activeTestimonial].quote}
            </p>

            <div className="mt-8 relative z-10">
              <h4 className="font-serif text-base font-bold text-brand-navy">{testimonialsData[activeTestimonial].name}</h4>
              <p className="text-xs text-brand-orange font-bold uppercase tracking-wider mt-1">
                {testimonialsData[activeTestimonial].role} &bull; <span className="text-gray-500">{testimonialsData[activeTestimonial].organization}</span>
              </p>
            </div>

            {/* Testimonial Carousel Dots Navigation */}
            <div className="flex items-center gap-2 mt-8">
              {testimonialsData.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveTestimonial(idx)}
                  className={`w-2.5 h-2.5 rounded-none transition-all duration-300 cursor-pointer ${
                    activeTestimonial === idx 
                      ? "bg-brand-orange scale-110 w-5" 
                      : "bg-gray-300 hover:bg-gray-400"
                  }`}
                  aria-label={`Go to testimonial ${idx + 1}`}
                />
              ))}
            </div>
          </div>

        </div>
      </section>

      {/* Industries Served Tag Section */}
      <section className="py-16 bg-[#dae8ff] border-b border-gray-150">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
          <div className="space-y-2">
            <h3 className="font-serif text-xl sm:text-2xl font-bold text-brand-navy">Core Sectors Securing Universal Coverage</h3>
            <p className="text-xs text-gray-500 uppercase tracking-widest font-semibold">Specialized Terminology. Seamless Connections.</p>
          </div>

          <div className="flex flex-wrap justify-center gap-3 max-w-4xl mx-auto">
            {industriesData.map((ind) => (
              <Link
                key={ind.id}
                to="/services"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-white hover:bg-brand-navy hover:text-white border border-gray-200 hover:border-brand-navy rounded-sm text-xs font-bold text-gray-700 shadow-sm transition-all duration-200 cursor-pointer group"
              >
                <span className="text-brand-orange group-hover:text-white transition-colors">
                  <IconRenderer name={ind.iconName} className="w-4 h-4" />
                </span>
                {ind.name}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Banner Band */}
      <section className="bg-[#1B2A6B] text-white py-16 md:py-20 relative overflow-hidden border-t border-brand-orange/10">
        {/* Background Accent */}
        <div className="absolute inset-0 overlay-pattern opacity-10" />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10 space-y-6">
          <h2 className="font-serif text-2.5xl sm:text-4xl md:text-4.5xl font-extrabold tracking-tight">Ready to Break Language Barriers?</h2>
          <p className="text-sm sm:text-base text-gray-300 max-w-xl mx-auto leading-relaxed">
            Partner with Vozara to deploy vetted HIPAA interpreters or localize critical digital services seamlessly under our 24-hour guarantee.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <button
              type="button"
              id="cta-band-request-btn"
              onClick={() => onOpenQuote()}
              className="px-8 py-4 bg-brand-orange hover:brightness-110 text-white font-bold rounded-sm shadow-md transition-all cursor-pointer text-sm uppercase tracking-wider w-full sm:w-auto"
            >
              Contact Us
            </button>
            <a
              href="tel:+12105482782"
              id="cta-band-phone"
              className="flex items-center justify-center gap-2 px-8 py-4 bg-transparent hover:bg-white hover:text-[#1B2A6B] border-2 border-white text-white font-bold rounded-sm transition-all text-sm uppercase tracking-wider w-full sm:w-auto text-center"
            >
              <PhoneCall className="w-4 h-4 text-brand-orange" />
              +1 (210) 548-2782
            </a>
          </div>
          <p className="text-[10px] text-gray-400 font-semibold tracking-wider uppercase">Our medical emergency and OPI routing networks are active 24/7/365.</p>
        </div>
      </section>

    </div>
  );
}

/* ==========================================
   2. SERVICES SCREEN / VIEW
   ========================================= */
function ServicesView({ onOpenQuote }: { onOpenQuote: (service?: string) => void }) {
  return (
    <div className="animate-fade-in space-y-1">
      
      {/* Page Hero with breadcrumb */}
      <section className="bg-brand-navy-dark text-white py-16 md:py-20 relative overflow-hidden">
        <div className="absolute inset-0 overlay-pattern opacity-10" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-4">
          <div id="services-breadcrumbs" className="flex items-center gap-2 text-xs text-gray-400 font-bold uppercase tracking-wider">
            <Link to="/" className="hover:text-brand-orange transition-colors">Home</Link>
            <span>/</span>
            <span className="text-gray-200">Services Portfolio</span>
          </div>
          <h1 className="font-serif text-3.5xl md:text-5xl font-extrabold tracking-tight">Professional Services Portfolio</h1>
          <p className="text-xs sm:text-sm text-gray-300 max-w-2xl leading-relaxed">
            Delivering peer-reviewed documentation, same-day face-to-face interpreters, and cloud-hosted HIPAA streaming. Discover how Vozara connects your enterprise safely.
          </p>
        </div>
      </section>

      {/* 5 Detailed Service Rows (Alternating Layout) */}
      <section className="py-20 bg-[#dae8ff] space-y-24 md:space-y-36" id="detailed-services-rows">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 bg-[#dae8ff]">
          
          {servicesData.map((service, index) => {
            const isRight = index % 2 === 1;
            return (
              <div 
                key={service.id} 
                id={`service-row-${service.id}`}
                className={`grid grid-cols-1 lg:grid-cols-12 gap-12 items-center ${
                  index !== 0 ? "pt-20 md:pt-32 border-t border-brand-navy/10" : ""
                }`}
              >
                {/* Visual Accent Box */}
                <div className={`lg:col-span-5 relative ${isRight ? "lg:order-last" : ""}`}>
                  <div className={`p-8 rounded-sm border ${
                    isRight 
                      ? "bg-[#1B2A6B] text-white border-white/10" 
                      : "bg-[#d1ddef] text-gray-900 border-white/20"
                  } shadow-md relative overflow-hidden space-y-6`}>
                    
                    <div className="w-12 h-12 rounded-sm bg-brand-orange/10 border border-brand-orange/20 flex items-center justify-center text-brand-orange">
                      <IconRenderer name={service.iconName} className="w-6 h-6" />
                    </div>

                    <div className="space-y-2">
                      <span className="text-[10px] uppercase font-bold tracking-widest text-brand-orange">{service.tagline}</span>
                      <h4 className="font-serif text-xl sm:text-2xl font-bold leading-tight">{service.title} Details</h4>
                    </div>

                    <p className={`text-xs leading-relaxed ${isRight ? "text-gray-300" : "text-gray-500"}`}>
                      This program is supported by on-demand dispatchers and live monitoring dashboards to maintain extreme terminology compliance, data isolation compliance, and native localization accuracy.
                    </p>

                    <div className="pt-2 border-t border-white/10 flex items-center justify-between">
                      <span className="text-[9px] uppercase tracking-wider text-gray-400 font-semibold">Standard Code</span>
                      <span className="text-xs font-mono font-bold text-brand-orange">VOZ-{service.id.substring(0, 4).toUpperCase()}</span>
                    </div>
                  </div>
                </div>

                {/* Main Content & Features */}
                <div className="lg:col-span-7 space-y-6">
                  <div className="space-y-2">
                    <span className="text-xs font-black uppercase tracking-widest text-brand-orange-dark block">{service.tagline}</span>
                    <h3 className="font-serif text-2.5xl md:text-3.5xl font-extrabold text-brand-navy tracking-tight leading-tight">
                      {service.title}
                    </h3>
                  </div>

                  <p className="text-gray-600 text-sm leading-relaxed">
                    {service.description}
                  </p>

                  <div className="space-y-3 pt-2">
                    <h4 className="text-xs uppercase font-extrabold tracking-[0.1em] text-brand-navy">Service Checklist Standards:</h4>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
                      {service.features.map((feat, fIdx) => (
                        <li key={fIdx} className="flex items-start gap-2.5 text-xs text-gray-700">
                          <Check className="w-4 h-3.5 text-brand-orange mt-0.5 flex-shrink-0" />
                          <span className="font-medium leading-tight">{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-4">
                    <button
                      type="button"
                      id={`request-service-${service.id}`}
                      onClick={() => onOpenQuote(service.title)}
                      className="px-6 py-3 bg-brand-navy hover:brightness-110 text-white font-bold rounded-sm shadow-md transition-all cursor-pointer text-sm uppercase tracking-wider"
                    >
                      Request This Service
                    </button>
                  </div>
                </div>

              </div>
            );
          })}

        </div>
      </section>

      {/* Industries Served Section */}
      <section className="py-20 md:py-28 bg-[#dae8ff] border-t border-b border-brand-navy/10" id="industries-grid-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
            <span className="text-xs uppercase font-extrabold tracking-[0.2em] text-brand-orangeBlock block">Strictly Vetted Verticals</span>
            <h2 className="font-serif text-3xl md:text-4.5xl font-extrabold text-brand-navy tracking-tight whitespace-normal">
              Industry Specific Language Access
            </h2>
            <div className="w-12 h-1 bg-brand-orange mx-auto rounded-sm" />
            <p className="text-gray-600 text-xs sm:text-sm">
              We understand that generic translation is a severe risk. Every industry demands specialized vocabulary systems, regulatory compliance frameworks, and nuanced workflow protocols.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {industriesData.map((ind) => (
              <div 
                key={ind.id}
                className="bg-[#d1ddef] border border-white/20 rounded-xl p-6 transition-all hover:shadow-lg flex flex-col justify-between group"
              >
                <div className="space-y-4">
                  <div className="w-10 h-10 rounded-lg bg-brand-navy/10 text-brand-navy flex items-center justify-center group-hover:bg-brand-navy group-hover:text-white transition-colors duration-300">
                    <IconRenderer name={ind.iconName} className="w-5 h-5" />
                  </div>
                  <h3 className="font-serif text-lg font-bold text-brand-navy group-hover:text-brand-orange transition-colors">
                    {ind.name}
                  </h3>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    {ind.description}
                  </p>
                </div>
                
                <div className="pt-4 border-t border-white/10 mt-6 text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-none flex items-center justify-between">
                  <span>HIPAA & CERTIFIED</span>
                  <Link to="/contact" className="hover:text-brand-orange flex items-center gap-0.5">
                    Connect
                    <ArrowRight className="w-3" />
                  </Link>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* Bottom CTA Block */}
      <section className="py-16 bg-[#dae8ff] text-center">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <h2 className="font-serif text-2.5xl sm:text-3.5xl font-extrabold text-brand-navy tracking-tight leading-tight">Need a Custom Language Solution?</h2>
          <p className="text-xs sm:text-sm text-gray-500 leading-relaxed max-w-xl mx-auto">
            Perhaps your enterprise demands massive volume workflows, API translations, or deep ongoing hybrid staffing deployments. Let's draft a custom Service Level Agreement (SLA).
          </p>
          <div className="pt-2">
            <Link
              to="/contact"
              className="inline-block px-8 py-3.5 bg-brand-orange hover:bg-brand-orange-dark text-white font-bold rounded-xl shadow-lg transition-transform hover:-translate-y-0.5 cursor-pointer text-sm"
            >
              Contact Us Now
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}

/* ==========================================
   3. ABOUT SCREEN / VIEW
   ========================================= */
function AboutView({ onOpenQuote }: { onOpenQuote: (service?: string) => void }) {
  return (
    <div className="animate-fade-in space-y-1">
      
      {/* Page Hero */}
      <section className="bg-brand-navy-dark text-white py-16 md:py-24 relative overflow-hidden">
        <div className="absolute inset-0 overlay-pattern opacity-10" />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10 space-y-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-brand-navy-light/40 border border-white/10 rounded-sm text-[10px] uppercase font-bold tracking-widest text-[#a3b8fc]">
            Est. 2022 &bull; Seattle Headquarters
          </div>
          <h1 className="font-serif text-3.5xl sm:text-4.5xl md:text-5.5xl font-extrabold tracking-tight max-w-4xl mx-auto leading-tight italic">
            "Language should never be a barrier to access, opportunity, or understanding."
          </h1>
          <p className="text-xs sm:text-sm text-gray-400 font-bold uppercase tracking-widest">
            Vozara Corporate Credo
          </p>
        </div>
      </section>

      {/* Mission Section Split Layout */}
      <section className="py-20 md:py-28 bg-[#dae8ff]" id="mission-split-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Column Content */}
            <div className="lg:col-span-7 space-y-6">
              <span className="text-xs uppercase font-extrabold tracking-[0.2em] text-brand-orange block">Founding Vision</span>
              <h2 className="font-serif text-3xl md:text-4.5xl font-extrabold text-brand-navy tracking-tight leading-tight">
                Our Mission & Origins
              </h2>
              <div className="w-12 h-1 bg-brand-orange rounded-sm" />
              
              <div className="space-y-4 text-gray-600 text-sm leading-relaxed">
                <p>
                  Vozara Language Services was founded in <strong>2022</strong> out of a core, essential realization: in our global, interconnected world, authentic human communication is not a premium luxury, but a vital public right. 
                </p>
                <p>
                  The name <strong>"Vozara"</strong> draws its core linguistic inspiration from the concepts of voice, connection, and connection. Our goal is to transform language access from a logistical bottleneck into a flawless pipeline of trust.
                </p>
                <p>
                  Since our founding, we have partnered with critical care hospitals, municipal divisions, regional offices, and digital platforms to secure reliable language access. We manage the complex mechanics of credentialing, scheduling, and terminology validation so our partners are always heard.
                </p>
              </div>

              {/* 4 About Stats Grid */}
              <div className="grid grid-cols-2 gap-4 pt-6 border-t border-brand-navy/10">
                {aboutStats.map((stat) => (
                  <div key={stat.id}>
                    <p className="font-serif text-2.5xl sm:text-3xl font-extrabold text-brand-navy">{stat.value}</p>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wide mt-1">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Graphics Column */}
            <div className="lg:col-span-5 relative">
              <div className="bg-[#1B2A6B] text-white p-8 rounded-sm border border-white/10 shadow-2xl relative overflow-hidden space-y-8">
                {/* Visual grid accent */}
                <div className="absolute inset-0 overlay-pattern z-0 opacity-10" />
                
                <div className="relative z-10 space-y-2">
                  <span className="text-[10px] uppercase font-bold tracking-widest text-brand-orange">Institutional Trust</span>
                  <h3 className="font-serif text-xl sm:text-2xl font-bold leading-snug">Vozara Compliance Covenants</h3>
                </div>

                <div className="relative z-10 space-y-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-brand-orange mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider">Title VI Compliant</h4>
                      <p className="text-[10.5px] text-gray-300 leading-normal mt-0.5">Enabling federal and state compliance across all public service sectors.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-brand-orange mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider">HIPAA Enforced Systems</h4>
                      <p className="text-[10.5px] text-gray-300 leading-normal mt-0.5">Data isolated endpoints securing patient-confidential diagnostics paths.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-brand-orange mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider">Court Credential Verified</h4>
                      <p className="text-[10.5px] text-gray-300 leading-normal mt-0.5">Legal, trial-safe transcriptionists answering simultaneous litigation calls.</p>
                    </div>
                  </div>
                </div>

                {/* Overlaid Badge */}
                <div className="h-1.5 bg-brand-orange rounded-sm" />
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* Core Values Section */}
      <section className="py-20 bg-[#dae8ff] border-t border-b border-brand-navy/15" id="values-grid-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-2xl mx-auto space-y-4 mb-16">
            <span className="text-xs uppercase font-extrabold tracking-[0.2em] text-brand-orange block">What Defines Us</span>
            <h2 className="font-serif text-3xl md:text-4.5xl font-extrabold text-brand-navy tracking-tight">Our Core Values</h2>
            <div className="w-12 h-1 bg-brand-orange mx-auto rounded-sm" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {valuesData.map((val) => (
              <div key={val.id} className="bg-[#d1ddef] border border-white/20 rounded-sm p-6 shadow-sm hover:shadow-md transition-all duration-300 space-y-4">
                <div className="w-10 h-10 rounded-sm bg-brand-navy/10 text-brand-navy flex items-center justify-center border border-brand-navy/5">
                  <IconRenderer name={val.iconName} className="w-5 h-5" />
                </div>
                <h3 className="font-serif text-lg font-bold text-brand-navy">{val.title}</h3>
                <p className="text-xs text-gray-500 leading-relaxed">
                  {val.description}
                </p>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* Timeline Section */}
      <section className="py-20 md:py-28 bg-[#dae8ff]" id="timeline-section">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-xl mx-auto space-y-4 mb-20">
            <span className="text-xs uppercase font-extrabold tracking-[0.2em] text-brand-orange block">A Decade of Growth</span>
            <h2 className="font-serif text-3xl md:text-4.5xl font-extrabold text-brand-navy tracking-tight">Corporate History Timeline</h2>
            <div className="w-12 h-1 bg-brand-orange mx-auto rounded-sm" />
          </div>

          {/* Time lines logic */}
          <div className="relative border-l-2 border-brand-navy/10 ml-4 md:ml-0 md:flex md:flex-col md:border-l-0 md:grid md:grid-cols-1 gap-12">
            
            {/* Loop through events */}
            <div className="space-y-12 md:space-y-0 relative">
              {/* Invisible centerline tracker on Desktop */}
              <div className="hidden md:block absolute left-1/2 top-4 bottom-4 w-0.5 bg-brand-navy/10 -translate-x-1/2" />

              {timelineData.map((ev, index) => {
                const isLeftEdge = index % 2 === 0;
                return (
                  <div key={ev.year} className="relative md:grid md:grid-cols-12 md:gap-8 items-center">
                    
                    {/* Left content box */}
                    <div className={`md:col-span-5 ${isLeftEdge ? "md:text-right" : "md:order-last md:col-start-8"}`}>
                      <div className="pl-6 md:pl-0 space-y-2">
                        <span className="inline-block px-3 py-1 bg-brand-orange text-white font-serif font-black text-xs rounded-sm tracking-wide uppercase">
                          {ev.year}
                        </span>
                        <h4 className="font-serif text-lg font-bold text-brand-navy">{ev.title}</h4>
                        <p className="text-xs text-gray-500 leading-relaxed max-w-sm ml-auto md:mr-0 inline-block">
                          {ev.description}
                        </p>
                      </div>
                    </div>

                    {/* Dot Indicator */}
                    <div className="absolute left-0 top-1.5 md:left-1/2 w-3 h-3 rounded-none bg-brand-orange border-2 border-white shadow-md md:-translate-x-1/2 z-10" />

                    <div className="hidden md:block md:col-span-2" />
                  </div>
                );
              })}
            </div>

          </div>

        </div>
      </section>

      {/* Dual CTA Section */}
      <section className="bg-[#1B2A6B] text-white py-16 md:py-20 relative overflow-hidden text-center border-t border-brand-orange/10">
        <div className="absolute inset-0 overlay-pattern opacity-15" />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-6">
          <h2 className="font-serif text-2.5xl sm:text-3.5xl font-extrabold tracking-tight">Support Global understanding with Vozara</h2>
          <p className="text-xs sm:text-sm text-gray-300 max-w-xl mx-auto leading-relaxed">
            Whether you want to dispatch interpreters or register your expertise as a bilingual specialist, we maintain active pipelines for you.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <button
              type="button"
              id="about-contact-cta"
              onClick={() => onOpenQuote()}
              className="px-8 py-4 bg-brand-orange hover:brightness-110 text-white font-bold rounded-sm shadow-md transition-all cursor-pointer text-sm uppercase tracking-wider w-full sm:w-auto"
            >
              Contact Us
            </button>
            <Link
              to="/careers"
              id="about-careers-cta"
              className="px-8 py-4 bg-transparent hover:bg-white hover:text-[#1B2A6B] border-2 border-white text-white font-bold rounded-sm transition-all text-sm uppercase tracking-wider w-full sm:w-auto text-center"
            >
              Join Our Team
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}

/* ==========================================
   4. CAREERS SCREEN / VIEW
   ========================================= */
function CareersView() {
  const [openAccordion, setOpenAccordion] = useState<string | null>("role-medical-interpreter");

  const toggleAccordion = (roleId: string) => {
    setOpenAccordion(openAccordion === roleId ? null : roleId);
  };

  return (
    <div className="animate-fade-in space-y-1">
      
      {/* Page Hero */}
      <section className="bg-brand-navy-dark text-white py-16 md:py-20 relative overflow-hidden">
        <div className="absolute inset-0 overlay-pattern opacity-10" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-4">
          <span className="text-xs uppercase font-extrabold tracking-[0.25em] text-brand-orange block">A Network of Excellence</span>
          <h1 className="font-serif text-3.5xl sm:text-5xl font-extrabold tracking-tight">Join Our Linguistic Grid</h1>
          <p className="text-xs sm:text-sm text-gray-300 max-w-xl leading-relaxed">
            Support marginalized individuals, schools, and enterprise partners. Build your flexible interpreting or translation career with professional compensation and active SLA oversight.
          </p>
        </div>
      </section>

      {/* Perks Grid (6 Cards, Numbered 01 -> 06) */}
      <section className="py-20 bg-[#dae8ff]" id="careers-perks-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-2xl mx-auto space-y-4 mb-16 md:mb-20">
            <span className="text-xs uppercase font-extrabold tracking-[0.2em] text-brand-orange block font-mono">Why Build With Vozara</span>
            <h2 className="font-serif text-3xl md:text-4.5xl font-extrabold text-brand-navy tracking-tight">Professional Perks & Support</h2>
            <div className="w-12 h-1 bg-brand-orange mx-auto rounded-sm" />
            <p className="text-gray-500 text-xs sm:text-sm">
              We empower our language specialists by managing the complete administrative log. Focus completely on the nuanced delivery of your native vocabulary.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {perksData.map((perk) => (
              <div 
                key={perk.id}
                className="p-6 rounded-sm bg-[#d1ddef] border border-white/20 hover:border-brand-orange/20 transition-all hover:bg-[#d1ddef]/90 hover:shadow-md flex gap-4 group"
              >
                <span className="font-serif text-2xl font-black text-brand-orange/20 group-hover:text-brand-orange transition-all leading-none">
                  {perk.number}
                </span>
                <div className="space-y-2">
                  <h3 className="font-serif text-base font-bold text-brand-navy">{perk.title}</h3>
                  <p className="text-xs text-gray-500 leading-relaxed">{perk.description}</p>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* Open Roles Accordion Section */}
      <section className="py-20 bg-[#dae8ff] border-t border-b border-brand-navy/15" id="accordion-roles-section">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center space-y-4 mb-12 sm:mb-16">
            <span className="text-xs uppercase font-extrabold tracking-[0.2em] text-brand-orange block font-mono">Current Opportunities</span>
            <h2 className="font-serif text-3xl md:text-4.5xl font-extrabold text-brand-navy tracking-tight">Open Contractor Roles</h2>
            <div className="w-12 h-1 bg-brand-orange mx-auto rounded-sm" />
          </div>

          {/* Accordion container */}
          <div className="space-y-4">
            {careerRolesData.map((role) => {
              const isExpanded = openAccordion === role.id;
              return (
                <div 
                  key={role.id}
                  id={`accordion-role-${role.id}`}
                  className="bg-[#d1ddef] border border-white/20 rounded-sm overflow-hidden shadow-sm"
                >
                  {/* Header Button */}
                  <button
                    type="button"
                    onClick={() => toggleAccordion(role.id)}
                    className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-[#d1ddef]/70 transition-colors duration-250 cursor-pointer"
                  >
                    <div>
                      <h3 className="font-serif text-[17px] sm:text-[18px] font-bold text-brand-navy tracking-tight leading-tight">
                        {role.title}
                      </h3>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
                        <span className="text-brand-orange font-bold">{role.type}</span>
                        <span>&bull;</span>
                        <span>{role.location}</span>
                        <span>&bull;</span>
                        <span className="text-brand-navy font-bold lowercase italic select-all">{role.languages}</span>
                      </div>
                    </div>
                    <div>
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-brand-orange" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                  </button>

                  {/* Expandable Content Panel */}
                  <div 
                    className={`transition-all duration-300 ease-in-out ${
                      isExpanded ? "max-h-[1000px] border-t border-white/10 p-6" : "max-h-0 overflow-hidden"
                    }`}
                  >
                    {isExpanded && (
                      <div className="space-y-5 animate-fade-in">
                        <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                          {role.description}
                        </p>

                        <div className="space-y-2.5">
                          <h4 className="text-[11px] uppercase font-bold tracking-wider text-brand-orange font-mono">Candidate Requirements:</h4>
                          <ul className="space-y-2">
                            {role.requirements.map((req, rIdx) => (
                              <li key={rIdx} className="flex items-start gap-2 text-xs text-gray-700">
                                <Check className="w-3.5 h-3.5 text-brand-orange mt-0.5 flex-shrink-0" />
                                <span className="font-medium">{req}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div className="pt-4 flex items-center gap-4">
                          {role.isInterpreter ? (
                            <Link
                              to="/careers/interpreter-apply"
                              id={`apply-role-link-${role.id}`}
                              className="px-5 py-2.5 bg-brand-orange hover:brightness-110 text-white font-bold rounded-sm shadow-md transition-all text-xs cursor-pointer block text-center uppercase tracking-wider"
                            >
                              Apply for This Role
                            </Link>
                          ) : (
                            <Link
                              to="/contact"
                              id={`apply-translator-link-${role.id}`}
                              className="px-5 py-2.5 bg-brand-navy hover:brightness-110 text-white font-bold rounded-sm shadow-md transition-all text-xs cursor-pointer block text-center uppercase tracking-wider"
                            >
                              Contact Recruiting Desk
                            </Link>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Unlisted Languages Banner */}
          <div className="mt-8 bg-[#1B2A6B] text-white rounded-sm p-6 sm:p-8 border border-white/10 shadow-md flex flex-col sm:flex-row justify-between items-center gap-6">
            <div className="space-y-1">
              <h4 className="font-serif text-[17px] font-bold text-brand-orange">Linguist in an Unlisted Specialty or Pair?</h4>
              <p className="text-xs text-gray-300 leading-relaxed max-w-md">We consistently scale for rare dialects. Send your credentials over and we will list you in our reserve database.</p>
            </div>
            <Link
              to="/contact"
              className="px-5 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 rounded-sm text-white font-bold text-xs whitespace-nowrap transition-colors uppercase tracking-wider"
            >
              Open Application Submission
            </Link>
          </div>

        </div>
      </section>

      {/* Team photo strip overlay */}
      <section className="relative h-64 sm:h-80 md:h-96 flex items-center justify-center overflow-hidden">
        {/* Dynamic dark backup color */}
        <div className="absolute inset-0 bg-[#1B2A6B]" />
        {/* Repeating text decorator representing diversity */}
        <div className="absolute inset-0 z-0 opacity-15 flex items-center justify-center pointer-events-none select-none">
          <div className="uppercase font-serif text-[120px] font-black tracking-widest text-[#283d90] text-center leading-none">
            VOZARA
          </div>
        </div>

        <div className="relative z-10 text-center max-w-lg px-4 space-y-4">
          <h3 className="font-serif text-2.5xl sm:text-3.5xl font-extrabold text-white tracking-tight">Ready to Make an Impact?</h3>
          <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
            Translate bridges of health, justice, trust, and connection. Partner with our recruitment coordinators today.
          </p>
          <div className="pt-2">
            <Link
              to="/careers/interpreter-apply"
              className="inline-block px-6 py-3.5 bg-brand-orange hover:brightness-110 text-white font-bold rounded-sm shadow-md text-xs uppercase tracking-wider"
            >
              Apply as Interpreter
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}

/* ==========================================
   5. CONTACT SCREEN / VIEW
   ========================================= */
function ContactView() {
  const [formData, setFormData] = useState({
    full_name: "",
    submitter_email: "",
    phone: "",
    organization: "",
    service: "Interpreter Staffing",
    language_pair: "",
    message: ""
  });

  const [formState, setFormState] = useState<"idle" | "getting_token" | "sending" | "success" | "error">("idle");
  const [errorText, setErrorText] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.full_name || !formData.submitter_email || !formData.message) {
      setErrorText("Name, Email, and Message details are required.");
      setFormState("error");
      return;
    }

    try {
      let submissionSuccessful = false;

      try {
        // Step A: Load anti-spam session keys
        setFormState("getting_token");
        const prepRes = await fetch(`/api/forms/prepare?form_key=vozara-contact`);
        if (prepRes.ok) {
          const prepData = await prepRes.json();
          if (prepData.success && prepData.required_hidden_fields) {
            // Step B: Submit data merging required fields
            setFormState("sending");
            const postPayload = {
              form_key: "vozara-contact",
              ...prepData.required_hidden_fields,
              ...formData
            };

            const submitRes = await fetch(`/api/forms/submit`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(postPayload)
            });

            if (submitRes.ok) {
              const submitData = await submitRes.json();
              if (submitData.success) {
                submissionSuccessful = true;
              }
            }
          }
        }
      } catch (backendErr) {
        console.warn("Express backend contact submit is unreachable, executing direct Firestore client fallback...", backendErr);
      }

      if (!submissionSuccessful) {
        setFormState("sending");
        await submitContactFormDirect(formData);
        submissionSuccessful = true;
      }

      if (submissionSuccessful) {
        setFormState("success");
      }
    } catch (err: any) {
      setFormState("error");
      setErrorText(err.message || "Failed to deliver parameters. Please refresh and try again.");
    }
  };

  const handleReset = () => {
    setFormData({
      full_name: "",
      submitter_email: "",
      phone: "",
      organization: "",
      service: "Interpreter Staffing",
      language_pair: "",
      message: ""
    });
    setFormState("idle");
  };

  const servicesOption = [
    "Interpreter Staffing",
    "Translation Services",
    "Localization Solutions",
    "Remote Interpreting (OPI/VRI)",
    "Multilingual Support",
    "Other"
  ];

  const popularLanguages = [
    "Spanish", "Arabic", "Mandarin", "French", "Portuguese", "Russian", "Somali", "Vietnamese", "+90 more"
  ];

  return (
    <div className="animate-fade-in space-y-1">
      
      {/* Page Hero */}
      <section className="bg-brand-navy-dark text-white py-16 md:py-20 relative overflow-hidden">
        <div className="absolute inset-0 overlay-pattern opacity-10" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-4">
          <h1 className="font-serif text-3.5xl md:text-5xl font-extrabold tracking-tight">Contact Us</h1>
          <p className="text-xs sm:text-sm text-gray-300 max-w-xl leading-relaxed">
            Connect directly with an on-duty program director. We review and coordinate all requests in under 1 business day under tight SLAs.
          </p>
        </div>
      </section>

      {/* Two Column Layout: Info Left, Form Right */}
      <section className="py-20 bg-[#dae8ff]" id="contact-content-grid">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 bg-[#dae8ff]">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 sm:gap-16">
            
            {/* Left Column Information Cards */}
            <div className="lg:col-span-5 space-y-10">
              
              <div className="space-y-4">
                <span className="text-xs uppercase font-extrabold tracking-[0.2em] text-brand-orange block font-mono">Operational Directory</span>
                <h2 className="font-serif text-2.5xl sm:text-3.5xl font-extrabold text-brand-navy tracking-tight leading-none">Get In Touch</h2>
                <div className="w-12 h-1 bg-brand-orange rounded-sm" />
                <p className="text-gray-700 text-xs sm:text-sm leading-relaxed">
                  Our service desk and interpreting routers are manned 24 hours a day to handle emergency clinical escalations, trial dates, and critical communication lines.
                </p>
              </div>

              {/* Direct Details list */}
              <div className="space-y-6">
                
                <div className="flex gap-4 p-5 bg-[#d1ddef] rounded-sm border border-white/20">
                  <PhoneCall className="w-6 h-6 text-brand-orange flex-shrink-0 mt-1" />
                  <div className="space-y-1">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-brand-navy font-mono">Telephone Operations</h3>
                    <a href="tel:+12105482782" id="contact-phone" className="text-base font-bold text-gray-950 block hover:text-brand-orange transition-colors">
                      +1 (210) 548-2782
                    </a>
                    <span className="inline-block px-2.5 py-0.5 bg-brand-orange/10 text-brand-orange font-bold rounded-sm text-[9px] uppercase tracking-wider">
                      Active 24/7/365 Emergency Dispatch
                    </span>
                  </div>
                </div>

                <div className="flex gap-4 p-5 bg-[#d1ddef] rounded-sm border border-white/20">
                  <Mail className="w-6 h-6 text-brand-orange flex-shrink-0 mt-1" />
                  <div className="space-y-1">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-brand-navy font-mono">Electronic Mailing Desk</h3>
                    <a href="mailto:info@vozarals.com" id="contact-email" className="text-base font-bold text-gray-950 block hover:text-brand-orange transition-colors">
                      info@vozarals.com
                    </a>
                    <p className="text-[11px] text-gray-600 font-medium">Program coordinator review in under 1 business day.</p>
                  </div>
                </div>

                <div className="flex gap-4 p-5 bg-[#d1ddef] rounded-sm border border-white/20">
                  <MapPin className="w-6 h-6 text-brand-orange flex-shrink-0 mt-1" />
                  <div className="space-y-1">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-brand-navy font-mono">Business Working Hours</h3>
                    <p className="text-sm font-bold text-gray-950">Monday - Friday, 8:00 AM - 6:00 PM</p>
                    <p className="text-[11px] text-gray-600 font-medium font-mono">Emergency on-call coverage actively operating outside standard business hours.</p>
                  </div>
                </div>

              </div>

              {/* Languages pills list */}
              <div className="space-y-3 pt-4 border-t border-brand-navy/10">
                <h4 className="text-[11px] uppercase font-bold tracking-wider text-brand-orange font-mono">Leading Languages Supported:</h4>
                <div className="flex flex-wrap gap-2">
                  {popularLanguages.map((lang) => (
                    <span 
                      key={lang} 
                      className="px-3 py-1 bg-brand-navy/10 text-brand-navy font-bold text-[11px] rounded-sm uppercase tracking-wider border border-brand-navy/10 font-mono"
                    >
                      {lang}
                    </span>
                  ))}
                </div>
              </div>

            </div>

            {/* Right Column Form Space */}
            <div className="lg:col-span-7">
              <div className="bg-[#121E52]/90 backdrop-blur-md border border-white/10 rounded-sm p-6 sm:p-10 shadow-2xl text-white relative overflow-hidden" id="contact-form-card">
                
                {formState === "success" ? (
                  <div className="text-center py-12 px-4 space-y-6">
                    <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-sm bg-green-500/10 text-green-400 mb-4 border border-green-500/30 animate-bounce">
                      <Check className="h-8 w-8" />
                    </div>
                    <h3 className="font-serif text-2xl font-bold text-white">Submission Delivered</h3>
                    <p className="text-gray-205 text-xs sm:text-sm max-w-md mx-auto leading-relaxed">
                      Your operational details have been processed. Anti-bot handshake tokens matched perfectly. A Vozara coordinator will reach out to you within 1 business day.
                    </p>
                    <div className="pt-2">
                       <button 
                         type="button" 
                         id="contact-form-reset-btn"
                         onClick={handleReset}
                         className="px-6 py-3 bg-brand-orange hover:brightness-110 text-white text-xs font-bold rounded-sm shadow-md transition-all uppercase tracking-wider cursor-pointer"
                       >
                         Send Another Message
                       </button>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-6" id="vozara-contact-form">
                    
                    <div>
                      <h3 className="font-serif text-lg font-bold text-white">Operational Request Form</h3>
                      <p className="text-xs text-gray-300 mt-1">Please provide your parameters below. All data is encrypted.</p>
                    </div>

                    {formState === "error" && (
                      <div className="bg-red-500/10 border border-red-500/30 text-red-200 p-3 rounded-sm text-xs leading-normal flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <span>{errorText}</span>
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="full_name" className="block text-[11px] font-bold uppercase tracking-wider text-gray-200 mb-1 font-mono">
                          Full Name <span className="text-brand-orange">*</span>
                        </label>
                        <input
                          type="text"
                          id="full_name"
                          required
                          value={formData.full_name}
                          onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                          className="w-full px-3 py-2 bg-[#1b275c] border border-white/15 rounded-sm text-sm text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-brand-orange focus:border-brand-orange"
                          placeholder="Your Name"
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="submitter_email" className="block text-[11px] font-bold uppercase tracking-wider text-gray-200 mb-1 font-mono">
                          Work Email <span className="text-brand-orange">*</span>
                        </label>
                        <input
                          type="email"
                          id="submitter_email"
                          required
                          value={formData.submitter_email}
                          onChange={(e) => setFormData({ ...formData, submitter_email: e.target.value })}
                          className="w-full px-3 py-2 bg-[#1b275c] border border-white/15 rounded-sm text-sm text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-brand-orange focus:border-brand-orange"
                          placeholder="name@company.com"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="phone" className="block text-[11px] font-bold uppercase tracking-wider text-gray-200 mb-1 font-mono">
                          Phone Number
                        </label>
                        <input
                          type="tel"
                          id="phone"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          className="w-full px-3 py-2 bg-[#1b275c] border border-white/15 rounded-sm text-sm text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-brand-orange focus:border-brand-orange"
                          placeholder="+1 (210) 548-2782"
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="organization" className="block text-[11px] font-bold uppercase tracking-wider text-gray-200 mb-1 font-mono">
                          Organization
                        </label>
                        <input
                          type="text"
                          id="organization"
                          value={formData.organization}
                          onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                          className="w-full px-3 py-2 bg-[#1b275c] border border-white/15 rounded-sm text-sm text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-brand-orange focus:border-brand-orange"
                          placeholder="Healthcare / Corporate Entity"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="service" className="block text-[11px] font-bold uppercase tracking-wider text-gray-200 mb-1 font-mono">
                          Service Needed <span className="text-brand-orange">*</span>
                        </label>
                        <select
                          id="service"
                          value={formData.service}
                          onChange={(e) => setFormData({ ...formData, service: e.target.value })}
                          className="w-full px-3 py-2 bg-[#1b275c] border border-white/15 rounded-sm text-sm text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-brand-orange focus:border-brand-orange"
                        >
                          {servicesOption.map((ser) => (
                            <option key={ser} value={ser} className="bg-[#121E52] text-white">{ser}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label htmlFor="language_pair" className="block text-[11px] font-bold uppercase tracking-wider text-gray-200 mb-1 font-mono">
                          Language Pair (e.g. EN ⇄ ES)
                        </label>
                        <input
                          type="text"
                          id="language_pair"
                          value={formData.language_pair}
                          onChange={(e) => setFormData({ ...formData, language_pair: e.target.value })}
                          className="w-full px-3 py-2 bg-[#1b275c] border border-white/15 rounded-sm text-sm text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-brand-orange focus:border-brand-orange"
                          placeholder="e.g. Spanish to English"
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="message" className="block text-[11px] font-bold uppercase tracking-wider text-gray-200 mb-1 font-mono">
                        How can we help? <span className="text-brand-orange">*</span>
                      </label>
                      <textarea
                        id="message"
                        required
                        rows={4}
                        value={formData.message}
                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                        className="w-full px-3 py-2 bg-[#1b275c] border border-white/15 rounded-sm text-sm text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-brand-orange focus:border-brand-orange"
                        placeholder="Provide details about your project, timeline, location, or specialized requirements..."
                      />
                    </div>

                    <div className="pt-2">
                      <button
                        type="submit"
                        id="contact-submit-btn"
                        disabled={formState === "getting_token" || formState === "sending"}
                        className="w-full flex items-center justify-center gap-2 px-5 py-3.5 bg-brand-orange hover:brightness-110 text-white font-bold rounded-sm shadow-md transition-all cursor-pointer text-xs uppercase tracking-wider"
                      >
                        {formState === "getting_token" ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin animate-spin text-white" />
                            Establishing Handshake Token...
                          </>
                        ) : formState === "sending" ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin animate-spin text-white" />
                            Delivering Message...
                          </>
                        ) : (
                          <>
                            <Send className="w-4 h-4 text-white" />
                            Deliver Operational Request
                          </>
                        )}
                      </button>
                    </div>

                    <div className="text-[10.5px] text-gray-300 text-center leading-normal font-mono">
                      By submitting, you agree to our security encryption logs. Dynamic token logs prevent bot spam by auditing local keystroke metrics.
                    </div>

                  </form>
                )}

              </div>
            </div>

          </div>

        </div>
      </section>

    </div>
  );
}

/* ==========================================
   6. INTERPRETER APPLICATION VIEW
   ========================================= */
function InterpreterApplyView() {
  const [formData, setFormData] = useState({
    full_name: "",
    submitter_email: "",
    phone: "",
    location: "",
    primary_language: "",
    additional_languages: "",
    interpreting_modes: "Both",
    industries: "Healthcare",
    experience_years: "1-3 Years",
    certifications: "",
    medical_legal_knowledge: "Yes - Experienced",
    technical_setup: "Meets All Requirements",
    availability: "Flexible / Hourly Contract",
    linkedin_or_portfolio: "",
    additional_info: ""
  });

  const [formState, setFormState] = useState<"idle" | "getting_tokens" | "submitting" | "success" | "error">("idle");
  const [errorBanner, setErrorBanner] = useState("");
  const [emailPreviewUrl, setEmailPreviewUrl] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.full_name || !formData.submitter_email || !formData.phone || !formData.primary_language || !formData.location) {
      setErrorBanner("Please fill in all standard required fields (Full Name, Email, Phone, Location, and Primary Language).");
      setFormState("error");
      return;
    }

    try {
      let submissionSuccessful = false;

      try {
        setFormState("getting_tokens");
        
        // Step 1: GET security challenge values
        const prepRes = await fetch(`/api/forms/prepare?form_key=vozara-interpreter-application`);
        if (prepRes.ok) {
          const prepData = await prepRes.json();
          
          if (prepData.success && prepData.required_hidden_fields) {
            // Step 2: POST applicant variables merged with required anti-spam tokens
            setFormState("submitting");
            const postPayload = {
              form_key: "vozara-interpreter-application",
              ...prepData.required_hidden_fields,
              ...formData
            };

            const submitRes = await fetch(`/api/forms/submit`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(postPayload)
            });

            if (submitRes.ok) {
              const submitData = await submitRes.json();
              if (submitData.success) {
                if (submitData.email_sandbox_preview) {
                  setEmailPreviewUrl(submitData.email_sandbox_preview);
                }
                submissionSuccessful = true;
              }
            }
          }
        }
      } catch (backendErr) {
        console.warn("Express backend interpreter application endpoint unreachable, running direct Firestore client fallback...", backendErr);
      }

      if (!submissionSuccessful) {
        setFormState("submitting");
        await submitInterpreterAppDirect(formData);
        submissionSuccessful = true;
      }

      if (submissionSuccessful) {
        setFormState("success");
      }
    } catch (err: any) {
      setFormState("error");
      setErrorBanner(err.message || "Recruitment portal is temporarily busy. Please resubmit.");
    }
  };

  const handleReset = () => {
    setFormData({
      full_name: "",
      submitter_email: "",
      phone: "",
      location: "",
      primary_language: "",
      additional_languages: "",
      interpreting_modes: "Both",
      industries: "Healthcare",
      experience_years: "1-3 Years",
      certifications: "",
      medical_legal_knowledge: "Yes - Experienced",
      technical_setup: "Meets All Requirements",
      availability: "Flexible / Hourly Contract",
      linkedin_or_portfolio: "",
      additional_info: ""
    });
    setEmailPreviewUrl("");
    setFormState("idle");
  };

  return (
    <div className="animate-fade-in space-y-1">
      {/* Page Hero */}
      <section className="bg-brand-navy-dark text-white py-16 md:py-20 relative overflow-hidden">
        <div className="absolute inset-0 overlay-pattern opacity-10" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-4">
          <Link to="/careers" id="app-back-careers" className="text-xs text-gray-400 hover:text-brand-orange font-bold uppercase tracking-wider flex items-center gap-1">
            &larr; Back to Careers
          </Link>
          <h1 className="font-serif text-3.5xl md:text-5xl font-extrabold tracking-tight">Interpreter Application Portal</h1>
          <p className="text-xs sm:text-sm text-gray-350 max-w-xl leading-relaxed">
            Register your bilingual expertise in our elite interpreter database. Work contract shifts remote (VRI/OPI) or on-site.
          </p>
        </div>
      </section>

      {/* Two Column Layout */}
      <section className="py-20 bg-[#dae8ff]" id="application-split-view">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 bg-[#dae8ff]">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            
            {/* Left Sidebar Details */}
            <div className="lg:col-span-4 space-y-8">
              
              <div className="p-6 bg-[#d1ddef] border border-white/20 rounded-sm space-y-4">
                <h3 className="font-serif text-lg font-bold text-brand-navy">Position Details</h3>
                <ul className="space-y-3.5 text-xs">
                  <li className="flex justify-between border-b border-brand-navy/10 pb-2.5">
                    <span className="text-gray-700 font-medium">Contract Type</span>
                    <strong className="text-brand-navy font-semibold">Independent Contractor</strong>
                  </li>
                  <li className="flex justify-between border-b border-brand-navy/10 pb-2.5">
                    <span className="text-gray-700 font-medium">Remote Modality</span>
                    <strong className="text-brand-navy font-semibold">Remote (OPI/VRI) or On-site</strong>
                  </li>
                  <li className="flex justify-between border-b border-brand-navy/10 pb-2.5">
                    <span className="text-gray-700 font-medium">Shift Scheduling</span>
                    <strong className="text-brand-navy font-semibold">Highly Flexible / Responsive</strong>
                  </li>
                  <li className="flex justify-between pb-1">
                    <span className="text-gray-700 font-medium">Competitive Rate</span>
                    <strong className="text-brand-orange font-bold">Standard Tiered Bonuses</strong>
                  </li>
                </ul>
              </div>

              <div className="p-6 bg-[#1B2A6B] text-white rounded-sm border border-white/10 space-y-5">
                <h3 className="font-serif text-lg font-bold">Technical Requirements</h3>
                <ul className="space-y-4 text-xs font-medium text-gray-300">
                  <li className="flex gap-2.5 items-start">
                    <Laptop className="w-5 h-5 text-brand-orange flex-shrink-0 mt-0.5" />
                    <span>A modern, reliable corporate notebook or laptop (Intel i5/M1, 8GB RAM minimum).</span>
                  </li>
                  <li className="flex gap-2.5 items-start">
                    <Wifi className="w-5 h-5 text-brand-orange flex-shrink-0 mt-0.5" />
                    <span>Wired high-speed fiber or cable internet connection (&gt;30 Mbps down/up bandwidth).</span>
                  </li>
                  <li className="flex gap-2.5 items-start">
                    <Headphones className="w-5 h-5 text-brand-orange flex-shrink-0 mt-0.5" />
                    <span>Dedicated high-quality, noise-canceling USB headset with a steady mutable microphone.</span>
                  </li>
                  <li className="flex gap-2.5 items-start">
                    <Video className="w-5 h-5 text-brand-orange flex-shrink-0 mt-0.5" />
                    <span>High-definition webcam with clean focal backgrounds (strictly calibrated for VRI calls).</span>
                  </li>
                </ul>
              </div>

              <div className="p-6 border border-white/20 rounded-sm text-center space-y-2 bg-[#d1ddef]">
                <span className="text-xs uppercase font-extrabold tracking-wider text-brand-orange leading-none block font-mono">Need Priority Help?</span>
                <p className="text-xs text-gray-700">For ongoing credentialing check status email us at:</p>
                <a href="mailto:careers@vozarals.com" id="hr-recruiting-email" className="text-sm font-serif font-black text-brand-navy block hover:text-brand-orange transition-colors">
                  careers@vozarals.com
                </a>
              </div>

            </div>

            {/* Right Multi-section Form Space */}
            <div className="lg:col-span-8">
                         <div className="bg-[#121E52]/90 backdrop-blur-md border border-white/10 rounded-sm p-6 sm:p-10 shadow-2xl text-white" id="application-container">
                
                {formState === "success" ? (
                  <div className="text-center py-12 px-4 space-y-6" id="app-success-view">
                    <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-sm bg-green-500/10 text-green-400 mb-6 border border-green-500/30 animate-bounce">
                      <Check className="h-10 w-10" />
                    </div>
                    <h3 className="font-serif text-2.5xl font-bold text-white">Application Received</h3>
                    <p className="text-gray-200 text-sm max-w-lg mx-auto leading-relaxed">
                      Thank you for completing your specialist application dashboard! Your variables matched our recruitment telemetry parameters. A real-time notification email has been dispatched to the recruiting desk (<strong>careers@vozarals.com</strong>), and a credentials coordinator will evaluate your qualifications shortly.
                    </p>

                    <div className="pt-4 flex flex-col sm:flex-row justify-center gap-3.5">
                      <button 
                        type="button" 
                        id="recruiter-reset-btn"
                        onClick={handleReset}
                        className="px-6 py-3 bg-brand-orange hover:brightness-110 text-white text-xs font-bold rounded-sm uppercase tracking-wider transition-all select-none cursor-pointer text-center"
                      >
                        Resubmit / File New Case
                      </button>
                      <Link 
                        to="/careers" 
                        className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white border border-white/10 text-xs font-bold rounded-sm uppercase block tracking-wider text-center"
                      >
                        Back to Core Directory
                      </Link>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-8" id="vozara-interpreter-form">
                    
                    <div>
                      <h2 className="font-serif text-xl sm:text-2xl font-bold text-white">Independent Interpreter File</h2>
                      <p className="text-xs text-gray-300 mt-1">Please provide accurate statements. Credentials will be audited with national directories.</p>
                    </div>

                    {formState === "error" && (
                      <div className="bg-red-500/10 border border-red-500/25 text-red-200 p-3 rounded-sm text-xs leading-normal flex items-start gap-2 animate-pulse">
                        <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <span>{errorBanner}</span>
                      </div>
                    )}

                    {/* Section 1: Personal Information */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 pb-1.5 border-b border-white/10">
                        <span className="w-5 h-5 rounded-sm bg-brand-orange text-white flex items-center justify-center font-bold text-[10px] font-mono">1</span>
                        <h4 className="text-xs uppercase font-extrabold tracking-wider text-brand-orange font-mono">Personal Identification</h4>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="app_full_name" className="block text-xs font-bold text-gray-300 uppercase tracking-widest mb-1 font-mono">
                            Full Legal Name <span className="text-brand-orange">*</span>
                          </label>
                          <input
                            type="text"
                            id="app_full_name"
                            required
                            value={formData.full_name}
                            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                            className="w-full px-3 py-2 bg-[#1b275c] border border-white/15 rounded-sm text-sm text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-brand-orange focus:border-brand-orange"
                            placeholder="John Sebastian Doe"
                          />
                        </div>
                        
                        <div>
                          <label htmlFor="app_email" className="block text-xs font-bold text-gray-300 uppercase tracking-widest mb-1 font-mono">
                            Email Address <span className="text-brand-orange">*</span>
                          </label>
                          <input
                            type="email"
                            id="app_email"
                            required
                            value={formData.submitter_email}
                            onChange={(e) => setFormData({ ...formData, submitter_email: e.target.value })}
                            className="w-full px-3 py-2 bg-[#1b275c] border border-white/15 rounded-sm text-sm text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-brand-orange focus:border-brand-orange"
                            placeholder="johndoe@email.com"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="app_phone" className="block text-xs font-bold text-gray-300 uppercase tracking-widest mb-1 font-mono">
                            Phone Number <span className="text-brand-orange">*</span>
                          </label>
                          <input
                            type="tel"
                            id="app_phone"
                            required
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            className="w-full px-3 py-2 bg-[#1b275c] border border-white/15 rounded-sm text-sm text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-brand-orange focus:border-brand-orange"
                            placeholder="+1 (210) 548-2782"
                          />
                        </div>

                        <div>
                          <label htmlFor="app_loc" className="block text-xs font-bold text-gray-300 uppercase tracking-widest mb-1 font-mono">
                            Location (City, State, Country) <span className="text-brand-orange">*</span>
                          </label>
                          <input
                            type="text"
                            id="app_loc"
                            required
                            value={formData.location}
                            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                            className="w-full px-3 py-2 bg-[#1b275c] border border-white/15 rounded-sm text-sm text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-brand-orange focus:border-brand-orange"
                            placeholder="Seattle, WA, USA"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Section 2: Language Capability */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 pb-1.5 border-b border-white/10">
                        <span className="w-5 h-5 rounded-sm bg-brand-orange text-white flex items-center justify-center font-bold text-[10px] font-mono">2</span>
                        <h4 className="text-xs uppercase font-extrabold tracking-wider text-brand-orange font-mono">Language Proficiencies</h4>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="app_primary_lang" className="block text-xs font-bold text-gray-300 uppercase tracking-widest mb-1 font-mono">
                            Primary Language Pair <span className="text-brand-orange">*</span>
                          </label>
                          <input
                            type="text"
                            id="app_primary_lang"
                            required
                            value={formData.primary_language}
                            onChange={(e) => setFormData({ ...formData, primary_language: e.target.value })}
                            className="w-full px-3 py-2 bg-[#1b275c] border border-white/15 rounded-sm text-sm text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-brand-orange focus:border-brand-orange"
                            placeholder="Spanish (EN-ES) / Vietnamese (EN-VI) etc..."
                          />
                        </div>

                        <div>
                          <label htmlFor="app_add_lang" className="block text-xs font-bold text-gray-300 uppercase tracking-widest mb-1 font-mono">
                            Additional Languages / Dialects
                          </label>
                          <input
                            type="text"
                            id="app_add_lang"
                            value={formData.additional_languages}
                            onChange={(e) => setFormData({ ...formData, additional_languages: e.target.value })}
                            className="w-full px-3 py-2 bg-[#1b275c] border border-white/15 rounded-sm text-sm text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-brand-orange focus:border-brand-orange"
                            placeholder="e.g. Catalan, Portuguese"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="app_modes" className="block text-xs font-bold text-gray-300 uppercase tracking-widest mb-1 font-mono">
                            Preferred Interpreting Modes
                          </label>
                          <select
                            id="app_modes"
                            value={formData.interpreting_modes}
                            onChange={(e) => setFormData({ ...formData, interpreting_modes: e.target.value })}
                            className="w-full px-3 py-2 bg-[#1b275c] border border-white/15 rounded-sm text-sm text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-brand-orange focus:border-brand-orange"
                          >
                            <option value="OPI (Phone)" className="bg-[#1b275c] text-white">OPI (Over-the-Phone)</option>
                            <option value="VRI (Video)" className="bg-[#1b275c] text-white">VRI (Video Remote)</option>
                            <option value="On-site Face-to-Face" className="bg-[#1b275c] text-white">On-site Face-to-Face</option>
                            <option value="Both" className="bg-[#1b275c] text-white">Both OPI/VRI</option>
                            <option value="All Modes Supported" className="bg-[#1b275c] text-white">All Modes (OPI / VRI / On-site)</option>
                          </select>
                        </div>

                        <div>
                          <label htmlFor="app_industries" className="block text-xs font-bold text-gray-300 uppercase tracking-widest mb-1 font-mono">
                            Target Industries Served
                          </label>
                          <select
                            id="app_industries"
                            value={formData.industries}
                            onChange={(e) => setFormData({ ...formData, industries: e.target.value })}
                            className="w-full px-3 py-2 bg-[#1b275c] border border-white/15 rounded-sm text-sm text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-brand-orange focus:border-brand-orange"
                          >
                            <option value="Healthcare" className="bg-[#1b275c] text-white">Healthcare</option>
                            <option value="Legal proceedings" className="bg-[#1b275c] text-white">Legal proceedings</option>
                            <option value="Public Government Sector" className="bg-[#1b275c] text-white">Public Government Sector</option>
                            <option value="Corporate Enterprise" className="bg-[#1b275c] text-white">Corporate Enterprise</option>
                            <option value="Education Boards" className="bg-[#1b275c] text-white">Education Boards</option>
                            <option value="Multiple Verticals" className="bg-[#1b275c] text-white">Multiple Verticals</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Section 3: Qualifications */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 pb-1.5 border-b border-white/10">
                        <span className="w-5 h-5 rounded-sm bg-brand-orange text-white flex items-center justify-center font-bold text-[10px] font-mono">3</span>
                        <h4 className="text-xs uppercase font-extrabold tracking-wider text-brand-orange font-mono">Qualifications & Background</h4>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="app_exp" className="block text-xs font-bold text-gray-300 uppercase tracking-widest mb-1 font-mono">
                            Years of Experience
                          </label>
                          <select
                            id="app_exp"
                            value={formData.experience_years}
                            onChange={(e) => setFormData({ ...formData, experience_years: e.target.value })}
                            className="w-full px-3 py-2 bg-[#1b275c] border border-white/15 rounded-sm text-sm text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-brand-orange focus:border-brand-orange"
                          >
                            <option value="Less than 1 Year" className="bg-[#1b275c] text-white">Less than 1 Year</option>
                            <option value="1-3 Years" className="bg-[#1b275c] text-white">1-3 Years</option>
                            <option value="3-5 Years" className="bg-[#1b275c] text-white">3-5 Years</option>
                            <option value="5+ Years" className="bg-[#1b275c] text-white">5+ Years</option>
                            <option value="10+ Years Premium expert" className="bg-[#1b275c] text-white">10+ Years Expert</option>
                          </select>
                        </div>

                        <div>
                          <label htmlFor="app_med_knowledge" className="block text-xs font-bold text-gray-300 uppercase tracking-widest mb-1 font-mono">
                            Medical/Legal Terminology Training
                          </label>
                          <select
                            id="app_med_knowledge"
                            value={formData.medical_legal_knowledge}
                            onChange={(e) => setFormData({ ...formData, medical_legal_knowledge: e.target.value })}
                            className="w-full px-3 py-2 bg-[#1b275c] border border-white/15 rounded-sm text-sm text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-brand-orange focus:border-brand-orange"
                          >
                            <option value="Yes - Experienced" className="bg-[#1b275c] text-white">Yes - Completed Training</option>
                            <option value="Brief familiarity" className="bg-[#1b275c] text-white">Brief Familiarity</option>
                            <option value="No prior structured training" className="bg-[#1b275c] text-white">No structured training</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label htmlFor="app_certifications" className="block text-xs font-bold text-gray-300 uppercase tracking-widest mb-1 font-mono">
                          Certifications / Credentials List
                        </label>
                        <input
                          type="text"
                          id="app_certifications"
                          value={formData.certifications}
                          onChange={(e) => setFormData({ ...formData, certifications: e.target.value })}
                          className="w-full px-3 py-2 bg-[#1b275c] border border-white/15 rounded-sm text-sm text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-brand-orange focus:border-brand-orange"
                          placeholder="e.g. CCHI #0192, State Court Certified Spanish, ATA Translation ID"
                        />
                      </div>
                    </div>

                    {/* Section 4: Technical availability and portfolio */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 pb-1.5 border-b border-white/10">
                        <span className="w-5 h-5 rounded-sm bg-brand-orange text-white flex items-center justify-center font-bold text-[10px] font-mono">4</span>
                        <h4 className="text-xs uppercase font-extrabold tracking-wider text-brand-orange font-mono">Technical Setup & Availability</h4>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="app_tech" className="block text-xs font-bold text-gray-300 uppercase tracking-widest mb-1 font-mono">
                            Audited Technical Setup
                          </label>
                          <select
                            id="app_tech"
                            value={formData.technical_setup}
                            onChange={(e) => setFormData({ ...formData, technical_setup: e.target.value })}
                            className="w-full px-3 py-2 bg-[#1b275c] border border-white/15 rounded-sm text-sm text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-brand-orange focus:border-brand-orange"
                          >
                            <option value="Meets All Requirements" className="bg-[#1b275c] text-white">Meets All (Wired speed, PC, USB mic)</option>
                            <option value="Needs review / upgrading speed" className="bg-[#1b275c] text-white">Upgrading hardware/connection speed</option>
                          </select>
                        </div>

                        <div>
                          <label htmlFor="app_avail" className="block text-xs font-bold text-gray-300 uppercase tracking-widest mb-1 font-mono">
                            Expected Clock Availability
                          </label>
                          <select
                            id="app_avail"
                            value={formData.availability}
                            onChange={(e) => setFormData({ ...formData, availability: e.target.value })}
                            className="w-full px-3 py-2 bg-[#1b275c] border border-white/15 rounded-sm text-sm text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-brand-orange focus:border-brand-orange"
                          >
                            <option value="Full-time active schedule" className="bg-[#1b275c] text-white">Full-time availability</option>
                            <option value="Part-time hours" className="bg-[#1b275c] text-white">Part-time hours</option>
                            <option value="Flexible / Hourly Contract" className="bg-[#1b275c] text-white">Flexible / Hourly shift reserve</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label htmlFor="app_linkedin" className="block text-xs font-bold text-gray-300 uppercase tracking-widest mb-1 font-mono">
                          LinkedIn or Portfolio Link
                        </label>
                        <input
                          type="url"
                          id="app_linkedin"
                          value={formData.linkedin_or_portfolio}
                          onChange={(e) => setFormData({ ...formData, linkedin_or_portfolio: e.target.value })}
                          className="w-full px-3 py-2 bg-[#1b275c] border border-white/15 rounded-sm text-sm text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-brand-orange focus:border-brand-orange"
                          placeholder="https://linkedin.com/in/username"
                        />
                      </div>

                      <div>
                        <label htmlFor="app_additional" className="block text-xs font-bold text-gray-300 uppercase tracking-widest mb-1 font-mono">
                          Brief statement / Cover details
                        </label>
                        <textarea
                          id="app_additional"
                          rows={3}
                          value={formData.additional_info}
                          onChange={(e) => setFormData({ ...formData, additional_info: e.target.value })}
                          className="w-full px-[#1b275c] py-2 bg-[#1b275c] border border-white/15 rounded-sm text-sm text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-brand-orange focus:border-brand-orange"
                          placeholder="List specialized dialect nuances, software familiarity CAT tools, or background check approvals..."
                        />
                      </div>
                    </div>

                    <div className="pt-4">
                      <button
                        type="submit"
                        id="app-submit-btn"
                        disabled={formState === "getting_tokens" || formState === "submitting"}
                        className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-brand-orange hover:brightness-110 text-white font-bold rounded-sm shadow-md transition-all text-xs uppercase tracking-widest select-none cursor-pointer"
                      >
                        {formState === "getting_tokens" ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Auditing Security Gateway...
                          </>
                        ) : formState === "submitting" ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Delivering Recruiter Dossier...
                          </>
                        ) : (
                          <>
                            <Send className="w-4 h-4" />
                            SUBMIT APPLICATION
                          </>
                        )}
                      </button>
                    </div>

                    <div className="text-[10px] text-gray-300 text-center leading-normal">
                      Vozara enforces HIPAA and Joint Commission workforce credential auditing. By registering, you authorize verification of certificates with their respective authorizing directories and medical centers.
                    </div>

                  </form>
                )}

              </div>
              
            </div>

          </div>

        </div>
      </section>

    </div>
  );
}

/* ==========================================
   MAIN GLOBAL APPLICATION MODULE LAYOUT
   ========================================= */
function AnimatedAppContent({
  isQuoteOpen,
  preferredServiceForQuote,
  handleOpenQuote,
  handleCloseQuote
}: {
  isQuoteOpen: boolean;
  preferredServiceForQuote: string;
  handleOpenQuote: (serviceName?: string) => void;
  handleCloseQuote: () => void;
}) {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-[#FAFAFB] text-[#1F2937] flex flex-col justify-between">
      
      {/* Sticky Global Top Header */}
      <Navbar onOpenQuote={handleOpenQuote} />

      {/* Content Route Routing Engine */}
      <main className="flex-grow z-10">
        <AnimatePresence mode="wait">
          <Routes>
            <Route 
              path="/" 
              element={
                <PageWrapper title="Connecting Voices">
                  <HomeView onOpenQuote={handleOpenQuote} />
                </PageWrapper>
              } 
            />
            <Route 
              path="/services" 
              element={
                <PageWrapper title="Our Solutions">
                  <ServicesView onOpenQuote={handleOpenQuote} />
                </PageWrapper>
              } 
            />
            <Route 
              path="/about" 
              element={
                <PageWrapper title="Who We Are">
                  <AboutView onOpenQuote={handleOpenQuote} />
                </PageWrapper>
              } 
            />
            <Route 
              path="/careers" 
              element={
                <PageWrapper title="Careers">
                  <CareersView />
                </PageWrapper>
              } 
            />
            <Route 
              path="/contact" 
              element={
                <PageWrapper title="Contact Support">
                  <ContactView />
                </PageWrapper>
              } 
            />
            <Route 
              path="/careers/interpreter-apply" 
              element={
                <PageWrapper title="Join as Interpreter">
                  <InterpreterApplyView />
                </PageWrapper>
              } 
            />
            <Route 
              path="/admin" 
              element={
                <PageWrapper title="Admin Sandbox Portal">
                  <AdminPortalView />
                </PageWrapper>
              } 
            />
          </Routes>
        </AnimatePresence>
      </main>

      {/* Universal Sticky Footing */}
      <Footer />

      {/* Global Quote Requester Dialog Portal */}
      <QuoteModal 
        isOpen={isQuoteOpen} 
        onClose={handleCloseQuote} 
        preferredService={preferredServiceForQuote}
      />

    </div>
  );
}

export default function App() {
  const [isQuoteOpen, setIsQuoteOpen] = useState(false);
  const [preferredServiceForQuote, setPreferredServiceForQuote] = useState("");

  const handleOpenQuote = (serviceName: string = "") => {
    setPreferredServiceForQuote(serviceName);
    setIsQuoteOpen(true);
  };

  const handleCloseQuote = () => {
    setIsQuoteOpen(false);
    setPreferredServiceForQuote("");
  };

  return (
    <Router>
      <AnimatedAppContent
        isQuoteOpen={isQuoteOpen}
        preferredServiceForQuote={preferredServiceForQuote}
        handleOpenQuote={handleOpenQuote}
        handleCloseQuote={handleCloseQuote}
      />
    </Router>
  );
}
