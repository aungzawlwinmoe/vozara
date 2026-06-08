/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { 
  ServiceItem, 
  IndustryItem, 
  Testimonial, 
  ValueItem, 
  TimelineEvent, 
  CareerRole, 
  PerkItem,
  StatMetric
} from "./types";

export const servicesData: ServiceItem[] = [
  {
    id: "interpreter-staffing",
    tagline: "Real people. Real connection. On demand.",
    title: "Interpreter Staffing",
    description: "Connect instantly with certified, screened face-to-face and scheduled interpreters for any venue. We handle the complex staffing and verification protocols so you can focus on communication.",
    features: [
      "Same-day emergency on-site placement",
      "Over 100+ native language pairs supported",
      "Rigorous medical & legal vetting workflows",
      "Fully compliant with Title VI and Joint Commission regulations",
      "Professional, smart, and culturally adaptive specialists"
    ],
    iconName: "Users"
  },
  {
    id: "translation-services",
    tagline: "Every word. Every nuance. Every time.",
    title: "Translation Services",
    description: "Transform written text while honoring terminology, formatting, and industry context. Our verified multi-step editor workflow guarantees translation precision.",
    features: [
      "Certified legal, medical, and governmental document translations",
      "Fast-turnaround timelines with dedicated emergency queues",
      "Double-blind peer review and quality editing protocols",
      "Secure digital delivery and physical notarization availability",
      "Multi-format support (PDF, DOCX, InDesign, HTML)"
    ],
    iconName: "FileText"
  },
  {
    id: "localization-solutions",
    tagline: "Speak their language. Respect their culture.",
    title: "Localization Solutions",
    description: "Adapt software, native applications, instructional content, and marketing messaging directly to the custom cultural paradigms of target regions.",
    features: [
      "Full digital product localization (Web, iOS, Android)",
      "Cultural consulting to align imagery and idiomatic styling",
      "SEO alignment to drive search performance in foreign regions",
      "Automated translation integration via continuous delivery",
      "Global user acceptance testing and validation"
    ],
    iconName: "FlameKindling"
  },
  {
    id: "remote-interpreting",
    tagline: "Instant access. No boundaries.",
    title: "Remote Interpreting (OPI/VRI)",
    description: "Tap into certified Over-the-Phone (OPI) and Video Remote Interpreting (VRI) instantly from any smart phone, browser, desk set, or medical cart.",
    features: [
      "On-demand calls connected in under 60 seconds",
      "24/7/365 active operations team and cloud routing",
      "Fully HIPAA and HITECH compliant encrypted architecture",
      "Zero specialized equipment required—works on standard web browsers",
      "Crystal-clear high-definition audio and low-latency video streaming"
    ],
    iconName: "Video"
  },
  {
    id: "multilingual-support",
    tagline: "Keep every customer heard and valued.",
    title: "Multilingual Support",
    description: "Extend your support capacity to cover global accounts. We match active, professional customer-facing representatives equipped with industry expertise.",
    features: [
      "Seamless call center extension and backup queues",
      "Bilingual chat, ticket response, and client-relations management",
      "Scalable hourly staffing configurations built for seasonal demand",
      "Specialist onboarding trained in custom internal software systems",
      "Rigorous SLA monitoring and active call-quality audits"
    ],
    iconName: "PhoneCall"
  }
];

export const industriesData: IndustryItem[] = [
  {
    id: "healthcare",
    name: "Healthcare",
    description: "Empowering clinics and global hospital networks with HIPAA-compliant VRI, OPI, and on-site medical interpreters to secure critical patient outcomes.",
    iconName: "Stethoscope"
  },
  {
    id: "legal",
    name: "Legal",
    description: "Facilitating depositions, court hearings, trials, and contract reviews with highly certified court interpreters and legal-specialist translators.",
    iconName: "Briefcase"
  },
  {
    id: "government",
    name: "Government",
    description: "Supporting federal, state, and local agencies with accessible public communications, translation of vital documents, and on-site meeting interpreters.",
    iconName: "FileShield"
  },
  {
    id: "corporate",
    name: "Corporate",
    description: "Enabling seamless international commerce, board meetings, training modules, and employee outreach across globally distributed workforces.",
    iconName: "Building2"
  },
  {
    id: "education",
    name: "Education",
    description: "Unifying schools and communities by translating IEP plans, powering parent-teacher conferences, and providing accessible campus support.",
    iconName: "GraduationCap"
  },
  {
    id: "finance",
    name: "Finance",
    description: "Bridging communication in retail banking, international loans, disclosure agreements, and compliance manuals with secure translators.",
    iconName: "TrendingUp"
  }
];

export const homeHomeStats: StatMetric[] = [
  { id: "s1", value: "100+", number: 100, suffix: "+", label: "Languages Covered" },
  { id: "s2", value: "500+", number: 500, suffix: "+", label: "Interpreters hired for partners" },
  { id: "s3", value: "24/7", number: 24, suffix: "/7", label: "Live Availability" },
  { id: "s4", value: "100+", number: 100, suffix: "+", label: "Medical & Legal Specialists" }
];

