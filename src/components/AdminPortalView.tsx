import React, { useState, useEffect, useRef } from "react";
import { SuiteToolsView } from "./SuiteToolsView";
import { AdminDashboard } from "./AdminDashboard";
import { CareersManager } from "./CareersManager";
import { motion, AnimatePresence } from "motion/react";
import { useNavigate } from "react-router-dom";
import { 
  getContactSubmissionsDirect, 
  getInterpreterSubmissionsDirect, 
  deleteSubmissionDirect,
  googleSignIn,
  logout as googleLogout,
  getAccessToken,
  db,
  handleFirestoreError,
  OperationType
} from "../firebase";
import { onSnapshot, collection, query, addDoc } from "firebase/firestore";
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
  ServerCrash,
  Sliders,
  Terminal,
  Send,
  Webhook,
  ArrowRight,
  Info,
  Calendar,
  Globe,
  Settings,
  Bell
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
  cv_name?: string;
  cv_size?: string;
  cv_base64?: string;
  timestamp: string;
  email_sandbox_preview?: string;
}

interface AntiSpamSession {
  id: string;
  ageSeconds: number;
  challenge: string;
}

interface AdminLog {
  id: string;
  timestamp: string;
  service: "SECURITY" | "DATABASE" | "INTEGRATION" | "AUTH" | "SYSTEM";
  level: "INFO" | "SUCCESS" | "WARN" | "CRITICAL";
  message: string;
}

