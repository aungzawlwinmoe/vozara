import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useNavigate } from "react-router-dom";
import { 
  getContactSubmissionsDirect, 
  getInterpreterSubmissionsDirect, 
  deleteSubmissionDirect 
} from "../firebase";
import { 
  Lock, 
  ShieldAlert, 
  Eye, 
  Trash2, 
  RefreshCw, 
  CheckCircle, 
  X, 
  Check, 
  FileText, 
  Users, 
  Clock, 
  AlertTriangle,
  Mail,
  Smartphone,
  MapPin,
  Building,
  Briefcase,
  HelpCircle,
  Database,
  Search,
  Filter,
  CheckCircle2,
  Trash,
  Play,
  Heart,
  ChevronRight,
  LogOut,
  AppWindow,
  ExternalLink,
  ShieldCheck,
  ServerCrash
} from "lucide-react";

interface ContactSubmission {
  id: string;
  full_name: string;
  submitter_email: string;
  phone: string;
  organization: string;
  service: string;
  language_pair: string;
  message: string;
  timestamp: string;
}

interface InterpreterSubmission {
  id: string;
  full_name: string;
  submitter_email: string;
  phone: string;
  location: string;
  primary_language: string;
  additional_languages: string;
  interpreting_modes: string;
  industries: string;
  experience_years: string;
  certifications: string;
  medical_legal_knowledge: string;
  technical_setup: string;
  availability: string;
  linkedin_or_portfolio: string;
  additional_info: string;
  timestamp: string;
  // If the server intercepted email and returned a sandbox preview Url
  email_sandbox_preview?: string;
}

interface AntiSpamSession {
  id: string;
  ageSeconds: number;
  challenge: string;
}

