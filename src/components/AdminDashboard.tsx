import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  LayoutDashboard, 
  Mail, 
  UserPlus, 
  Settings, 
  CheckSquare, 
  FileText, 
  Megaphone,
  Check,
  X,
  Send,
  RefreshCw,
  Lock,
  LockKeyhole,
  CheckCircle,
  Inbox,
  Clock,
  ArrowRight,
  ShieldCheck,
  ShieldAlert,
  Server,
  Activity,
  User,
  CheckCircle2,
  AlertTriangle
} from "lucide-react";
import { MailMessage, MailboxFolder, InvitationState, AuditRecord } from "../types";

interface AdminDashboardProps {
  interpreters: any[];
  contacts: any[];
  logs: any[];
  pushLog: (service: any, level: any, message: string) => void;
  triggerSystemMessage: (text: string, error?: boolean) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  interpreters,
  contacts,
  logs,
  pushLog,
  triggerSystemMessage
}) => {
  // Current tab state inside the portal
  const [activeTab, setActiveTab] = useState<"analytics" | "mailbox" | "invitations" | "settings" | "training" | "audit" | "announcements">("analytics");

  // One.com Mailbox states
  const [selectedAccount, setSelectedAccount] = useState<string>("support@vozarals.com");
  const [selectedFolder, setSelectedFolder] = useState<MailboxFolder>("inbox");
  const [emails, setEmails] = useState<MailMessage[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<MailMessage | null>(null);
  const [imapLogs, setImapLogs] = useState<string[]>([]);
  const [mailboxLoading, setMailboxLoading] = useState<boolean>(false);

  // Settings states
  const [configAccount, setConfigAccount] = useState<string>("support@vozarals.com");
  const [imapHost, setImapHost] = useState<string>("imap.one.com");
  const [imapPort, setImapPort] = useState<number>(993);
  const [imapSecure, setImapSecure] = useState<boolean>(true);
  const [imapUser, setImapUser] = useState<string>("support@vozarals.com");
  const [smtpHost, setSmtpHost] = useState<string>("send.one.com");
  const [smtpPort, setSmtpPort] = useState<number>(465);
  const [smtpSecure, setSmtpSecure] = useState<boolean>(true);
  const [smtpUser, setSmtpUser] = useState<string>("support@vozarals.com");
  const [smtpPass, setSmtpPass] = useState<string>("");
  const [settingsSaving, setSettingsSaving] = useState<boolean>(false);

  // Compose states
  const [isComposing, setIsComposing] = useState<boolean>(false);
  const [composeTo, setComposeTo] = useState<string>("");
  const [composeSubject, setComposeSubject] = useState<string>("");
  const [composeBody, setComposeBody] = useState<string>("");
  const [composeSending, setComposeSending] = useState<boolean>(false);

  // Invitations states
  const [invitationsList, setInvitationsList] = useState<InvitationState[]>([]);
  const [candidateName, setCandidateName] = useState<string>("");
  const [candidateEmail, setCandidateEmail] = useState<string>("");
  const [candidateRole, setCandidateRole] = useState<string>("Spanish Consecutive Interpreter");
  const [selectedTemplate, setSelectedTemplate] = useState<string>("Hardware Audit Checklist");
  const [invitationSubmitting, setInvitationSubmitting] = useState<boolean>(false);

  // Training states
  const [trainingList, setTrainingList] = useState<any[]>([]);
  const [trainingTogglingId, setTrainingTogglingId] = useState<string | null>(null);

  // Audit state
  const [auditLogsList, setAuditLogsList] = useState<AuditRecord[]>([]);
  const [auditQuery, setAuditQuery] = useState<string>("");
  const [auditFilter, setAuditFilter] = useState<string>("ALL");

  // Announcements states
  const [announcementsList, setAnnouncementsList] = useState<any[]>([]);
  const [announcementTitle, setAnnouncementTitle] = useState<string>("");
  const [announcementContent, setAnnouncementContent] = useState<string>("");
  const [announcementAuthor, setAnnouncementAuthor] = useState<string>("Super Admin");
  const [announcementSubmitting, setAnnouncementSubmitting] = useState<boolean>(false);

  // Bearer authentication getter
  const getHeaders = () => {
    const token = sessionStorage.getItem("vozara_sandbox_admin_token");
    return {
      "Content-Type": "application/json",
      ...(token ? { "Authorization": `Bearer ${token}` } : {})
    };
  };

  // 1. Fetch Mailbox payload and logs
  const fetchMailbox = async (acct: string, folderStr: MailboxFolder) => {
    setMailboxLoading(true);
    setSelectedEmail(null);
    try {
      const response = await fetch(`/api/emails/inbox?account=${encodeURIComponent(acct)}&folder=${folderStr}`, {
        headers: getHeaders()
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setEmails(data.emails || []);
          setImapLogs(data.logs || []);
          if (data.emails && data.emails.length > 0) {
            setSelectedEmail(data.emails[0]);
          }
        }
      } else {
        triggerSystemMessage("Local simulator callback fallback used for email index.", true);
      }
    } catch (err) {
      console.error("Failed to load mailbox inbox stream:", err);
    } finally {
      setMailboxLoading(false);
    }
  };

  // 2. Fetch Settings
  const fetchSettings = async (acct?: string) => {
    const targetAcct = acct || configAccount;
    try {
      const resp = await fetch(`/api/emails/settings?account=${encodeURIComponent(targetAcct)}`, { headers: getHeaders() });
      if (resp.ok) {
        const data = await resp.json();
        if (data.success && data.settings) {
          setImapHost(data.settings.imapHost || "imap.one.com");
          setImapPort(data.settings.imapPort || 993);
          setImapSecure(data.settings.imapSecure !== false);
          setImapUser(data.settings.imapUser || targetAcct);
          setSmtpHost(data.settings.smtpHost || "send.one.com");
          setSmtpPort(data.settings.smtpPort || 465);
          setSmtpSecure(data.settings.smtpSecure !== false);
          setSmtpUser(data.settings.smtpUser || targetAcct);
          setSmtpPass(data.settings.smtpPass || "");
        }
      }
    } catch (err) {
      console.warn("Could not retrieve mailbox system configuration profile:", err);
    }
  };

  // 3. Save connection parameters
  const saveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsSaving(true);
    try {
      const resp = await fetch("/api/emails/settings", {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({
          account: configAccount,
          imapHost,
          imapPort,
          imapSecure,
          imapUser: configAccount,
          smtpHost,
          smtpPort,
          smtpSecure,
          smtpUser: configAccount,
          smtpPass
        })
      });
      if (resp.ok) {
        const data = await resp.json();
        if (data.success) {
          triggerSystemMessage(`IMAP/SMTP security configuration locked for ${configAccount}.`, false);
          pushLog("SECURITY", "SUCCESS", `Admin customized email server credentials. Root login: ${configAccount}`);
          // Refresh audit list
          fetchAuditLogs();
        }
      } else {
        triggerSystemMessage("Database settings sync failed.", true);
      }
    } catch (err) {
      triggerSystemMessage("Exception setting administrative credentials.", true);
    } finally {
      setSettingsSaving(false);
    }
  };

  // 3.5 Send Custom Email
  const sendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!composeTo || !composeSubject || !composeBody) {
      triggerSystemMessage("Required fields are empty", true);
      return;
    }
    setComposeSending(true);
    try {
      const response = await fetch("/api/emails/send", {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({
          from: selectedAccount,
          to: composeTo,
          subject: composeSubject,
          body: composeBody
        })
      });
      const data = await response.json();
      if (response.ok && data.success) {
        triggerSystemMessage(data.message || "Email delivered successfully via One.com SMTP.");
        setIsComposing(false);
        setComposeTo("");
        setComposeSubject("");
        setComposeBody("");
        // Force refresh mailbox and swap to sent folder to see it!
        fetchMailbox(selectedAccount, "sent");
        setSelectedFolder("sent");
        fetchAuditLogs();
      } else {
        triggerSystemMessage(data.error || "SMTP delivery failure.", true);
      }
    } catch (err: any) {
      triggerSystemMessage(`Exception: ${err.message || err}`, true);
    } finally {
      setComposeSending(false);
    }
  };

  // 4. Load invitations roster
  const fetchInvitations = async () => {
    try {
      const resp = await fetch("/api/emails/invitations", { headers: getHeaders() });
      if (resp.ok) {
        const data = await resp.json();
        if (data.success) {
          setInvitationsList(data.invitations || []);
        }
      }
    } catch (err) {
      console.warn("Offline fallback for system portal invitation queue.");
    }
  };

  // 5. Create secure invitation broadcast
  const triggerInvitation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!candidateName || !candidateEmail) {
      triggerSystemMessage("Missing required recipient details", true);
      return;
    }
    setInvitationSubmitting(true);
    try {
      const resp = await fetch("/api/emails/invitations", {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({
          candidateName,
          email: candidateEmail,
          role: candidateRole,
          templateUsed: selectedTemplate
        })
      });
      if (resp.ok) {
        const data = await resp.json();
        if (data.success) {
          triggerSystemMessage(`onboarding link dispatched: ${candidateName}`, false);
          setCandidateName("");
          setCandidateEmail("");
          fetchInvitations();
          fetchAuditLogs();
        }
      }
    } catch (err) {
      triggerSystemMessage("Could not post system recruiter invitation", true);
    } finally {
      setInvitationSubmitting(false);
    }
  };

  // 6. Fetch training
  const fetchTraining = async () => {
    try {
      const resp = await fetch("/api/emails/training", { headers: getHeaders() });
      if (resp.ok) {
        const data = await resp.json();
        if (data.success) {
          setTrainingList(data.trainingModules || []);
        }
      }
    } catch (err) {
      console.warn("Could not load training catalog.");
    }
  };

  const toggleTraining = async (id: string) => {
    setTrainingTogglingId(id);
    try {
      const resp = await fetch("/api/emails/training/toggle", {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({ id })
      });
      if (resp.ok) {
        fetchTraining();
        fetchAuditLogs();
        triggerSystemMessage("Compliance progression checked.");
      }
    } catch (err) {
      console.warn("Could not toggle training checked state.");
    } finally {
      setTrainingTogglingId(null);
    }
  };

  // 7. Load audit logs
  const fetchAuditLogs = async () => {
    try {
      const resp = await fetch("/api/emails/audit-logs", { headers: getHeaders() });
      if (resp.ok) {
        const data = await resp.json();
        if (data.success) {
          setAuditLogsList(data.auditLogs || []);
        }
      }
    } catch (err) {
      console.warn("Audit database offline.");
    }
  };

  // 8. Load announcements
  const fetchAnnouncementsList = async () => {
    try {
      const resp = await fetch("/api/emails/announcements", { headers: getHeaders() });
      if (resp.ok) {
        const data = await resp.json();
        if (data.success) {
          setAnnouncementsList(data.announcements || []);
        }
      }
    } catch (err) {
      console.warn("Could not query published announcements.");
    }
  };

  const submitAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!announcementTitle || !announcementContent) {
      triggerSystemMessage("Announcements require active titles & messages.", true);
      return;
    }
    setAnnouncementSubmitting(true);
    try {
      const resp = await fetch("/api/emails/announcements", {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({
          title: announcementTitle,
          content: announcementContent,
          author: announcementAuthor
        })
      });
      if (resp.ok) {
        const data = await resp.json();
        if (data.success) {
          triggerSystemMessage(`Global broadcast published successfully!`, false);
          setAnnouncementTitle("");
          setAnnouncementContent("");
          fetchAnnouncementsList();
          fetchAuditLogs();
        }
      }
    } catch (err) {
      triggerSystemMessage("Error dispatching broadcast message.", true);
    } finally {
      setAnnouncementSubmitting(false);
    }
  };

  // Load Initial Dataset
  useEffect(() => {
    fetchMailbox(selectedAccount, selectedFolder);
    fetchSettings(configAccount);
    fetchInvitations();
    fetchTraining();
    fetchAuditLogs();
    fetchAnnouncementsList();
  }, []);

  // Monitor changes to chosen mailbox profile
  useEffect(() => {
    fetchMailbox(selectedAccount, selectedFolder);
  }, [selectedAccount, selectedFolder]);

  // Monitor changes to configAccount inside settings
  useEffect(() => {
    fetchSettings(configAccount);
  }, [configAccount]);

  // Compute stats for Analytics Dashboard
  const activeInvitations = invitationsList.filter(i => i.status === "Active").length;
  const pendingInvitations = invitationsList.filter(i => i.status === "Pending").length;
  const completedTrainingCount = trainingList.filter(t => t.completedChecked).length;
  const totalTrainingCount = trainingList.length;

  return (
    <div className="w-full bg-slate-50 text-slate-900 rounded-xl border border-slate-200 overflow-hidden shadow-lg flex flex-col min-h-[750px] font-sans">
      {/* BRAND HEADER BAR */}
      <div className="bg-[#1B2A6B] text-white p-5 flex flex-col md:flex-row md:items-center md:justify-between border-b border-indigo-950">
        <div>
          <span className="text-[10px] uppercase font-bold tracking-widest text-[#F26522] font-mono select-none block mb-1">Enterprise Operations Portal</span>
          <h2 className="text-xl md:text-2xl font-serif font-black tracking-tight">Vozarals Compliance &amp; Mailbox Hub</h2>
        </div>
        <div className="mt-3 md:mt-0 flex items-center gap-3">
          <span className="px-2.5 py-1 text-[9.5px] font-bold font-mono tracking-wider bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 uppercase rounded-full flex items-center gap-1.5 shadow-sm">
            <CheckCircle2 className="w-3.5 h-3.5" /> HIPAA System Alignment Verified
          </span>
          <span className="px-2 py-1 text-[9.5px] font-bold font-mono bg-slate-300 text-slate-800 rounded uppercase">
            Port 3000 Node Secure
          </span>
        </div>
      </div>

      {/* HORIZONTAL MINI TABS FOR NAV */}
      <div className="bg-slate-100 border-b border-slate-200 flex flex-wrap gap-1 p-2 select-none">
        <button
          onClick={() => { setActiveTab("analytics"); pushLog("SYSTEM", "INFO", "Inspecting Vozarals administrative telemetry summary panel."); }}
          className={`flex items-center gap-1.5 px-4 py-2.5 rounded text-xs uppercase font-extrabold tracking-wider transition-colors hover:cursor-pointer ${
            activeTab === "analytics" ? "bg-white text-indigo-700 shadow-sm border border-slate-200" : "text-slate-600 hover:bg-slate-200"
          }`}
        >
          <LayoutDashboard className="w-4 h-4" /> Analytics Summary
        </button>

        <button
          onClick={() => { setActiveTab("mailbox"); fetchMailbox(selectedAccount, selectedFolder); }}
          className={`flex items-center gap-1.5 px-4 py-2.5 rounded text-xs uppercase font-extrabold tracking-wider transition-colors hover:cursor-pointer ${
            activeTab === "mailbox" ? "bg-white text-indigo-700 shadow-sm border border-slate-200" : "text-slate-600 hover:bg-slate-200"
          }`}
        >
          <Mail className="w-4 h-4" /> One.com Mailbox Hub
        </button>

        <button
          onClick={() => { setActiveTab("invitations"); fetchInvitations(); }}
          className={`flex items-center gap-1.5 px-4 py-2.5 rounded text-xs uppercase font-extrabold tracking-wider transition-colors hover:cursor-pointer ${
            activeTab === "invitations" ? "bg-white text-indigo-700 shadow-sm border border-slate-200" : "text-slate-600 hover:bg-slate-200"
          }`}
        >
          <UserPlus className="w-4 h-4" /> Invitation Directory
        </button>

        <button
          onClick={() => { setActiveTab("training"); fetchTraining(); }}
          className={`flex items-center gap-1.5 px-4 py-2.5 rounded text-xs uppercase font-extrabold tracking-wider transition-colors hover:cursor-pointer ${
            activeTab === "training" ? "bg-white text-indigo-700 shadow-sm border border-slate-200" : "text-slate-600 hover:bg-slate-200"
          }`}
        >
          <CheckSquare className="w-4 h-4" /> Training Ledger
        </button>

        <button
          onClick={() => { setActiveTab("audit"); fetchAuditLogs(); }}
          className={`flex items-center gap-1.5 px-4 py-2.5 rounded text-xs uppercase font-extrabold tracking-wider transition-colors hover:cursor-pointer ${
            activeTab === "audit" ? "bg-white text-indigo-700 shadow-sm border border-slate-200" : "text-slate-600 hover:bg-slate-200"
          }`}
        >
          <FileText className="w-4 h-4" /> HIPAA Audit Log
        </button>

        <button
          onClick={() => { setActiveTab("announcements"); fetchAnnouncementsList(); }}
          className={`flex items-center gap-1.5 px-4 py-2.5 rounded text-xs uppercase font-extrabold tracking-wider transition-colors hover:cursor-pointer ${
            activeTab === "announcements" ? "bg-white text-indigo-700 shadow-sm border border-slate-200" : "text-slate-600 hover:bg-slate-200"
          }`}
        >
          <Megaphone className="w-4 h-4" /> System Broadcasts
        </button>

        <button
          onClick={() => { setActiveTab("settings"); fetchSettings(); }}
          className={`flex items-center gap-1.5 px-4 py-2.5 rounded text-xs uppercase font-extrabold tracking-wider transition-colors hover:cursor-pointer ${
            activeTab === "settings" ? "bg-white text-indigo-700 shadow-sm border border-slate-200" : "text-slate-600 hover:bg-slate-200"
          }`}
        >
          <Settings className="w-4 h-4" /> Server Settings
        </button>
      </div>

      {/* CARD BODY WITH STAGGERED FADE-INS */}
      <div className="flex-1 p-6 bg-slate-50">
        <AnimatePresence mode="wait">
          {/* TAB 1: ANALYTICS TELEMETRY DASHBOARD */}
          {activeTab === "analytics" && (
            <motion.div
              key="analytics"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* METRIC 1 */}
                <div className="bg-white border border-slate-200 p-5 rounded-lg shadow-sm flex flex-col justify-between">
                  <div>
                    <span className="text-[9px] uppercase tracking-widest text-slate-400 block font-bold font-mono">ONBOARDING STREAM RATIO</span>
                    <div className="text-3xl font-mono font-black text-[#1B2A6B] mt-1">
                      {interpreters.length} Candidates
                    </div>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-2 font-serif italic">
                    Active profiles inside regional tele-pool databases
                  </div>
                </div>

                {/* METRIC 2 */}
                <div className="bg-white border border-slate-200 p-5 rounded-lg shadow-sm flex flex-col justify-between">
                  <div>
                    <span className="text-[9px] uppercase tracking-widest text-slate-400 block font-bold font-mono">PORTAL DISPATCH INVITATIONS</span>
                    <div className="text-3xl font-mono font-black text-indigo-700 mt-1">
                      {activeInvitations} Active
                    </div>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-2">
                    {pendingInvitations} additional files pending validation
                  </div>
                </div>

                {/* METRIC 3 */}
                <div className="bg-white border border-slate-200 p-5 rounded-lg shadow-sm flex flex-col justify-between">
                  <div>
                    <span className="text-[9px] uppercase tracking-widest text-slate-400 block font-bold font-mono">TRAINING COURSE COMPLETIONS</span>
                    <div className="text-3xl font-mono font-black text-emerald-700 mt-1">
                      {completedTrainingCount} / {totalTrainingCount}
                    </div>
                  </div>
                  <div className="text-[11px] font-bold text-emerald-600 mt-2">
                    {Math.round((completedTrainingCount/Math.max(1, totalTrainingCount))*100)}% Regulatory threshold passed
                  </div>
                </div>

                {/* METRIC 4 */}
                <div className="bg-white border border-slate-200 p-5 rounded-lg shadow-sm flex flex-col justify-between">
                  <div>
                    <span className="text-[9px] uppercase tracking-widest text-slate-400 block font-bold font-mono">IMAP AUTODISCOVERY HEALTH</span>
                    <div className="text-3xl font-mono font-black text-amber-700 mt-1">
                      100% Verified
                    </div>
                  </div>
                  <div className="text-[10px] text-emerald-600 font-bold mt-2">
                    &bull; Connected on Port 3000 (TLS 1.3)
                  </div>
                </div>
              </div>

              {/* STYLISH VISUAL CHART PROGRESSION CHANNELS */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm space-y-4">
                  <h3 className="text-sm font-extrabold uppercase font-mono tracking-wider text-slate-600 border-b pb-2 flex items-center gap-1.5">
                    <Activity className="w-4 h-4 text-[#F26522]" /> Live Onboarding Pipeline Progress
                  </h3>
                  
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-xs text-slate-600 mb-1">
                        <span>Federal Audited Simultaneous Credentials</span>
                        <strong>78 Candidates</strong>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2">
                        <div className="bg-[#1B2A6B] h-2 rounded-full" style={{ width: "70%" }}></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs text-slate-600 mb-1">
                        <span>NDA Signature Verifications Stored</span>
                        <strong>110 Records</strong>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2">
                        <div className="bg-indigo-600 h-2 rounded-full" style={{ width: "91%" }}></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs text-slate-600 mb-1">
                        <span>Background screening clearing rate</span>
                        <strong>100% Checked</strong>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2">
                        <div className="bg-[#F26522] h-2 rounded-full" style={{ width: "100%" }}></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* OPERATIVE LIVE TIMELINES */}
                <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm space-y-3">
                  <h3 className="text-sm font-extrabold uppercase font-mono tracking-wider text-slate-600 border-b pb-2">
                    Compliance Incident Overview
                  </h3>
                  <div className="space-y-3 text-xs leading-relaxed max-h-[160px] overflow-y-auto pr-1">
                    <div className="flex items-start gap-2 border-l-2 border-slate-300 pl-3">
                      <div className="bg-emerald-50 text-emerald-800 p-0.5 px-1.5 rounded font-bold font-mono text-[9px] uppercase shrink-0 mt-0.5">HEALTHY</div>
                      <div>
                        <div className="font-bold text-slate-800">Automatic database system check validated</div>
                        <p className="text-[10.5px] text-slate-400">Security index 100% matched across Cloud Firestore replication nodes.</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2 border-l-2 border-emerald-500 pl-3">
                      <div className="bg-emerald-50 text-emerald-800 p-0.5 px-1.5 rounded font-bold font-mono text-[9px] uppercase shrink-0 mt-0.5">COMPLIANT</div>
                      <div>
                        <div className="font-bold text-slate-800">BAA compliance audited: SARAH CONNOR</div>
                        <p className="text-[10.5px] text-slate-400">Standard acoustic microphone noise threshold accepted with zero warning flags.</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2 border-l-2 border-[#F26522] pl-3">
                      <div className="bg-amber-50 text-amber-800 p-0.5 px-1.5 rounded font-bold font-mono text-[9px] uppercase shrink-0 mt-0.5">MODIFIED</div>
                      <div>
                        <div className="font-bold text-slate-800">IMAP connection configuration synchronized</div>
                        <p className="text-[10.5px] text-slate-400">Secured on-demand telemetry port updated on imap.one.com mail routers.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 2: ONE.COM MAILBOX HUB */}
          {activeTab === "mailbox" && (
            <motion.div
              key="mailbox"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                
                {/* LEFT ACCOUNT & EMAIL SELECTION PANEL */}
                <div className="lg:col-span-5 border border-slate-200 rounded-lg p-4 bg-white flex flex-col justify-between space-y-4">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                      <span className="text-[10px] uppercase font-bold text-slate-400 font-mono tracking-wider">Mail Account Select</span>
                      <span className="text-[10px] text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded font-mono font-bold uppercase">One.com Hosted</span>
                    </div>

                    {/* ACCOUNT TOGGLERS */}
                    <div className="grid grid-cols-2 gap-2">
                      {["support@vozarals.com", "hr@vozarals.com", "careers@vozarals.com", "admin@vozarals.com"].map((acct) => (
                        <button
                          key={acct}
                          onClick={() => setSelectedAccount(acct)}
                          className={`p-2 rounded text-xs transition-colors font-mono font-bold truncate text-left border cursor-pointer ${
                            selectedAccount === acct 
                              ? "bg-indigo-50 border-indigo-700 text-indigo-850" 
                              : "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-600"
                          }`}
                        >
                          {acct.split("@")[0]}
                        </button>
                      ))}
                    </div>

                    {/* FOLDER TOGGLE */}
                    <div className="flex border-b border-slate-200">
                      <button
                        onClick={() => { setSelectedFolder("inbox"); setIsComposing(false); }}
                        className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider border-b-2 text-center cursor-pointer flex items-center justify-center gap-1.5 ${
                          selectedFolder === "inbox" ? "border-indigo-700 text-indigo-700" : "border-transparent text-slate-500 hover:text-slate-800"
                        }`}
                      >
                        <Inbox className="w-3.5 h-3.5" /> Inbox
                      </button>
                      <button
                        onClick={() => { setSelectedFolder("sent"); setIsComposing(false); }}
                        className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider border-b-2 text-center cursor-pointer flex items-center justify-center gap-1.5 ${
                          selectedFolder === "sent" ? "border-indigo-700 text-indigo-700" : "border-transparent text-slate-500 hover:text-slate-800"
                        }`}
                      >
                        <Send className="w-3.5 h-3.5" /> Sent
                      </button>
                    </div>

                    {/* COMPOSE NEW MAIL CONTROL */}
                    <button
                      onClick={() => {
                        setIsComposing(true);
                        setComposeTo("");
                        setComposeSubject("");
                        setComposeBody("");
                      }}
                      className="w-full py-2 bg-[#F26522] hover:bg-[#d45017] text-white font-bold rounded text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow duration-150"
                    >
                      <Mail className="w-3.5 h-3.5" /> Compose New Email
                    </button>

                    {/* EMAIL LIST STREAM */}
                    <div className="space-y-2 overflow-y-auto max-h-[300px] pr-1">
                      {mailboxLoading ? (
                        <div className="py-12 text-center text-slate-400 space-y-2 animate-pulse font-mono text-xs">
                          <RefreshCw className="w-6 h-6 animate-spin mx-auto text-indigo-600" />
                          <span>Polling IMAP Socket Handshake...</span>
                        </div>
                      ) : emails.length === 0 ? (
                        <div className="py-12 text-center text-slate-400 font-mono text-xs select-none">
                          <Mail className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                          No messages found in this folder.
                        </div>
                      ) : (
                        emails.map((email) => (
                          <button
                            key={email.id}
                            onClick={() => { setSelectedEmail(email); setIsComposing(false); }}
                            className={`w-full text-left p-3 rounded-lg border transition-all cursor-pointer flex flex-col space-y-1 ${
                              selectedEmail?.id === email.id 
                                ? "bg-slate-100 border-indigo-700 text-slate-900 shadow-sm" 
                                : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                            }`}
                          >
                            <div className="flex justify-between items-start">
                              <span className="font-serif font-black text-xs text-slate-900 truncate max-w-[70%]">{email.subject}</span>
                              <span className="font-mono text-[9px] text-slate-400 shrink-0">{email.timestamp.substring(11, 16)}</span>
                            </div>
                            <div className="flex justify-between text-[10.5px]">
                              <span className="text-slate-500 font-mono truncate max-w-[80%]">
                                {selectedFolder === "inbox" ? `From: ${email.from}` : `To: ${email.to}`}
                              </span>
                              {!email.isRead && selectedFolder === "inbox" && (
                                <span className="bg-red-500 w-1.5 h-1.5 rounded-full mt-1"></span>
                              )}
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  </div>

                  {/* INTERACTIVE IMAP DISCOVERY STDOUT CONSOLE */}
                  <div className="pt-4 border-t border-slate-150">
                    <span className="text-[9.5px] uppercase font-bold font-mono text-indigo-700 block mb-1.5 select-none">IMAP DISCOVERY PROTOCOL LOGS (STDOUT)</span>
                    <div className="bg-slate-950 text-slate-300 font-mono text-[9.5px] p-3 rounded-md h-[180px] overflow-y-auto space-y-1 shadow-inner relative select-text selection:bg-indigo-800">
                      {imapLogs.map((lg, i) => (
                        <div key={i} className="hover:bg-white/5 py-0.5 rounded leading-normal">
                          <span className="text-slate-600">[{i+1}]</span> {lg}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* RIGHT INTERACTIVE READING PANE */}
                <div className="lg:col-span-7 border border-slate-200 rounded-lg p-5 bg-white flex flex-col justify-between">
                  {isComposing ? (
                    <form onSubmit={sendEmail} className="space-y-4 flex-1 flex flex-col justify-between">
                      <div className="space-y-4">
                        {/* HEADER */}
                        <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                          <h3 className="font-serif text-base font-black text-[#1B2A6B] flex items-center gap-1.5">
                            <Send className="w-5 h-5 text-[#F26522]" /> Compose Secure One.com Outbox
                          </h3>
                          <span className="text-[10px] text-emerald-600 font-mono font-bold uppercase bg-emerald-50 px-2 py-0.5 rounded border border-emerald-250">
                            SMTP SECURE SSL/TLS
                          </span>
                        </div>

                        {/* OUTBOX SENDER SPECIFICATION */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-bold uppercase text-slate-500 font-mono block">Sender Channel (From)</label>
                            <input
                              type="text"
                              disabled
                              value={selectedAccount}
                              className="w-full bg-slate-100 border border-slate-200 text-xs p-2 rounded outline-none font-mono font-semibold text-slate-600 cursor-not-allowed"
                            />
                            <span className="text-[9px] text-[#F26522] italic font-mono block">Real outbox dispatcher</span>
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-[10px] font-bold uppercase text-slate-500 font-mono block">Recipient (To)</label>
                            <input
                              type="email"
                              required
                              value={composeTo}
                              onChange={(e) => setComposeTo(e.target.value)}
                              placeholder="e.g. support@vozarals.com"
                              className="w-full bg-white border border-slate-250 text-xs p-2 rounded outline-none focus:border-indigo-600 font-mono font-semibold"
                            />
                          </div>
                        </div>

                        {/* SUBJECT */}
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold uppercase text-slate-500 font-mono block">Subject Line</label>
                          <input
                            type="text"
                            required
                            value={composeSubject}
                            onChange={(e) => setComposeSubject(e.target.value)}
                            placeholder="e.g. Telehealth Sound Isolation Clearance & Guidelines"
                            className="w-full bg-white border border-slate-250 text-xs p-2 rounded outline-none focus:border-indigo-600 font-serif font-black text-[#1B2A6B]"
                          />
                        </div>

                        {/* EMAIL BODY */}
                        <div className="space-y-1.5 flex-1 flex flex-col">
                          <label className="text-[10px] font-bold uppercase text-slate-500 font-mono block">Message Body (Supports Plain Text & HTML)</label>
                          <textarea
                            required
                            rows={8}
                            value={composeBody}
                            onChange={(e) => setComposeBody(e.target.value)}
                            placeholder="Type your official regulatory message or instructions here..."
                            className="w-full bg-white border border-slate-250 text-xs p-3 rounded outline-none focus:border-indigo-600 font-sans leading-relaxed resize-none flex-1 min-h-[180px]"
                          />
                        </div>
                      </div>

                      {/* OUTBOX DISPATCH BUTTONS */}
                      <div className="pt-4 border-t border-slate-150 flex justify-between items-center mt-4">
                        <button
                          type="button"
                          onClick={() => setIsComposing(false)}
                          className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold text-xs rounded uppercase cursor-pointer"
                        >
                          Cancel
                        </button>

                        <div className="flex gap-2">
                          <button
                            type="submit"
                            disabled={composeSending}
                            className="px-5 py-2 bg-[#F26522] hover:bg-[#d45017] disabled:bg-slate-300 text-white font-bold text-xs rounded uppercase flex items-center gap-1.5 cursor-pointer shadow duration-150"
                          >
                            {composeSending ? (
                              <>
                                <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Transmitting Outbox...
                              </>
                            ) : (
                              <>
                                <Send className="w-3.5 h-3.5" /> Send Dynamic SMTP Email
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </form>
                  ) : selectedEmail ? (
                    <div className="space-y-4 flex-1 flex flex-col justify-between select-text selection:bg-indigo-100">
                      <div className="space-y-4">
                        {/* EMAIL HEADER INFORMATION */}
                        <div className="p-4 bg-slate-50 border border-slate-250/60 rounded-lg space-y-2.5">
                          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 border-b border-slate-200 pb-2">
                            <h3 className="font-serif text-base font-black text-[#1B2A6B]">
                              {selectedEmail.subject}
                            </h3>
                            <span className="text-[10px] font-mono text-slate-400 font-semibold">{selectedEmail.timestamp}</span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 font-mono text-[10.5px] text-slate-600">
                            <div>From: <strong className="text-slate-900 select-all">{selectedEmail.from}</strong></div>
                            <div>To: <strong className="text-slate-900 select-all">{selectedEmail.to}</strong></div>
                          </div>
                        </div>

                        {/* SANITIZED HTML BODY */}
                        <div className="border border-slate-150 rounded-lg p-5 bg-white/50 text-xs text-slate-800 leading-relaxed min-h-[250px] font-sans selection:bg-slate-200">
                          <div dangerouslySetInnerHTML={{ __html: selectedEmail.body }} className="prose max-w-none space-y-2" />
                        </div>
                      </div>

                      {/* ACTIONS BAR */}
                      <div className="pt-4 border-t border-slate-150 flex justify-between items-center">
                        <span className="text-[9.5px] text-slate-400 font-mono">Mail ID: {selectedEmail.id} &bull; Security TLS encrypted</span>
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setIsComposing(true);
                              setComposeTo(selectedEmail.from === selectedAccount ? selectedEmail.to : selectedEmail.from);
                              setComposeSubject(selectedEmail.subject.startsWith("RE:") ? selectedEmail.subject : `RE: ${selectedEmail.subject}`);
                              setComposeBody(`\n\n-----------------\nFrom: ${selectedEmail.from}\nTo: ${selectedEmail.to}\nDate: ${selectedEmail.timestamp}\nSubject: ${selectedEmail.subject}\n\n${selectedEmail.body.replace(/<[^>]*>/g, '')}`);
                            }}
                            className="p-1.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded cursor-pointer transition-colors"
                          >
                            Reply to Sender
                          </button>
                          <button
                            onClick={() => triggerSystemMessage("Secure print archive generated.")}
                            className="p-1.5 px-3 bg-slate-100 hover:bg-slate-150 border border-slate-200 hover:border-slate-350 text-slate-700 text-xs font-bold rounded cursor-pointer transition-colors"
                          >
                            Print Dossier Checkup
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="py-24 text-center text-slate-400 max-w-md mx-auto space-y-3 select-none">
                      <Mail className="w-12 h-12 text-slate-200 mx-auto" strokeWidth={1} />
                      <h4 className="font-serif font-black text-slate-800">No message selected</h4>
                      <p className="text-[11px] pb-2">Select any message envelope or click Compose at left to trigger secured communications.</p>
                      <button
                        onClick={() => {
                          setIsComposing(true);
                          setComposeTo("");
                          setComposeSubject("");
                          setComposeBody("");
                        }}
                        className="py-1.5 px-4 bg-[#F26522] hover:bg-[#d45017] text-white font-bold rounded text-xs uppercase tracking-wider transition-all cursor-pointer shadow mx-auto"
                      >
                        Compose Freeform Outbox
                      </button>
                    </div>
                  )}
                </div>

              </div>
            </motion.div>
          )}

          {/* TAB 3: INVITATIONS DIRECTORY */}
          {activeTab === "invitations" && (
            <motion.div
              key="invitations"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                
                {/* TRIGGER FORM PANEL */}
                <form onSubmit={triggerInvitation} className="lg:col-span-4 bg-white border border-slate-200 p-5 rounded-lg shadow-sm space-y-4">
                  <h3 className="text-xs font-bold uppercase font-mono tracking-widest text-slate-500 pb-2 border-b">Trigger Secured Invite</h3>

                  <div className="space-y-1.5">
                    <label htmlFor="inv_cand_name" className="text-[10px] font-bold uppercase text-slate-600 font-mono block">Candidate Human Name</label>
                    <input
                      id="inv_cand_name"
                      type="text"
                      className="w-full bg-white border border-slate-200 text-xs p-2 rounded outline-none focus:border-indigo-600 font-medium"
                      placeholder="e.g. Sarah Connor"
                      value={candidateName}
                      onChange={(e) => setCandidateName(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="inv_cand_email" className="text-[10px] font-bold uppercase text-slate-600 font-mono block">Candidate Email</label>
                    <input
                      id="inv_cand_email"
                      type="email"
                      className="w-full bg-white border border-slate-200 text-xs p-2 rounded outline-none focus:border-indigo-600 font-mono"
                      placeholder="e.g. sarah.connor@gmail.com"
                      value={candidateEmail}
                      onChange={(e) => setCandidateEmail(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="inv_cand_role" className="text-[10px] font-bold uppercase text-slate-600 font-mono block">Target Service Position</label>
                    <select
                      id="inv_cand_role"
                      className="w-full bg-white border border-slate-200 text-xs p-2 rounded outline-none focus:border-indigo-600 font-medium cursor-pointer"
                      value={candidateRole}
                      onChange={(e) => setCandidateRole(e.target.value)}
                    >
                      <option value="Spanish Consecutive Interpreter">Spanish Consecutive Interpreter</option>
                      <option value="Russian Medical VRI Interpreter">Russian Medical VRI Interpreter</option>
                      <option value="Mandarin Courtroom Simultaneous">Mandarin Courtroom Simultaneous</option>
                      <option value="General Translating Advisor">General Translating Advisor</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="inv_cand_template" className="text-[10px] font-bold uppercase text-slate-600 font-mono block">Compliance Audit Template</label>
                    <select
                      id="inv_cand_template"
                      className="w-full bg-white border border-slate-200 text-xs p-2 rounded outline-none focus:border-indigo-600 font-medium cursor-pointer"
                      value={selectedTemplate}
                      onChange={(e) => setSelectedTemplate(e.target.value)}
                    >
                      <option value="Hardware Audit Checklist">Hardware Audit Checklist (Jabra sweep + background barrier)</option>
                      <option value="HIPAA Training & BAA Agreement">HIPAA Training &amp; BAA Agreement (BAA execution sequence)</option>
                      <option value="Full Platform Access Pack">Full Platform Access Pack (all compliance agreements)</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    disabled={invitationSubmitting}
                    className="w-full py-2.5 bg-[#F26522] hover:bg-[#d45017] disabled:bg-slate-350 text-white font-bold rounded text-xs uppercase tracking-wider transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    {invitationSubmitting ? "Dispatching invite..." : "Dispatch Secure Portal Invite"}
                  </button>
                </form>

                {/* INVITATION RECORDS DIRECTORY */}
                <div className="lg:col-span-8 bg-white border border-slate-200 rounded-lg p-5 shadow-sm space-y-4">
                  <h3 className="text-xs font-bold uppercase font-mono tracking-widest text-slate-500 pb-2 border-b">Active System Portal Invitations Roster</h3>

                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[550px] text-left border-collapse text-xs text-slate-700">
                      <thead>
                        <tr className="border-b border-slate-200 font-mono text-[9px] text-slate-400 uppercase tracking-wider">
                          <th className="pb-2 select-none">Reciprocal Candidate</th>
                          <th className="pb-2 select-none">Target Role</th>
                          <th className="pb-2 select-none">Clearance Rules</th>
                          <th className="pb-2 uppercase select-none">Dispatched At</th>
                          <th className="pb-2 text-right select-none">State Link</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {invitationsList.map((inv) => (
                          <tr key={inv.id} className="hover:bg-slate-50/50">
                            <td className="py-3 font-serif font-bold text-slate-900">
                              <div>{inv.candidateName}</div>
                              <div className="text-[10px] text-slate-400 font-mono font-normal">{inv.email}</div>
                            </td>
                            <td className="py-3">{inv.role}</td>
                            <td className="py-3 font-mono text-[10.5px] text-indigo-700">{inv.templateUsed}</td>
                            <td className="py-3 font-mono text-[10.5px] text-slate-450">{inv.sentAt || "No link sent"}</td>
                            <td className="py-3 text-right">
                              {inv.status === "Active" ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 text-[9.5px] font-bold font-mono uppercase">
                                  <Check className="w-3 h-3 stroke-[3px]" /> Active Invitation Sent
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 text-[9.5px] font-bold font-mono uppercase">
                                  <Clock className="w-3 h-3 text-amber-600" /> Pending Trigger
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>
            </motion.div>
          )}

          {/* TAB 4: TRAINING MANAGEMENT */}
          {activeTab === "training" && (
            <motion.div
              key="training"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
              className="space-y-6"
            >
              <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm space-y-4">
                <div className="flex justify-between items-center border-b pb-3 border-slate-150">
                  <div>
                    <h3 className="text-sm font-extrabold uppercase font-mono tracking-widest text-[#1B2A6B]">Compliance Training Curriculum</h3>
                    <p className="text-xs text-slate-400 mt-1">Review federal tele-interpretive regulations, HIPAA alignment checklists, and platform code of conduct.</p>
                  </div>
                  <span className="px-2.5 py-1 text-xs font-mono font-bold bg-[#1B2A6B]/5 text-indigo-700 rounded-full border border-indigo-200">
                    Compliant Modules: {completedTrainingCount} / {totalTrainingCount}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
                  {trainingList.map((mod) => (
                    <div 
                      key={mod.id} 
                      className={`border rounded-lg p-5 flex flex-col justify-between space-y-4 shadow-sm relative overflow-hidden transition-all duration-200 ${
                        mod.completedChecked 
                          ? "bg-emerald-50/20 border-emerald-250" 
                          : "bg-white border-slate-200"
                      }`}
                    >
                      <div className="space-y-2">
                        <div className="flex justify-between items-start gap-2">
                          <h4 className="font-serif font-black text-sm text-slate-800 leading-tight">{mod.title}</h4>
                          <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold font-mono uppercase ${
                            mod.completedChecked 
                              ? "bg-emerald-100 text-emerald-800" 
                              : "bg-amber-100 text-amber-800"
                          }`}>
                            {mod.completedChecked ? "Audit Verified" : "Pending Audit"}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 leading-relaxed pr-1">
                          {mod.description}
                        </p>
                      </div>

                      <div className="pt-3 border-t border-slate-150/80 flex justify-between items-center text-xs">
                        <span className="font-mono text-slate-400">Min Score: {mod.minScore}%</span>
                        <button
                          onClick={() => toggleTraining(mod.id)}
                          disabled={trainingTogglingId === mod.id}
                          className={`px-3 py-1.5 rounded font-bold text-[10.5px] uppercase tracking-wider cursor-pointer font-mono flex items-center gap-1 transition-colors border ${
                            mod.completedChecked
                              ? "bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-300"
                              : "bg-slate-900 hover:bg-black text-white border-transparent"
                          }`}
                        >
                          {trainingTogglingId === mod.id ? (
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          ) : mod.completedChecked ? (
                            <>
                              <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> Toggle Revocation
                            </>
                          ) : (
                            "Verify Audit Progress"
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 5: HIPAA COMPLIANCE LOGS */}
          {activeTab === "audit" && (
            <motion.div
              key="audit"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
              className="space-y-6"
            >
              <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm space-y-4">
                
                {/* FILTER SEARCH HEADER */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-150 pb-4">
                  <div>
                    <h3 className="text-sm font-extrabold uppercase font-mono tracking-widest text-[#1B2A6B]">Compliance &amp; HIPAA Audit Trail</h3>
                    <p className="text-xs text-slate-400">Enterprise immutable transaction log recording connection protocol validations, BAA changes, and SMTP relays.</p>
                  </div>
                  
                  {/* DIRECT ACTIONS */}
                  <div className="flex gap-2 w-full sm:w-auto">
                    <input
                      type="text"
                      className="bg-white border border-slate-200 text-xs py-1.5 px-3 rounded outline-none focus:border-indigo-600 flex-1 sm:w-48 font-medium"
                      placeholder="Search log records..."
                      value={auditQuery}
                      onChange={(e) => setAuditQuery(e.target.value)}
                    />

                    <select
                      className="bg-white border border-slate-200 text-xs py-1.5 px-2 rounded outline-none cursor-pointer"
                      value={auditFilter}
                      onChange={(e) => setAuditFilter(e.target.value)}
                    >
                      <option value="ALL">All Severities</option>
                      <option value="INFO">INFO Only</option>
                      <option value="WARN">WARN Only</option>
                      <option value="CRITICAL">CRITICAL Only</option>
                    </select>
                  </div>
                </div>

                {/* TABLE OF AUDITED TRANSACTIONS */}
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[700px] text-left border-collapse text-xs text-slate-700">
                    <thead>
                      <tr className="border-b border-slate-250 font-mono text-[9px] text-slate-400 uppercase tracking-wider select-none">
                        <th className="pb-2.5">Audit Timestamp (UTC)</th>
                        <th className="pb-2.5">Compliance Event Action</th>
                        <th className="pb-2.5">Triggered By</th>
                        <th className="pb-2.5">Severity</th>
                        <th className="pb-2.5 text-right">Verification Statement Details</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                      {auditLogsList
                        .filter(log => {
                          const queryMatch = !auditQuery || 
                            log.action.toLowerCase().includes(auditQuery.toLowerCase()) || 
                            log.details.toLowerCase().includes(auditQuery.toLowerCase());
                          const filterMatch = auditFilter === "ALL" || log.severity === auditFilter;
                          return queryMatch && filterMatch;
                        })
                        .map((log) => {
                          let levelBadge = "bg-slate-100 text-slate-700 border-slate-200";
                          if (log.severity === "WARN") levelBadge = "bg-amber-50 text-amber-800 border-amber-200 font-bold";
                          if (log.severity === "CRITICAL") levelBadge = "bg-red-50 text-red-800 border-red-200 font-black";

                          return (
                            <tr key={log.id} className="hover:bg-slate-50/50">
                              <td className="py-3 text-slate-450 select-text">{log.timestamp}</td>
                              <td className="py-3 font-bold text-slate-800 select-text">{log.action}</td>
                              <td className="py-3 text-slate-600 select-all">{log.userEmail}</td>
                              <td className="py-3">
                                <span className={`px-2 py-0.5 rounded border text-[9px] uppercase tracking-wide inline-block ${levelBadge}`}>
                                  {log.severity}
                                </span>
                              </td>
                              <td className="py-3 text-right max-w-sm truncate text-slate-500 font-normal select-text" title={log.details}>
                                {log.details}
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 6: BROADCAST ANNOUNCEMENTS HUB */}
          {activeTab === "announcements" && (
            <motion.div
              key="announcements"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                
                {/* POST ANNOUNCEMENT FORM */}
                <form onSubmit={submitAnnouncement} className="lg:col-span-5 bg-white border border-slate-200 p-5 rounded-lg shadow-sm space-y-4">
                  <h3 className="text-xs font-bold uppercase font-mono tracking-widest text-slate-500 pb-2 border-b">Publish Operations Broadcast</h3>

                  <div className="space-y-1.5">
                    <label htmlFor="ann_title" className="text-[10px] font-bold uppercase text-slate-600 font-mono block">Broadcast Title Header</label>
                    <input
                      id="ann_title"
                      type="text"
                      className="w-full bg-white border border-slate-200 text-xs p-2.5 rounded outline-none focus:border-indigo-600 font-bold text-slate-850"
                      placeholder="e.g. Critical HIPAA Acoustic updates"
                      value={announcementTitle}
                      onChange={(e) => setAnnouncementTitle(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1.5 font-sans">
                    <label htmlFor="ann_author" className="text-[10px] font-bold uppercase text-slate-600 font-mono block">Relay Author Signature</label>
                    <input
                      id="ann_author"
                      type="text"
                      className="w-full bg-white border border-slate-200 text-xs p-2 rounded outline-none focus:border-indigo-600 font-medium"
                      placeholder="Super Admin"
                      value={announcementAuthor}
                      onChange={(e) => setAnnouncementAuthor(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="ann_body" className="text-[10px] font-bold uppercase text-slate-600 font-mono block">Announcement Message Body</label>
                    <textarea
                      id="ann_body"
                      rows={5}
                      className="w-full bg-white border border-slate-200 text-xs p-2.5 rounded outline-none focus:border-indigo-600 font-sans leading-relaxed resize-none"
                      placeholder="Describe standard operational policies..."
                      value={announcementContent}
                      onChange={(e) => setAnnouncementContent(e.target.value)}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={announcementSubmitting}
                    className="w-full py-2.5 bg-slate-900 hover:bg-black text-white font-bold rounded text-xs uppercase tracking-wider transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm select-none"
                  >
                    <Megaphone className="w-3.5 h-3.5 text-[#F26522]" />
                    {announcementSubmitting ? "Broadcasting..." : "Broadcast to operations pool"}
                  </button>
                </form>

                {/* CURRENT PUBLISHED BROADCASTS */}
                <div className="lg:col-span-12 xl:col-span-7 bg-white border border-slate-200 rounded-lg p-5 shadow-sm space-y-4">
                  <h3 className="text-xs font-bold uppercase font-mono tracking-widest text-slate-500 pb-2 border-b">Active Operations Broadcast Streams</h3>

                  <div className="space-y-4 overflow-y-auto max-h-[450px] pr-1">
                    {announcementsList.length === 0 ? (
                      <div className="py-20 text-center text-slate-400 font-mono text-xs">
                        No previous broadcast signals recorded.
                      </div>
                    ) : (
                      announcementsList.map((ann) => (
                        <div key={ann.id} className="border border-slate-150 rounded-lg p-4 bg-slate-55 bg-slate-50 relative overflow-hidden flex flex-col justify-between">
                          <div className="space-y-2">
                            <div className="flex justify-between items-start gap-3">
                              <h4 className="font-serif font-black text-sm text-slate-800 tracking-tight">{ann.title}</h4>
                              <span className="font-mono text-[9.5px] text-slate-400 shrink-0 font-semibold">{ann.date}</span>
                            </div>
                            <p className="text-xs text-slate-600 leading-relaxed font-sans">{ann.content}</p>
                          </div>
                          <div className="flex justify-between text-[10px] text-slate-400 font-mono border-t border-slate-200/60 pt-2 mt-2">
                            <span>Author: <strong className="text-slate-700">{ann.author}</strong></span>
                            <span>System Wave ID: {ann.id}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

              </div>
            </motion.div>
          )}

          {/* TAB 7: SETTINGS & SERVER CONFIG */}
          {activeTab === "settings" && (
            <motion.div
              key="settings"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
              className="space-y-6"
            >
              <form onSubmit={saveSettings} className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm max-w-2xl mx-auto space-y-6">
                <div className="border-b pb-3 border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <h3 className="text-sm font-extrabold uppercase font-mono tracking-widest text-[#1B2A6B] flex items-center gap-1.5 select-none">
                      <Server className="w-5 h-5 text-[#F26522]" /> Secure connection parameters (SMTP/IMAP)
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">Configure SMTP and IMAP system server options cleanly. All authentication and protocols remain strictly server-side.</p>
                  </div>
                  {/* DYNAMIC ACCOUNT CONFIGURATION PICKER */}
                  <div className="space-y-1 w-full md:w-auto md:min-w-[200px]">
                    <label htmlFor="settings_config_account" className="text-[9.5px] font-bold uppercase text-indigo-700 block font-mono">Select Account to Configure</label>
                    <select
                      id="settings_config_account"
                      value={configAccount}
                      onChange={(e) => setConfigAccount(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-250 text-xs p-1.5 rounded outline-none focus:border-indigo-600 font-bold font-mono cursor-pointer"
                    >
                      <option value="support@vozarals.com">support@vozarals.com (Default Support)</option>
                      <option value="hr@vozarals.com">hr@vozarals.com (Human Resources)</option>
                      <option value="careers@vozarals.com">careers@vozarals.com (Careers Portal)</option>
                      <option value="admin@vozarals.com">admin@vozarals.com (Service Admin)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* IMAP SETTINGS */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold uppercase font-mono text-indigo-750 border-b pb-1 flex items-center gap-1">
                      Incoming Mail Server (IMAP)
                    </h4>

                    <div className="space-y-1.5">
                      <label htmlFor="set_imap_host" className="text-[10px] font-bold uppercase text-slate-500 block font-mono">Mail Server Host</label>
                      <input
                        id="set_imap_host"
                        type="text"
                        className="w-full bg-white border border-slate-200 text-xs p-2 rounded outline-none focus:border-indigo-600 font-mono"
                        placeholder="imap.one.com"
                        value={imapHost}
                        onChange={(e) => setImapHost(e.target.value)}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label htmlFor="set_imap_port" className="text-[10px] font-bold uppercase text-slate-500 block font-mono">Port</label>
                        <input
                          id="set_imap_port"
                          type="number"
                          className="w-full bg-white border border-slate-200 text-xs p-2 rounded outline-none focus:border-indigo-600 font-mono"
                          placeholder="993"
                          value={imapPort}
                          onChange={(e) => setImapPort(parseInt(e.target.value) || 993)}
                        />
                      </div>
                      <div className="flex items-center gap-2 pt-6">
                        <input
                          id="set_imap_sec"
                          type="checkbox"
                          checked={imapSecure}
                          onChange={(e) => setImapSecure(e.target.checked)}
                          className="h-4 w-4 text-indigo-605 focus:ring-indigo-600 rounded cursor-pointer text-indigo-600"
                        />
                        <label htmlFor="set_imap_sec" className="text-xs font-bold text-slate-500 cursor-pointer select-none">Use SSL / TLS</label>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label htmlFor="set_imap_user" className="text-[10px] font-bold uppercase text-slate-500 block font-mono">IMAP Account Username</label>
                      <input
                        id="set_imap_user"
                        type="text"
                        className="w-full bg-slate-50 border border-slate-200 text-xs p-2 rounded outline-none focus:border-indigo-600 font-mono text-slate-500 cursor-not-allowed"
                        placeholder="support@vozarals.com"
                        value={imapUser}
                        disabled
                      />
                      <span className="text-[9px] text-slate-400 italic">Prebound to configured profile target ({configAccount})</span>
                    </div>
                  </div>

                  {/* SMTP SETTINGS */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold uppercase font-mono text-indigo-755 border-b pb-1">Outgoing Mail Server (SMTP)</h4>

                    <div className="space-y-1.5">
                      <label htmlFor="set_smtp_host" className="text-[10px] font-bold uppercase text-slate-500 block font-mono">SMTP Server Host</label>
                      <input
                        id="set_smtp_host"
                        type="text"
                        className="w-full bg-white border border-slate-200 text-xs p-2 rounded outline-none focus:border-indigo-600 font-mono"
                        placeholder="send.one.com"
                        value={smtpHost}
                        onChange={(e) => setSmtpHost(e.target.value)}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label htmlFor="set_smtp_port" className="text-[10px] font-bold uppercase text-slate-500 block font-mono">Port</label>
                        <input
                          id="set_smtp_port"
                          type="number"
                          className="w-full bg-white border border-slate-200 text-xs p-2 rounded outline-none focus:border-indigo-600 font-mono"
                          placeholder="465"
                          value={smtpPort}
                          onChange={(e) => setSmtpPort(parseInt(e.target.value) || 465)}
                        />
                      </div>
                      <div className="flex items-center gap-2 pt-6">
                        <input
                          id="set_smtp_sec"
                          type="checkbox"
                          checked={smtpSecure}
                          onChange={(e) => setSmtpSecure(e.target.checked)}
                          className="h-4 w-4 text-indigo-605 focus:ring-indigo-600 rounded cursor-pointer text-indigo-600"
                        />
                        <label htmlFor="set_smtp_sec" className="text-xs font-bold text-slate-500 cursor-pointer select-none">Use SSL / TLS</label>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label htmlFor="set_smtp_user" className="text-[10px] font-bold uppercase text-slate-555 block font-mono">SMTP Username / Login</label>
                      <input
                        id="set_smtp_user"
                        type="text"
                        className="w-full bg-slate-50 border border-slate-200 text-xs p-2 rounded outline-none focus:border-indigo-600 font-mono text-slate-500 cursor-not-allowed font-semibold"
                        placeholder="support@vozarals.com"
                        value={smtpUser}
                        disabled
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label htmlFor="set_smtp_pass" className="text-[10px] font-bold uppercase text-[#F26522] block font-mono">SMTP Password (🔒 Encrypted SSL)</label>
                      <input
                        id="set_smtp_pass"
                        type="password"
                        className="w-full bg-white border border-slate-250 text-xs p-2 rounded outline-none focus:border-indigo-600 font-mono font-medium"
                        placeholder="••••••••"
                        value={smtpPass}
                        onChange={(e) => setSmtpPass(e.target.value)}
                      />
                      <span className="text-[9px] text-slate-450 block leading-tight">
                        Enter password credentials for {configAccount}. support@vozarals.com password helper profile check: <code className="bg-slate-100 px-0.5 rounded font-bold font-mono">PhoeThar@vozara2026</code>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t flex justify-end gap-3">
                  <button
                    type="submit"
                    disabled={settingsSaving}
                    className="p-2.5 px-6 font-mono font-bold bg-[#1B2A6B] hover:bg-slate-800 duration-150 disabled:bg-slate-300 text-white rounded text-xs uppercase tracking-wider flex items-center gap-1.5 shadow cursor-pointer select-none"
                  >
                    <Lock className="w-3.5 h-3.5 text-[#F26522]" />
                    {settingsSaving ? "Updating parameters..." : `Save Settings & Bind ${configAccount}`}
                  </button>
                </div>
              </form>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

    </div>
  );
};