export default function AdminPortalView() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [loginError, setLoginError] = useState<string>("");
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);

  // Core Submission and Bot leases state
  const [contacts, setContacts] = useState<ContactSubmission[]>([]);
  const [interpreters, setInterpreters] = useState<InterpreterSubmission[]>([]);
  const [antispamSessions, setAntispamSessions] = useState<AntiSpamSession[]>([]);
  const [uptime, setUptime] = useState<number>(0);
  const [firebaseConnected, setFirebaseConnected] = useState<boolean>(false);

  // Active UI Tabs
  const [activeTab, setActiveTab] = useState<"interpreters" | "contacts" | "antispam" | "integrations">("interpreters");
  const [searchTerm, setSearchTerm] = useState<string>("");

  // Active Admin Tool Selection
  const [activeTool, setActiveTool] = useState<"vozara_control" | "suitability_analyzer" | "log_auditor" | "compliance_signatures" | "rate_calculator" | "compliance_mailbox_portal" | "careers_manager">("vozara_control");

  // State for Candidate Suitability Analyzer
  const [selectedSuiteCandidateId, setSelectedSuiteCandidateId] = useState<string>("");
  const [suiteAdjustments, setSuiteAdjustments] = useState({
    certificationsBonus: 20,
    experienceBonus: 5,
    soundIsolationBonus: 15,
    speedBonus: 10
  });

  // State for Compliance Ledgers
  const [complianceRecords, setComplianceRecords] = useState<Record<string, {
    ndaSign: boolean;
    hipaaVerify: boolean;
    criminalPassed: boolean;
    slaSigned: boolean;
    w9Received: boolean;
  }>>({});

  // State for Rate Generator
  const [calcSource, setCalcSource] = useState<string>("English");
  const [calcTarget, setCalcTarget] = useState<string>("Spanish");
  const [calcMode, setCalcMode] = useState<string>("VRI");
  const [calcSector, setCalcSector] = useState<string>("medical");
  const [calcMinutes, setCalcMinutes] = useState<number>(60);
  const [calcWeekend, setCalcWeekend] = useState<boolean>(false);
  const [calcMargin, setCalcMargin] = useState<number>(30);
  const [selectedSub, setSelectedSub] = useState<any | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<{ type: string; id: string } | null>(null);
  const [sysMsg, setSysMsg] = useState<{ text: string; error?: boolean } | null>(null);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // ADVANCED FEATURE 1: Custom real-time logging state
  const [logs, setLogs] = useState<AdminLog[]>([
    {
      id: "log_init_01",
      timestamp: new Date(Date.now() - 600000).toLocaleTimeString(),
      service: "SYSTEM",
      level: "INFO",
      message: "Vozara Secure Sandbox Terminal v2.1.0 Online."
    },
    {
      id: "log_init_02",
      timestamp: new Date(Date.now() - 580000).toLocaleTimeString(),
      service: "SECURITY",
      level: "INFO",
      message: "Anti-spam Handshake protocol listening on port 3000."
    },
    {
      id: "log_init_03",
      timestamp: new Date(Date.now() - 550000).toLocaleTimeString(),
      service: "DATABASE",
      level: "WARN",
      message: "Firebase credentials checked. Preparing direct API channel fallback..."
    },
    {
      id: "log_init_04",
      timestamp: new Date(Date.now() - 530000).toLocaleTimeString(),
      service: "INTEGRATION",
      level: "SUCCESS",
      message: "Notification hook verified: Slack gateway simulator configured successfully."
    }
  ]);

  // ADVANCED FEATURE 2: Auto-Sync Logs State
  const [autoSync, setAutoSync] = useState<string>("off"); // "off", "10", "30", "60"
  const [syncCountdown, setSyncCountdown] = useState<number>(0);
  const [totalSyncsExecuted, setTotalSyncsExecuted] = useState<number>(0);

  // ADVANCED FEATURE 3: Custom Integrations Settings (persisted in LocalStorage)
  const [integrations, setIntegrations] = useState({
    slackEnabled: true,
    slackWebhook: "https://hooks.slack.com/services/T012345/B012345/vozara-leads-relay",
    candidateAlerts: true,
    clientAlerts: true,
    apiToken: "sk_live_vozara_9b8a3c7f92e5d164a82b",
    webhookSecret: "whsec_vozara_sign_2026_xyz"
  });

  const [slackTestModalOpen, setSlackTestModalOpen] = useState<boolean>(false);
  const [slackTestPayload, setSlackTestPayload] = useState<any | null>(null);
  const [simulatedWebhookSuccess, setSimulatedWebhookSuccess] = useState<boolean>(false);

  // Gmail REST API Connection State
  const [gmailToken, setGmailToken] = useState<string | null>(null);
  const [gmailUser, setGmailUser] = useState<{ email: string; name?: string; photo?: string } | null>(null);
  const [gmailLoading, setGmailLoading] = useState<boolean>(false);
  const [gmailInboxStats, setGmailInboxStats] = useState<{ totalThreads?: number; messageCount?: number; lastChecked?: string } | null>(null);
  const [gmailTemplate, setGmailTemplate] = useState<string>("welcome");
  const [gmailSubject, setGmailSubject] = useState<string>("");
  const [gmailBody, setGmailBody] = useState<string>("");
  const [gmailRecipient, setGmailRecipient] = useState<string>("");
  const [gmailSendStatus, setGmailSendStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [gmailSendResultMsg, setGmailSendResultMsg] = useState<string>("");

  // Ref for the logs terminal to always scroll to bottom
  const logsEndRef = useRef<HTMLDivElement>(null);

  // Save/Load integration configurations
  useEffect(() => {
    const saved = localStorage.getItem("vozara_sandbox_integrations");
    if (saved) {
      try {
        setIntegrations(JSON.parse(saved));
      } catch (err) {
        console.error("Error reading integration configs:", err);
      }
    }
  }, []);

  const saveIntegrations = (newConfigs: typeof integrations) => {
    setIntegrations(newConfigs);
    localStorage.setItem("vozara_sandbox_integrations", JSON.stringify(newConfigs));
    pushLog("INTEGRATION", "SUCCESS", "Integrations settings saved to persistent local store.");
    triggerSystemMessage("Integrations configuration updated successfully.");
  };

  // Helper to push logs locally
  const pushLog = (
    service: "SECURITY" | "DATABASE" | "INTEGRATION" | "AUTH" | "SYSTEM",
    level: "INFO" | "SUCCESS" | "WARN" | "CRITICAL",
    message: string
  ) => {
    const newLog: AdminLog = {
      id: "log_" + Math.random().toString(36).substring(2, 9) + "_" + Date.now(),
      timestamp: new Date().toLocaleTimeString(),
      service,
      level,
      message
    };
    setLogs(prev => [newLog, ...prev].slice(0, 80)); // Limit to last 80 logs
  };

  // Auto scroll logs container
  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs]);

  // Read credentials on mount
  useEffect(() => {
    const savedToken = sessionStorage.getItem("vozara_sandbox_admin_token");
    if (savedToken) {
      setIsAuthenticated(true);
      pushLog("AUTH", "SUCCESS", "Automatically authenticated session from persistent tokens.");
      fetchDashboardData();
    }
  }, []);

  // Sync selected sub email and details with composer template
  useEffect(() => {
    if (selectedSub) {
      setGmailRecipient(selectedSub.submitter_email || "");
      // Preset templates
      if (activeTab === "interpreters") {
        applyGmailTemplate("welcome", selectedSub.full_name, selectedSub);
      } else {
        applyGmailTemplate("custom", selectedSub.full_name, selectedSub);
      }
      setGmailSendStatus("idle");
    }
  }, [selectedSub, activeTab]);

  // Sync Timer hook (Auto-Sync Logs implementation)
  useEffect(() => {
    if (autoSync === "off") {
      setSyncCountdown(0);
      return;
    }

    const intervalVal = parseInt(autoSync, 10);
    if (isNaN(intervalVal)) return;

    setSyncCountdown(intervalVal);
    
    const countdownInterval = setInterval(() => {
      setSyncCountdown(prev => {
        if (prev <= 1) {
          // Perform the automatic sync
          fetchDashboardData(true);
          return intervalVal;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(countdownInterval);
  }, [autoSync]);

  // Flag to check if we loaded initial records to prevent log duplicate storms on start
  const isInitialInterpreterLoaded = useRef(false);
  const isInitialContactLoaded = useRef(false);

  // Real-time Firestore Subscriptions
  useEffect(() => {
    if (!isAuthenticated || !db) return;

    pushLog("SYSTEM", "INFO", "Initializing real-time portal telemetry bridges...");

    // 1. Listen for interpreter career applications in real-time
    const unscInterpreter = onSnapshot(collection(db, "interpreter_submissions"), (snapshot) => {
      const items: InterpreterSubmission[] = [];
      snapshot.forEach((snapDoc) => {
        items.push({ id: snapDoc.id, ...snapDoc.data() } as InterpreterSubmission);
      });
      // Sort by timestamp descending
      items.sort((a, b) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime());

      if (isInitialInterpreterLoaded.current) {
        snapshot.docChanges().forEach((change) => {
          if (change.type === "added") {
            const data = change.doc.data() as any;
            pushLog(
              "INTEGRATION",
              "SUCCESS",
              `[REAL-TIME MONITOR] Candidate application submitted: ${data.full_name || "Bilingual Candidate"} (${data.primary_language || "OPI/VRI Specialist"})`
            );
          } else if (change.type === "modified") {
            const data = change.doc.data() as any;
            pushLog(
              "DATABASE",
              "INFO",
              `[REAL-TIME MONITOR] Candidate portfolio updated: ${data.full_name || "Bilingual Candidate"}`
            );
          } else if (change.type === "removed") {
            pushLog(
              "DATABASE",
              "WARN",
              `[REAL-TIME MONITOR] Candidate application removed from database.`
            );
          }
        });
      } else {
        isInitialInterpreterLoaded.current = true;
      }

      setInterpreters(items);
      setFirebaseConnected(true);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, "interpreter_submissions");
    });

    // 2. Listen for client lead submissions in real-time
    const unscContact = onSnapshot(collection(db, "contact_submissions"), (snapshot) => {
      const items: ContactSubmission[] = [];
      snapshot.forEach((snapDoc) => {
        items.push({ id: snapDoc.id, ...snapDoc.data() } as ContactSubmission);
      });
      // Sort by timestamp descending
      items.sort((a, b) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime());

      if (isInitialContactLoaded.current) {
        snapshot.docChanges().forEach((change) => {
          if (change.type === "added") {
            const data = change.doc.data() as any;
            pushLog(
              "DATABASE",
              "SUCCESS",
              `[REAL-TIME MONITOR] Client lead request inbound: ${data.full_name || "Enterprise Partner"} (${data.organization || "Private Account"})`
            );
          } else if (change.type === "modified") {
            const data = change.doc.data() as any;
            pushLog(
              "DATABASE",
              "INFO",
              `[REAL-TIME MONITOR] Client inquiry dossier adjusted: ${data.full_name || "Enterprise Partner"}`
            );
          } else if (change.type === "removed") {
            pushLog(
              "DATABASE",
              "WARN",
              `[REAL-TIME MONITOR] Client inquiry removed from database.`
            );
          }
        });
      } else {
        isInitialContactLoaded.current = true;
      }

      setContacts(items);
      setFirebaseConnected(true);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, "contact_submissions");
    });

    return () => {
      unscInterpreter();
      unscContact();
      isInitialInterpreterLoaded.current = false;
      isInitialContactLoaded.current = false;
    };
  }, [isAuthenticated]);

  // Utility message trigger
  const triggerSystemMessage = (text: string, error = false) => {
    setSysMsg({ text, error });
    setTimeout(() => setSysMsg(null), 4000);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setLoginError("Please supply both credentials.");
      return;
    }
    setLoginError("");
    setIsLoggingIn(true);
    pushLog("AUTH", "INFO", `Logging in user: ${username}`);

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
            pushLog("AUTH", "CRITICAL", "Handshake rejected: credentials invalid.");
            setIsLoggingIn(false);
            return;
          }
        }
      } catch (fetchErr) {
        console.warn("Express server authentication offline, executing web client auth fallback.", fetchErr);
        pushLog("SYSTEM", "WARN", "Express server auth endpoint offline. Re-routing through local browser encryption.");
      }

      // Exact criteria match
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
          pushLog("AUTH", "CRITICAL", `Handshake mismatch for user profile ${username}`);
          setIsLoggingIn(false);
          return;
        }
      }

      if (success) {
        sessionStorage.setItem("vozara_sandbox_admin_token", token);
        setIsAuthenticated(true);
        pushLog("AUTH", "SUCCESS", `Access token granted dynamically to user: ${username}`);
        triggerSystemMessage("Operations terminal connection verified.");
        fetchDashboardData();
      }
    } catch (err) {
      setLoginError("Connection handshake timed out during login dispatch.");
      pushLog("AUTH", "CRITICAL", "TLS protocol timeout during operations login loop.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    pushLog("AUTH", "INFO", "Session revoked by administrator request. Purging state.");
    sessionStorage.removeItem("vozara_sandbox_admin_token");
    sessionStorage.removeItem("vozara_static_fallback");
    setIsAuthenticated(false);
    setSelectedSub(null);
  };

  const getAdminHeader = () => {
    const token = sessionStorage.getItem("vozara_sandbox_admin_token");
    return token ? { "Authorization": `Bearer ${token}` } : {};
  };

  const fetchDashboardData = async (isAutoSyncingCall = false) => {
    if (!isAutoSyncingCall) {
      setIsRefreshing(true);
      pushLog("DATABASE", "INFO", "Querying central repository statistics...");
    } else {
      pushLog("DATABASE", "INFO", "Background Auto-Sync: Commenced cron-trigger tables download.");
    }

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
              
              if (isAutoSyncingCall) {
                setTotalSyncsExecuted(prev => prev + 1);
                pushLog(
                  "DATABASE", 
                  "SUCCESS", 
                  `Background Auto-Sync #${totalSyncsExecuted + 1} completed. Retrieved ${valSubmissions.interpreters?.length || 0} candidates, ${valSubmissions.contacts?.length || 0} clients.`
                );
              } else {
                pushLog("DATABASE", "SUCCESS", `Fetched ${valSubmissions.interpreters?.length || 0} Interpreter applications & ${valSubmissions.contacts?.length || 0} Client leads.`);
              }
            }
          }
        } catch (e) {
          console.warn("Backend endpoints offline, routing client queries directly to Firestore database schema...", e);
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
          
          if (isAutoSyncingCall) {
            setTotalSyncsExecuted(prev => prev + 1);
            pushLog(
              "DATABASE",
              "SUCCESS",
              `Auto-Sync via Direct SDK #${totalSyncsExecuted + 1} finalized: Saved ${directInterpreters.length} recruits, ${directContacts.length} partner requests.`
            );
          } else {
            pushLog("DATABASE", "SUCCESS", `Direct Firestore connection loaded ${directInterpreters.length} applicants & ${directContacts.length} clients.`);
          }
        } catch (dbErr: any) {
          console.error("Direct Firestore read fallback failed:", dbErr);
          pushLog("DATABASE", "CRITICAL", `Direct Firestore lookup pool rejected: ${dbErr.message || dbErr}`);
          triggerSystemMessage("Database download blocked. Review active Firestore quotas.", true);
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
              pushLog("SECURITY", "INFO", `Cryptographic leases audited: ${valAntispam.activeSessions?.length || 0} active handshakes in memory.`);
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
      pushLog("SYSTEM", "CRITICAL", `Operations Hub communication timeout: ${err}`);
      triggerSystemMessage("Connection mapping timeout.", true);
    } finally {
      if (!isAutoSyncingCall) {
        setIsRefreshing(false);
      }
    }
  };

  const handleDelete = async (type: "contact" | "interpreter", id: string) => {
    pushLog("DATABASE", "WARN", `Commencing record prune pipeline for ID: ${id} (${type})`);
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
          console.warn("Express backend failed deleted request. Dropping to client direct connection...", e);
        }
      }

      if (!deletedDirectly) {
        await deleteSubmissionDirect(type, id);
      }

      pushLog("DATABASE", "SUCCESS", `Discard and purge verified for record ${id}. System ledger updated.`);
      triggerSystemMessage("Document removed and pruned cleanly from database.");
      
      if (type === "contact") {
        setContacts(prev => prev.filter(c => c.id !== id));
      } else {
        setInterpreters(prev => prev.filter(i => i.id !== id));
      }

      if (selectedSub && selectedSub.id === id) {
        setSelectedSub(null);
      }
    } catch (err: any) {
      pushLog("DATABASE", "CRITICAL", `Pruning workflow failure: ${err.message || err}`);
      triggerSystemMessage(`Pruning operation failed: ${err.message || err}`, true);
    } finally {
      setShowDeleteConfirm(null);
    }
  };

  const handleClearAntiSpam = async () => {
    pushLog("SECURITY", "WARN", "Cryptographic anti-spam lease flush manual override triggered.");
    try {
      const response = await fetch("/api/admin/clear-sessions", {
        method: "POST",
        headers: getAdminHeader()
      });
      if (response.ok) {
        setAntispamSessions([]);
        pushLog("SECURITY", "SUCCESS", "All active single-use bot challenge tokens flushed. Memory cleared.");
        triggerSystemMessage("Anti-bot session leases purged cleanly.");
      }
    } catch (err) {
      pushLog("SECURITY", "CRITICAL", "Could not submit session purge event.");
      triggerSystemMessage("Purge failed.", true);
    }
  };

  // ADVANCED FEATURE 4: Interactive Applicant Simulator
  const handleSimulateCandidate = () => {
    pushLog("DATABASE", "INFO", "Simulating inbound candidate application event...");
    
    const mockNames = ["Amara Okafor", "Kenji Takahashi", "Elena Rostova", "Mateo Silva", "Gabriela Dupont", "Sofia Al-Fayed"];
    const mockLanguages = ["Arabic (EN-AR)", "Spanish (EN-ES)", "Russian (EN-RU)", "Japanese (EN-JA)", "Igbo (EN-IG)", "Portuguese (EN-PT)"];
    const mockLocations = ["Houston, TX, USA", "Tokyo, Japan", "London, UK", "Rio de Janeiro, Brazil", "Paris, France", "Dubai, UAE"];
    const mockModes = ["Simultaneous, Consecutive", "Consecutive, VRI", "Over-the-Phone (OPI), VRI", "Conference Video, Liaison"];
    const mockExperiences = ["5", "8", "12", "15", "4", "20"];
    const mockNotes = [
      "Specializes in petrochemical medical safety and high-stakes courtroom legal translations.",
      "Certified judicial expert. Looking to support remote video medical consultations on demand.",
      "Dual national with military defense and corporate negotiation expertise. Fluent in 4 sub-dialects.",
      "Active high-speed fiber hardware with redundant power backups and studio soundproofing."
    ];

    const randomName = mockNames[Math.floor(Math.random() * mockNames.length)];
    const randomLang = mockLanguages[Math.floor(Math.random() * mockLanguages.length)];
    const randomLoc = mockLocations[Math.floor(Math.random() * mockLocations.length)];
    const randomMode = mockModes[Math.floor(Math.random() * mockModes.length)];
    const randomExp = mockExperiences[Math.floor(Math.random() * mockExperiences.length)];
    const randomNote = mockNotes[Math.floor(Math.random() * mockNotes.length)];
    const randomId = "sim_" + Math.random().toString(36).substring(2, 8);

    const simulatedCandidate: InterpreterSubmission = {
      id: randomId,
      full_name: randomName,
      submitter_email: randomName.toLowerCase().replace(" ", "") + "@gmail.com",
      phone: "+1 (555) " + Math.floor(100 + Math.random() * 900) + "-" + Math.floor(1000 + Math.random() * 9000),
      location: randomLoc,
      primary_language: randomLang,
      additional_languages: "French, German (Standard)",
      interpreting_modes: randomMode,
      industries: "Medical, Healthcare, Legal, Corporate Finance",
      experience_years: randomExp,
      certifications: "ATA Certified, HIPAA Verified, Joint Commission Compliant",
      medical_legal_knowledge: "Highly detailed. Previous 6 years serving county medical health networks.",
      technical_setup: "Acoustic isolated back-office booth, dynamic Rode mic, 300 Mbps download LAN line.",
      availability: "Full-Time (M-F 8 AM - 6 PM EST)",
      linkedin_or_portfolio: "https://linkedin.com/in/" + randomName.toLowerCase().replace(" ", "-"),
      additional_info: randomNote,
      cv_name: randomName.replace(" ", "_") + "_Resume.pdf",
      cv_size: `${Math.floor(110 + Math.random() * 140)} KB`,
      cv_base64: "data:application/pdf;base64,JVBERi0xLjQKJSDi48clCjEgMCBvYmoKPDwKL1R5cGUgL0NhdGFsb2cKL1BhZ2VzIDIgMCBSCj4+CmVuZG9iagoyIDAgb2JqCjw8Ci9UeXBlIC9QYWdlcwovS2lkcyBbMyAwIFJdCi9Db3VudCAxCj4+CmVuZG9iagozIDAgb2JqCjw8Ci9UeXBlIC9QYWdlCi9QYXJlbnQgMiAwIFIKL01lZGlhQm94IFswIDAgNTk1IDg0Ml0KL1Jlc291cmNlcyA8PAovRm9udCA8PAovRjEgNCAwIFIKPj4KPj4KL0NvbnRlbnRzIDUgMCBSCj4+CmVuZG9iago0IDAgb2JqCjw8Ci9UeXBlIC9Gb250Ci9TdWJ0eXBlIC9UeXBlMQovQmFzZUZvbnQgL0hlbHZldGljYQo+PgplbmRvYmoKNSAwIG9iago8PAovTGVuZ3RoIDY5Cj4+CnN0cmVhbQpCVAovRjEgMjQgVGYKOTAgNzAwIFRkCihWb3phcmEgTGFuZ3VhZ2UgU2VydmljZXMgLSBDYW5kaWRhdGUgUmVzdW1lKSBUagogRVQKZW5kc3RyZWFtCmVuZG9iagp4cmVmCjAgNgowMDAwMDAwMDAwIDY1NTM1IGYgCjAwMDAwMDAwMTggMDAwMDAgbiAKMDAwMDAwMDA2OSAwMDAwMCBuIAowMDAwMDAwMTI3IDAwMDAwIGYgCjAwMDAwMDAyNjEgMDAwMDAgbiAKMDAwMDAwMDMzOCAwMDAwMCBuIAp0cmFpbGVyCjw8Ci9TaXplIDYKL1Jvb3QgMSAwIFIKPj4Kc3RhcnR4cmVmCjQ1OAolJUVPRgo=",
      timestamp: new Date().toISOString()
    };

    const isStaticMode = sessionStorage.getItem("vozara_static_fallback") === "true";
    if (!isStaticMode && db) {
      const { id, ...persistedPayload } = simulatedCandidate;
      addDoc(collection(db, "interpreter_submissions"), persistedPayload)
        .then((docRef) => {
          pushLog("DATABASE", "SUCCESS", `Simulated Recruits Inbound: ${randomName} persisted to Cloud Firestore (${docRef.id}).`);
        })
        .catch((err) => {
          handleFirestoreError(err, OperationType.WRITE, "interpreter_submissions");
        });
    } else {
      setInterpreters(prev => [simulatedCandidate, ...prev]);
      pushLog("DATABASE", "SUCCESS", `Simulated Recruits Inbound: ${randomName} (${randomLang}) applied from ${randomLoc} (static cache).`);
    }
    
    // Trigger integration notification test
    if (integrations.slackEnabled) {
      pushLog("INTEGRATION", "INFO", `Slack Webhook Relay triggered for newly joined candidate: ${randomName}`);
    }

    triggerSystemMessage(`Demo Applicant simulated: ${randomName}`);
  };

  // Visual Slack webhook simulation trigger
  const triggerSlackTest = () => {
    if (interpreters.length === 0) {
      triggerSystemMessage("Simulate or load at least 1 candidate profile to generate the webhook payload.", true);
      return;
    }
    const sample = interpreters[0];
    setSlackTestPayload({
      text: `*New Vozara Linguist Application Received* :email:\n*Name:* ${sample.full_name}\n*Languages:* ${sample.primary_language}\n*Experience:* ${sample.experience_years} Years\n*Location:* ${sample.location}\n*Modes:* ${sample.interpreting_modes}`,
      attachments: [
        {
          color: "#F26522",
          fields: [
            { title: "Email", value: sample.submitter_email, short: true },
            { title: "Specs Verification", value: sample.certifications || "Pending Review", short: true }
          ]
        }
      ]
    });
    setSimulatedWebhookSuccess(false);
    setSlackTestModalOpen(true);
    pushLog("INTEGRATION", "INFO", "Generated Slack application-alert webhook block package.");
  };

  const dispatchSlackTestWebhook = () => {
    setSimulatedWebhookSuccess(true);
    pushLog("INTEGRATION", "SUCCESS", `Slack webhook successfully simulated on target URL: ${integrations.slackWebhook}`);
    setTimeout(() => {
      setSlackTestModalOpen(false);
      setSimulatedWebhookSuccess(false);
    }, 2500);
  };

  // Google Workspaces Gmail REST API Integration Helpers
  const handleConnectGmail = async () => {
    setGmailLoading(true);
    try {
      pushLog("AUTH", "INFO", "Initiating modern Workspace OAuth consent handshake for Gmail gateway...");
      const result = await googleSignIn();
      if (result) {
        setGmailToken(result.accessToken);
        setGmailUser({
          email: result.user.email || "unknown@gmail.com",
          name: result.user.displayName || undefined,
          photo: result.user.photoURL || undefined
        });
        pushLog("AUTH", "SUCCESS", `Gmail REST API gateway established for admin: ${result.user.email}`);
        
        // Fetch diagnostic stats
        await fetchGmailDiagStats(result.accessToken);
        triggerSystemMessage("Google Gmail workspace synced.");
      }
    } catch (err: any) {
      pushLog("AUTH", "CRITICAL", `OAuth handshakes failed: ${err.message || err}`);
      triggerSystemMessage("Gmail OAuth request declined.", true);
    } finally {
      setGmailLoading(false);
    }
  };

  const handleDisconnectGmail = async () => {
    setGmailLoading(true);
    try {
      await googleLogout();
      setGmailToken(null);
      setGmailUser(null);
      setGmailInboxStats(null);
      pushLog("AUTH", "WARN", "Gmail dispatch gateway disconnected.");
      triggerSystemMessage("Google services decoupled.");
    } catch (err: any) {
      console.error("Disconnect error:", err);
    } finally {
      setGmailLoading(false);
    }
  };

  const fetchGmailDiagStats = async (token: string) => {
    try {
      const res = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/profile", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const profile = await res.json();
        setGmailInboxStats({
          messageCount: profile.messagesTotal,
          totalThreads: profile.threadsTotal,
          lastChecked: new Date().toLocaleTimeString()
        });
        pushLog("INTEGRATION", "SUCCESS", `Retrieved Gmail Diagnostics. Inbox message count: ${profile.messagesTotal}`);
      } else {
        const errorText = await res.text();
        console.warn("Gmail Stats failed:", errorText);
      }
    } catch (err) {
      console.error("Error fetching diagnostics profile:", err);
    }
  };

  const applyGmailTemplate = (templateName: string, candidateName: string, details?: any) => {
    setGmailTemplate(templateName);
    const firstName = candidateName.split(" ")[0] || "there";
    
    if (templateName === "welcome") {
      setGmailSubject(`Vozara Interpreter Onboarding: Next Steps for ${firstName}`);
      setGmailBody(`
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; padding: 24px; color: #1e293b; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; background-color: #ffffff;">
  <div style="text-align: center; margin-bottom: 24px;">
    <span style="font-size: 24px; font-weight: bold; color: #1B2A6B; letter-spacing: 1px;">VOZARA</span>
    <span style="font-size: 24px; font-weight: bold; color: #F26522; letter-spacing: 1px;">LINGUISTICS</span>
  </div>
  <p style="font-size: 15px; line-height: 1.6; color: #334155;">Dear <strong>${candidateName}</strong>,</p>
  <p style="font-size: 15px; line-height: 1.6; color: #334155;">Thank you for your application to join our specialist interpreter panel. We have reviewed your qualifications and experienced background in <strong>${details?.primary_language || "Specialist Languages"}</strong>.</p>
  <p style="font-size: 15px; line-height: 1.6; color: #334155;">We would love to onboard you to our active dispatch queue! The next step is a quick software orientation and hardware isolation test. Please let us know your general availability for this week.</p>
  <div style="background-color: #f8fafc; padding: 16px; border-left: 4px solid #F26522; margin: 20px 0; border-radius: 4px;">
    <h4 style="margin: 0 0 8px 0; font-size: 13px; text-transform: uppercase; color: #1B2A6B; letter-spacing: 0.5px; font-weight: bold;">Onboarding Checkup Scope</h4>
    <p style="margin: 0; font-size: 13px; color: #475569; line-height: 1.5;">Active noise block level check, audio isolation verification (-15dB target isolation), HIPAA compliance walkthrough, and custom software client configuration.</p>
  </div>
  <p style="font-size: 15px; line-height: 1.6; color: #334155;">We look forward to translating bridges of trust together!</p>
  <hr style="border: 0; border-top: 1px solid #edf2f7; margin: 24px 0;" />
  <p style="font-size: 11px; color: #94a3b8; text-align: center;">Vozara Language Services LLC &bull; 500 Corporate Circle &bull; On-Demand Recruiting</p>
</div>
      `.trim());
    } else if (templateName === "interview") {
      setGmailSubject(`Interview Invitation: Vozara Professional Panel for ${firstName}`);
      setGmailBody(`
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; padding: 24px; color: #1e293b; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; background-color: #ffffff;">
  <div style="text-align: center; margin-bottom: 24px;">
    <h2 style="margin: 0; color: #1B2A6B; font-weight: 800; font-size: 20px; letter-spacing: 0.5px;">VOZARA AUDITION BOARD</h2>
  </div>
  <p style="font-size: 15px; line-height: 1.6; color: #334155;">Hello <strong>${candidateName}</strong>,</p>
  <p style="font-size: 15px; line-height: 1.6; color: #334155;">Your impressive credentials demonstrate excellent capacity for consecutive and simultaneous translation services for <strong>${details?.primary_language || "Specialist Languages"}</strong>.</p>
  <p style="font-size: 15px; line-height: 1.6; color: #334155;">We would like to invite you for a <strong>30-minute technical evaluation</strong> conducted via Zoom secure video conferencing. We will test consecutive and remote simultaneous software drills.</p>
  <p style="font-size: 15px; line-height: 1.6; text-align: center; margin: 28px 0;">
    <a href="https://calendly.com/vozara-sandbox" style="background-color: #1B2A6B; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; font-size: 14px; display: inline-block; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">Select Interview Time Spot</a>
  </p>
  <p style="font-size: 15px; line-height: 1.6; color: #334155;">Please bring your professional credentials list and photographic ID. Thank you!</p>
  <hr style="border: 0; border-top: 1px solid #edf2f7; margin: 24px 0;" />
  <p style="font-size: 11px; color: #94a3b8; text-align: center;">Best regards,<br/>The Vozara Recruiting Panel</p>
</div>
      `.trim());
    } else if (templateName === "documentation") {
      setGmailSubject(`Vozara Application Status: Pending Proof of Certifications`);
      setGmailBody(`
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; padding: 24px; color: #1e293b; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; background-color: #ffffff;">
  <p style="font-size: 15px; line-height: 1.6; color: #334155;">Hello <strong>${candidateName}</strong>,</p>
  <p style="font-size: 15px; line-height: 1.6; color: #334155;">Thank you for submitting your application to Vozara Language Services. We are excited about your credentials!</p>
  <p style="font-size: 15px; line-height: 1.6; color: #334155;">During our assessment we noticed the certification field needs supportive documentation. Could you please reply directly to this mail with copy scans or certificates for your registered credentials or background compliance checks?</p>
  <p style="font-size: 15px; line-height: 1.6; color: #334155;">Once received, our compliance team will complete your validation in our active credentials registry.</p>
  <p style="font-size: 14px; color: #475569; margin-top: 24px;">Best regards,<br/>Vozara Credentials Verification Hub</p>
</div>
      `.trim());
    } else {
      setGmailSubject("");
      setGmailBody(`
<div style="font-family: Arial, sans-serif; padding: 20px; line-height: 1.6; color: #333333;">
  <p>Dear ${candidateName},</p>
  <p>[Write your custom message here]</p>
  <p>Best regards,<br/>Vozara Admin Panel</p>
</div>
      `.trim());
    }
  };

  const sendComposeGmail = async () => {
    if (!gmailToken) {
      triggerSystemMessage("Please connect your Gmail account first.", true);
      return;
    }
    if (!gmailRecipient) {
      triggerSystemMessage("Please provide a recipient email.", true);
      return;
    }
    if (!gmailSubject) {
      triggerSystemMessage("Please enter a subject line.", true);
      return;
    }
    if (!gmailBody) {
      triggerSystemMessage("Please write some message body.", true);
      return;
    }

    setGmailSendStatus("sending");
    setGmailSendResultMsg("");
    
    try {
      pushLog("INTEGRATION", "INFO", `Generating MIME envelope to dispatch email to: ${gmailRecipient}...`);
      
      const utf8Subject = `=?utf-8?B?${btoa(unescape(encodeURIComponent(gmailSubject)))}?=`;
      const emailLines = [
        `To: ${gmailRecipient}`,
        `Subject: ${utf8Subject}`,
        'Content-Type: text/html; charset=utf-8',
        'MIME-Version: 1.0',
        '',
        gmailBody
      ];
      const email = emailLines.join('\r\n');
      
      // Base64URL encode
      const base64 = btoa(unescape(encodeURIComponent(email)));
      const rawPayload = base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

      const res = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${gmailToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ raw: rawPayload })
      });

      if (res.ok) {
        const responseData = await res.json();
        setGmailSendStatus("success");
        setGmailSendResultMsg(`Message successfully dispatched! ID: ${responseData.id}`);
        pushLog("INTEGRATION", "SUCCESS", `Email successfully sent via Gmail API to candidate/contact: ${gmailRecipient}. Message ID: ${responseData.id}`);
        triggerSystemMessage("Gmail successfully sent.");
        
        // Refresh diagnostics statistics
        fetchGmailDiagStats(gmailToken);
      } else {
        const errorData = await res.json();
        setGmailSendStatus("error");
        setGmailSendResultMsg(`Gmail API error: ${errorData.error?.message || JSON.stringify(errorData)}`);
        pushLog("INTEGRATION", "WARN", `Gmail dispatch failed: ${errorData.error?.message || "Unknown API response"}`);
      }
    } catch (err: any) {
      setGmailSendStatus("error");
      setGmailSendResultMsg(`SMTP local fallback error: ${err.message || err}`);
      pushLog("INTEGRATION", "CRITICAL", `Failed to compile or submit MIME package: ${err.message || err}`);
    }
  };

  // Searching tables
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

  // RENDER LOGIN VIEW: Professional, clean, matches the main website theme
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#FAFAFB] text-gray-800 flex items-center justify-center p-4 relative font-sans">
        {/* Absolute Background Polka Grid */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[radial-gradient(#1B2A6B_1px,transparent_1px)] [background-size:20px_20px]" />
        
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-lg bg-white border border-gray-200/80 rounded-lg p-10 shadow-xl relative overflow-hidden"
          id="admin-login-window"
        >
          {/* Top Decorative Banner */}
          <div className="absolute top-0 left-0 right-0 h-2 bg-[#1B2A6B]" />
          <div className="absolute top-2 left-0 right-0 h-1 bg-[#F26522]" />

          <div className="text-center space-y-4 mb-8 pt-4">
            <div className="mx-auto w-16 h-16 bg-[#1B2A6B]/5 border border-[#1B2A6B]/10 rounded-full flex items-center justify-center text-[#1B2A6B]">
              <Lock className="w-6 h-6 text-[#1B2A6B]" />
            </div>
            <h1 className="font-serif text-3xl font-black text-[#1B2A6B] tracking-tight uppercase">
              VOZARA
            </h1>
            <p className="text-sm font-serif italic text-[#F26522] font-semibold tracking-wider">
              System Operations Control Terminal
            </p>
            <div className="h-px bg-gray-200 w-24 mx-auto" />
            <p className="text-xs text-gray-500 max-w-xs mx-auto leading-relaxed">
              Secure sandbox login environment. Dual credential handshake requested to monitor candidate submissions and active bot-defender leases.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label htmlFor="admin_username" className="block text-[11px] font-bold uppercase tracking-widest text-[#1B2A6B] mb-2 font-mono">
                Admin Username or Email
              </label>
              <input 
                id="admin_username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 focus:border-[#1B2A6B] focus:ring-2 focus:ring-[#1B2A6B]/15 rounded-md px-4 py-3.5 text-sm text-gray-900 placeholder-gray-400 outline-none transition-all font-mono"
                placeholder="admin@vozarals.com"
                required
              />
            </div>

            <div>
              <label htmlFor="admin_password" className="block text-[11px] font-bold uppercase tracking-widest text-[#1B2A6B] mb-2 font-mono">
                Access Token / Password
              </label>
              <input 
                id="admin_password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 focus:border-[#1B2A6B] focus:ring-2 focus:ring-[#1B2A6B]/15 rounded-md px-4 py-3.5 text-sm text-gray-900 placeholder-gray-400 outline-none transition-all font-mono"
                placeholder="••••••••••••••"
                required
              />
            </div>

            {loginError && (
              <div className="p-4 bg-red-50 border border-red-200/80 rounded-md flex items-start gap-3">
                <ShieldAlert className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
                <span className="text-xs text-red-700 font-medium leading-relaxed">{loginError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full bg-[#1B2A6B] hover:bg-[#283D90] text-white font-bold tracking-widest uppercase py-4 rounded-md text-xs transition-colors hover:cursor-pointer disabled:opacity-50 select-none flex items-center justify-center gap-2.5 shadow-md hover:shadow-lg"
            >
              {isLoggingIn ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Establishing Secure Handshake...
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4 text-[#F26522]" />
                  Enter Control Workspace
                </>
              )}
            </button>
          </form>


        </motion.div>
      </div>
    );
  }

  // RENDER AUTHENTICATED WORKSPACE: Clean, beautiful, matching the company main theme
  return (
    <div className="min-h-screen bg-[#FAFAFB] text-gray-800 flex flex-col font-sans">
      
      {/* Top Professional Admin Bar */}
      <header className="bg-[#1B2A6B] text-white relative shadow-md">
        {/* Subtle orange line trim */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#F26522]" />
        
        <div className="max-w-7xl mx-auto px-6 py-5 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-[#F26522] p-2.5 rounded-md text-white font-black shadow-inner">
              <Sliders className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-serif text-2xl font-bold tracking-tight text-white uppercase">
                  VOZARA CONTROL
                </h1>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[9.5px] tracking-widest font-mono uppercase font-bold flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
                  Live Sync
                </span>
              </div>
              <p className="text-[11.5px] text-gray-300 font-serif italic">
                Advanced Operations Terminal for Linguistic Verification & Systems Audits
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Auto-Sync Quick Selector Drawer */}
            <div className="bg-[#0D163D] border border-white/10 rounded-md p-1.5 px-3 flex items-center gap-2">
              <span className="text-[10px] text-gray-400 uppercase font-mono tracking-wider flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#F26522]" /> Auto-Sync Logs:
              </span>
              <select
                id="auto-sync-logs-select"
                value={autoSync}
                onChange={(e) => {
                  setAutoSync(e.target.value);
                  pushLog("SYSTEM", "INFO", `Auto-Sync logs interval configured to: ${e.target.value === "off" ? "Disabled" : e.target.value + " seconds"}`);
                }}
                className="bg-[#1B2A6B] text-white py-1 px-2 rounded border border-white/10 text-xs font-mono font-bold focus:outline-none cursor-pointer"
              >
                <option value="off">Off</option>
                <option value="10">Every 10s</option>
                <option value="30">Every 30s</option>
                <option value="60">Every 60s</option>
              </select>
            </div>

            <button
              onClick={() => fetchDashboardData(false)}
              disabled={isRefreshing}
              className="p-2 px-3 text-white hover:text-[#1B2A6B] bg-[#1B2A6B] hover:bg-white rounded-md transition-all border border-white/20 flex items-center gap-1.5 text-xs uppercase font-bold tracking-wider hover:cursor-pointer disabled:opacity-50 inline-flex shadow-sm"
              title="Force manual database synchronize"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
              Sync Hub
            </button>

            <button
              onClick={handleLogout}
              className="p-2 px-3 text-red-200 hover:text-white bg-red-950/40 hover:bg-red-700/80 rounded-md transition-all border border-red-900/30 flex items-center gap-1.5 text-xs uppercase font-bold tracking-wider hover:cursor-pointer shadow-sm"
            >
              <LogOut className="w-3.5 h-3.5" />
              Lock Portal
            </button>
          </div>
        </div>
      </header>

      {/* Main Container Wrapper */}
      <main className="flex-grow max-w-[1550px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Dynamic Broadcast Info message */}
        {sysMsg && (
          <div className={`p-4 rounded-md border shadow-md ${
            sysMsg.error 
              ? "bg-red-50 border-red-200 text-red-800" 
              : "bg-emerald-50 border-emerald-200 text-emerald-800"
          } text-xs flex items-center justify-between`}>
          <div className="flex items-center gap-3">
            {sysMsg.error ? (
              <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
            ) : (
              <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
            )}
            <span className="font-semibold">{sysMsg.text}</span>
          </div>
          <button onClick={() => setSysMsg(null)} className="hover:opacity-80 text-gray-500 cursor-pointer p-1">
            <X className="w-4 h-4" />
          </button>
        </div>
        )}

        {/* Operations Suite Grid System */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Operations Tools Sidebar */}
          <div className="lg:col-span-3 space-y-4">
            <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm space-y-4 relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-[#1B2A6B]" />
              <div className="space-y-1">
                <h3 className="font-serif font-black text-[#1B2A6B] text-sm uppercase tracking-wider">Operations Suite</h3>
                <p className="text-[10.5px] text-gray-400">Select active sandbox utility from systems control.</p>
              </div>

              <div className="space-y-2 mt-4 text-xs font-sans">
                {/* TOOL 1: VOZARA CONTROL */}
                <button
                  type="button"
                  id="tool-select-vozara"
                  onClick={() => {
                    setActiveTool("vozara_control");
                    pushLog("SYSTEM", "INFO", "Switched active tool context to VOZARA CONTROL Submissions");
                  }}
                  className={`w-full text-left p-3.5 rounded-lg border transition-all duration-200 cursor-pointer flex items-start gap-3 ${
                    activeTool === "vozara_control"
                      ? "bg-[#1B2A6B]/5 border-[#1B2A6B] text-[#1B2A6B] font-bold shadow-sm"
                      : "bg-white hover:bg-gray-50 border-gray-200 text-gray-600"
                  }`}
                >
                  <Database className={`w-5 h-5 mt-0.5 shrink-0 ${activeTool === "vozara_control" ? "text-[#F26522]" : "text-gray-400"}`} />
                  <div className="min-w-0 flex-1">
                    <div className="font-serif text-sm font-semibold flex items-center justify-between">
                      <span>VOZARA CONTROL</span>
                      <span className="px-1.5 py-0.2 rounded bg-[#F26522] text-white text-[8px] uppercase tracking-widest font-mono font-bold">CORE</span>
                    </div>
                    <p className="text-[10px] text-gray-450 leading-normal mt-0.5 font-normal">Manage candidates, clients, and sync logs.</p>
                  </div>
                </button>

                {/* TOOL 2: SUITABILITY ANALYZER (HIDDEN)
                <button
                  type="button"
                  id="tool-select-suitability"
                  onClick={() => {
                    setActiveTool("suitability_analyzer");
                    pushLog("SYSTEM", "INFO", "Switched active tool context to LINGUIST SUITABILITY & MATCH ENGINE");
                  }}
                  className={`w-full text-left p-3.5 rounded-lg border transition-all duration-200 cursor-pointer flex items-start gap-3 ${
                    activeTool === "suitability_analyzer"
                      ? "bg-[#1B2A6B]/5 border-[#1B2A6B] text-[#1B2A6B] font-bold shadow-sm"
                      : "bg-white hover:bg-gray-50 border-gray-200 text-gray-600"
                  }`}
                >
                  <Sliders className={`w-5 h-5 mt-0.5 shrink-0 ${activeTool === "suitability_analyzer" ? "text-[#F26522]" : "text-gray-400"}`} />
                  <div className="min-w-0 flex-1">
                    <div className="font-serif text-sm font-semibold">Linguist Suitability &amp; Match Engine</div>
                    <p className="text-[10px] text-gray-450 leading-normal mt-0.5 font-normal">Review ATS score index and rank qualifications in real-time.</p>
                  </div>
                </button>
                */}

                {/* TOOL 3: REAL-TIME LOGSTREAM (HIDDEN)
                <button
                  type="button"
                  id="tool-select-logs"
                  onClick={() => {
                    setActiveTool("log_auditor");
                    pushLog("SYSTEM", "INFO", "Switched active tool context to OPERATIONS TELEMETER LOGGING SYSTEM");
                  }}
                  className={`w-full text-left p-3.5 rounded-lg border transition-all duration-205 cursor-pointer flex items-start gap-3 ${
                    activeTool === "log_auditor"
                      ? "bg-[#1B2A6B]/5 border-[#1B2A6B] text-[#1B2A6B] font-bold shadow-sm"
                      : "bg-white hover:bg-gray-50 border-gray-200 text-gray-600"
                  }`}
                >
                  <Terminal className={`w-5 h-5 mt-0.5 shrink-0 ${activeTool === "log_auditor" ? "text-[#F26522]" : "text-gray-400"}`} />
                  <div className="min-w-0 flex-1">
                    <div className="font-serif text-sm font-semibold">Operations Telemeter Logging System</div>
                    <p className="text-[10px] text-gray-450 leading-normal mt-0.5 font-normal">Monitor server signals, memory logs, and sync channels.</p>
                  </div>
                </button>
                */}

                {/* TOOL 4: COMPLIANCE LEDGERS */}
                <button
                  type="button"
                  id="tool-select-compliance"
                  onClick={() => {
                    setActiveTool("compliance_signatures");
                    pushLog("SYSTEM", "INFO", "Switched active tool context to COMPLIANCE & LEGAL LEDGERS");
                  }}
                  className={`w-full text-left p-3.5 rounded-lg border transition-all duration-210 cursor-pointer flex items-start gap-3 ${
                    activeTool === "compliance_signatures"
                      ? "bg-[#1B2A6B]/5 border-[#1B2A6B] text-[#1B2A6B] font-bold shadow-sm"
                      : "bg-white hover:bg-gray-50 border-gray-200 text-gray-600"
                  }`}
                >
                  <ShieldCheck className={`w-5 h-5 mt-0.5 shrink-0 ${activeTool === "compliance_signatures" ? "text-[#F26522]" : "text-gray-400"}`} />
                  <div className="min-w-0 flex-1">
                    <div className="font-serif text-sm font-semibold font-bold">Compliance Checklist</div>
                    <p className="text-[10px] text-gray-450 leading-normal mt-0.5 font-normal">Audit NDAs, background checks, and certifications.</p>
                  </div>
                </button>

                {/* TOOL 5: RATE MATRIX CALC (HIDDEN)
                <button
                  type="button"
                  id="tool-select-ratecalc"
                  onClick={() => {
                    setActiveTool("rate_calculator");
                    pushLog("SYSTEM", "INFO", "Switched active tool context to REMOTE RATE MATRIX & BID CALCULATOR");
                  }}
                  className={`w-full text-left p-3.5 rounded-lg border transition-all duration-215 cursor-pointer flex items-start gap-3 ${
                    activeTool === "rate_calculator"
                      ? "bg-[#1B2A6B]/5 border-[#1B2A6B] text-[#1B2A6B] font-bold shadow-sm"
                      : "bg-white hover:bg-gray-50 border-gray-200 text-gray-600"
                  }`}
                >
                  <Sliders className={`w-5 h-5 mt-0.5 shrink-0 rotate-90 ${activeTool === "rate_calculator" ? "text-[#F26522]" : "text-gray-400"}`} />
                  <div className="min-w-0 flex-1">
                    <div className="font-serif text-sm font-semibold">Remote Rate Matrix &amp; Bid Calculator</div>
                    <p className="text-[10px] text-gray-450 leading-normal mt-0.5 font-normal">Estimate enterprise quotes and payout split scenarios dynamically.</p>
                  </div>
                </button>
                */}

                {/* TOOL 6: VOZARALS COMPLIANCE & MAILBOX HUB PORTAL */}
                <button
                  type="button"
                  id="tool-select-mailboxportal"
                  onClick={() => {
                    setActiveTool("compliance_mailbox_portal");
                    pushLog("SYSTEM", "INFO", "Switched active tool context to VOZARALS COMPLIANCE & MAILBOX HUB PORTAL");
                  }}
                  className={`w-full text-left p-3.5 rounded-lg border transition-all duration-220 cursor-pointer flex items-start gap-3 ${
                    activeTool === "compliance_mailbox_portal"
                      ? "bg-[#1B2A6B]/5 border-[#1B2A6B] text-[#1B2A6B] font-bold shadow-sm"
                      : "bg-white hover:bg-gray-50 border-gray-200 text-gray-600"
                  }`}
                >
                  <Mail className={`w-5 h-5 mt-0.5 shrink-0 ${activeTool === "compliance_mailbox_portal" ? "text-[#F26522]" : "text-gray-400"}`} />
                  <div className="min-w-0 flex-1">
                    <div className="font-serif text-sm font-bold font-semibold text-[#1B2A6B]">Compliance &amp; Mailbox Hub</div>
                    <p className="text-[10px] text-gray-450 leading-normal mt-0.5 font-normal">Regulatory on boarding directory, One.com email gateway, and audits.</p>
                  </div>
                </button>

                {/* TOOL 7: CAREERS MANAGER */}
                <button
                  type="button"
                  id="tool-select-careersmanager"
                  onClick={() => {
                    setActiveTool("careers_manager");
                    pushLog("SYSTEM", "INFO", "Switched active tool context to CAREERS & OPEN CONTRACTOR ROLES MANAGER");
                  }}
                  className={`w-full text-left p-3.5 rounded-lg border transition-all duration-225 cursor-pointer flex items-start gap-3 ${
                    activeTool === "careers_manager"
                      ? "bg-[#1B2A6B]/5 border-[#1B2A6B] text-[#1B2A6B] font-bold shadow-sm"
                      : "bg-white hover:bg-gray-50 border-gray-200 text-gray-600"
                  }`}
                >
                  <Briefcase className={`w-5 h-5 mt-0.5 shrink-0 ${activeTool === "careers_manager" ? "text-[#F26522]" : "text-gray-400"}`} />
                  <div className="min-w-0 flex-1">
                    <div className="font-serif text-sm font-bold font-semibold text-[#1B2A6B]">Careers &amp; Contractor Roles</div>
                    <p className="text-[10px] text-gray-450 leading-normal mt-0.5 font-normal">Publish open freelance positions, configure requirements and manual pages.</p>
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* RIGHT SIDE ACTIVE OPERATIONS AREA (9 columns) */}
          <div className="lg:col-span-9 space-y-8">
            {activeTool === "compliance_mailbox_portal" ? (
              <AdminDashboard
                interpreters={interpreters}
                contacts={contacts}
                logs={logs}
                pushLog={pushLog}
                triggerSystemMessage={triggerSystemMessage}
              />
            ) : activeTool === "careers_manager" ? (
              <CareersManager
                pushLog={pushLog}
                triggerSystemMessage={triggerSystemMessage}
              />
            ) : activeTool !== "vozara_control" ? (
              <SuiteToolsView
                interpreters={interpreters}
                contacts={contacts}
                antispamSessions={antispamSessions}
                activeTool={activeTool as any}
                logs={logs}
                pushLog={pushLog}
                triggerSystemMessage={triggerSystemMessage}
                setLogs={setLogs}
                handleSimulateCandidate={handleSimulateCandidate}
              />
            ) : (
              <div className="space-y-8">
                {/* Stats Grid Dashboard */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6" id="stats-ribbon-grid">
          
                  <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm relative overflow-hidden flex flex-col justify-between h-32 hover:shadow-md transition-all">
                    <div className="absolute top-0 left-0 right-0 h-1 bg-[#1B2A6B]" />
                    <div className="flex justify-between items-start">
                      <span className="text-[10.5px] uppercase tracking-widest text-[#1B2A6B] font-extrabold font-mono">Candidate Pool</span>
                      <Users className="w-5 h-5 text-[#F26522]" />
                    </div>
                    <div>
                      <div className="text-3xl font-serif font-bold text-[#1B2A6B] tracking-tight">{interpreters.length}</div>
                      <p className="text-[10.5px] text-gray-500 font-sans flex items-center gap-1 inline-flex mt-1">
                        Active Linguist Profiles Undergoing Review
                      </p>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm relative overflow-hidden flex flex-col justify-between h-32 hover:shadow-md transition-all">
                    <div className="absolute top-0 left-0 right-0 h-1 bg-[#1B2A6B]" />
                    <div className="flex justify-between items-start">
                      <span className="text-[10.5px] uppercase tracking-widest text-[#1B2A6B] font-extrabold font-mono">Corporate Leads</span>
                      <FileText className="w-5 h-5 text-[#F26522]" />
                    </div>
                    <div>
                      <div className="text-3xl font-serif font-bold text-[#1B2A6B] tracking-tight">{contacts.length}</div>
                      <p className="text-[10.5px] text-gray-500 font-sans mt-1">
                        Enterprise Business Solutions Requests
                      </p>
                    </div>
                  </div>

                </div>

        {/* Dynamic Column Split Area */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT AREA (Now expanded to full 12 columns span) */}
          <div className="col-span-1 lg:col-span-12 flex flex-col gap-6">
            
            {/* Main Interactive Work Center */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
              
              {/* Tab Selector Buttons */}
              <div className="flex border-b border-gray-200 bg-gray-50/50 p-2 gap-1 overflow-x-auto">
                <button
                  type="button"
                  id="tab-btn-interpreters"
                  onClick={() => { setActiveTab("interpreters"); setSearchTerm(""); }}
                  className={`px-5 py-3 text-xs font-bold uppercase tracking-wider rounded-md transition-all hover:cursor-pointer flex items-center gap-2 font-mono ${
                    activeTab === "interpreters"
                      ? "bg-white text-[#1B2A6B] border border-gray-200 shadow-sm border-b-2 border-b-[#F26522]"
                      : "text-gray-500 hover:text-[#1B2A6B] hover:bg-gray-100/50"
                  }`}
                >
                  <Users className="w-4 h-4" />
                  Linguists ({interpreters.length})
                </button>
                
                <button
                  type="button"
                  id="tab-btn-contacts"
                  onClick={() => { setActiveTab("contacts"); setSearchTerm(""); }}
                  className={`px-5 py-3 text-xs font-bold uppercase tracking-wider rounded-md transition-all hover:cursor-pointer flex items-center gap-2 font-mono ${
                    activeTab === "contacts"
                      ? "bg-white text-[#1B2A6B] border border-gray-200 shadow-sm border-b-2 border-b-[#1B2A6B]"
                      : "text-gray-500 hover:text-[#1B2A6B] hover:bg-gray-100/50"
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  Client leads ({contacts.length})
                </button>

                <button
                  type="button"
                  id="tab-btn-antispam"
                  onClick={() => { setActiveTab("antispam"); setSearchTerm(""); }}
                  className={`px-5 py-3 text-xs font-bold uppercase tracking-wider rounded-md transition-all hover:cursor-pointer flex items-center gap-2 font-mono ${
                    activeTab === "antispam"
                      ? "bg-white text-[#1B2A6B] border border-gray-200 shadow-sm border-b-2 border-b-emerald-600"
                      : "text-gray-500 hover:text-[#1B2A6B] hover:bg-gray-100/50"
                  }`}
                >
                  <ShieldCheck className="w-4 h-4" />
                  Shield Leases ({antispamSessions.length})
                </button>

                <button
                  type="button"
                  id="tab-btn-integrations"
                  onClick={() => { setActiveTab("integrations"); setSearchTerm(""); }}
                  className={`px-5 py-3 text-xs font-bold uppercase tracking-wider rounded-md transition-all hover:cursor-pointer flex items-center gap-2 font-mono ${
                    activeTab === "integrations"
                      ? "bg-white text-[#1B2A6B] border border-gray-200 shadow-sm border-b-2 border-b-purple-600"
                      : "text-gray-500 hover:text-[#1B1A6B] hover:bg-gray-100/50"
                  }`}
                >
                  <Webhook className="w-4 h-4 text-purple-600" />
                  Integrations Hub
                </button>
              </div>

              {/* Filtering bar, search utility */}
              {activeTab !== "antispam" && activeTab !== "integrations" && (
                <div className="p-4 border-b border-gray-250 bg-gray-50/20 flex flex-col sm:flex-row gap-4 items-center justify-between">
                  <div className="relative w-full sm:w-80">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-450 pointer-events-none">
                      <Search className="w-4 h-4 text-gray-400" />
                    </span>
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Filter submissions by keywords..."
                      className="w-full bg-white border border-gray-200 focus:border-[#1B2A6B] focus:ring-1 focus:ring-[#1B2A6B]/30 rounded-md pl-10 pr-4 py-2 text-xs text-gray-950 placeholder-gray-400 outline-none transition-all"
                    />
                  </div>
                  <div className="text-[11px] font-medium text-gray-500 shrink-0">
                    Showing <span className="font-bold text-[#1B2A6B]">{activeTab === "interpreters" ? filteredInterpreters.length : filteredContacts.length}</span> records out of {activeTab === "interpreters" ? interpreters.length : contacts.length} total
                  </div>
                </div>
              )}

              {/* Workspace Data Panels */}
              <div className="p-6">
                
                {activeTab === "interpreters" && (
                  filteredInterpreters.length === 0 ? (
                    <div className="py-16 text-center space-y-4 max-w-sm mx-auto">
                      <Users className="w-12 h-12 text-gray-300 mx-auto" />
                      <div>
                        <h3 className="font-serif font-bold text-gray-800 text-base">No interpreters found</h3>
                        <p className="text-xs text-gray-500 leading-relaxed mt-1">
                          No candidate records match your search criteria, or no data exists in sandbox collections.
                        </p>
                      </div>
                      <div className="flex gap-2 justify-center">
                        <button
                          onClick={handleSimulateCandidate}
                          className="px-4 py-2 bg-[#F26522] hover:bg-[#D54F10] text-white font-bold text-[10.5px] uppercase tracking-wide rounded hover:cursor-pointer transition-colors shadow-sm"
                        >
                          Simulate Demo Recruits
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[750px] text-left border-collapse">
                        <thead>
                          <tr className="border-b border-gray-200 text-[10px] text-gray-400 uppercase tracking-widest font-mono font-bold">
                            <th className="pb-3 pr-2 select-none">Linguist Name</th>
                            <th className="pb-3 select-none">Email & Phone</th>
                            <th className="pb-3 select-none">Language Combination</th>
                            <th className="pb-3 select-none">Exp / Modes</th>
                            <th className="pb-3 select-none">Registration Date</th>
                            <th className="pb-3 text-right select-none">Prune</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 text-xs text-gray-700">
                          {filteredInterpreters.map((item) => (
                            <tr 
                              key={item.id} 
                              className={`hover:bg-[#1B2A6B]/5 transition-all cursor-pointer ${
                                selectedSub && selectedSub.id === item.id 
                                  ? "bg-[#1B2A6B]/5 border-l-4 border-l-[#F26522]" 
                                  : "border-l-4 border-l-transparent"
                              }`}
                              onClick={() => {
                                setSelectedSub(item);
                                pushLog("SYSTEM", "INFO", `Inspecting candidate dossier: ${item.full_name}`);
                              }}
                            >
                              <td className="py-4 pr-2 font-serif font-bold text-[#1B2A6B] text-sm">
                                <div className="flex items-center gap-2">
                                  {item.full_name}
                                  {item.email_sandbox_preview && (
                                    <span className="px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200 text-[8.5px] uppercase font-bold tracking-wider font-mono">
                                      Mail Box
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="py-4 font-mono text-[11px] text-gray-600">
                                <div className="font-semibold text-gray-900">{item.submitter_email}</div>
                                <div className="text-[10px] text-gray-450">{item.phone} &bull; {item.location}</div>
                              </td>
                              <td className="py-4">
                                <span className="inline-block px-2.5 py-0.5 bg-[#1B2A6B]/5 border border-[#1B2A6B]/15 text-[#1B2A6B] rounded font-semibold text-[11px]">
                                  {item.primary_language}
                                </span>
                              </td>
                              <td className="py-4 text-gray-600">
                                <div className="font-bold text-gray-800">{item.interpreting_modes}</div>
                                <div className="text-[10px] text-gray-450 font-mono">{item.experience_years} Years Practitioner</div>
                              </td>
                              <td className="py-4 text-gray-500 font-mono text-[10.5px]">
                                {new Date(item.timestamp).toLocaleDateString()} {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </td>
                              <td className="py-4 text-right" onClick={(e) => e.stopPropagation()}>
                                <button
                                  onClick={() => setShowDeleteConfirm({ type: "interpreter", id: item.id })}
                                  className="p-1 px-2.5 rounded text-red-500 hover:text-white hover:bg-red-600/10 border border-red-200 hover:border-red-600 transition-all hover:cursor-pointer"
                                  title="Prune Record"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )
                )}

                {activeTab === "contacts" && (
                  filteredContacts.length === 0 ? (
                    <div className="py-16 text-center space-y-4 max-w-sm mx-auto">
                      <FileText className="w-12 h-12 text-gray-300 mx-auto" />
                      <div>
                        <h3 className="font-serif font-bold text-gray-800 text-base">No client requests found</h3>
                        <p className="text-xs text-gray-500 mt-1">
                          Corporate contact inquiries collection is empty, or filtering returned zero indicators.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[750px] text-left border-collapse">
                        <thead>
                          <tr className="border-b border-gray-200 text-[10px] text-gray-400 uppercase tracking-widest font-mono font-bold">
                            <th className="pb-3 pr-2 select-none">Client Submitter</th>
                            <th className="pb-3 select-none">Contact Info / Org</th>
                            <th className="pb-3 select-none">Service Tier Requested</th>
                            <th className="pb-3 select-none">Message snippet</th>
                            <th className="pb-3 select-none">Submit Time</th>
                            <th className="pb-3 text-right select-none">Discard</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 text-xs text-gray-700">
                          {filteredContacts.map((item) => (
                            <tr 
                              key={item.id} 
                              className={`hover:bg-[#1B2A6B]/5 transition-all cursor-pointer ${
                                selectedSub && selectedSub.id === item.id 
                                  ? "bg-[#1B2A6B]/5 border-l-4 border-l-[#1B2A6B]" 
                                  : "border-l-4 border-l-transparent"
                              }`}
                              onClick={() => {
                                setSelectedSub(item);
                                pushLog("SYSTEM", "INFO", `Inspecting corporate inquiry: ${item.full_name}`);
                              }}
                            >
                              <td className="py-4 pr-2 font-serif font-bold text-[#1B2A6B] text-sm">{item.full_name}</td>
                              <td className="py-4 text-gray-600 font-mono text-[11px]">
                                <div className="font-semibold text-gray-900">{item.submitter_email}</div>
                                <div className="text-[10px] text-gray-450 font-sans font-medium">{item.organization || "Private Account"} &bull; {item.phone || "No phone line"}</div>
                              </td>
                              <td className="py-4">
                                <span className="inline-block px-2.5 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded font-bold text-[10.5px]">
                                  {item.service || "Linguistic Suite"}
                                </span>
                              </td>
                              <td className="py-4 max-w-[200px] text-gray-500 truncate italic">
                                &ldquo;{item.message}&rdquo;
                              </td>
                              <td className="py-4 text-gray-500 font-mono text-[10.5px]">
                                {new Date(item.timestamp).toLocaleDateString()} {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </td>
                              <td className="py-4 text-right" onClick={(e) => e.stopPropagation()}>
                                <button
                                  onClick={() => setShowDeleteConfirm({ type: "contact", id: item.id })}
                                  className="p-1 px-2.5 rounded text-red-500 hover:text-white hover:bg-red-600/10 border border-red-200 hover:border-red-600 transition-all hover:cursor-pointer"
                                  title="Prune Record"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )
                )}

                {activeTab === "antispam" && (
                  <div className="space-y-6">
                    <div className="p-5 bg-emerald-50/50 border border-emerald-100 rounded-lg flex flex-col md:flex-row gap-5 items-center justify-between">
                      <div className="space-y-1">
                        <h4 className="text-xs uppercase font-extrabold tracking-widest text-[#1B2A6B] flex items-center gap-1.5 font-mono">
                          <ShieldCheck className="w-4 h-4 text-emerald-600" />
                          Cryptographic Bot Interceptor Status
                        </h4>
                        <p className="text-[11px] text-gray-500 leading-relaxed">
                          In-memory defensive challenge leases generated on <code>/api/forms/prepare</code>. 
                          These ensure all client postings carry a single-use token block to filter mechanical dictionary attacks.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleClearAntiSpam}
                        disabled={antispamSessions.length === 0}
                        className="p-2.5 px-4 bg-red-600 text-white hover:bg-red-700 font-bold uppercase rounded-md text-[10px] tracking-widest select-none duration-200 shrink-0 hover:cursor-pointer disabled:opacity-40"
                      >
                        FLUSH AGENT STORAGE
                      </button>
                    </div>

                    {antispamSessions.length === 0 ? (
                      <div className="py-12 border border-dashed border-gray-200 text-center rounded-lg max-w-sm mx-auto space-y-2">
                        <Clock className="w-10 h-10 text-gray-300 mx-auto" />
                        <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">No Lease Signatures Registered</h4>
                        <p className="text-[10px] text-gray-400">
                          Interactive form triggers will generate single-use security keys in sandbox heap.
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {antispamSessions.map(sess => (
                          <div key={sess.id} className="p-4 bg-gray-50 border border-gray-200 rounded-lg space-y-2 relative shadow-inner">
                            <div className="flex justify-between border-b border-gray-200 pb-2">
                              <span className="font-mono text-xs font-bold text-[#1B2A6B]">{sess.id}</span>
                              <span className="font-mono text-[9px] text-gray-400 flex items-center gap-1">
                                <Clock className="w-3 h-3" /> Timestamp lease {sess.ageSeconds}s ago
                              </span>
                            </div>
                            <div className="overflow-hidden text-ellipsis whitespace-nowrap text-xs">
                              Challenge Signature: <span className="font-mono bg-white border border-gray-150 px-1 py-0.5 rounded text-purple-600 font-semibold select-all text-[11px]">{sess.challenge}</span>
                            </div>
                            <p className="text-[9.5px] text-gray-400">
                              Validated single-use bot protection hash token waiting form trigger.
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* ADVANCED CUSTOM INTEGRATIONS COMPONENT */}
                {activeTab === "integrations" && (
                  <div className="space-y-6">
                    <div className="border border-purple-200 bg-purple-50/20 p-5 rounded-lg flex flex-col sm:flex-row gap-5 items-center justify-between">
                      <div className="space-y-1">
                        <h4 className="text-xs uppercase font-extrabold tracking-widest text-purple-800 flex items-center gap-1.5 font-mono">
                          <Webhook className="w-4 h-4 text-purple-600" />
                          External Corporate Hookups config
                        </h4>
                        <p className="text-[11px] text-gray-500 leading-relaxed">
                          Synchronize submissions directly with custom web messenger systems and automate Slack notification channels. Use the test triggers underneath to run local diagnostics.
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={triggerSlackTest}
                          className="p-2.5 px-4 bg-purple-100 hover:bg-purple-200 text-purple-700 font-bold uppercase rounded-md text-[10px] tracking-wider select-none hover:cursor-pointer transition-colors"
                        >
                          Send Test Slack Block
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2">
                      <div className="space-y-4 border border-gray-200 p-5 rounded-lg bg-white shadow-sm flex flex-col justify-between">
                        <div className="space-y-4">
                          <h3 className="text-xs uppercase tracking-widest text-[#1B2A6B] font-extrabold font-mono flex items-center gap-2">
                            <Sliders className="w-4 h-4 text-[#F26522]" /> Webhook Config Integration
                          </h3>
                          <div className="h-px bg-gray-150 w-full" />
                          
                          <div className="space-y-1">
                            <label className="flex items-center gap-2 text-xs font-bold text-gray-700 cursor-pointer select-none">
                              <input
                                type="checkbox"
                                checked={integrations.slackEnabled}
                                onChange={(e) => saveIntegrations({ ...integrations, slackEnabled: e.target.checked })}
                                className="rounded border-gray-300 focus:ring-0 cursor-pointer"
                              />
                              Enable Slack Channel Relay
                            </label>
                            <p className="text-[10px] text-gray-400 pl-5">Automatically format and send leads to Slack workspace webhook</p>
                          </div>

                          <div className="space-y-2">
                            <label htmlFor="int_slack_url" className="text-[10.5px] uppercase font-bold tracking-wider text-gray-550 block font-mono">Slack Webhook Destination URL</label>
                            <input
                              id="int_slack_url"
                              type="text"
                              value={integrations.slackWebhook}
                              onChange={(e) => setIntegrations({ ...integrations, slackWebhook: e.target.value })}
                              className="w-full bg-gray-50 border border-gray-200 text-xs rounded p-2.5 font-mono text-gray-800 outline-none focus:border-[#1B2A6B]"
                            />
                          </div>

                          <div className="space-y-2 pt-2">
                            <label htmlFor="int_websec" className="text-[10.5px] uppercase font-bold tracking-wider text-gray-550 block font-mono">Webhook Security Sign Secret Signature</label>
                            <input
                              id="int_websec"
                              type="text"
                              value={integrations.webhookSecret}
                              onChange={(e) => setIntegrations({ ...integrations, webhookSecret: e.target.value })}
                              className="w-full bg-gray-50 border border-gray-200 text-xs rounded p-2.5 font-mono text-gray-850 outline-none focus:border-[#1B2A6B]"
                            />
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => saveIntegrations(integrations)}
                          className="w-full py-2 bg-[#1B2A6B] hover:bg-[#283D90] text-white font-bold rounded text-[10.5px] uppercase tracking-wider hover:cursor-pointer transition-colors mt-4"
                        >
                          Commit Webhook Configurations
                        </button>
                      </div>

                      <div className="space-y-4 border border-gray-200 p-5 rounded-lg bg-white shadow-sm flex flex-col justify-between">
                        <div className="space-y-4">
                          <h3 className="text-xs uppercase tracking-widest text-[#1B2A6B] font-extrabold font-mono flex items-center gap-2">
                            <Settings className="w-4 h-4 text-[#F26522]" /> API Verification Access
                          </h3>
                          <div className="h-px bg-gray-150 w-full" />
                          
                          <div className="space-y-1.5 text-xs text-gray-700 leading-relaxed">
                            <span className="font-bold text-gray-900 block mb-1">Raw Submissions Bearer Key token</span>
                            <div className="p-2.5 bg-gray-50 rounded border border-gray-200 font-mono text-[10.5px] block truncate select-all relative group cursor-pointer text-gray-700">
                              <span className="text-emerald-700">Bearer</span> {integrations.apiToken}
                            </div>
                            <p className="text-[10px] text-gray-400 mt-2">
                              Use this static authorization key token to fetch full candidate and contact applications from external services or curl scripts:
                            </p>
                          </div>

                          <div className="bg-gray-950 text-emerald-400 p-3.5 rounded font-mono text-[10px] leading-relaxed select-all">
                            curl -X GET \<br />
                            &nbsp;&nbsp;https://vozarals.com/api/admin/submissions \<br />
                            &nbsp;&nbsp;-H "Authorization: Bearer sk_live_vozara_..."
                          </div>
                        </div>

                        <div className="space-y-3 pt-4 border-t border-gray-100">
                          <label className="flex items-center gap-2 text-xs font-bold text-gray-700 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={integrations.candidateAlerts}
                              onChange={(e) => saveIntegrations({ ...integrations, candidateAlerts: e.target.checked })}
                              className="rounded border-gray-300 focus:ring-0 cursor-pointer"
                            />
                            Email alert for new Candidates
                          </label>
                          <label className="flex items-center gap-2 text-xs font-bold text-gray-700 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={integrations.clientAlerts}
                              onChange={(e) => saveIntegrations({ ...integrations, clientAlerts: e.target.checked })}
                              className="rounded border-gray-300 focus:ring-0 cursor-pointer"
                            />
                            Email alert for Client Leads
                          </label>
                        </div>
                      </div>

                      {/* GMAIL API SYSTEM GATEWAY CARD */}
                      <div className="space-y-4 border border-gray-200 p-5 rounded-lg bg-white shadow-sm flex flex-col justify-between">
                        <div className="space-y-4">
                          <h3 className="text-xs uppercase tracking-widest text-[#1B2A6B] font-extrabold font-mono flex items-center gap-2">
                            <Mail className="w-4 h-4 text-[#F26522]" /> google gmail gateway
                          </h3>
                          <div className="h-px bg-gray-150 w-full" />

                          {gmailToken ? (
                            <div className="space-y-3">
                              <div className="flex items-center gap-2.5 p-2.5 bg-emerald-50 border border-emerald-100 rounded-md">
                                {gmailUser?.photo ? (
                                  <img 
                                    src={gmailUser.photo} 
                                    alt="Google Profile" 
                                    className="w-10 h-10 rounded-full border border-emerald-250 shrink-0"
                                    referrerPolicy="no-referrer"
                                  />
                                ) : (
                                  <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-sm uppercase shrink-0">
                                    {(gmailUser?.name || gmailUser?.email || "G")[0]}
                                  </div>
                                )}
                                <div className="min-w-0 flex-1">
                                  <div className="font-bold text-xs text-gray-800 truncate">{gmailUser?.name || "Workspace Admin"}</div>
                                  <div className="text-[10px] text-gray-500 truncate font-mono">{gmailUser?.email}</div>
                                  <span className="inline-flex items-center gap-1 text-[9px] bg-emerald-150/40 text-emerald-800 px-1.5 py-0.5 rounded font-mono font-bold mt-1 uppercase">
                                    <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" /> Active Session
                                  </span>
                                </div>
                              </div>

                              {gmailInboxStats && (
                                <div className="p-2 bg-gray-50 rounded border border-gray-150 grid grid-cols-2 gap-1.5 text-center text-gray-700">
                                  <div>
                                    <div className="text-[9px] uppercase tracking-wider text-gray-400 font-mono select-none">Total Messages</div>
                                    <div className="text-xs font-black text-gray-900 font-mono mt-0.5">{gmailInboxStats.messageCount ?? "N/A"}</div>
                                  </div>
                                  <div>
                                    <div className="text-[9px] uppercase tracking-wider text-gray-400 font-mono select-none">Total Threads</div>
                                    <div className="text-xs font-black text-gray-900 font-mono mt-0.5">{gmailInboxStats.totalThreads ?? "N/A"}</div>
                                  </div>
                                  <div className="col-span-2 text-[8px] text-gray-400 border-t border-gray-100 pt-1 mt-0.5 font-mono text-center select-none">
                                    Verified: {gmailInboxStats.lastChecked}
                                  </div>
                                </div>
                              )}

                              {/* Mini Test Dispatcher Console */}
                              <div className="bg-gray-50 border border-gray-200 p-2.5 rounded-md space-y-2">
                                <div className="text-[9.5px] font-bold text-[#1B2A6B] uppercase tracking-widest font-mono flex items-center gap-1.5">
                                  <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" /> REST Dispatch Sandbox
                                </div>
                                <div className="space-y-1.5">
                                  <input 
                                    type="email" 
                                    value={gmailRecipient} 
                                    onChange={(e) => setGmailRecipient(e.target.value)}
                                    placeholder="Enter test recipe email..." 
                                    className="w-full bg-white border border-gray-200 text-[10.5px] rounded p-1.5 font-mono outline-none focus:border-[#1B2A6B]"
                                  />
                                  <input 
                                    type="text" 
                                    value={gmailSubject} 
                                    onChange={(e) => setGmailSubject(e.target.value)}
                                    placeholder="Subject header line..." 
                                    className="w-full bg-white border border-gray-200 text-[10.5px] rounded p-1.5 outline-none focus:border-[#1B2A6B]"
                                  />
                                  <textarea 
                                    value={gmailBody} 
                                    onChange={(e) => setGmailBody(e.target.value)}
                                    placeholder="MIME message content body..." 
                                    className="w-full h-12 bg-white border border-gray-200 text-[10.5px] rounded p-1.5 font-mono outline-none focus:border-[#1B2A6B] resize-none"
                                  />
                                </div>

                                {gmailSendStatus !== "idle" && (
                                  <div className={`p-1.5 rounded text-[9.5px] leading-normal font-mono ${
                                    gmailSendStatus === "sending" ? "bg-blue-50 text-blue-700 border border-blue-150" :
                                    gmailSendStatus === "success" ? "bg-emerald-50 text-emerald-700 border border-emerald-150" :
                                    "bg-red-50 text-red-700 border border-red-150 animate-pulse"
                                  }`}>
                                    {gmailSendStatus === "sending" && "Forwarding payload to REST gateway..."}
                                    {gmailSendStatus === "success" && (gmailSendResultMsg || "Transmitted successfully!")}
                                    {gmailSendStatus === "error" && (gmailSendResultMsg || "Error transmitting payload.")}
                                  </div>
                                )}

                                <button
                                  type="button"
                                  disabled={gmailLoading || gmailSendStatus === "sending"}
                                  onClick={sendComposeGmail}
                                  className="w-full py-1.5 bg-[#F26522] hover:bg-[#d45017] disabled:bg-gray-300 text-white font-bold rounded text-[9.5px] uppercase tracking-wider duration-150 cursor-pointer font-mono"
                                >
                                  {gmailSendStatus === "sending" ? "Sending..." : "Dispatch SMTP-REST packet"}
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-3 pt-1">
                              <p className="text-[11px] text-gray-500 leading-relaxed">
                                Link this management terminal directly with Google Workspace to dispatch authentic candidate responses, onboarding packages, and interview offers via your actual corporate Gmail address.
                              </p>
                              
                              <div className="bg-[#1B2A6B]/5 border border-[#1B2A6B]/10 p-2.5 rounded text-[10px] text-[#1B2A6B] flex items-start gap-1.5 leading-relaxed">
                                <Info className="w-3.5 h-3.5 text-[#F26522] mt-0.5 shrink-0" />
                                <span>Uses official direct OAuth pathways inside secure sandboxed iFrame. Sensitive credentials remain transiently in memory.</span>
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="pt-4">
                          {gmailToken ? (
                            <button
                              type="button"
                              disabled={gmailLoading}
                              onClick={handleDisconnectGmail}
                              className="w-full py-2 bg-gray-50 hover:bg-gray-100 text-gray-600 hover:text-red-600 border border-gray-250 font-bold rounded text-[10.5px] uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5 hover:cursor-pointer font-mono"
                            >
                              <LogOut className="w-3.5 h-3.5" /> disconnect gmail node
                            </button>
                          ) : (
                            <button
                              type="button"
                              disabled={gmailLoading}
                              onClick={handleConnectGmail}
                              className="w-full py-2 bg-[#1B2A6B] hover:bg-[#283D90] disabled:bg-gray-300 text-white font-bold rounded text-[10.5px] uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-sm hover:cursor-pointer"
                            >
                              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                                <path d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-5.136 4.114A5.903 5.903 0 018 12.63c0-3.26 2.64-5.9 5.9-5.9 1.48 0 2.83.55 3.87 1.46l3.07-3.07C18.98 3.37 16.58 2.43 13.9 2.43 8.3 2.43 3.77 6.96 3.77 12.56s4.53 10.13 10.13 10.13c5.8 0 9.6-4.07 9.6-9.76 0-.66-.06-1.3-.17-1.95H12.24z"/>
                              </svg>
                              {gmailLoading ? "Authorizing Popups..." : "Connect Admin Gmail Account"}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

              </div>

            </div>

            {/* Operations Diagnostics Sandbox Suite (Removed per clean business view instructions) */}

          </div>

          {/* RIGHT SIDEBAR (4 Columns): Log monitor stack (Hidden from view) */}
          <div className="hidden">
            
            {/* DOSSIER DETAIL VERIFICATION CAPABLE STACK */}
            {selectedSub ? (
              <div className="bg-white rounded-lg border border-gray-205 shadow-md overflow-hidden relative flex flex-col max-h-[85vh]">
                {/* Visual identity line */}
                <div className={`h-1.5 w-full ${activeTab === "interpreters" ? "bg-[#F26522]" : "bg-[#1B2A6B]"}`} />

                {/* Header info */}
                <div className="p-5 border-b border-gray-150 flex items-center justify-between bg-gray-50/35">
                  <div className="max-w-[85%]">
                    <span className="text-[9.5px] uppercase font-bold tracking-widest text-[#F26522] font-mono block">
                      {activeTab === "interpreters" ? "Linguist Credentials Dossier" : "Client Lead Requirements"}
                    </span>
                    <h3 className="font-serif text-lg font-bold text-[#1B2A6B] truncate mt-0.5" title={selectedSub.full_name}>
                      {selectedSub.full_name}
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedSub(null)}
                    className="p-1 text-gray-450 hover:text-[#1B2A6B] hover:bg-gray-100 rounded cursor-pointer transition-colors shrink-0"
                    title="Close Details view"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Body details */}
                <div className="p-6 overflow-y-auto space-y-5 text-xs text-gray-700">
                  
                  {/* General details ribbon */}
                  <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg space-y-3 font-mono text-[11px] text-gray-800">
                    <div>
                      <span className="text-[#1B2A6B] block uppercase font-bold text-[9px] tracking-wider mb-0.5">Submitter Email</span>
                      <a href={`mailto:${selectedSub.submitter_email}`} className="font-semibold text-gray-900 hover:underline break-all">
                        {selectedSub.submitter_email}
                      </a>
                    </div>
                    <div>
                      <span className="text-[#1B2A6B] block uppercase font-bold text-[9px] tracking-wider mb-0.5">Phone Line</span>
                      <a href={`tel:${selectedSub.phone}`} className="font-semibold text-gray-900 hover:underline">
                        {selectedSub.phone || "No phone supplied"}
                      </a>
                    </div>
                    <div className="pt-2 border-t border-gray-200">
                      <span className="text-[#1B2A6B] block uppercase font-bold text-[9px] tracking-wider mb-1">Geographic jurisdiction</span>
                      <div className="font-bold text-gray-900 flex items-center gap-1.5 font-sans">
                        <MapPin className="w-3.5 h-3.5 text-[#F26522] shrink-0" />
                        {selectedSub.location || "International Pool - Remote"}
                      </div>
                    </div>
                  </div>

                  {activeTab === "interpreters" ? (
                    /* CANDIDATE INFO FIELDS */
                    <div className="space-y-4">
                      <div className="space-y-1">
                        <span className="text-gray-400 block uppercase font-bold text-[9px] tracking-widest font-mono">Qualifications Matrix</span>
                        <div className="flex flex-wrap items-center gap-1.5 pt-1">
                          <span className="px-2 py-1 bg-[#1B2A6B] text-white font-bold text-[10px] rounded">
                            {selectedSub.primary_language}
                          </span>
                          {selectedSub.interpreting_modes && (
                            <span className="px-2 py-1 bg-[#F26522]/10 border border-[#F26522]/20 text-[#D54F10] font-bold text-[10px] rounded">
                              {selectedSub.interpreting_modes}
                            </span>
                          )}
                        </div>
                        {selectedSub.additional_languages && (
                          <div className="text-[11px] text-gray-600 bg-gray-50 p-2.5 rounded border border-gray-150 mt-2">
                            <strong>Secondary matching:</strong> {selectedSub.additional_languages}
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-4 pt-1">
                        <div>
                          <span className="text-[#1B2A6B] block uppercase font-bold text-[9px] tracking-wider mb-0.5">Linguistic Experience</span>
                          <p className="text-sm font-serif font-black text-[#1B2A6B]">{selectedSub.experience_years || "0"} Years Practicing</p>
                        </div>
                        <div>
                          <span className="text-[#1B2A6B] block uppercase font-bold text-[9px] tracking-wider mb-0.5">Court/HIPAA Certifications</span>
                          <p className="text-xs font-semibold text-emerald-700 font-sans">{selectedSub.certifications || "General Qualification"}</p>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <span className="text-gray-400 block uppercase font-bold text-[9px] tracking-widest font-mono">Expertise domain alignment</span>
                        <p className="p-3 bg-gray-50 border border-gray-200 rounded font-sans italic">
                          {selectedSub.medical_legal_knowledge || "Standard conference translating"}
                        </p>
                      </div>

                      <div className="space-y-1.5">
                        <span className="text-gray-400 block uppercase font-bold text-[9px] tracking-widest font-mono">Hardware & Workspace environment</span>
                        <p className="p-3 bg-gray-50 border border-gray-200 rounded font-mono text-[10.5px] leading-relaxed text-gray-600">
                          {selectedSub.technical_setup || "No custom hardware profile submitted."}
                        </p>
                      </div>

                       {selectedSub.linkedin_or_portfolio && (
                        <div>
                          <span className="text-[#1B2A6B] block uppercase font-bold text-[9px] tracking-wider mb-1">Dossier Portfolio Link</span>
                          <a 
                            href={selectedSub.linkedin_or_portfolio} 
                            target="_blank" 
                            rel="noreferrer" 
                            className="bg-gray-50 hover:bg-gray-100 border border-gray-200 p-2.5 rounded block text-[11px] font-mono break-all font-semibold text-[#F26522] flex items-center gap-1 hover:underline"
                          >
                            <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                            {selectedSub.linkedin_or_portfolio}
                          </a>
                        </div>
                      )}

                      {selectedSub.cv_name && (
                        <div className="space-y-1">
                          <span className="text-[#1B2A6B] block uppercase font-bold text-[9px] tracking-wider mb-1">Attached CV / Résumé</span>
                          <div className="bg-gray-55/60 border border-gray-200 p-3 rounded-lg flex items-center justify-between gap-3 font-sans">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="h-10 w-10 rounded bg-[#F26522]/10 text-[#F26522] flex items-center justify-center shrink-0 border border-[#F26522]/20">
                                <FileText className="w-5 h-5" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-gray-900 truncate" title={selectedSub.cv_name}>
                                  {selectedSub.cv_name}
                                </p>
                                <p className="text-[10px] text-gray-500 font-mono">
                                  {selectedSub.cv_size || "Unknown size"} &bull; Document File
                                </p>
                              </div>
                            </div>
                            
                            <button
                              type="button"
                              onClick={() => {
                                if (selectedSub.cv_base64) {
                                  const link = document.createElement("a");
                                  link.href = selectedSub.cv_base64.startsWith("data:") 
                                    ? selectedSub.cv_base64 
                                    : `data:application/pdf;base64,${selectedSub.cv_base64}`;
                                  link.download = selectedSub.cv_name || "Resume.pdf";
                                  document.body.appendChild(link);
                                  link.click();
                                  document.body.removeChild(link);
                                  pushLog("SYSTEM", "SUCCESS", `Downloaded candidate resume: ${selectedSub.cv_name}`);
                                } else {
                                  pushLog("SYSTEM", "WARN", "CV base64 payload is empty or corrupted.");
                                }
                              }}
                              className="px-3 py-1.5 bg-[#1B2A6B] hover:brightness-110 text-white font-bold text-[10px] uppercase tracking-wide rounded hover:cursor-pointer transition-all shadow-sm whitespace-nowrap shrink-0 flex items-center gap-1 font-mono"
                            >
                              Download CV
                            </button>
                          </div>
                        </div>
                      )}

                      {selectedSub.additional_info && (
                        <div className="space-y-1">
                          <span className="text-gray-400 block uppercase font-bold text-[9px] tracking-widest font-mono">Cover Note</span>
                          <p className="p-3.5 bg-gray-50/70 border border-gray-150 rounded leading-relaxed italic text-gray-650">
                            &ldquo;{selectedSub.additional_info}&rdquo;
                          </p>
                        </div>
                      )}

                      {/* SMTP Node captures preview */}
                      {selectedSub.email_sandbox_preview && (
                        <div className="pt-4 border-t border-gray-150 space-y-2">
                          <div className="flex justify-between items-center bg-purple-50 p-2 border border-purple-200 rounded">
                            <span className="text-[10px] font-bold text-purple-850 uppercase font-mono flex items-center gap-1.5">
                              <Mail className="w-3.5 h-3.5" /> Intercepted Mail Envelope
                            </span>
                            <a 
                              href={selectedSub.email_sandbox_preview} 
                              target="_blank" 
                              referrerPolicy="no-referrer"
                              rel="noreferrer" 
                              className="text-[10.5px] text-[#F26522] hover:underline font-bold flex items-center gap-0.5 cursor-pointer"
                            >
                              Open Raw HTML <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                          
                          {/* Live mail capture iframe */}
                          <div className="w-full h-64 rounded bg-gray-100 border border-gray-250 overflow-hidden relative">
                            <div className="absolute top-0 left-0 right-0 h-6 bg-gray-200/80 px-2 flex items-center text-[8.5px] text-gray-500 uppercase tracking-widest font-mono font-bold select-none">
                              SMTP Capture: careers@vozarals.com
                            </div>
                            <iframe 
                              src={selectedSub.email_sandbox_preview}
                              className="w-full h-full pt-6 bg-white" 
                              title="SMTP mailbox previewer" 
                            />
                          </div>
                        </div>
                      )}

                    </div>
                  ) : (
                    /* CORPORATE LEAD DETAILS */
                    <div className="space-y-4">
                      <div>
                        <span className="text-gray-400 block uppercase font-bold text-[9px] tracking-widest font-mono">Solutions demanded</span>
                        <span className="px-3 py-1 bg-amber-50 border border-amber-300 text-amber-800 rounded font-bold mt-1 text-[11px] inline-block">
                          {selectedSub.service || "Linguistic translation solution"}
                        </span>
                        {selectedSub.language_pair && (
                          <p className="text-[11.5px] mt-2.5 text-gray-605 text-gray-600 bg-gray-50 rounded p-2.5 border border-gray-150">
                            Language combination required: <strong className="text-gray-900 font-mono font-bold">{selectedSub.language_pair}</strong>
                          </p>
                        )}
                      </div>

                      {selectedSub.organization && (
                        <div className="space-y-1">
                          <span className="text-[#1B2A6B] block uppercase font-bold text-[9px] tracking-wider font-mono">Enterprise client organization</span>
                          <div className="p-3 bg-gray-50 border border-gray-200 rounded text-gray-900 font-serif font-bold text-sm flex items-center gap-2">
                            <Building className="w-4 h-4 text-[#F26522] shrink-0" />
                            {selectedSub.organization}
                          </div>
                        </div>
                      )}

                      <div className="space-y-1">
                        <span className="text-gray-400 block uppercase font-bold text-[9px] tracking-widest font-mono">Detailed requirement statement</span>
                        <p className="p-4 bg-gray-50 border border-gray-200 rounded italic leading-relaxed text-gray-700 font-serif text-[13.5px]">
                          &ldquo;{selectedSub.message}&rdquo;
                        </p>
                      </div>
                    </div>
                  )}

                  {/* DIRECT RECRUITER CORRESPONDENCE GMAIL GATEWAY */}
                  <div className="pt-5 border-t border-gray-200 space-y-3">
                    <h4 className="text-[10px] uppercase font-bold tracking-widest text-[#1B2A6B] font-mono flex items-center gap-1.5 select-none">
                      <Mail className="w-3.5 h-3.5 text-[#F26522]" /> Recruiter Gmail Correspondence
                    </h4>
                    
                    {gmailToken ? (
                      <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg space-y-3">
                        <div className="flex items-center justify-between">
                          <label htmlFor="dossier_comp_temp" className="text-[10px] uppercase font-extrabold text-gray-500 font-mono">Select Email Template</label>
                          <span className="text-[9px] text-emerald-800 font-mono bg-emerald-50 px-1.5 py-0.5 rounded font-bold uppercase shrink-0">
                            Connected as {gmailUser?.email}
                          </span>
                        </div>
                        
                        <select 
                          id="dossier_comp_temp"
                          value={gmailTemplate}
                          onChange={(e) => applyGmailTemplate(e.target.value, selectedSub.full_name, selectedSub)}
                          className="w-full bg-white border border-gray-200 text-xs rounded p-2 text-gray-700 font-sans outline-none focus:border-[#1B2A6B]"
                        >
                          <option value="welcome">Welcome & Hardware Checkup (Interpreter onboarding)</option>
                          <option value="interview">1-on-1 Audition Invitation (Zoom interview slots)</option>
                          <option value="documentation">Documentation Pending Notification (Credentials verification)</option>
                          <option value="custom">Blank Canvas (Custom Message)</option>
                        </select>

                        <div className="space-y-2">
                          <div>
                            <label htmlFor="dossier_comp_to" className="text-[9.5px] font-bold text-gray-500 block mb-1 uppercase font-mono">Recipient Email</label>
                            <input 
                              id="dossier_comp_to"
                              type="email" 
                              value={gmailRecipient}
                              onChange={(e) => setGmailRecipient(e.target.value)}
                              className="w-full bg-white border border-gray-200 text-xs rounded p-2 font-mono text-gray-800 outline-none focus:border-[#1B2A6B]"
                              placeholder="candidate@email.com"
                            />
                          </div>

                          <div>
                            <label htmlFor="dossier_comp_subj" className="text-[9.5px] font-bold text-gray-500 block mb-1 uppercase font-mono">Subject Header</label>
                            <input 
                              id="dossier_comp_subj"
                              type="text" 
                              value={gmailSubject}
                              onChange={(e) => setGmailSubject(e.target.value)}
                              className="w-full bg-white border border-gray-200 text-xs rounded p-2 text-gray-850 font-sans font-semibold outline-none focus:border-[#1B2A6B]"
                              placeholder="Application update..."
                            />
                          </div>

                          <div>
                            <div className="flex justify-between items-center mb-1">
                              <label htmlFor="dossier_comp_body" className="text-[9.5px] font-bold text-gray-500 uppercase font-mono">HTML Message Body</label>
                              <span className="text-[9.5px] text-gray-400 italic">Supports HTML layouts</span>
                            </div>
                            <textarea 
                              id="dossier_comp_body"
                              value={gmailBody}
                              onChange={(e) => setGmailBody(e.target.value)}
                              className="w-full h-44 bg-white border border-gray-201 text-xs rounded p-2.5 font-mono text-gray-800 outline-none focus:border-[#1B2A6B] resize-y"
                              placeholder="Dear Candidate..."
                            />
                          </div>
                        </div>

                        {gmailSendStatus !== "idle" && (
                          <div className={`p-3 rounded-md text-xs leading-relaxed font-mono ${
                            gmailSendStatus === "sending" ? "bg-blue-50 text-blue-800 border border-blue-200 animate-pulse" :
                            gmailSendStatus === "success" ? "bg-emerald-50 text-emerald-800 border border-emerald-200" :
                            "bg-red-50 text-red-800 border border-red-200"
                          }`}>
                            {gmailSendStatus === "sending" && (
                              <div className="flex items-center gap-1.5 font-bold">
                                <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-600" />
                                Transmitting MIME package over secure REST gateway...
                              </div>
                            )}
                            {gmailSendStatus === "success" && (
                              <div className="space-y-1">
                                <div className="font-bold flex items-center gap-1.5 text-emerald-750">
                                  <CheckCircle className="w-4 h-4 text-emerald-600" /> Message dispatched successfully!
                                </div>
                                <p className="text-[10px] text-emerald-600">{gmailSendResultMsg}</p>
                              </div>
                            )}
                            {gmailSendStatus === "error" && (
                              <div className="space-y-1">
                                <div className="font-bold text-red-750">Transmission failure!</div>
                                <p className="text-[10px] text-red-600">{gmailSendResultMsg}</p>
                              </div>
                            )}
                          </div>
                        )}

                        <button
                          type="button"
                          disabled={gmailLoading || gmailSendStatus === "sending"}
                          onClick={sendComposeGmail}
                          className="w-full py-2.5 bg-[#F26522] hover:bg-[#d45017] disabled:bg-gray-300 text-white font-bold rounded text-xs uppercase tracking-wider transition-colors flex items-center justify-center gap-2 hover:cursor-pointer shadow-sm font-mono"
                        >
                          <Send className="w-3.5 h-3.5" />
                          {gmailSendStatus === "sending" ? "Transmitting..." : "Send via connected Gmail"}
                        </button>
                      </div>
                    ) : (
                      <div className="border border-dashed border-gray-250 p-4 rounded-lg bg-gray-50/50 text-center space-y-2 select-none">
                        <Mail className="w-8 h-8 text-gray-300 mx-auto" />
                        <div className="text-xs font-bold text-gray-600">recruiter email correspondence offline</div>
                        <p className="text-[10.5px] text-gray-400 max-w-sm mx-auto leading-relaxed">
                          Link your Google Workspace Gmail account in the <strong className="text-[#1B2A6B] font-extrabold hover:underline cursor-pointer" onClick={() => setActiveTab("integrations")}>Integrations</strong> tab to instantly compose & dispatch custom answers, Zoom auditions, and checks directly from this screen.
                        </p>
                      </div>
                    )}
                  </div>

                </div>

                {/* Discard button */}
                <div className="p-4 border-t border-gray-150 bg-gray-50/50 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm({ type: activeTab === "interpreters" ? "interpreter" : "contact", id: selectedSub.id })}
                    className="w-full py-2.5 bg-red-100 hover:bg-red-650 hover:bg-red-600 text-red-700 hover:text-white border border-red-200 transition-colors rounded text-xs uppercase font-bold tracking-wider hover:cursor-pointer select-none flex items-center justify-center gap-2"
                  >
                    <Trash className="w-4 h-4" />
                    Discard & Purge Ledger
                  </button>
                </div>
              </div>
            ) : (
              /* REAL-TIME CANDIDATE LOG MONITOR SYSTEM LOG */
              <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden flex flex-col h-[520px]">
                
                {/* Header operations log */}
                <div className="p-5 border-b border-gray-200 bg-gray-50/50 flex justify-between items-center">
                  <div className="flex items-center gap-2 text-[#1B2A6B]">
                    <Terminal className="w-5 h-5 text-[#F26522]" />
                    <h3 className="font-serif font-bold text-sm uppercase tracking-wide">
                      Real-time candidates monitor log
                    </h3>
                  </div>
                  {/* Status Indicator blinking */}
                  <span className="flex items-center gap-1 text-[9px] font-bold text-emerald-700 font-mono">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping inline-block" /> ONLINE
                  </span>
                </div>

                {/* Subtitle helper */}
                <div className="p-3 bg-[#1B2A6B]/5 border-b border-gray-150 text-[10.5px] text-gray-600 leading-normal pl-4 font-serif italic">
                  Tapping table records or executing state actions appends direct cryptographic telemetry variables below.
                </div>

                {/* Actual Terminal Window console */}
                <div className="flex-grow bg-[#0D163D] text-[#A5B4FC] font-mono text-[10.5px] p-5 overflow-y-auto space-y-3 shadow-inner relative flex flex-col scrollbar-thin">
                  
                  {/* Background terminal overlay logo decor */}
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-5 select-none font-sans font-black text-6xl text-white">
                    VOZARA
                  </div>
                  
                  <div className="flex-grow space-y-2.5 relative z-10">
                    {/* Reverse listed so latest appears on bottom */}
                    {[...logs].reverse().map((lg) => {
                      let levelColor = "text-sky-400";
                      if (lg.level === "SUCCESS") levelColor = "text-emerald-400";
                      if (lg.level === "WARN") levelColor = "text-amber-400";
                      if (lg.level === "CRITICAL") levelColor = "text-red-400";

                      let serviceName = lg.service;

                      return (
                        <div key={lg.id} className="leading-relaxed hover:bg-white/5 p-1 rounded transition-colors break-words">
                          <span className="text-gray-500">[{lg.timestamp}]</span>&nbsp;
                          <span className={`font-bold ${levelColor}`}>[{serviceName}]</span>&nbsp;
                          <span className="text-gray-200">{lg.message}</span>
                        </div>
                      );
                    })}
                    <div ref={logsEndRef} />
                  </div>
                </div>

                {/* Footer console controller button */}
                <div className="p-4 border-t border-gray-150 bg-gray-50/50 flex justify-between items-center gap-3">
                  <div className="text-[10px] text-gray-400 font-mono">
                    Buffered: {logs.length} telemetry loops
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setLogs([
                        {
                          id: "clear_" + Date.now(),
                          timestamp: new Date().toLocaleTimeString(),
                          service: "SYSTEM",
                          level: "INFO",
                          message: "Security buffer cleared. Initializing system ledger loop..."
                        }
                      ]);
                      triggerSystemMessage("Local console buffer cleared.");
                    }}
                    className="p-1 px-3 border border-gray-200 hover:bg-gray-100 text-[#1B2A6B] font-bold text-[9.5px] uppercase tracking-wider rounded cursor-pointer select-none"
                  >
                    Clear Feed
                  </button>
                </div>

              </div>
            )}

          </div>

        </div>

              </div>
            )}

          </div>

        </div>

      </main>

      {/* Dossier details modal popup overlay */}
      {selectedSub && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-2xl bg-white border border-gray-200 rounded-xl shadow-2xl overflow-hidden relative flex flex-col max-h-[90vh]"
          >
            {/* Visual identity line */}
            <div className={`h-1.5 w-full ${activeTab === "interpreters" ? "bg-[#F26522]" : "bg-[#1B2A6B]"}`} />

            {/* Header info */}
            <div className="p-5 border-b border-gray-150 flex items-center justify-between bg-gray-50/35 shrink-0">
              <div className="max-w-[85%]">
                <span className="text-[9.5px] uppercase font-bold tracking-widest text-[#F26522] font-mono block">
                  {activeTab === "interpreters" ? "Linguist Credentials Dossier" : "Client Lead Requirements"}
                </span>
                <h3 className="font-serif text-lg font-bold text-[#1B2A6B] truncate mt-0.5" title={selectedSub.full_name}>
                  {selectedSub.full_name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedSub(null)}
                className="p-1.5 px-3 bg-gray-100 hover:bg-gray-250 hover:text-gray-900 border border-transparent rounded-md text-gray-450 cursor-pointer transition-all shrink-0 font-bold font-mono text-xs uppercase tracking-wider flex items-center gap-1.5"
                title="Close Details view"
              >
                <X className="w-4 h-4" /> Close
              </button>
            </div>

            {/* Body contents (scrollable area) */}
            <div className="p-6 overflow-y-auto space-y-5 text-xs text-gray-770 flex-grow scrollbar-thin">
              
              {/* General details ribbon */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 border border-gray-200 rounded-lg space-y-3 md:space-y-0 font-mono text-[11px] text-gray-800">
                <div>
                  <span className="text-[#1B2A6B] block uppercase font-bold text-[8.5px] tracking-widest mb-0.5">Submitter Email</span>
                  <a href={`mailto:${selectedSub.submitter_email}`} className="font-semibold text-gray-900 hover:underline break-all">
                    {selectedSub.submitter_email}
                  </a>
                </div>
                <div>
                  <span className="text-[#1B2A6B] block uppercase font-bold text-[8.5px] tracking-widest mb-0.5">Phone Line</span>
                  <a href={`tel:${selectedSub.phone}`} className="font-semibold text-gray-900 hover:underline">
                    {selectedSub.phone || "No phone supplied"}
                  </a>
                </div>
                <div>
                  <span className="text-[#1B2A6B] block uppercase font-bold text-[8.5px] tracking-widest mb-0.5">Location</span>
                  <div className="font-bold text-gray-950 flex items-center gap-1 font-sans">
                    <MapPin className="w-3.5 h-3.5 text-[#F26522] shrink-0" />
                    {selectedSub.location || "International Pool - Remote"}
                  </div>
                </div>
              </div>

              {activeTab === "interpreters" ? (
                /* CANDIDATE INFO FIELDS */
                <div className="space-y-4">
                  <div className="space-y-1">
                    <span className="text-gray-400 block uppercase font-bold text-[8.5px] tracking-widest font-mono font-mono">Qualifications Matrix</span>
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      <span className="px-2 py-1 bg-[#1B2A6B] text-white font-mono font-bold text-[9.5px] uppercase rounded">
                        {selectedSub.primary_language}
                      </span>
                      {selectedSub.interpreting_modes && (
                        <span className="px-2 py-1 bg-[#F26522]/10 border border-[#F26522]/20 text-[#D54F10] font-mono font-bold text-[9.5px] uppercase rounded">
                          {selectedSub.interpreting_modes}
                        </span>
                      )}
                    </div>
                    {selectedSub.additional_languages && (
                      <div className="text-[11px] text-gray-650 bg-gray-50 p-2.5 rounded border border-gray-150 mt-2">
                        <strong>Secondary matching:</strong> {selectedSub.additional_languages}
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-1">
                    <div>
                      <span className="text-[#1B2A6B] block uppercase font-bold text-[8.5px] tracking-widest font-mono font-mono">Experience</span>
                      <p className="text-sm font-sans font-black text-[#1B2A6B]">{selectedSub.experience_years || "0"} Years Practicing</p>
                    </div>
                    <div>
                      <span className="text-[#1B2A6B] block uppercase font-bold text-[8.5px] tracking-widest font-mono font-mono">Certifications</span>
                      <p className="text-xs font-semibold text-emerald-700 font-sans font-bold">{selectedSub.certifications || "General Qualification"}</p>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <span className="text-gray-400 block uppercase font-bold text-[8.5px] tracking-widest font-mono font-mono font-mono">Expertise domain alignment</span>
                    <p className="p-3 bg-gray-50 border border-gray-200 rounded font-sans italic text-gray-700">
                      {selectedSub.medical_legal_knowledge || "Standard conference translating"}
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <span className="text-gray-400 block uppercase font-bold text-[8.5px] tracking-widest font-mono font-mono font-mono">Hardware & Workspace environment</span>
                    <p className="p-3 bg-gray-50 border border-gray-200 rounded font-mono text-[10.5px] leading-relaxed text-gray-600">
                      {selectedSub.technical_setup || "No custom hardware profile submitted."}
                    </p>
                  </div>

                  {selectedSub.linkedin_or_portfolio && (
                    <div>
                      <span className="text-gray-400 block uppercase font-bold text-[8.5px] tracking-widest font-mono font-mono">Dossier Portfolio Link</span>
                      <a 
                        href={selectedSub.linkedin_or_portfolio} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="bg-gray-50 hover:bg-gray-100 border border-gray-200 p-2.5 rounded block text-[11px] font-mono break-all font-semibold text-[#F26522] flex items-center gap-1 hover:underline"
                      >
                        <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                        {selectedSub.linkedin_or_portfolio}
                      </a>
                    </div>
                  )}

                  {selectedSub.cv_name && (
                    <div className="space-y-2">
                      <span className="text-gray-400 block uppercase font-bold text-[8.5px] tracking-widest font-mono">Attached CV / Résumé</span>
                      <div className="bg-gray-50 border border-gray-200 p-3 rounded-lg flex items-center justify-between gap-3 font-sans">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="h-10 w-10 rounded bg-[#F26522]/10 text-[#F26522] flex items-center justify-center shrink-0 border border-[#F26522]/20">
                            <FileText className="w-5 h-5" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-gray-900 truncate" title={selectedSub.cv_name}>
                              {selectedSub.cv_name}
                            </p>
                            <p className="text-[10px] text-gray-500 font-mono">
                              {selectedSub.cv_size || "Unknown size"} &bull; Document File
                            </p>
                          </div>
                        </div>
                        
                        <button
                          type="button"
                          onClick={() => {
                            if (selectedSub.cv_base64) {
                              const link = document.createElement("a");
                              link.href = selectedSub.cv_base64.startsWith("data:") 
                                ? selectedSub.cv_base64 
                                : `data:application/pdf;base64,${selectedSub.cv_base64}`;
                              link.download = selectedSub.cv_name || "Resume.pdf";
                              document.body.appendChild(link);
                              link.click();
                              document.body.removeChild(link);
                              pushLog("SYSTEM", "SUCCESS", `Downloaded candidate resume: ${selectedSub.cv_name}`);
                            } else {
                              pushLog("SYSTEM", "WARN", "CV base64 payload is empty or corrupted.");
                            }
                          }}
                          className="px-3 py-1.5 bg-[#1B2A6B] hover:brightness-110 text-white font-bold text-[10px] uppercase tracking-wide rounded hover:cursor-pointer transition-all shadow-sm whitespace-nowrap shrink-0 flex items-center gap-1 font-mono"
                        >
                          Download CV
                        </button>
                      </div>
                    </div>
                  )}

                  {selectedSub.additional_info && (
                    <div className="space-y-1">
                      <span className="text-gray-400 block uppercase font-bold text-[8.5px] tracking-widest font-mono">Cover Note</span>
                      <p className="p-3 bg-gray-50 border border-gray-150 rounded leading-relaxed italic text-gray-650">
                        &ldquo;{selectedSub.additional_info}&rdquo;
                      </p>
                    </div>
                  )}

                  {/* SMTP Node captures preview */}
                  {selectedSub.email_sandbox_preview && (
                    <div className="pt-4 border-t border-gray-150 space-y-2">
                      <div className="flex justify-between items-center bg-purple-50 p-2 border border-purple-200 rounded">
                        <span className="text-[10px] font-bold text-purple-850 uppercase font-mono flex items-center gap-1 select-none">
                          <Mail className="w-3.5 h-3.5" /> Intercepted Mail Envelope
                        </span>
                        <a 
                          href={selectedSub.email_sandbox_preview} 
                          target="_blank"  
                          referrerPolicy="no-referrer"
                          rel="noreferrer" 
                          className="text-[10.5px] text-[#F26522] hover:underline font-bold flex items-center gap-0.5 cursor-pointer"
                        >
                          Open Raw HTML <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                      
                      {/* Live mail capture iframe */}
                      <div className="w-full h-52 rounded bg-gray-100 border border-gray-200 overflow-hidden relative">
                        <div className="absolute top-0 left-0 right-0 h-5 px-2 flex items-center text-[8px] text-gray-400 uppercase tracking-widest font-mono font-bold select-none">
                          SMTP Capture: careers@vozarals.com
                        </div>
                        <iframe 
                          src={selectedSub.email_sandbox_preview}
                          className="w-full h-full pt-5 bg-white" 
                          title="SMTP mailbox previewer" 
                        />
                      </div>
                    </div>
                  )}

                </div>
              ) : (
                /* CORPORATE LEAD DETAILS */
                <div className="space-y-4">
                  <div>
                    <span className="text-gray-400 block uppercase font-bold text-[8.5px] tracking-widest font-mono">Solutions demanded</span>
                    <span className="px-3 py-1 bg-[#1B2A6B] text-white rounded font-mono font-bold mt-1 text-[10px] uppercase inline-block">
                      {selectedSub.service || "Linguistic translation solution"}
                    </span>
                    {selectedSub.language_pair && (
                      <p className="text-[11px] mt-2.5 text-gray-600 font-mono">
                        Language combination required: <strong className="text-gray-900">{selectedSub.language_pair}</strong>
                      </p>
                    )}
                  </div>

                  {selectedSub.organization && (
                    <div className="space-y-1">
                      <span className="text-gray-400 block uppercase font-bold text-[8.5px] tracking-widest font-mono font-mono">Enterprise client organization</span>
                      <div className="p-3 bg-gray-50 border border-gray-200 rounded text-gray-800 font-serif font-bold text-sm flex items-center gap-2">
                        <Building className="w-4 h-4 text-[#F26522] shrink-0" />
                        {selectedSub.organization}
                      </div>
                    </div>
                  )}

                  <div className="space-y-1">
                    <span className="text-gray-400 block uppercase font-bold text-[8.5px] tracking-widest font-mono font-sans font-sans">Detailed requirement statement</span>
                    <p className="p-4 bg-gray-50 border border-gray-200 rounded italic leading-relaxed text-[#1B2A6B] font-serif text-[13.5px]">
                      &ldquo;{selectedSub.message}&rdquo;
                    </p>
                  </div>
                </div>
              )}

              {/* DIRECT RECRUITER CORRESPONDENCE GMAIL GATEWAY */}
              <div className="pt-4 border-t border-gray-200 space-y-3">
                <h4 className="text-[10px] uppercase font-bold tracking-widest text-[#1B2A6B] font-mono flex items-center gap-1 select-none">
                  <Mail className="w-3.5 h-3.5 text-[#F26522]" /> Recruiter Gmail Correspondence
                </h4>
                
                {gmailToken ? (
                  <div className="space-y-3 bg-gray-50 border border-gray-150 p-4 rounded-lg">
                    <div>
                      <label htmlFor="dossier_comp_temp" className="text-[9px] uppercase font-bold text-gray-500 block mb-1 font-mono">Select Email Template</label>
                      <select 
                        id="dossier_comp_temp"
                        value={gmailTemplate}
                        onChange={(e) => applyGmailTemplate(e.target.value, selectedSub.full_name, selectedSub)}
                        className="w-full bg-white border border-gray-200 text-xs rounded p-2 text-gray-700 font-mono outline-none focus:ring-1 focus:ring-[#1B2A6B]"
                      >
                        <option value="welcome">Welcome & Hardware Checkup</option>
                        <option value="interview">1-on-1 Audition Invitation</option>
                        <option value="documentation">Documentation Pending Notification</option>
                        <option value="custom">Blank Canvas (Custom Mail)</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <div>
                        <label htmlFor="dossier_comp_to" className="text-[8.5px] font-bold text-gray-450 block mb-0.5 uppercase font-mono">To</label>
                        <input 
                          id="dossier_comp_to"
                          type="email" 
                          value={gmailRecipient}
                          onChange={(e) => setGmailRecipient(e.target.value)}
                          className="w-full bg-white border border-gray-200 text-xs rounded p-2 font-mono text-gray-800 outline-none"
                          placeholder="candidate@email.com"
                        />
                      </div>

                      <div>
                        <label htmlFor="dossier_comp_subj" className="text-[8.5px] font-bold text-gray-455 block mb-0.5 uppercase font-mono">Subject</label>
                        <input 
                          id="dossier_comp_subj"
                          type="text" 
                          value={gmailSubject}
                          onChange={(e) => setGmailSubject(e.target.value)}
                          className="w-full bg-white border border-gray-200 text-xs font-serif font-bold rounded p-2 text-gray-800 outline-none focus:border-[#1B2A6B]"
                          placeholder="Application update..."
                        />
                      </div>

                      <div>
                        <label htmlFor="dossier_comp_body" className="text-[8.5px] font-bold text-gray-460 block mb-0.5 uppercase font-mono">HTML Message Body</label>
                        <textarea 
                          id="dossier_comp_body"
                          value={gmailBody}
                          onChange={(e) => setGmailBody(e.target.value)}
                          className="w-full h-32 bg-white border border-gray-211 text-[11px] rounded p-2.5 font-mono text-gray-800 outline-none focus:border-[#1B2A6B] resize-y"
                          placeholder="Dear Candidate..."
                        />
                      </div>
                    </div>

                    {gmailSendStatus !== "idle" && (
                      <div className={`p-3 rounded-md text-xs leading-relaxed font-mono ${
                        gmailSendStatus === "sending" ? "bg-blue-50 text-blue-800 border border-blue-200 animate-pulse" :
                        gmailSendStatus === "success" ? "bg-emerald-50 text-emerald-800 border border-emerald-200" :
                        "bg-red-50 text-red-800 border border-red-200"
                      }`}>
                        {gmailSendStatus === "sending" && "Transmitting MIME package over secure REST gateway..."}
                        {gmailSendStatus === "success" && (
                          <div className="space-y-0.5">
                            <span className="font-bold">&check; Message dispatched successfully!</span>
                            <p className="text-[10px] text-emerald-600">{gmailSendResultMsg}</p>
                          </div>
                        )}
                        {gmailSendStatus === "error" && (
                          <div className="space-y-0.5">
                            <span className="font-bold">Transmission failure!</span>
                            <p className="text-[10px] text-red-600">{gmailSendResultMsg}</p>
                          </div>
                        )}
                      </div>
                    )}

                    <button
                      type="button"
                      disabled={gmailLoading || gmailSendStatus === "sending"}
                      onClick={sendComposeGmail}
                      className="w-full py-2.5 bg-[#F26522] hover:bg-[#d45017] disabled:bg-gray-300 text-white font-bold rounded text-xs uppercase tracking-wider transition-colors flex items-center justify-center gap-1 hover:cursor-pointer shadow-sm font-mono"
                    >
                      <Send className="w-3.5 h-3.5" />
                      {gmailSendStatus === "sending" ? "Transmitting..." : "Send via connected Gmail"}
                    </button>
                  </div>
                ) : (
                  <div className="border border-dashed border-gray-200 p-4 rounded-lg bg-gray-50/50 text-center space-y-2 select-none">
                    <Mail className="w-7 h-7 text-gray-300 mx-auto" />
                    <div className="text-xs font-bold text-gray-500">recruiter email correspondence offline</div>
                    <p className="text-[10px] text-gray-400 max-w-sm mx-auto leading-relaxed">
                      Link your Google Workspace Gmail account in the <span className="text-[#1C2D6D] font-bold hover:underline cursor-pointer" onClick={() => setActiveTab("integrations")}>Integrations</span> tab to instantly compose & dispatch custom answers directly from this dashboard.
                    </p>
                  </div>
                )}
              </div>

            </div>

            {/* Discard button */}
            <div className="p-4 border-t border-gray-150 bg-gray-50/50 flex gap-2 shrink-0 animate-fade-in">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm({ type: activeTab === "interpreters" ? "interpreter" : "contact", id: selectedSub.id })}
                className="w-full py-2.5 bg-red-100 hover:bg-red-650 hover:bg-red-600 text-red-700 hover:text-white border border-red-200 transition-all rounded text-xs uppercase font-bold tracking-wider hover:cursor-pointer select-none flex items-center justify-center gap-2 font-mono"
              >
                <Trash className="w-4 h-4" />
                Discard & Purge Ledger
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Slack Integration live simulator modal popup */}
      {slackTestModalOpen && slackTestPayload && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-lg bg-[#1D1F23] text-[#D1D2D3] rounded-lg shadow-2xl border border-gray-700/60 overflow-hidden font-sans"
          >
            {/* Simulated Slack channel header bar */}
            <div className="bg-[#121417] p-4 px-5 border-b border-gray-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-[11.5px] font-black text-white uppercase bg-purple-700 px-2 py-0.5 rounded">SLACK</span>
                <span className="text-xs text-gray-400 font-bold">#leads-incoming</span>
              </div>
              <button 
                onClick={() => setSlackTestModalOpen(false)} 
                className="text-gray-500 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div className="flex items-start gap-3">
                {/* Slack notification icon */}
                <div className="w-9 h-9 rounded bg-[#F26522] text-white flex items-center justify-center text-xs font-black shrink-0 shadow-lg">
                  VZ
                </div>
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-white">Vozara Leads Dispatcher</span>
                    <span className="px-1.5 py-0.2 bg-gray-800 rounded font-bold text-[8.5px] text-gray-400 uppercase">APP</span>
                    <span className="text-[10px] text-gray-500">{new Date().toLocaleTimeString()}</span>
                  </div>
                  <p className="text-xs text-[#E8EAED] whitespace-pre-wrap leading-relaxed">
                    {slackTestPayload.text}
                  </p>
                  
                  {/* Attachment Block inside simulated Slack notification */}
                  <div className="border-l-4 border-l-[#F26522] bg-[#222529] p-3 rounded-r-md mt-2 space-y-2">
                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      {slackTestPayload.attachments[0].fields.map((f: any, idx: number) => (
                        <div key={idx}>
                          <span className="text-gray-500 block font-bold text-[9px] uppercase">{f.title}</span>
                          <span className="text-gray-200 font-mono">{f.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {simulatedWebhookSuccess ? (
                <div className="p-3 bg-emerald-950/40 border border-emerald-800 rounded-md text-emerald-400 text-center text-xs font-medium flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-4 h-4 animate-bounce" />
                  Hook package dispatched successfully to {integrations.slackWebhook}
                </div>
              ) : (
                <div className="text-xs text-gray-400 bg-[#292D32]/40 p-3 rounded leading-relaxed border border-gray-800 italic">
                  Note: Clicking "Dispatch Payload" below emulates making a REST request containing this formatted markdown text block to your Slack integrations link.
                </div>
              )}
            </div>

            <div className="p-4 bg-[#121417]/85 border-t border-gray-800 flex justify-end gap-2.5">
              <button
                onClick={() => setSlackTestModalOpen(false)}
                className="p-1.5 px-4 bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold text-xs uppercase tracking-wider rounded duration-150 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={dispatchSlackTestWebhook}
                disabled={simulatedWebhookSuccess}
                className="p-1.5 px-4 bg-purple-700 hover:bg-purple-600 text-white font-bold text-xs uppercase tracking-wider rounded duration-150 cursor-pointer disabled:opacity-40"
              >
                Dispatch Hook Payload &rarr;
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Delete confirmation modal overlay */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md bg-white border border-gray-200 rounded-lg p-6 space-y-4 shadow-2xl relative"
          >
            {/* Orange trim line */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-[#F26522] rounded-t-lg" />

            <div className="flex items-center gap-3 text-red-650 border-b border-gray-150 pb-3">
              <ShieldAlert className="w-6 h-6 text-red-650 shrink-0" />
              <h3 className="text-sm font-serif font-black uppercase text-gray-900 tracking-wider">
                Irreversible Database Prune
              </h3>
            </div>
            
            <p className="text-xs text-gray-600 leading-relaxed">
              You are about to permanently delete record ID <code className="bg-gray-100 border border-gray-200 px-1 py-0.5 rounded text-red-600 font-mono text-[11px] block mt-1.5 font-bold select-all">{showDeleteConfirm.id}</code> from {firebaseConnected ? "Cloud Firestore and " : ""}local sandbox operational cache.
            </p>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(null)}
                className="w-1/2 py-2.5 border border-gray-250 bg-white hover:bg-gray-50 text-gray-500 hover:text-gray-900 text-xs font-bold uppercase tracking-wider rounded-md cursor-pointer select-none"
              >
                Cancel, Retain
              </button>
              <button
                type="button"
                onClick={() => handleDelete(showDeleteConfirm.type as any, showDeleteConfirm.id)}
                className="w-1/2 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold uppercase tracking-wider rounded-md cursor-pointer select-none"
              >
                Yes, Purge Record
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Footer Branding Area */}
      <footer className="bg-gray-100 border-t border-gray-200 py-8 px-6 text-center text-gray-500 text-xs font-mono">
        <div>
          Vozara Secure Admin Portal v2.1.0 &bull; Handshake TLS Active &bull; Running Node.js Cloud Sandboxing Environment
        </div>
        <div className="text-[10px] text-gray-400 mt-1">
          Authorized User Session: {sessionStorage.getItem("vozara_sandbox_admin_token") ? "ADMIN_PREVIEW_RECRUITS_APPROVED_2026" : "OFFLINE"}
        </div>
      </footer>

    </div>
  );
}