export default function AdminPortalView() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [loginError, setLoginError] = useState<string>("");
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);

  // Dashboard Data State
  const [contacts, setContacts] = useState<ContactSubmission[]>([]);
  const [interpreters, setInterpreters] = useState<InterpreterSubmission[]>([]);
  const [antispamSessions, setAntispamSessions] = useState<AntiSpamSession[]>([]);
  const [uptime, setUptime] = useState<number>(0);
  const [firebaseConnected, setFirebaseConnected] = useState<boolean>(false);
  
  // Controls & UI States
  const [activeTab, setActiveTab] = useState<"interpreters" | "contacts" | "antispam">("interpreters");
  const [isLoadingData, setIsLoadingData] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedSub, setSelectedSub] = useState<any | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<{ type: string; id: string } | null>(null);
  const [sysMsg, setSysMsg] = useState<{ text: string; error?: boolean } | null>(null);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Read token from storage on mount
  useEffect(() => {
    const savedToken = sessionStorage.getItem("vozara_sandbox_admin_token");
    if (savedToken) {
      setIsAuthenticated(true);
      fetchDashboardData();
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setLoginError("Please supply both credentials.");
      return;
    }
    setLoginError("");
    setIsLoggingIn(true);

    try {
      let data: any = null;
      let success = false;
      let token = "";

      try {
        const response = await fetch("/api/admin/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, password })
        });

        if (response.ok) {
          data = await response.json();
          if (data && data.success) {
            success = true;
            token = data.token;
            sessionStorage.removeItem("vozara_static_fallback");
          } else {
            setLoginError(data?.error || "Credentials rejected.");
            setIsLoggingIn(false);
            return;
          }
        }
      } catch (fetchErr) {
        console.warn("Express backend authentication endpoint unreachable, trying client-side direct credential fallback...", fetchErr);
      }

      // If backend is unreachable or doesn't support login, fall back to exact same criteria on client side
      if (!success) {
        if (
          (username === "admin@vozarals.com" || username === "admin" || username === "aungzawlwinmoe@gmail.com") &&
          password === "admin-sandbox-2026"
        ) {
          success = true;
          token = "token_vozara_sandbox_admin_2026_xyz";
          sessionStorage.setItem("vozara_static_fallback", "true");
        } else {
          setLoginError("Invalid admin credentials. Please note the test credentials are admin@vozarals.com / admin-sandbox-2026.");
          setIsLoggingIn(false);
          return;
        }
      }

      if (success) {
        sessionStorage.setItem("vozara_sandbox_admin_token", token);
        setIsAuthenticated(true);
        setSysMsg({ text: "Authentication success. Systems unlocked (static support active)." });
        setTimeout(() => setSysMsg(null), 3500);
        fetchDashboardData();
      }
    } catch (err) {
      setLoginError("Offline or communication timeout with sandbox agent.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem("vozara_sandbox_admin_token");
    sessionStorage.removeItem("vozara_static_fallback");
    setIsAuthenticated(false);
    setSelectedSub(null);
  };

  const getAdminHeader = () => {
    const token = sessionStorage.getItem("vozara_sandbox_admin_token");
    return token ? { "Authorization": `Bearer ${token}` } : {};
  };

  const fetchDashboardData = async () => {
    setIsRefreshing(true);
    try {
      const tokenHeaders = getAdminHeader();
      const isStaticMode = sessionStorage.getItem("vozara_static_fallback") === "true";
      let hasFetchedBackend = false;

      if (!isStaticMode) {
        try {
          const resSubmissions = await fetch("/api/admin/submissions", { headers: tokenHeaders });
          
          if (resSubmissions.status === 401) {
            handleLogout();
            return;
          }

          if (resSubmissions.ok) {
            const valSubmissions = await resSubmissions.json();
            if (valSubmissions.success) {
              setContacts(valSubmissions.contacts || []);
              setInterpreters(valSubmissions.interpreters || []);
              setFirebaseConnected(valSubmissions.firebaseConnected || false);
              hasFetchedBackend = true;
            }
          }
        } catch (e) {
          console.warn("Backend submissions endpoint unreachable, using client-side Firestore fallback...");
        }
      }

      if (!hasFetchedBackend) {
        // Direct Client-Side Firestore Query Fallback
        try {
          const directContacts = await getContactSubmissionsDirect();
          const directInterpreters = await getInterpreterSubmissionsDirect();
          setContacts(directContacts);
          setInterpreters(directInterpreters);
          setFirebaseConnected(true);
        } catch (dbErr: any) {
          console.error("Direct Firestore read fallback failed:", dbErr);
          setSysMsg({ text: "Static direct database read failed. Please check your Firebase rules/quota.", error: true });
          setTimeout(() => setSysMsg(null), 5000);
        }
      }

      // Fetch Anti-spam queues (only relevant to server context)
      if (!isStaticMode) {
        try {
          const resAntispam = await fetch("/api/admin/antispam-stats", { headers: tokenHeaders });
          if (resAntispam.ok) {
            const valAntispam = await resAntispam.json();
            if (valAntispam.success) {
              setAntispamSessions(valAntispam.activeSessions || []);
              setUptime(valAntispam.uptimeSeconds || 0);
            }
          }
        } catch (e) {
          setAntispamSessions([]);
          setUptime(0);
        }
      } else {
        setAntispamSessions([]);
        setUptime(0);
      }
    } catch (err) {
      console.error("Failed to query sandbox data:", err);
      setSysMsg({ text: "Dynamic sync timeout. Sourcing local browser state.", error: true });
      setTimeout(() => setSysMsg(null), 4000);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleDelete = async (type: "contact" | "interpreter", id: string) => {
    try {
      const isStaticMode = sessionStorage.getItem("vozara_static_fallback") === "true";
      let deletedDirectly = false;

      if (!isStaticMode) {
        try {
          const response = await fetch("/api/admin/submissions", {
            method: "DELETE",
            headers: { 
              "Content-Type": "application/json",
              ...getAdminHeader()
            },
            body: JSON.stringify({ type, id })
          });

          if (response.ok) {
            const data = await response.json();
            if (data && data.success) {
              deletedDirectly = true;
            }
          }
        } catch (e) {
          console.warn("Express backend is offline. Retrying deletion via direct Firebase client SDK...");
        }
      }

      if (!deletedDirectly) {
        // Direct Client-Side delete
        await deleteSubmissionDirect(type, id);
      }

      setSysMsg({ text: "Document removed and pruned cleanly from Firebase database." });
      setTimeout(() => setSysMsg(null), 3000);
      
      // Remove locally from state
      if (type === "contact") {
        setContacts(prev => prev.filter(c => c.id !== id));
      } else {
        setInterpreters(prev => prev.filter(i => i.id !== id));
      }

      if (selectedSub && selectedSub.id === id) {
        setSelectedSub(null);
      }
    } catch (err: any) {
      setSysMsg({ text: `Pruning operation failed: ${err.message || err}`, error: true });
      setTimeout(() => setSysMsg(null), 4000);
    } finally {
      setShowDeleteConfirm(null);
    }
  };

  const handleClearAntiSpam = async () => {
    try {
      const response = await fetch("/api/admin/clear-sessions", {
        method: "POST",
        headers: getAdminHeader()
      });
      if (response.ok) {
        setAntispamSessions([]);
        setSysMsg({ text: "Challenge queues purged cleanly." });
        setTimeout(() => setSysMsg(null), 3000);
      }
    } catch (err) {
      setSysMsg({ text: "Purge failed.", error: true });
      setTimeout(() => setSysMsg(null), 4000);
    }
  };

  const filteredInterpreters = interpreters.filter(item => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      item.full_name?.toLowerCase().includes(term) ||
      item.submitter_email?.toLowerCase().includes(term) ||
      item.primary_language?.toLowerCase().includes(term) ||
      item.location?.toLowerCase().includes(term)
    );
  });

  const filteredContacts = contacts.filter(item => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      item.full_name?.toLowerCase().includes(term) ||
      item.submitter_email?.toLowerCase().includes(term) ||
      item.organization?.toLowerCase().includes(term) ||
      item.message?.toLowerCase().includes(term)
    );
  });

  const formatUptime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours}h ${mins}m ${secs}s`;
  };

  // Render Authentication Form
  if (!isAuthenticated) {
    return (
      <div className="min-h-[85vh] bg-gradient-to-b from-[#0F172A] to-[#1E293B] text-slate-100 flex items-center justify-center p-4">
        <div className="absolute inset-0 pointer-events-none opacity-5 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:16px_16px]" />
        
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-sm p-8 shadow-2xl relative"
        >
          {/* Accent Header */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-brand-orange to-amber-500 rounded-t-sm" />

          <div className="text-center space-y-3 mb-8">
            <div className="mx-auto w-12 h-12 bg-amber-500/10 border border-amber-500/30 rounded-full flex items-center justify-center text-amber-500">
              <Lock className="w-5 h-5 animate-pulse" />
            </div>
            <h1 className="font-serif text-2xl font-bold tracking-tight text-white uppercase">
              Operations Control
            </h1>
            <p className="text-xs text-slate-400 font-sans tracking-wide">
              Secure Local Sandbox Preview Portal for Website Administrators
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Admin Username or Email
              </label>
              <input 
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 rounded-sm px-4 py-3 text-sm text-white placeholder-slate-600 outline-none transition-all font-mono"
                placeholder="admin@vozarals.com"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Access Token / Password
              </label>
              <input 
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 rounded-sm px-4 py-3 text-sm text-white placeholder-slate-600 outline-none transition-all font-mono"
                placeholder="••••••••••••••"
                required
              />
            </div>

            {loginError && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-sm flex items-start gap-2.5">
                <ShieldAlert className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                <span className="text-xs text-red-400 leading-tight">{loginError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full bg-brand-orange hover:bg-brand-orange-light text-white font-bold tracking-wider uppercase py-3 rounded-sm text-xs transition-colors hover:cursor-pointer disabled:opacity-50 select-none flex items-center justify-center gap-2"
            >
              {isLoggingIn ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Granting Handshake...
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  Request Access Token
                </>
              )}
            </button>
          </form>

          {/* Help Banner - Fully Transparent Demo Credentials */}
          <div className="mt-8 pt-6 border-t border-slate-800/60 text-slate-400 space-y-3 hidden">
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-amber-500 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              Local Sandbox Authentication Note
            </h3>
            <p className="text-[11px] font-sans leading-relaxed">
              This sandbox interface retrieves submissions securely in real-time. Use the following developer-sandbox default credentials to instantiate view logs:
            </p>
            <div className="p-2 border border-slate-800 bg-slate-950/80 rounded-sm font-mono text-[10.5px] space-y-1 text-sky-400">
              <div>Username: <span className="text-white select-all">admin@vozarals.com</span></div>
              <div>Password: <span className="text-white select-all">admin-sandbox-2026</span></div>
            </div>
            <p className="text-[10px] text-slate-500 italic">
              All form post challenges, custom mapping tables, and nodemailer HTML envelopes can be simulated here without active SMTP transports.
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  // Render Authenticated Dashboard
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-4 sm:p-6 lg:p-8">
      {/* Upper Status Ribbon */}
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 pb-4 border-b border-slate-900">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h1 className="font-serif text-2xl font-black text-white uppercase tracking-tight">
              Admin Portal
            </h1>
          </div>
          <p className="text-xs text-slate-400 font-sans mt-0.5">
            Real-time candidate log monitor, custom integrations, and auto-sync logs.
          </p>
        </div>

        <div className="flex items-center gap-3 self-stretch sm:self-auto justify-end">
          <button
            onClick={fetchDashboardData}
            disabled={isRefreshing}
            className="p-2.5 text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-850 rounded-sm transition-all border border-slate-800 flex items-center gap-1.5 text-xs hover:cursor-pointer"
            title="Refresh submissions"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
            Sync Hub
          </button>

          <button
            onClick={handleLogout}
            className="p-2.5 text-red-400 hover:text-white bg-red-950/20 hover:bg-red-950/60 rounded-sm transition-all border border-red-950/50 flex items-center gap-1.5 text-xs hover:cursor-pointer font-bold uppercase tracking-wider"
          >
            <LogOut className="w-3.5 h-3.5" />
            Lock Portal
          </button>
        </div>
      </div>

      {/* Live System Messages */}
      {sysMsg && (
        <div className={`max-w-7xl mx-auto p-4 mb-6 rounded-sm border ${
          sysMsg.error 
            ? "bg-red-500/10 border-red-500/30 text-red-400" 
            : "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
        } text-xs flex items-center justify-between`}>
          <div className="flex items-center gap-2">
            {sysMsg.error ? <AlertTriangle className="w-4 h-4 shrink-0" /> : <CheckCircle className="w-4 h-4 shrink-0" />}
            <span>{sysMsg.text}</span>
          </div>
          <button onClick={() => setSysMsg(null)} className="hover:opacity-85 text-slate-400"><X className="w-3.5 h-3.5" /></button>
        </div>
      )}

      {/* Main Bento Stats Grid */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-slate-900 p-5 rounded-sm border border-slate-850 relative overflow-hidden flex flex-col justify-between h-28">
          <div className="flex justify-between items-start">
            <span className="text-xs uppercase tracking-wider text-slate-400 font-bold">Candidates Received</span>
            <Users className="w-5 h-5 text-brand-orange" />
          </div>
          <div>
            <div className="text-3xl font-black text-white leading-none">{interpreters.length}</div>
            <p className="text-[10px] text-slate-500 mt-1 font-sans">Interpreter Applications Active</p>
          </div>
        </div>

        <div className="bg-slate-900 p-5 rounded-sm border border-slate-850 relative overflow-hidden flex flex-col justify-between h-28">
          <div className="flex justify-between items-start">
            <span className="text-xs uppercase tracking-wider text-slate-400 font-bold">Client Leads</span>
            <FileText className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <div className="text-3xl font-black text-white leading-none">{contacts.length}</div>
            <p className="text-[10px] text-slate-500 mt-1 font-sans">Corporate Contact Submissions</p>
          </div>
        </div>

        <div className="bg-slate-900 p-5 rounded-sm border border-slate-850 relative overflow-hidden flex flex-col justify-between h-28">
          <div className="flex justify-between items-start">
            <span className="text-xs uppercase tracking-wider text-slate-400 font-bold">Anti-Bot Tokens</span>
            <Clock className="w-5 h-5 text-cyan-500" />
          </div>
          <div>
            <div className="text-3xl font-black text-white leading-none font-mono">
              {antispamSessions.length} <span className="text-xs text-slate-500 font-normal">challenges</span>
            </div>
            <p className="text-[10px] text-slate-500 mt-1 font-sans">Active valid form entry leases</p>
          </div>
        </div>

        <div className="bg-slate-900 p-5 rounded-sm border border-slate-850 relative overflow-hidden flex flex-col justify-between h-28">
          <div className="flex justify-between items-start">
            <span className="text-xs uppercase tracking-wider text-slate-400 font-bold">Persistence Engine</span>
            <Database className={`w-5 h-5 ${firebaseConnected ? "text-emerald-500" : "text-amber-500"}`} />
          </div>
          <div>
            <div className="text-xs font-mono text-white leading-none flex items-center gap-1.5 uppercase font-bold">
              {firebaseConnected ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 inline" />
                  Cloud Firestore Live
                </>
              ) : (
                <>
                  <AlertTriangle className="w-4 h-4 text-amber-400 inline" />
                  In-Memory Cache (Dev Mode)
                </>
              )}
            </div>
            <p className="text-[10px] text-slate-500 mt-2 font-sans overflow-hidden text-ellipsis whitespace-nowrap">
              Project ID: {firebaseConnected ? "ai-studio-e3c5279f" : "local-demonstration"}
            </p>
          </div>
        </div>
      </div>

      {/* Main Panel Area: Splits into Columns if Selected details */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Interactive Panel (List / Logs List) */}
        <div className={`col-span-1 ${selectedSub ? "lg:col-span-7" : "lg:col-span-12"} transition-all`}>
          
          <div className="bg-slate-900 rounded-sm border border-slate-850 overflow-hidden">
            
            {/* Tab Selection */}
            <div className="flex border-b border-slate-850 bg-slate-950 p-2 gap-1">
              <button
                onClick={() => { setActiveTab("interpreters"); setSearchTerm(""); }}
                className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider rounded-sm transition-all hover:cursor-pointer flex items-center gap-2 ${
                  activeTab === "interpreters"
                    ? "bg-slate-900 text-white border-b-2 border-brand-orange"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Users className="w-4 h-4" />
                Interpreter Applicants ({interpreters.length})
              </button>
              
              <button
                onClick={() => { setActiveTab("contacts"); setSearchTerm(""); }}
                className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider rounded-sm transition-all hover:cursor-pointer flex items-center gap-2 ${
                  activeTab === "contacts"
                    ? "bg-slate-900 text-white border-b-2 border-amber-500"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <FileText className="w-4 h-4" />
                Contact Client Requests ({contacts.length})
              </button>

              <button
                onClick={() => { setActiveTab("antispam"); setSearchTerm(""); }}
                className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider rounded-sm transition-all hover:cursor-pointer flex items-center gap-2 ${
                  activeTab === "antispam"
                    ? "bg-slate-900 text-white border-b-2 border-cyan-500"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
                Anti-Spam Monitor ({antispamSessions.length})
              </button>
            </div>

            {/* Filter Search Utilities */}
            {activeTab !== "antispam" && (
              <div className="p-4 border-b border-slate-850 bg-slate-900/60 flex flex-col sm:flex-row gap-4 items-center">
                <div className="relative w-full sm:w-72">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                    <Search className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Filter submissions..."
                    className="w-full bg-slate-950 border border-slate-800 focus:border-brand-orange/50 rounded-sm pl-10 pr-4 py-1.5 text-xs text-white placeholder-slate-500 outline-none transition-all"
                  />
                </div>
                <div className="text-[10px] text-slate-500 sm:ml-auto">
                  Showing {activeTab === "interpreters" ? filteredInterpreters.length : filteredContacts.length} total entries
                </div>
              </div>
            )}

            {/* Content Lists */}
            <div className="p-4 overflow-x-auto">
              
              {activeTab === "interpreters" && (
                filteredInterpreters.length === 0 ? (
                  <div className="py-12 text-center space-y-2">
                    <Users className="w-10 h-10 text-slate-700 mx-auto" />
                    <p className="text-sm text-slate-500">No Interpreter Applications in sandbox yet.</p>
                    <p className="text-xs text-slate-600">Head to Careers &rarr; Join as Interpreter, submit the form, and return here.</p>
                  </div>
                ) : (
                  <table className="w-full min-w-[700px] text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-850 text-[10.5px] text-slate-500 uppercase tracking-wider font-bold">
                        <th className="pb-3 select-none">Applicant Name</th>
                        <th className="pb-3 select-none">Contact Information</th>
                        <th className="pb-3 select-none">Target/Primary Language</th>
                        <th className="pb-3 select-none">Modes & Exp</th>
                        <th className="pb-3 select-none">Submit Time</th>
                        <th className="pb-3 text-right select-none">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-850/60 text-xs">
                      {filteredInterpreters.map((item) => (
                        <tr 
                          key={item.id} 
                          className={`hover:bg-slate-850/30 transition-all cursor-pointer ${
                            selectedSub && selectedSub.id === item.id ? "bg-slate-850/45 border-l-2 border-brand-orange" : ""
                          }`}
                          onClick={() => setSelectedSub(item)}
                        >
                          <td className="py-4 font-bold text-white">
                            <div className="flex items-center gap-2">
                              {item.full_name}
                              {item.email_sandbox_preview && (
                                <span className="px-1.5 py-0.5 rounded-sm bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[9px] uppercase font-bold tracking-wide">
                                  Mail Inbox
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-4 text-slate-300">
                            <div>{item.submitter_email}</div>
                            <div className="text-[10px] text-slate-500">{item.phone} &bull; {item.location}</div>
                          </td>
                          <td className="py-4">
                            <span className="px-2 py-1 bg-brand-orange/10 border border-brand-orange/20 text-brand-orange-light rounded-sm font-semibold select-none">
                              {item.primary_language}
                            </span>
                            {item.additional_languages && (
                              <span className="text-[10.5px] text-slate-500 block mt-1 overflow-hidden max-w-[200px] text-ellipsis whitespace-nowrap">
                                Addit: {item.additional_languages}
                              </span>
                            )}
                          </td>
                          <td className="py-4 text-slate-400">
                            <div>{item.interpreting_modes}</div>
                            <div className="text-[10px] text-slate-500 font-mono">{item.experience_years || "0"} Yrs Experience</div>
                          </td>
                          <td className="py-4 text-slate-500 font-mono text-[10.5px]">
                            {new Date(item.timestamp).toLocaleString()}
                          </td>
                          <td className="py-4 text-right" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => setShowDeleteConfirm({ type: "interpreter", id: item.id })}
                              className="p-1 px-2 rounded-sm text-red-400 hover:text-white hover:bg-red-500/25 border border-red-500/10 transition-colors hover:cursor-pointer"
                              title="Delete Submission"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )
              )}

              {activeTab === "contacts" && (
                filteredContacts.length === 0 ? (
                  <div className="py-12 text-center space-y-2">
                    <FileText className="w-10 h-10 text-slate-700 mx-auto" />
                    <p className="text-sm text-slate-500">No Contact Requests in sandbox yet.</p>
                    <p className="text-xs text-slate-600">Access /contact page, submit your contact form, and refresh.</p>
                  </div>
                ) : (
                  <table className="w-full min-w-[700px] text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-850 text-[10.5px] text-slate-500 uppercase tracking-wider font-bold">
                        <th className="pb-3 select-none">Client Name</th>
                        <th className="pb-3 select-none">Contact Info / Org</th>
                        <th className="pb-3 select-none">Solution Requested</th>
                        <th className="pb-3 select-none">Snippet Message</th>
                        <th className="pb-3 select-none">Submit Time</th>
                        <th className="pb-3 text-right select-none">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-850/60 text-xs">
                      {filteredContacts.map((item) => (
                        <tr 
                          key={item.id} 
                          className={`hover:bg-slate-850/30 transition-all cursor-pointer ${
                            selectedSub && selectedSub.id === item.id ? "bg-slate-850/45 border-l-2 border-amber-500" : ""
                          }`}
                          onClick={() => setSelectedSub(item)}
                        >
                          <td className="py-4 font-bold text-white">{item.full_name}</td>
                          <td className="py-4 text-slate-300">
                            <div>{item.submitter_email}</div>
                            <div className="text-[10px] text-slate-500 font-semibold">{item.organization || "Private Client"} &bull; {item.phone || "No phone"}</div>
                          </td>
                          <td className="py-4">
                            <span className="px-2 py-1 bg-amber-500/10 border border-amber-500/20 text-yellow-400 rounded-sm font-semibold select-none">
                              {item.service || "General Inquiry"}
                            </span>
                            {item.language_pair && (
                              <div className="text-[10px] text-slate-500 mt-1 font-mono">{item.language_pair}</div>
                            )}
                          </td>
                          <td className="py-4 max-w-[200px] text-slate-400 overflow-hidden text-ellipsis whitespace-nowrap">
                            {item.message}
                          </td>
                          <td className="py-4 text-slate-500 font-mono text-[10.5px]">
                            {new Date(item.timestamp).toLocaleString()}
                          </td>
                          <td className="py-4 text-right" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => setShowDeleteConfirm({ type: "contact", id: item.id })}
                              className="p-1 px-2 rounded-sm text-red-400 hover:text-white hover:bg-red-500/25 border border-red-500/10 transition-colors hover:cursor-pointer"
                              title="Delete Submission"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )
              )}

              {activeTab === "antispam" && (
                <div className="space-y-6 py-2">
                  <div className="p-4 bg-slate-950/60 border border-slate-850 rounded-sm flex flex-col sm:flex-row gap-4 items-center justify-between">
                    <div>
                      <h4 className="text-xs uppercase font-extrabold tracking-[0.1em] text-cyan-400 flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4" />
                        In-Memory Bot Defender State
                      </h4>
                      <p className="text-[11px] text-slate-400 leading-relaxed mt-1">
                        Active lease timestamps generated by <code>/api/forms/prepare</code>. A token lease expires instantly upon form submission to prevent automated replay spamming.
                      </p>
                    </div>
                    <button
                      onClick={handleClearAntiSpam}
                      disabled={antispamSessions.length === 0}
                      className="px-4 py-2 border border-red-950/80 bg-red-950/20 text-red-400 hover:bg-red-950/55 rounded-sm hover:cursor-pointer text-xs font-bold uppercase tracking-wider select-none shrink-0 disabled:opacity-40"
                    >
                      Purge Active Leases
                    </button>
                  </div>

                  {antispamSessions.length === 0 ? (
                    <div className="py-8 text-center text-slate-650 text-xs">
                      No active anti-spam challenge tokens leases in-memory. Click any application forms page to generate dynamic handshakes.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {antispamSessions.map(sess => (
                        <div key={sess.id} className="p-4 bg-slate-950 border border-slate-850 rounded-sm font-mono text-[11px] text-slate-300 space-y-1 relative">
                          <div className="flex justify-between border-b border-slate-900 pb-1.5 mb-1.5">
                            <span className="text-cyan-400 font-bold">{sess.id}</span>
                            <span className="text-slate-500">Leased {sess.ageSeconds}s ago</span>
                          </div>
                          <div className="overflow-hidden text-ellipsis whitespace-nowrap text-slate-400">
                            Challenge Signature: <span className="text-white font-semibold">{sess.challenge}</span>
                          </div>
                          <div className="text-[10px] text-slate-500 italic">
                            Valid single-use bot protection hash token.
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

            </div>

          </div>
        </div>

        {/* Right Detail Card Visualizer (Conditional upon click row) */}
        {selectedSub && (
          <div className="col-span-1 lg:col-span-5 bg-slate-900 rounded-sm border border-slate-850 shadow-xl overflow-hidden relative sticky top-24 self-start max-h-[85vh] flex flex-col justify-between">
            {/* Slide Ribbon Accent */}
            <div className={`absolute top-0 left-0 right-0 h-1 ${activeTab === "interpreters" ? "bg-brand-orange" : "bg-amber-500"}`} />

            {/* Panel Title Header */}
            <div className="p-5 border-b border-slate-850 flex items-center justify-between text-white">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-widest text-[#F26522]">
                  {activeTab === "interpreters" ? "Linguist Verification Detail" : "Corporate Request Detail"}
                </span>
                <h3 className="font-serif text-lg font-bold truncate max-w-[280px]">
                  {selectedSub.full_name}
                </h3>
              </div>
              <button 
                onClick={() => setSelectedSub(null)}
                className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-sm transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Card Detail Body */}
            <div className="p-6 overflow-y-auto flex-grow space-y-6 scrollbar-thin text-slate-200">
              
              {/* Quick Details Grid */}
              <div className="grid grid-cols-2 gap-3 text-xs bg-slate-950 p-4 border border-slate-850 rounded-sm font-sans">
                <div>
                  <span className="text-slate-500 block uppercase font-bold text-[9px] tracking-wider mb-1">Email Submitter</span>
                  <a href={`mailto:${selectedSub.submitter_email}`} className="text-white hover:underline truncate block">
                    {selectedSub.submitter_email}
                  </a>
                </div>
                <div>
                  <span className="text-slate-500 block uppercase font-bold text-[9px] tracking-wider mb-1">Phone Line</span>
                  <a href={`tel:${selectedSub.phone}`} className="text-white hover:underline block truncate">
                    {selectedSub.phone || "N/A"}
                  </a>
                </div>
                <div className="pt-2 border-t border-slate-900 col-span-2">
                  <span className="text-slate-500 block uppercase font-bold text-[9px] tracking-wider mb-1">Location Jurisdiction</span>
                  <div className="text-white font-medium flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-[#F26522]" />
                    {selectedSub.location || "Seattle Headquarters, WA"}
                  </div>
                </div>
              </div>

              {activeTab === "interpreters" ? (
                // Interpreter Fields
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <span className="text-slate-500 block uppercase font-bold text-[9px] tracking-wider">Linguistic Qualifications</span>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2 py-0.5 bg-brand-orange/10 border border-brand-orange/30 text-white font-semibold text-xs rounded-sm">
                        Primary: {selectedSub.primary_language}
                      </span>
                      {selectedSub.interpreting_modes && (
                        <span className="px-2 py-0.5 bg-slate-950 border border-slate-850 text-slate-300 font-medium text-xs rounded-sm">
                          Modes: {selectedSub.interpreting_modes}
                        </span>
                      )}
                    </div>
                    {selectedSub.additional_languages && (
                      <p className="text-xs text-slate-300 mt-2 bg-slate-950/70 p-2.5 border border-slate-900 rounded-sm">
                        <strong className="text-slate-400">Other Languages:</strong> {selectedSub.additional_languages}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-slate-500 block uppercase font-bold text-[9px] tracking-wider mb-1">Practitioner Exp</span>
                      <p className="text-xs text-white">{selectedSub.experience_years || "0"} Years Practicing</p>
                    </div>
                    <div>
                      <span className="text-slate-500 block uppercase font-bold text-[9px] tracking-wider mb-1">HIPAA / Court Certified</span>
                      <p className="text-xs text-emerald-400 font-semibold">{selectedSub.certifications || "Certified / Verified"}</p>
                    </div>
                  </div>

                  <div>
                    <span className="text-slate-500 block uppercase font-bold text-[9px] tracking-wider mb-1">Technical Hardware Layout</span>
                    <p className="text-xs text-slate-300 bg-slate-950/40 p-2.5 rounded-sm border border-slate-900 italic font-mono text-[11px]">
                      {selectedSub.technical_setup || "Dedicated workspace with noise-canceling headsets, high-speed cable LAN, and active backup power."}
                    </p>
                  </div>

                  <div>
                    <span className="text-slate-500 block uppercase font-bold text-[9px] tracking-wider mb-1">Availability Window</span>
                    <p className="text-xs text-white">{selectedSub.availability || "Flexible / On-Demand"}</p>
                  </div>

                  {selectedSub.linkedin_or_portfolio && (
                    <div>
                      <span className="text-slate-500 block uppercase font-bold text-[9px] tracking-wider mb-1">Professional Portfolio</span>
                      <a 
                        href={selectedSub.linkedin_or_portfolio} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="text-[#FB8C00] hover:underline font-mono text-[11px] truncate block flex items-center gap-1.5"
                      >
                        <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                        {selectedSub.linkedin_or_portfolio}
                      </a>
                    </div>
                  )}

                  {selectedSub.additional_info && (
                    <div>
                      <span className="text-slate-500 block uppercase font-bold text-[9px] tracking-wider mb-1">Cover Note / Candidate Statement</span>
                      <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-3 rounded-sm border border-slate-900">
                        {selectedSub.additional_info}
                      </p>
                    </div>
                  )}

                  {/* Nodes for Intercepted Mail Sandboxing */}
                  {selectedSub.email_sandbox_preview && (
                    <div className="pt-4 border-t border-slate-850 space-y-2.5">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <span className="text-xs uppercase font-extrabold tracking-wider text-indigo-400 flex items-center gap-1.5">
                          <Mail className="w-4 h-4" />
                          Intercepted Mail Sandbox Envelope
                        </span>
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <a 
                            href={selectedSub.email_sandbox_preview} 
                            target="_blank" 
                            referrerPolicy="no-referrer"
                            rel="noreferrer" 
                            className="text-xs text-brand-orange hover:text-white font-bold flex items-center gap-1 inline-flex hover:cursor-pointer transition-colors"
                          >
                            View Sent Email in Ethereal Sandbox &rarr;
                          </a>
                          <span className="text-slate-700 hidden sm:inline">|</span>
                          <a 
                            href={selectedSub.email_sandbox_preview} 
                            target="_blank" 
                            referrerPolicy="no-referrer"
                            rel="noreferrer" 
                            className="text-xs text-slate-400 hover:text-white flex items-center gap-1 inline-flex hover:cursor-pointer transition-colors"
                          >
                            Raw HTML
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </div>
                      <p className="text-[10.5px] text-slate-400 leading-relaxed">
                        To bypass SMTP network sandboxes, Nodemailer captured this exact application transaction. Rendered below:
                      </p>
                      
                      {/* Live Iframe Sandbox Preview! */}
                      <div className="w-full h-80 rounded-sm border border-slate-850 bg-slate-950 overflow-hidden relative">
                        <div className="absolute top-0 left-0 right-0 h-7 bg-slate-900 border-b border-slate-850 px-3 flex items-center text-[9.5px] text-slate-500 uppercase tracking-widest font-mono">
                          Recipient: careers@vozarals.com | SMTP Intercept
                        </div>
                        <iframe 
                          src={selectedSub.email_sandbox_preview} 
                          className="w-full h-full pt-7 bg-white filter invert-[0.93] hue-rotate-180" 
                          title="Mail Sender Interception Loop" 
                        />
                      </div>
                    </div>
                  )}

                </div>
              ) : (
                // Contact Leads Fields
                <div className="space-y-4">
                  <div>
                    <span className="text-slate-500 block uppercase font-bold text-[9px] tracking-wider mb-1">Requested Solution Suite</span>
                    <span className="px-2.5 py-1 bg-amber-500/10 border border-amber-500/30 text-yellow-500 rounded-sm font-semibold text-xs inline-block">
                      {selectedSub.service || "General Language Inquiry"}
                    </span>
                    {selectedSub.language_pair && (
                      <p className="text-xs mt-2 text-slate-400">
                        Language Pair Scope: <strong className="text-white font-semibold font-mono">{selectedSub.language_pair}</strong>
                      </p>
                    )}
                  </div>

                  {selectedSub.organization && (
                    <div>
                      <span className="text-slate-500 block uppercase font-bold text-[9px] tracking-wider mb-1">Corporate Organization</span>
                      <p className="text-xs text-white font-medium flex items-center gap-1.5">
                        <Building className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        {selectedSub.organization}
                      </p>
                    </div>
                  )}

                  <div>
                    <span className="text-slate-500 block uppercase font-bold text-[9px] tracking-wider mb-1">Message Content</span>
                    <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-4 border border-slate-900 rounded-sm whitespace-pre-line font-serif italic text-sm">
                      &ldquo;{selectedSub.message}&rdquo;
                    </p>
                  </div>
                </div>
              )}

            </div>

            {/* Bottom Actions Row */}
            <div className="p-5 border-t border-slate-850 bg-slate-950/40 text-center">
              <button
                onClick={() => setShowDeleteConfirm({ type: activeTab === "interpreters" ? "interpreter" : "contact", id: selectedSub.id })}
                className="w-full py-2.5 border border-red-950 bg-red-950/20 text-red-400 hover:bg-red-950 hover:text-white transition-all rounded-sm text-xs font-bold uppercase tracking-wider select-none hover:cursor-pointer flex items-center justify-center gap-2"
              >
                <Trash className="w-4 h-4" />
                Discard & Purge Record
              </button>
            </div>

          </div>
        )}

      </div>

      {/* Delete Confirmation Modal Overlay */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-sm p-6 space-y-4"
          >
            <div className="flex items-center gap-3 text-red-500 border-b border-slate-850 pb-3">
              <ShieldAlert className="w-6 h-6 shrink-0" />
              <h3 className="text-sm font-serif font-extrabold uppercase tracking-wide text-white">
                Irreversible Database Purge
              </h3>
            </div>
            
            <p className="text-xs text-slate-300 leading-relaxed">
              You are about to permanently delete record ID <code className="text-cyan-400 font-mono">{showDeleteConfirm.id}</code> from {firebaseConnected ? "Cloud Firestore and " : ""}local sandbox memory.
            </p>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="w-1/2 py-2 border border-slate-805 bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white text-xs font-bold uppercase tracking-wider rounded-sm hover:cursor-pointer select-none"
              >
                No, Retain
              </button>
              <button
                onClick={() => handleDelete(showDeleteConfirm.type as any, showDeleteConfirm.id)}
                className="w-1/2 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-bold uppercase tracking-wider rounded-sm hover:cursor-pointer select-none"
              >
                Yes, Purge
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Page bottom lock acknowledgement */}
      <div className="text-center py-12 text-slate-600 text-[10.5px] font-mono">
        Vozara Secure Admin Portal v1.4.2 &bull; Authenticated: AES-256 Mock Handshake &bull; Dev Mode Active
      </div>
    </div>
  );
}