export const aboutStats: StatMetric[] = [
  { id: "a1", value: "100+", number: 100, suffix: "+", label: "Languages Supported" },
  { id: "a2", value: "500+", number: 500, suffix: "+", label: "Interpreters hired for partners" },
  { id: "a3", value: "4+", number: 4, suffix: "+", label: "Years of Proven Success" },
  { id: "a4", value: "98%", number: 98, suffix: "%", label: "Client Partner Satisfaction" }
];

export const whyVozaraData = [
  {
    number: "01",
    title: "Certified Professionals",
    description: "Every translator and interpreter is strictly vetted and certified by leading global bodies (CCHI, IMIA, court credentials), completing rigorous ethics and terminology tests."
  },
  {
    number: "02",
    title: "Global Reach",
    description: "Our expansive digital secure network spans multiple time zones, securing immediate local cultural expertise and remote support capabilities around the clock."
  },
  {
    number: "03",
    title: "Industry Expertise",
    description: "We don't believe in generic services; we match your projects with subject-matter experts specialized in healthcare, legal proceedings, corporate contracts, or software logic."
  },
  {
    number: "04",
    title: "Committed to Excellence",
    description: "With multi-stage quality review protocols and fully HIPAA-compliant cloud architectures, we deliver precise services with confidentiality and care."
  }
];

export const testimonialsData: Testimonial[] = [
  {
    id: "t1",
    name: "Dr. Sarah Mitchell",
    role: "Healthcare Administrator",
    organization: "Metro Health Alliance",
    quote: "Integrating Vozara's Remote VRI service transformed our emergency care pipeline. Within 45 seconds, our physicians can connect with a medical-certified interpreter, securing accurate diagnostic communication and profound patient trust. They have become an indispensable partner in our health equity missions."
  },
  {
    id: "t2",
    name: "James Harrington",
    role: "Senior Corporate Attorney",
    organization: "Harrington & Cole LLP",
    quote: "For complex deposition trials and cross-border regulatory reviews, precision in language is absolutely non-negotiable. Vozara's legal interpreters understand technical terminology beautifully, maintaining extreme accuracy and confidentiality throughout high-stakes corporate litigation."
  },
  {
    id: "t3",
    name: "Elena Vasquez",
    role: "Global Operations Director",
    organization: "Synapse Software Systems",
    quote: "Launching our API suite across Latin American and East Asian regions was a major security checkpoint. Vozara localized not just the UI text, but our technical support pathways, instructional content, and compliance documents. Their translation quality and responsiveness were stellar."
  }
];

export const valuesData: ValueItem[] = [
  {
    id: "val1",
    title: "Uncompromising Accuracy",
    description: "We capture every single semantic word, subtle cultural nuance, and industry descriptor. Communication only succeeds when the original intent is perfectly understood.",
    iconName: "CheckCircle2"
  },
  {
    id: "val2",
    title: "Cultural Sensitivity",
    description: "Language is intrinsically bound to local culture. We communicate with deep situational awareness, ensuring terms are appropriate, respectful, and perfectly aligned.",
    iconName: "Globe"
  },
  {
    id: "val3",
    title: "Confidentiality & Compliance",
    description: "From HIPAA-compliant streaming nodes to NDA-controlled secure legal document systems, we enforce absolute privacy, physical isolation, and network security policies.",
    iconName: "ShieldCheck"
  },
  {
    id: "val4",
    title: "Empathetic Reliability",
    description: "We understand that critical connection lines cannot fail. Whether it is a 3:00 AM clinical emergency or a high-stakes deal, we answer the call with immediate availability.",
    iconName: "Clock"
  }
];

export const timelineData: TimelineEvent[] = [
  {
    year: "2022",
    title: "Founded Vozara",
    description: "Launched in Seattle with Arabic and Spanish medical interpreters, driven by a deep mission to democratize quality language access."
  },
  {
    year: "2023",
    title: "Expanded Language Pairs",
    description: "Onboarded state court-certified interpreters and extended document translation channels into Russian, Chinese, Vietnamese, and French partnerships."
  },
  {
    year: "2024",
    title: "Over-The-Phone & Video Launch",
    description: "Bootstrapped our 24/7 native phone routing platform and deployed high-definition encrypted web-video streaming rooms for medical and legal facilities."
  },
  {
    year: "2025",
    title: "500+ Certified Interpreters Available",
    description: "Hit a major organizational milestone, integrating robust cloud staffing portals and state-of-the-art continuing-education pipelines."
  },
  {
    year: "2026",
    title: "Global Enterprise Expansion",
    description: "Integrated complete multi-channel localization networks for Fortune 500 tech platforms, standardizing continuous delivery of translated assets in 100+ languages."
  }
];

export const perksData: PerkItem[] = [
  {
    id: "p1",
    number: "01",
    title: "Flexible Scheduling",
    description: "Work on your terms. Set your contract availability hours, accept targeted remote bookings, or take active shifts according to your preferred lifestyle."
  },
  {
    id: "p2",
    number: "02",
    title: "Competitive Pay",
    description: "We value high specialist caliber. Vozara provides leading professional compensation rates, with clear tiered bonuses for legal, medical, or niche certifications."
  },
  {
    id: "p3",
    number: "03",
    title: "Professional Growth",
    description: "Access curated continuing-education academies, certified HIPAA refresher courses, and terminology trainings to support your long-term translation career."
  },
  {
    id: "p4",
    number: "04",
    title: "Diverse Global Community",
    description: "Connect with native linguists, interpreters, and cultural consultants from 100+ countries, united by a deep passion for human communication and access."
  },
  {
    id: "p5",
    number: "05",
    title: "Meaningful, Vital Work",
    description: "Every translation or call changes lives. Help minoritized patients navigate clinical diagnostics, secure fair legal representation, or support critical education lines."
  },
  {
    id: "p6",
    number: "06",
    title: "Remote & Hybrid Options",
    description: "Work comfortably from your custom acoustic-shielded home office, or support on-site assignments in state courts and medical campuses in your region."
  }
];

export const careerRolesData: CareerRole[] = [
  {
    id: "role-remote-interpreter",
    title: "Remote OPI/VRI Interpreter",
    type: "Contract",
    location: "Remote, Worldwide",
    languages: "Spanish / Arabic / Mandarin / Russian",
    description: "Join our fast-paced remote interpreter grid answering high-volume call requests on our proprietary digital secure call routing network. Secured for remote emergency lines.",
    requirements: [
      "Minimum of 2 years active certified VRI or OPI call-handling experience",
      "Strict compliance with clean background noise-reduction levels (<40dB ambient sound)",
      "Technical setup including structured noise-canceling USB headset and high-definition web equipment",
      "Wired fiber, ethernet, or high-speed cable connection securing continuous uptime",
      "Clear, authoritative vocal presence and rapid transition mental agility"
    ],
    isInterpreter: true
  },
  {
    id: "role-legal-interpreter",
    title: "Legal Interpreter",
    type: "Contract",
    location: "Remote or On-site",
    languages: "Spanish / French / Portuguese / Korean",
    description: "Provide immaculate consecutive and simultaneous interpretation for complex legal procedures, including depositions, arbitrations, court hearings, and corporate contract translations.",
    requirements: [
      "State Court Interpreter Certification or Federal Court Interpreter Credentials",
      "Comprehensive knowledge of legal terminology, criminal procedures, and civil evidence structures",
      "Absolute adherence to court confidentiality covenants and conflict-of-interest declarations",
      "Proven track record of high-stakes simultaneous translation in court settings",
      "Professional presentation, attire, and vocal projection"
    ],
    isInterpreter: true
  },
  {
    id: "role-medical-interpreter",
    title: "Medical Interpreter",
    type: "Contract",
    location: "Remote or On-site",
    languages: "Spanish / Arabic / Mandarin / Vietnamese",
    description: "Facilitate direct, culturally sensitive, and accurate communication between healthcare practitioners and patients in high-pressure clinical, laboratory, and hospital environments.",
    requirements: [
      "Active CCHI (Certified Commission for Healthcare Interpreters) or NBCMI (National Board) credentials",
      "Profound familiarity with medical diagnostics, pharmaceutical terminology, and clinical pathways",
      "Adherence to HIPAA, IMIA Code of Ethics, and hospital workplace decorum",
      "Stable high-speed digital connection and professional background elements for VRI roles",
      "Availability for emergency acute care call routing or scheduled clinic hours"
    ],
    isInterpreter: true
  },
  {
    id: "role-community-interpreter",
    title: "Community Interpreter",
    type: "Part-time / Full-time",
    location: "On-site",
    languages: "Somali / Hmong / Amharic / Haitian Creole",
    description: "Support local social service agencies, school districts, community centers, and non-profit organizations by providing vital interpretation to secure public access to basic human services.",
    requirements: [
      "Proven native fluency in English and target community language",
      "Completion of a structured 40-hour Community Interpreting training course or equivalent",
      "Warm, empathetic, human-focused communication skills with exceptional active listening",
      "Knowledge of local community frameworks, school enrollment boards, and municipal systems",
      "Reliable regional transportation for on-site school or agency visits"
    ],
    isInterpreter: true
  },
  {
    id: "role-document-translator",
    title: "Document Translator",
    type: "Freelance",
    location: "Remote",
    languages: "All Language Pairs Supported",
    description: "Translate, localize, and quality-proof vital written records across medical, legal, corporate, educational, and public sectors, ensuring idiomatic formatting and regulatory compliance.",
    requirements: [
      "Minimum 3+ years of professional document translation experience",
      "Degree in Linguistics, Translation Studies, or American Translators Association (ATA) certification",
      "Expert command of advanced translation software (CAT Tools) and terminology tables",
      "Exceptional editing and double-blind correction capacity",
      "Diligent commitment to rigid corporate submission deadlines"
    ],
    isInterpreter: false
  }
];
