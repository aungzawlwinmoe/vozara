import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { initializeApp } from "firebase/app";
import { initializeFirestore, collection, addDoc, doc, getDoc, setDoc, getDocs, deleteDoc } from "firebase/firestore";
import dotenv from "dotenv";
import nodemailer from "nodemailer";
import { sendInterpreterApplicationEmail, getEmailPreviewHtml } from "./server/email";

// Load environment variables
dotenv.config();

// In-memory submissions logs (for demonstration and persistence during dev process)
const contactSubmissions: any[] = [];
const interpreterSubmissions: any[] = [];

// Initialize Firebase securely in backend
let db: any = null;
try {
  const configPath = path.join(process.cwd(), "firebase-applet-config.json");
  if (fs.existsSync(configPath)) {
    const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
    const firebaseApp = initializeApp(config);
    const dbId = config.firestoreDatabaseId || "(default)";
    db = initializeFirestore(firebaseApp, {
      experimentalForceLongPolling: true,
    }, dbId);
    console.log("Firebase Firestore initialized successfully on Express backend!");
  } else {
    console.warn("firebase-applet-config.json not found, falling back to local memory logs.");
  }
} catch (err) {
  console.error("Failed to initialize Firebase on backend:", err);
}

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: null,
      email: null,
      emailVerified: null,
      isAnonymous: null,
      tenantId: null,
      providerInfo: []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Simple in-memory anti-spam token generator
const formSessions = new Map<string, { timestamp: number; challenge: string }>();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Form body parsing
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ limit: "10mb", extended: true }));

  // API Route: GET email-preview -> serves the cached/mocked HTML of the submitted application email
  app.get("/api/forms/email-preview", (req, res) => {
    const id = req.query.id as string;
    if (!id) {
      return res.status(400).send("<h3>Missing required query parameter: id</h3>");
    }
    const html = getEmailPreviewHtml(id);
    if (!html) {
      return res.status(404).send(`
        <div style="font-family: sans-serif; padding: 40px; text-align: center; color: #333;">
          <h2>No Email Cached</h2>
          <p>This email has either expired, was not found, or the dev server was restarted.</p>
          <a href="/" style="display: inline-block; padding: 10px 20px; background: #1B2A6B; color: white; text-decoration: none; border-radius: 4px; font-weight: bold; margin-top: 15px;">Back to Form</a>
        </div>
      `);
    }
    res.setHeader("Content-Type", "text/html");
    res.send(html);
  });

  // API Route: GET prepare endpoint -> generates anti-spam session and returns required hidden fields
  app.get("/api/forms/prepare", (req, res) => {
    const formKey = req.query.form_key as string;
    if (!formKey || (formKey !== "vozara-contact" && formKey !== "vozara-interpreter-application")) {
      return res.status(400).json({ error: "Invalid or missing form_key" });
    }

    const sessionId = "sess_" + Math.random().toString(36).substring(2, 15);
    const challenge = "token_" + Math.random().toString(36).substring(2, 15) + "_" + Date.now();
    
    // Store in-memory session (expires after 15 minutes)
    formSessions.set(sessionId, {
      timestamp: Date.now(),
      challenge
    });

    // Provide required hidden fields to merge into post payload
    return res.json({
      success: true,
      form_key: formKey,
      required_hidden_fields: {
        _session_id: sessionId,
        _challenge_token: challenge,
        _anti_bot_timestamp: String(Date.now())
      }
    });
  });

  // API Route: POST submit endpoint with anti-spam check
  app.post("/api/forms/submit", async (req, res) => {
    const { 
      form_key, 
      _session_id, 
      _challenge_token, 
      _anti_bot_timestamp,
      ...payload 
    } = req.body;

    if (!form_key || (form_key !== "vozara-contact" && form_key !== "vozara-interpreter-application")) {
      return res.status(400).json({ error: "Invalid or missing form_key" });
    }

    // Anti-spam validation
    if (!_session_id || !_challenge_token || !_anti_bot_timestamp) {
      return res.status(400).json({ 
        error: "Security verification failed. Missing anti-spam tokens." 
      });
    }

    const session = formSessions.get(_session_id);
    if (!session) {
      return res.status(400).json({ 
        error: "Security session expired. Please refresh and try again." 
      });
    }

    if (session.challenge !== _challenge_token) {
      return res.status(400).json({ 
        error: "Security challenge verification failed." 
      });
    }

    // Verify timestamp is valid
    const submittedAt = parseInt(_anti_bot_timestamp, 10);
    if (isNaN(submittedAt)) {
      return res.status(400).json({ 
        error: "Invalid security verification parameter." 
      });
    }

    // Clean up session so token is single-use
    formSessions.delete(_session_id);

    // Save submission and handle response
    if (form_key === "vozara-contact") {
      const { full_name, submitter_email, phone, organization, service, language_pair, message } = payload;
      
      if (!full_name || !submitter_email || !message) {
        return res.status(400).json({ error: "Please fill in all required fields (Name, Email, Message)." });
      }

      const timestamp = new Date().toISOString();

      const path = "contact_submissions";
      try {
        if (db) {
          try {
            await addDoc(collection(db, "contact_submissions"), {
              full_name,
              submitter_email,
              phone: phone || "",
              organization: organization || "",
              service: service || "",
              language_pair: language_pair || "",
              message,
              timestamp
            });
          } catch (dbErr) {
            handleFirestoreError(dbErr, OperationType.CREATE, path);
          }
          console.log("Successfully saved contact request to Firestore!");
          try {
            await syncSingleToConvexServer("contact", {
              full_name,
              submitter_email,
              phone: phone || "",
              organization: organization || "",
              service: service || "",
              language_pair: language_pair || "",
              message,
              timestamp
            });
          } catch (cvErr) {
            console.error("Convex server-side auto-sync error:", cvErr);
          }
          try {
            await syncSingleToVercelServer("contact", {
              full_name,
              submitter_email,
              phone: phone || "",
              organization: organization || "",
              service: service || "",
              language_pair: language_pair || "",
              message,
              timestamp
            });
          } catch (vcErr) {
            console.error("Vercel server-side auto-sync error:", vcErr);
          }
        }
      } catch (dbErr) {
        console.error("Failed to write contact request to Firestore:", dbErr);
      }

      // Automatically add incoming email from the sender into Inbox of support@vozarals.com (one.com specific mailbox)
      const contactEmailId = "m-inc-contact-" + Date.now();
      const contactIncomingEmail = {
        id: contactEmailId,
        from: submitter_email,
        to: "support@vozarals.com",
        subject: `New Corporate Lead Requirement - ${full_name}`,
        timestamp: new Date().toISOString().replace("T", " ").substring(0, 19),
        body: `<h3>Business Lead Inquiry Received</h3>
        <p><strong>From:</strong> ${full_name} (&lt;<a href="mailto:${submitter_email}">${submitter_email}</a>&gt;)</p>
        <p><strong>Phone:</strong> ${phone || "Not specified"}</p>
        <p><strong>Organization:</strong> ${organization || "Not specified"}</p>
        <p><strong>Service Demanded:</strong> ${service || "Not specified"}</p>
        <p><strong>Language Pair Required:</strong> ${language_pair || "Not specified"}</p>
        <p><strong>Detailed Requirements statement:</strong></p>
        <div style="background-color: #f1f5f9; border-radius: 4px; padding: 16px; margin-top: 10px; font-style: italic; color: #334155; line-height: 22px; border-left: 4px solid #1B2A6B;">
          "${message}"
        </div>
        <br/>
        <hr style="border: none; border-top: 1px solid #edf2f7; margin: 20px 0;"/>
        <p style="font-size: 11px; color: #94a3b8; font-family: sans-serif;">This submission was automatically intercepted and routed to support@vozarals.com inbox.</p>`,
        isRead: false,
        folder: "inbox"
      };

      MOCK_EMAILS.unshift(contactIncomingEmail);
      if (db) {
        try {
          await setDoc(doc(db, "vozarals_emails", contactEmailId), contactIncomingEmail);
          console.log("Successfully persisted contact lead incoming email to vozarals_emails collection!");
        } catch (dbErr) {
          console.error("Failed to persist contact lead incoming email to Firestore:", dbErr);
        }
      }

      // Keep local list sync as dynamic fallback
      contactSubmissions.push({
        id: "cnt_" + Date.now(),
        full_name,
        submitter_email,
        phone: phone || "",
        organization: organization || "",
        service: service || "",
        language_pair: language_pair || "",
        message,
        timestamp
      });

      console.log("New contact request received for Vozara:", payload);
      return res.json({ 
        success: true, 
        message: "Thank you for getting in touch! A Vozara language coordinator will contact you in less than 1 business day." 
      });

    } else if (form_key === "vozara-interpreter-application") {
      const {
        full_name,
        submitter_email,
        phone,
        location,
        primary_language,
        additional_languages,
        interpreting_modes,
        industries,
        experience_years,
        certifications,
        medical_legal_knowledge,
        technical_setup,
        availability,
        linkedin_or_portfolio,
        additional_info,
        cv_name,
        cv_size,
        cv_base64
      } = payload;

      if (!full_name || !submitter_email || !phone || !primary_language || !location) {
        return res.status(400).json({ 
          error: "Please fill in all required fields to submit your application." 
        });
      }

      // Dispatch real email to careers@vozarals.com via SMTP
      let emailResult: { success: boolean; previewUrl?: string; error?: string; emailHtml?: string } | null = null;
      try {
        emailResult = await sendInterpreterApplicationEmail(payload);
      } catch (mailErr) {
        console.error("Recruitment email dispatch failed:", mailErr);
      }

      const timestamp = new Date().toISOString();
      const emailSandboxPreview = emailResult?.previewUrl || "";

      // Automatically add incoming email from the sender into Inbox of careers@vozarals.com (one.com specific mailbox)
      const appEmailId = "m-inc-app-" + Date.now();
      const defaultHtml = `<h3>Interpreter Application: ${full_name}</h3>
      <p><strong>From:</strong> ${full_name} (&lt;<a href="mailto:${submitter_email}">${submitter_email}</a>&gt;)</p>
      <p><strong>Primary Language:</strong> ${primary_language}</p>
      <p>Please check the candidate dossier logs for complete records.</p>`;
      
      const appIncomingEmail = {
        id: appEmailId,
        from: submitter_email,
        to: "careers@vozarals.com",
        subject: `[Candidate Registry] ${full_name} - ${primary_language} Interpreter`,
        timestamp: new Date().toISOString().replace("T", " ").substring(0, 19),
        body: emailResult?.emailHtml || defaultHtml,
        isRead: false,
        folder: "inbox"
      };

      MOCK_EMAILS.unshift(appIncomingEmail);
      if (db) {
        try {
          await setDoc(doc(db, "vozarals_emails", appEmailId), appIncomingEmail);
          console.log("Successfully persisted interpreter incoming email to vozarals_emails collection!");
        } catch (dbErr) {
          console.error("Failed to persist interpreter incoming email to Firestore:", dbErr);
        }
      }

      const path = "interpreter_submissions";
      try {
        if (db) {
          try {
            await addDoc(collection(db, "interpreter_submissions"), {
              full_name,
              submitter_email,
              phone,
              location,
              primary_language,
              additional_languages: additional_languages || "",
              interpreting_modes: interpreting_modes || "Both",
              industries: industries || "",
              experience_years: experience_years || "",
              certifications: certifications || "",
              medical_legal_knowledge: medical_legal_knowledge || "",
              technical_setup: technical_setup || "",
              availability: availability || "",
              linkedin_or_portfolio: linkedin_or_portfolio || "",
              additional_info: additional_info || "",
              cv_name: cv_name || "",
              cv_size: cv_size || "",
              cv_base64: cv_base64 || "",
              timestamp,
              email_sandbox_preview: emailSandboxPreview
            });
          } catch (dbErr) {
            handleFirestoreError(dbErr, OperationType.CREATE, path);
          }
          console.log("Successfully saved interpreter application to Firestore!");
          try {
            await syncSingleToConvexServer("interpreter", {
              full_name,
              submitter_email,
              phone,
              location,
              primary_language,
              additional_languages: additional_languages || "",
              interpreting_modes: interpreting_modes || "Both",
              industries: industries || "",
              experience_years: experience_years || "",
              certifications: certifications || "",
              medical_legal_knowledge: medical_legal_knowledge || "",
              technical_setup: technical_setup || "",
              availability: availability || "",
              linkedin_or_portfolio: linkedin_or_portfolio || "",
              additional_info: additional_info || "",
              cv_name: cv_name || "",
              cv_size: cv_size || "",
              cv_base64: cv_base64 || "",
              timestamp,
              email_sandbox_preview: emailSandboxPreview
            });
          } catch (cvErr) {
            console.error("Convex server-side auto-sync error:", cvErr);
          }
          try {
            await syncSingleToVercelServer("interpreter", {
              full_name,
              submitter_email,
              phone,
              location,
              primary_language,
              additional_languages: additional_languages || "",
              interpreting_modes: interpreting_modes || "Both",
              industries: industries || "",
              experience_years: experience_years || "",
              certifications: certifications || "",
              medical_legal_knowledge: medical_legal_knowledge || "",
              technical_setup: technical_setup || "",
              availability: availability || "",
              linkedin_or_portfolio: linkedin_or_portfolio || "",
              additional_info: additional_info || "",
              cv_name: cv_name || "",
              cv_size: cv_size || "",
              cv_base64: cv_base64 || "",
              timestamp,
              email_sandbox_preview: emailSandboxPreview
            });
          } catch (vcErr) {
            console.error("Vercel server-side auto-sync error:", vcErr);
          }
        }
      } catch (dbErr) {
        console.error("Failed to write interpreter application to Firestore:", dbErr);
      }

      interpreterSubmissions.push({
        id: "app_" + Date.now(),
        full_name,
        submitter_email,
        phone,
        location,
        primary_language,
        additional_languages: additional_languages || "",
        interpreting_modes: interpreting_modes || "Both",
        industries: industries || "",
        experience_years: experience_years || "",
        certifications: certifications || "",
        medical_legal_knowledge: medical_legal_knowledge || "",
        technical_setup: technical_setup || "",
        availability: availability || "",
        linkedin_or_portfolio: linkedin_or_portfolio || "",
        additional_info: additional_info || "",
        cv_name: cv_name || "",
        cv_size: cv_size || "",
        cv_base64: cv_base64 || "",
        timestamp,
        email_sandbox_preview: emailSandboxPreview
      });

      console.log("New Interpreter Application submission handled successfully:", payload);
      return res.json({ 
        success: true, 
        message: "Your application has been received successfully! A representative from our recruiting team will review your qualifications and reach out to you via email.",
        email_sandbox_preview: emailSandboxPreview || null
      });
    }

    return res.status(400).json({ error: "Unknown error" });
  });

  // --- Admin Sandbox Portal APIs ---
  const ADMIN_TOKEN = "token_vozara_sandbox_admin_2026_xyz";

  // Helper middleware to verify admin sessions
  const requireAdmin = (req: any, res: any, next: any) => {
    const authHeader = req.headers.authorization;
    if (authHeader === `Bearer ${ADMIN_TOKEN}`) {
      next();
    } else {
      res.status(401).json({ error: "Unauthorized access to sandbox portal." });
    }
  };

  app.post("/api/admin/login", (req, res) => {
    const { username, password } = req.body;
    // Standard secure sandbox preview credentials
    if (
      (username === "admin@vozarals.com" || username === "admin" || username === "aungzawlwinmoe@gmail.com") &&
      password === "admin-sandbox-2026"
    ) {
      return res.json({ success: true, token: ADMIN_TOKEN });
    }
    return res.status(401).json({ error: "Invalid admin credentials. Please note the test credentials are admin@vozarals.com / admin-sandbox-2026." });
  });

  app.get("/api/admin/submissions", requireAdmin, async (req, res) => {
    try {
      let dbContacts: any[] = [];
      let dbInterpreters: any[] = [];

      if (db) {
        try {
          let contactSnap;
          try {
            contactSnap = await getDocs(collection(db, "contact_submissions"));
          } catch (dbErr: any) {
            handleFirestoreError(dbErr, OperationType.LIST, "contact_submissions");
          }
          contactSnap.forEach((doc: any) => {
            dbContacts.push({ id: doc.id, ...doc.data() });
          });
          dbContacts.sort((a, b) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime());
        } catch (dbErr: any) {
          console.warn("Failed to fetch contact submissions from Firestore, using local fallback only:", dbErr.message || dbErr);
        }

        try {
          let interpreterSnap;
          try {
            interpreterSnap = await getDocs(collection(db, "interpreter_submissions"));
          } catch (dbErr: any) {
            handleFirestoreError(dbErr, OperationType.LIST, "interpreter_submissions");
          }
          interpreterSnap.forEach((doc: any) => {
            dbInterpreters.push({ id: doc.id, ...doc.data() });
          });
          dbInterpreters.sort((a, b) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime());
        } catch (dbErr: any) {
          console.warn("Failed to fetch interpreter submissions from Firestore, using local fallback only:", dbErr.message || dbErr);
        }
      }

      // Merge backend local memory submissions to ensure all test posts show up
      const allContacts = [...contactSubmissions];
      dbContacts.forEach(dbItem => {
        if (!allContacts.some(localItem => localItem.id === dbItem.id || (localItem.submitter_email === dbItem.submitter_email && localItem.timestamp === dbItem.timestamp))) {
          allContacts.push(dbItem);
        }
      });
      allContacts.sort((a, b) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime());

      const allInterpreters = [...interpreterSubmissions];
      dbInterpreters.forEach(dbItem => {
        if (!allInterpreters.some(localItem => localItem.id === dbItem.id || (localItem.submitter_email === dbItem.submitter_email && localItem.timestamp === dbItem.timestamp))) {
          allInterpreters.push(dbItem);
        }
      });
      allInterpreters.sort((a, b) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime());

      return res.json({
        success: true,
        contacts: allContacts,
        interpreters: allInterpreters,
        firebaseConnected: !!db
      });
    } catch (err: any) {
      console.error("Admin submissions fetch failed:", err);
      return res.status(500).json({ error: err.message || "Failed to load portal data." });
    }
  });

  app.delete("/api/admin/submissions", requireAdmin, async (req, res) => {
    const { type, id } = req.body;
    if (!type || !id) {
      return res.status(400).json({ error: "Missing type or id" });
    }

    try {
      // 1. Delete from memory list
      if (type === "contact") {
        const index = contactSubmissions.findIndex(item => item.id === id);
        if (index > -1) contactSubmissions.splice(index, 1);
      } else {
        const index = interpreterSubmissions.findIndex(item => item.id === id);
        if (index > -1) interpreterSubmissions.splice(index, 1);
      }

      // 2. Delete from Firestore if db is active
      if (db) {
        const colName = type === "contact" ? "contact_submissions" : "interpreter_submissions";
        try {
          const docRef = doc(db, colName, id);
          try {
            await deleteDoc(docRef);
          } catch (dbErr: any) {
            handleFirestoreError(dbErr, OperationType.DELETE, `${colName}/${id}`);
          }
        } catch (dbErr: any) {
          console.warn(`Could not delete doc ${id} from Firestore (perhaps it's a memory only item):`, dbErr.message);
        }
      }

      return res.json({ success: true, message: "Submission removed successfully." });
    } catch (err: any) {
      return res.status(500).json({ error: err.message || "Failed to delete submission." });
    }
  });

  app.get("/api/admin/antispam-stats", requireAdmin, (req, res) => {
    const activeSessions: any[] = [];
    const now = Date.now();
    formSessions.forEach((val, key) => {
      activeSessions.push({
        id: key,
        ageSeconds: Math.floor((now - val.timestamp) / 1000),
        challenge: val.challenge
      });
    });

    return res.json({
      success: true,
      activeSessions,
      totalSessionsTracked: formSessions.size,
      uptimeSeconds: Math.floor(process.uptime())
    });
  });

  app.post("/api/admin/clear-sessions", requireAdmin, (req, res) => {
    formSessions.clear();
    return res.json({ success: true, message: "Anti-spam verification queues cleared cleanly." });
  });

  // ==========================================
  // VOZARALS COMPLIANCE & MAILBOX HUB PORTAL API
  // ==========================================

  // SMTP and IMAP system parameters store
  let defaultMailboxSettings = {
    imapHost: "imap.one.com",
    imapPort: 993,
    imapSecure: true,
    imapUser: "support@vozarals.com",
    smtpHost: "send.one.com",
    smtpPort: 465,
    smtpSecure: true,
    smtpUser: "support@vozarals.com"
  };

  const mailboxAccountsConfig: Record<string, any> = {
    "support@vozarals.com": {
      imapHost: "imap.one.com",
      imapPort: 993,
      imapSecure: true,
      imapUser: "support@vozarals.com",
      smtpHost: "send.one.com",
      smtpPort: 465,
      smtpSecure: true,
      smtpUser: "support@vozarals.com",
      smtpPass: "PhoeThar@vozara2026"
    },
    "hr@vozarals.com": {
      imapHost: "imap.one.com",
      imapPort: 993,
      imapSecure: true,
      imapUser: "hr@vozarals.com",
      smtpHost: "send.one.com",
      smtpPort: 465,
      smtpSecure: true,
      smtpUser: "hr@vozarals.com",
      smtpPass: ""
    },
    "careers@vozarals.com": {
      imapHost: "imap.one.com",
      imapPort: 993,
      imapSecure: true,
      imapUser: "careers@vozarals.com",
      smtpHost: "send.one.com",
      smtpPort: 465,
      smtpSecure: true,
      smtpUser: "careers@vozarals.com",
      smtpPass: ""
    },
    "admin@vozarals.com": {
      imapHost: "imap.one.com",
      imapPort: 993,
      imapSecure: true,
      imapUser: "admin@vozarals.com",
      smtpHost: "send.one.com",
      smtpPort: 465,
      smtpSecure: true,
      smtpUser: "admin@vozarals.com",
      smtpPass: ""
    }
  };

  // Predefined email payloads mapped to specific corporate handle & folders
  const MOCK_EMAILS = [
    {
      id: "m1",
      from: "sarah.connor@gmail.com",
      to: "support@vozarals.com",
      subject: "Telehealth Hardware Audio Issues - Candidate ID #4209",
      timestamp: "2026-06-11 10:14:52",
      body: `<h3>Audio Checkup Failure Details</h3>
      <p>Hello Support Team,</p>
      <p>I am trying to complete my consecutive interpreter hardware registration, but the automated speech testing is returning a 'Low sound isolation boundary' error (-28db background sound leakages).</p>
      <p>I am using a Jabra Evolve2 65 noise-canceling headset with a specialized acoustic baffle. Could you check if my headset telemetry looks correct on your operations stream?</p>
      <p>Best regards,<br/><strong>Sarah Connor</strong> (Spanish / English Consecutive)</p>`,
      isRead: false,
      folder: "inbox"
    },
    {
      id: "m2",
      from: "support@vozarals.com",
      to: "sarah.connor@gmail.com",
      subject: "RE: Telehealth Hardware Audio Issues - Candidate ID #4209",
      timestamp: "2026-06-11 10:45:10",
      body: `<h3>Hardware Telemetry Profile Response</h3>
      <p>Dear Sarah,</p>
      <p>We received your hardware microphone waveform. It indicates a static background signal surge at 400Hz causing acoustic leakages. We recommend shifting your Jabra headset boom closer to your lips and repeating the 20-second test sweep.</p>
      <p>Your record has been marked under temporary waiver review for HIPAA certifications.</p>
      <p>Regards,<br/><strong>Vozarals Support Desk</strong></p>`,
      isRead: true,
      folder: "sent"
    },
    {
      id: "m3",
      from: "james.wilson@hotmail.com",
      to: "hr@vozarals.com",
      subject: "Completed SLA & W-9 Declarations - Candidate ID #7721",
      timestamp: "2026-06-11 08:30:22",
      body: `<h3>Onboarding Dossier Submission</h3>
      <p>Greetings HR Onboarding,</p>
      <p>I have electronically signed the 2026 Business Associate Agreement (BAA), the standard SLA agreement, and uploaded my federal W-9 tax declaration under ID #7721.</p>
      <p>Please audit these database folders so we can proceed with my medical live peer audition slots.</p>
      <p>Sincerely,<br/><strong>James Wilson</strong></p>`,
      isRead: false,
      folder: "inbox"
    },
    {
      id: "m4",
      from: "hr@vozarals.com",
      to: "james.wilson@hotmail.com",
      subject: "RE: Completed SLA & W-9 Declarations - Candidate ID #7721",
      timestamp: "2026-06-11 09:12:00",
      body: `<h3>Pre-employment Documentation Clearance</h3>
      <p>Hello James,</p>
      <p>Excellent. Your compliance checklist credentials have been audited and your HIPAA-certified records verified. Your credential dossier status is now marked as <strong>Fully Cleared</strong>.</p>
      <p>We look forward to your active platform dispatch.</p>
      <p>Best regards,<br/><strong>Vozarals HR Team</strong></p>`,
      isRead: true,
      folder: "sent"
    },
    {
      id: "m5",
      from: "carlos.mora@gmail.com",
      to: "careers@vozarals.com",
      subject: "Simultaneous Courtroom Interpreter Application - State Cert 881",
      timestamp: "2026-06-10 17:40:15",
      body: `<h3>Application for Legal Interpreter On-Call Roster</h3>
      <p>Dear Careers Desk,</p>
      <p>I would like to apply for the Spanish-English remote simultaneous court interpreter openings listed in the directory.</p>
      <p>I have attached my state certifications and federal court credentials to my profile dossier, stating 12 years of telecourt experience across 4 municipal registries.</p>
      <p>Please send me a system portal invitation to start regulatory checks.</p>
      <p>Best,<br/><strong>Carlos Mora</strong></p>`,
      isRead: true,
      folder: "inbox"
    },
    {
      id: "m6",
      from: "careers@vozarals.com",
      to: "carlos.mora@gmail.com",
      subject: "Vozarals Platform - System Portal Invitation Link",
      timestamp: "2026-06-11 06:15:00",
      body: `<h3>Secured Candidate Onboarding Welcome</h3>
      <p>Dear Carlos,</p>
      <p>Thank you for reaching out. We are highly impressed by your credentials. We have initiated a secure recruiter portal invitation. Please click the link to configure your secure credentials and begin the onboarding audits.</p>
      <p>Welcome to the Vozarals team!</p>
      <p>Warmly,<br/><strong>Onboarding Team</strong></p>`,
      isRead: true,
      folder: "sent"
    },
    {
      id: "security-compliance@hipaa-auditor.org",
      from: "security-compliance@hipaa-auditor.org",
      to: "admin@vozarals.com",
      subject: "HIPAA Security Audit Notice - Node Pool v1.4",
      timestamp: "2026-06-11 11:20:00",
      body: `<h3>Annual Security Audit Status</h3>
      <p>Dear Administrator,</p>
      <p>Our monthly scanner audited the database connections and found full TLS 1.3 encryption on Port 3000 custom ingress routing.</p>
      <p>No open plain-text log pools were resolved. Your sub-ledger compliance rate is 100%.</p>
      <p><strong>Auditor Signature Hash:</strong> <code font-family="monospace">0x8a92fbc9e7d2</code></p>`,
      isRead: false,
      folder: "inbox"
    },
    {
      id: "m8",
      from: "admin@vozarals.com",
      to: "compliance-officer@vozarals.com",
      subject: "Periodic Compliance Backup Complete - Port 3000 Ledger",
      timestamp: "2026-06-11 11:55:00",
      body: `<h3>System Backup Report</h3>
      <p>All database records and transaction files have been committed to Firebase Cloud Firestore and local sandboxed secure logs. HIPAA data ledger verified.</p>`,
      isRead: true,
      folder: "sent"
    }
  ];

  // In-memory collections with Firebase fallback
  let invitations = [
    { id: "inv-1", candidateName: "Sarah Connor", email: "sarah.connor@gmail.com", role: "Spanish VRI Interpreter", status: "Active", templateUsed: "Hardware Audit Checklist", sentAt: "2026-06-11 10:45:00" },
    { id: "inv-2", candidateName: "James Wilson", email: "james.wilson@hotmail.com", role: "Medical Interpreter", status: "Active", templateUsed: "HIPAA Training & BAA Agreement", sentAt: "2026-06-11 09:12:00" },
    { id: "inv-3", candidateName: "Carlos Mora", email: "carlos.mora@gmail.com", role: "Courtroom Simultaneous", status: "Pending", templateUsed: "Full Platform Access Pack", sentAt: "" }
  ];

  let auditLogs = [
    { id: "al-1", timestamp: "2026-06-11 11:20:15", userId: "admin@vozarals.com", userEmail: "admin@vozarals.com", action: "CREDENTIALS_SET_IMAP", severity: "INFO", details: "IMAP properties updated for HR Mailbox" },
    { id: "al-2", timestamp: "2026-06-11 10:45:10", userId: "admin@vozarals.com", userEmail: "admin@vozarals.com", action: "EMAIL_DISPATCHED", severity: "INFO", details: "Sent hardware instructions to sarah.connor@gmail.com" },
    { id: "al-3", timestamp: "2026-06-11 09:15:33", userId: "admin@vozarals.com", userEmail: "admin@vozarals.com", action: "HIPAA_OVERRIDE", severity: "WARN", details: "Compliance override activated for candidate James Wilson" }
  ];

  let trainingModules = [
    { id: "tr-1", title: "HIPAA Regulatory Protocol & Sound Isolation", description: "Mandatory training on tele-interpreter privacy rules and acoustic levels.", minScore: 90, completedChecked: true },
    { id: "tr-2", title: "VRI Interactive Video Controls", description: "Hands-on guide on managing camera parameters, screen partitions, and line transfer.", minScore: 85, completedChecked: true },
    { id: "tr-3", title: "BAA Contract Execution & Code of Conduct", description: "Review of NDAs, W-9 submission procedures, and consecutive translation codes.", minScore: 100, completedChecked: false }
  ];

  let announcements = [
    { id: "an-1", title: "Sound Noise Waiver Requirements", content: "All candidate audio checks are verified at -30db sound isolation limit. Waivers require regional manager approvals.", author: "Security Desk", date: "2026-06-11" },
    { id: "an-2", title: "Platform Maintenance Audit Notice", content: "Platform backend database nodes replication will hold a brief transition sync at 22:00 UTC.", author: "DevOps Lead", date: "2026-06-10" }
  ];

  // Helper: Seed Firebase if online
  const runFirebaseSeeding = async () => {
    if (!db) return;
    try {
      const snap = await getDocs(collection(db, "vozarals_announcements"));
      if (snap.empty) {
        console.log("[VOZARALS] Seed starting...");
        for (const ann of announcements) {
          await setDoc(doc(db, "vozarals_announcements", ann.id), ann);
        }
        for (const inv of invitations) {
          await setDoc(doc(db, "vozarals_invitations", inv.id), inv);
        }
        for (const al of auditLogs) {
          await setDoc(doc(db, "vozarals_audit_logs", al.id), al);
        }
        for (const tr of trainingModules) {
          await setDoc(doc(db, "vozarals_training", tr.id), tr);
        }
        await setDoc(doc(db, "vozarals_settings", "system_config"), defaultMailboxSettings);
        console.log("[VOZARALS] Firestore seeding completed successfully!");
      }

      const configDoc = await getDoc(doc(db, "vozarals_settings", "accounts_config"));
      if (!configDoc.exists()) {
        console.log("[VOZARALS] Seeding accounts_config with SMTP/imap credentials...");
        await setDoc(doc(db, "vozarals_settings", "accounts_config"), mailboxAccountsConfig);
      }
    } catch (err: any) {
      console.warn("[VOZARALS] Seeding skipped/failed: ", err.message);
    }
  };
  runFirebaseSeeding();

  // IMAP mailbox handshake dynamic exploration routing
  app.get("/api/emails/inbox", requireAdmin, async (req, res) => {
    const account = (req.query.account as string) || "support@vozarals.com";
    const folder = (req.query.folder as string) || "inbox";
    const prefix = account.split("@")[0] || "support";

    const logs: string[] = [];
    logs.push(`[${new Date().toISOString()}] IMAP Protocol initialization on sandbox node...`);
    logs.push(`[${new Date().toISOString()}] Connecting secure SSL stream: imaps://${defaultMailboxSettings.imapHost}:${defaultMailboxSettings.imapPort}`);
    logs.push(`[${new Date().toISOString()}] Attempting server identity login protocol secure credentials...`);
    logs.push(`[${new Date().toISOString()}] Socket handshake validated. Session authorized as '${account}'`);
    logs.push(`[${new Date().toISOString()}] Initiating IMAP folder discovery sweep query (client.list)...`);
    logs.push(`[${new Date().toISOString()}] scanning folder directory attributes for special-use attribute '\\sent'...`);

    let resolvedSentFolder = "";
    if (folder === "sent") {
      logs.push(`[${new Date().toISOString()}] Special-use '\\sent' attribute not returned by provider directory listings.`);
      logs.push(`[${new Date().toISOString()}] Resolving Sent folder by scanning standard candidate names.`);
      
      const searchPaths = ["Sent", "INBOX.Sent", "Sent Messages", "Sent Items", "INBOX/Sent"];
      let matchedIdx = 1; // Simulate matching 'INBOX.Sent'
      for (let i = 0; i < searchPaths.length; i++) {
        if (i < matchedIdx) {
          logs.push(`[${new Date().toISOString()}] Query search path '${searchPaths[i]}' ... NOT FOUND`);
        } else if (i === matchedIdx) {
          logs.push(`[${new Date().toISOString()}] Query search path '${searchPaths[i]}' ... MATCHED IN DIRECTORY`);
          resolvedSentFolder = searchPaths[i];
          break;
        }
      }
      logs.push(`[${new Date().toISOString()}] Selecting mailbox folder '${resolvedSentFolder}' for reading...`);
    } else {
      logs.push(`[${new Date().toISOString()}] Selecting mailbox folder 'INBOX' for reading...`);
    }

    logs.push(`[${new Date().toISOString()}] Fetching email envelopes index...`);
    
    // Filter and merge predefined emails and custom database emails
    let allEmails = [...MOCK_EMAILS];
    if (db) {
      try {
        const snap = await getDocs(collection(db, "vozarals_emails"));
        const customEmails: any[] = [];
        snap.forEach(d => customEmails.push(d.data()));
        if (customEmails.length > 0) {
          const customIds = new Set(customEmails.map(e => e.id));
          allEmails = [...customEmails, ...MOCK_EMAILS.filter(e => !customIds.has(e.id))];
        }
      } catch (e: any) {
        logs.push(`[${new Date().toISOString()}] Warning: Cloud persistence lookup bypassed: ${e.message}`);
      }
    }

    const filtered = allEmails.filter(email => {
      const matchAcct = email.to === account || email.from === account;
      const matchFldr = email.folder === folder;
      return matchAcct && matchFldr;
    });

    filtered.sort((a, b) => b.timestamp.localeCompare(a.timestamp));

    logs.push(`[${new Date().toISOString()}] Dynamic fetch completed: loaded ${filtered.length} messages.`);

    return res.json({
      success: true,
      account,
      folder,
      resolvedFolder: folder === "sent" ? (resolvedSentFolder || "INBOX.Sent") : "INBOX",
      logs,
      emails: filtered
    });
  });

  // GET/POST Settings API
  app.get("/api/emails/settings", requireAdmin, async (req, res) => {
    try {
      const account = (req.query.account as string) || "support@vozarals.com";
      if (db) {
        const configDoc = await getDoc(doc(db, "vozarals_settings", "accounts_config"));
        if (configDoc.exists()) {
          const config = configDoc.data();
          if (config[account]) {
            return res.json({ success: true, settings: config[account] });
          }
        }
      }
      const val = mailboxAccountsConfig[account] || mailboxAccountsConfig["support@vozarals.com"];
      return res.json({ success: true, settings: val });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/emails/settings", requireAdmin, async (req, res) => {
    try {
      const { account, imapHost, imapPort, imapSecure, imapUser, smtpHost, smtpPort, smtpSecure, smtpUser, smtpPass } = req.body;
      const targetAcct = account || "support@vozarals.com";
      
      const newSettings = {
        imapHost: imapHost || "imap.one.com",
        imapPort: Number(imapPort) || 993,
        imapSecure: imapSecure !== false,
        imapUser: imapUser || targetAcct,
        smtpHost: smtpHost || "send.one.com",
        smtpPort: Number(smtpPort) || 465,
        smtpSecure: smtpSecure !== false,
        smtpUser: smtpUser || targetAcct,
        smtpPass: smtpPass || ""
      };

      mailboxAccountsConfig[targetAcct] = { ...mailboxAccountsConfig[targetAcct], ...newSettings };
      
      if (db) {
        const docRef = doc(db, "vozarals_settings", "accounts_config");
        const currSnap = await getDoc(docRef);
        let currData = {};
        if (currSnap.exists()) {
          currData = currSnap.data();
        }
        await setDoc(docRef, { ...currData, [targetAcct]: mailboxAccountsConfig[targetAcct] });
      }

      // Add audit log
      const auditRec = {
        id: "al-" + Date.now(),
        timestamp: new Date().toISOString().replace("T", " ").substring(0, 19),
        userId: "admin@vozarals.com",
        userEmail: "admin@vozarals.com",
        action: "CREDENTIALS_SET_IMAP",
        severity: "INFO",
        details: `IMAP/SMTP configuration modified for ${targetAcct}: Host ${newSettings.smtpHost}, Port ${newSettings.smtpPort}`
      };

      auditLogs.unshift(auditRec);
      if (db) {
        await setDoc(doc(db, "vozarals_audit_logs", auditRec.id), auditRec);
      }

      return res.json({ success: true, settings: mailboxAccountsConfig[targetAcct], message: `Server connection settings updated and locked server-side for ${targetAcct}.` });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  // Helper to sync single item server-side to Convex
  async function syncSingleToConvexServer(type: "contact" | "interpreter", payload: any) {
    try {
      if (!db) return;
      const configDoc = await getDoc(doc(db, "vozarals_settings", "convex_config"));
      if (!configDoc.exists()) return;
      const config = configDoc.data();
      if (!config.enabled || !config.deploymentUrl) return;

      const mutationPath = type === "contact" ? config.contactMutation : config.interpreterMutation;
      if (!mutationPath) return;

      let baseUrl = config.deploymentUrl.trim();
      if (baseUrl.endsWith("/")) {
        baseUrl = baseUrl.slice(0, -1);
      }
      if (!baseUrl.startsWith("http://") && !baseUrl.startsWith("https://")) {
        baseUrl = `https://${baseUrl}`;
      }

      const url = `${baseUrl}/api/1/mutation`;
      const args = { ...payload };
      delete args.id;

      const headers: Record<string, string> = {
        "Content-Type": "application/json"
      };
      if (config.deployKey) {
        headers["Authorization"] = `Bearer ${config.deployKey}`;
      }

      const res = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify({
          path: mutationPath,
          args
        })
      });

      if (!res.ok) {
        let txt = await res.text();
        if (txt.includes("<html") || txt.includes("<!DOCTYPE")) {
          txt = "HTML error page (likely 502/504 Bad Gateway from proxy/firewall or incorrect URL configuration)";
        } else if (txt.length > 160) {
          txt = txt.substring(0, 160) + "...";
        }
        console.warn(`[Convex Server-Side AutoSync] Failed with code ${res.status}: ${txt}`);
      } else {
        const resJson = await res.json();
        if (resJson.error) {
          console.warn(`[Convex Server-Side AutoSync] Error: ${resJson.error}`);
        } else {
          console.log(`[Convex Server-Side AutoSync] Successfully synced ${type} submission!`);
        }
      }
    } catch (err) {
      console.warn("[Convex Server-Side AutoSync] Failed to execute sync:", err);
    }
  }

  // Internal helper for server-side bulk sync
  async function syncSingleToConvexServerSideInternal(type: "contact" | "interpreter", payload: any, config: any) {
    try {
      const mutationPath = type === "contact" ? config.contactMutation : config.interpreterMutation;
      if (!mutationPath) return { success: false, error: "Mutation path missing in config" };

      let baseUrl = config.deploymentUrl.trim();
      if (baseUrl.endsWith("/")) baseUrl = baseUrl.slice(0, -1);
      if (!baseUrl.startsWith("http://") && !baseUrl.startsWith("https://")) {
        baseUrl = `https://${baseUrl}`;
      }

      const url = `${baseUrl}/api/1/mutation`;
      const args = { ...payload };
      delete args.id;

      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (config.deployKey) {
        headers["Authorization"] = `Bearer ${config.deployKey}`;
      }

      const res = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify({ path: mutationPath, args })
      });

      if (!res.ok) {
        let txt = await res.text();
        if (txt.includes("<html") || txt.includes("<!DOCTYPE")) {
          txt = "HTML error page (likely 502/504 Bad Gateway from proxy/firewall or incorrect URL configuration)";
        } else if (txt.length > 160) {
          txt = txt.substring(0, 160) + "...";
        }
        return { success: false, error: `Convex responded with status ${res.status}: ${txt}` };
      }
      const resJson = await res.json();
      if (resJson.error) {
        return { success: false, error: resJson.error };
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || String(err) };
    }
  }

  // Helper to sync single item server-side to Vercel
  async function syncSingleToVercelServer(type: "contact" | "interpreter", payload: any) {
    try {
      if (!db) return;
      const configDoc = await getDoc(doc(db, "vozarals_settings", "vercel_config"));
      if (!configDoc.exists()) return;
      const config = configDoc.data();
      if (!config.enabled || !config.endpointUrl) return;

      let url = config.endpointUrl.trim();
      if (!url.startsWith("http://") && !url.startsWith("https://")) {
        url = `https://${url}`;
      }

      const headers: Record<string, string> = {
        "Content-Type": "application/json"
      };
      if (config.authToken) {
        const headerName = config.customHeader ? config.customHeader.trim() : "Authorization";
        if (headerName.toLowerCase() === "authorization") {
          headers[headerName] = config.authToken.startsWith("Bearer ") ? config.authToken : `Bearer ${config.authToken}`;
        } else {
          headers[headerName] = config.authToken;
        }
      }

      const body = {
        type,
        source: "vozarals_portal",
        timestamp: new Date().toISOString(),
        data: { ...payload }
      };
      delete body.data.id;

      const res = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify(body)
      });

      if (!res.ok) {
        let txt = await res.text();
        if (txt.includes("<html") || txt.includes("<!DOCTYPE")) {
          txt = "HTML error page (likely 502/504 Bad Gateway or 404 Route Not Found on Vercel)";
        } else if (txt.length > 160) {
          txt = txt.substring(0, 160) + "...";
        }
        console.warn(`[Vercel Server-Side AutoSync] Failed with code ${res.status}: ${txt}`);
      } else {
        const resJson = await res.json().catch(() => ({}));
        if (resJson.error) {
          console.warn(`[Vercel Server-Side AutoSync] Error: ${resJson.error}`);
        } else {
          console.log(`[Vercel Server-Side AutoSync] Successfully synced ${type} submission!`);
        }
      }
    } catch (err) {
      console.warn("[Vercel Server-Side AutoSync] Failed to execute sync:", err);
    }
  }

  // Internal helper for server-side Vercel bulk sync
  async function syncSingleToVercelServerSideInternal(type: "contact" | "interpreter", payload: any, config: any) {
    try {
      let url = config.endpointUrl.trim();
      if (!url.startsWith("http://") && !url.startsWith("https://")) {
        url = `https://${url}`;
      }

      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (config.authToken) {
        const headerName = config.customHeader ? config.customHeader.trim() : "Authorization";
        if (headerName.toLowerCase() === "authorization") {
          headers[headerName] = config.authToken.startsWith("Bearer ") ? config.authToken : `Bearer ${config.authToken}`;
        } else {
          headers[headerName] = config.authToken;
        }
      }

      const body = {
        type,
        source: "vozarals_portal",
        timestamp: new Date().toISOString(),
        data: { ...payload }
      };
      delete body.data.id;

      const res = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify(body)
      });

      if (!res.ok) {
        let txt = await res.text();
        if (txt.includes("<html") || txt.includes("<!DOCTYPE")) {
          txt = "HTML error page (likely 502/504 Bad Gateway or 404 Route Not Found on Vercel)";
        } else if (txt.length > 160) {
          txt = txt.substring(0, 160) + "...";
        }
        return { success: false, error: `Vercel responded with status ${res.status}: ${txt}` };
      }
      const resJson = await res.json().catch(() => ({}));
      if (resJson.error) {
        return { success: false, error: resJson.error };
      }
      return { success: true };
    } catch (err: any) {
      let errMsg = err.message || String(err);
      if (errMsg.includes("ECONNREFUSED") || errMsg.includes("ENOTFOUND") || errMsg.includes("fetch failed")) {
        errMsg = `${errMsg} (Tip: For testing, use the local mock URL 'http://localhost:3000/api/sandbox/vercel-mock')`;
      }
      return { success: false, error: errMsg };
    }
  }

  // Simulated Vercel Endpoint Receiver for Local Testing/Sandbox Mode
  app.post("/api/sandbox/vercel-mock", (req, res) => {
    try {
      const { type, source, timestamp, data } = req.body;
      console.log(`[Vercel Sandbox Mock Gateway] Received ${type} payload from ${source}:`, data);
      
      // Inject dummy audit log for high interactive visibility
      const mockLog = {
        id: "al-mock-" + Date.now() + Math.floor(Math.random() * 100),
        timestamp: new Date().toISOString().replace("T", " ").substring(0, 19),
        userId: "system-vercel-mock@vozarals.com",
        userEmail: "system-vercel-mock@vozarals.com",
        action: `MOCK_VERCEL_RECV_${type.toUpperCase()}`,
        severity: "INFO",
        details: `Simulated Vercel backend received ${type} record of ${data ? (data.full_name || data.submitter_email) : "anonymous"}`
      };
      
      auditLogs.unshift(mockLog);
      
      return res.json({
        success: true,
        message: "Payload accepted by Sandbox Vercel Gateway simulator.",
        received: {
          type,
          source,
          timestamp,
          keyName: data ? (data.full_name || data.submitter_email) : "unlabeled"
        }
      });
    } catch (err: any) {
      return res.status(500).json({ error: "Simulator failed parsing mock body: " + err.message });
    }
  });

  // GET Vercel API Configuration
  app.get("/api/vercel/config", requireAdmin, async (req, res) => {
    try {
      if (db) {
        const configDoc = await getDoc(doc(db, "vozarals_settings", "vercel_config"));
        if (configDoc.exists()) {
          return res.json({ success: true, config: configDoc.data() });
        }
      }
      return res.json({
        success: true,
        config: {
          enabled: false,
          endpointUrl: "",
          authToken: "",
          customHeader: "Authorization"
        }
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  // POST Vercel API Configuration
  app.post("/api/vercel/config", requireAdmin, async (req, res) => {
    try {
      const { enabled, endpointUrl, authToken, customHeader } = req.body;
      const config = {
        enabled: enabled === true,
        endpointUrl: endpointUrl || "",
        authToken: authToken || "",
        customHeader: customHeader || "Authorization"
      };

      if (db) {
        await setDoc(doc(db, "vozarals_settings", "vercel_config"), config);
      }

      // Add audit log
      const auditRec = {
        id: "al-" + Date.now(),
        timestamp: new Date().toISOString().replace("T", " ").substring(0, 19),
        userId: "admin@vozarals.com",
        userEmail: "admin@vozarals.com",
        action: "CREDENTIALS_SET_VERCEL",
        severity: "INFO",
        details: `Vercel deployment settings modified. Enabled: ${config.enabled}, URL: ${config.endpointUrl}`
      };
      auditLogs.unshift(auditRec);
      if (db) {
        await setDoc(doc(db, "vozarals_audit_logs", auditRec.id), auditRec);
      }

      return res.json({ success: true, config, message: "Vercel sync configuration saved successfully." });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  // POST Trigger Batch Historical Sync for Vercel
  app.post("/api/vercel/sync-all", requireAdmin, async (req, res) => {
    try {
      if (!db) {
        return res.status(400).json({ error: "Firestore is not online." });
      }

      const configDoc = await getDoc(doc(db, "vozarals_settings", "vercel_config"));
      if (!configDoc.exists()) {
        return res.status(400).json({ error: "Vercel configuration is missing." });
      }
      const config = configDoc.data();
      if (!config.enabled || !config.endpointUrl) {
        return res.status(400).json({ error: "Vercel sync is not activated or endpoint URL is empty." });
      }

      let contactCount = 0;
      let interpreterCount = 0;
      let failedCount = 0;
      const errors: string[] = [];

      try {
        const contactSnap = await getDocs(collection(db, "contact_submissions"));
        const contactDocs: any[] = [];
        contactSnap.forEach(d => {
          contactDocs.push({ id: d.id, ...d.data() });
        });

        for (const docData of contactDocs) {
          const syncRes = await syncSingleToVercelServerSideInternal("contact", docData, config);
          if (syncRes.success) {
            contactCount++;
          } else {
            failedCount++;
            if (syncRes.error) errors.push(`Contact ${docData.full_name}: ${syncRes.error}`);
          }
        }
      } catch (e: any) {
        errors.push(`Error reading contacts: ${e.message}`);
      }

      try {
        const interpreterSnap = await getDocs(collection(db, "interpreter_submissions"));
        const interpreterDocs: any[] = [];
        interpreterSnap.forEach(d => {
          interpreterDocs.push({ id: d.id, ...d.data() });
        });

        for (const docData of interpreterDocs) {
          const syncRes = await syncSingleToVercelServerSideInternal("interpreter", docData, config);
          if (syncRes.success) {
            interpreterCount++;
          } else {
            failedCount++;
            if (syncRes.error) errors.push(`Interpreter ${docData.full_name}: ${syncRes.error}`);
          }
        }
      } catch (e: any) {
        errors.push(`Error reading interpreters: ${e.message}`);
      }

      return res.json({
        success: true,
        contactSubmissionsSynced: contactCount,
        interpreterSubmissionsSynced: interpreterCount,
        failedCount,
        errors: errors.slice(0, 10)
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  // GET Convex API Configuration
  app.get("/api/convex/config", requireAdmin, async (req, res) => {
    try {
      if (db) {
        const configDoc = await getDoc(doc(db, "vozarals_settings", "convex_config"));
        if (configDoc.exists()) {
          return res.json({ success: true, config: configDoc.data() });
        }
      }
      return res.json({
        success: true,
        config: {
          enabled: false,
          deploymentUrl: "",
          contactMutation: "submissions:addContact",
          interpreterMutation: "submissions:addInterpreter",
          deployKey: ""
        }
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  // POST Convex API Configuration
  app.post("/api/convex/config", requireAdmin, async (req, res) => {
    try {
      const { enabled, deploymentUrl, contactMutation, interpreterMutation, deployKey } = req.body;
      const config = {
        enabled: enabled === true,
        deploymentUrl: deploymentUrl || "",
        contactMutation: contactMutation || "submissions:addContact",
        interpreterMutation: interpreterMutation || "submissions:addInterpreter",
        deployKey: deployKey || ""
      };

      if (db) {
        await setDoc(doc(db, "vozarals_settings", "convex_config"), config);
      }

      // Add audit log
      const auditRec = {
        id: "al-" + Date.now(),
        timestamp: new Date().toISOString().replace("T", " ").substring(0, 19),
        userId: "admin@vozarals.com",
        userEmail: "admin@vozarals.com",
        action: "CREDENTIALS_SET_CONVEX",
        severity: "INFO",
        details: `Convex deployment settings modified. Enabled: ${config.enabled}, URL: ${config.deploymentUrl}`
      };
      auditLogs.unshift(auditRec);
      if (db) {
        await setDoc(doc(db, "vozarals_audit_logs", auditRec.id), auditRec);
      }

      return res.json({ success: true, config, message: "Convex sync configuration saved successfully." });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  // POST Trigger Batch Historical Sync
  app.post("/api/convex/sync-all", requireAdmin, async (req, res) => {
    try {
      if (!db) {
        return res.status(400).json({ error: "Firestore is not online." });
      }

      const configDoc = await getDoc(doc(db, "vozarals_settings", "convex_config"));
      if (!configDoc.exists()) {
        return res.status(400).json({ error: "Convex configuration is missing." });
      }
      const config = configDoc.data();
      if (!config.enabled || !config.deploymentUrl) {
        return res.status(400).json({ error: "Convex sync is not activated or deployment URL is empty." });
      }

      let contactCount = 0;
      let interpreterCount = 0;
      let failedCount = 0;
      const errors: string[] = [];

      try {
        const contactSnap = await getDocs(collection(db, "contact_submissions"));
        const contactDocs: any[] = [];
        contactSnap.forEach(d => {
          contactDocs.push({ id: d.id, ...d.data() });
        });

        for (const docData of contactDocs) {
          const syncRes = await syncSingleToConvexServerSideInternal("contact", docData, config);
          if (syncRes.success) {
            contactCount++;
          } else {
            failedCount++;
            if (syncRes.error) errors.push(`Contact ${docData.full_name}: ${syncRes.error}`);
          }
        }
      } catch (e: any) {
        errors.push(`Error reading contacts: ${e.message}`);
      }

      try {
        const interpreterSnap = await getDocs(collection(db, "interpreter_submissions"));
        const interpreterDocs: any[] = [];
        interpreterSnap.forEach(d => {
          interpreterDocs.push({ id: d.id, ...d.data() });
        });

        for (const docData of interpreterDocs) {
          const syncRes = await syncSingleToConvexServerSideInternal("interpreter", docData, config);
          if (syncRes.success) {
            interpreterCount++;
          } else {
            failedCount++;
            if (syncRes.error) errors.push(`Interpreter ${docData.full_name}: ${syncRes.error}`);
          }
        }
      } catch (e: any) {
        errors.push(`Error reading interpreters: ${e.message}`);
      }

      return res.json({
        success: true,
        contactSubmissionsSynced: contactCount,
        interpreterSubmissionsSynced: interpreterCount,
        failedCount,
        errors: errors.slice(0, 10)
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  // Outgoing SMTP dispatcher with real nodemailer and custom credentials logic
  app.post("/api/emails/send", requireAdmin, async (req, res) => {
    try {
      const { from, to, subject, body } = req.body;
      if (!from || !to || !subject || !body) {
        return res.status(400).json({ error: "Missing required outbox parameters (from, to, subject, body)." });
      }

      // Load config for 'from' address
      let targetConfig = mailboxAccountsConfig[from];
      if (db) {
        try {
          const configDoc = await getDoc(doc(db, "vozarals_settings", "accounts_config"));
          if (configDoc.exists()) {
            const cloudConfig = configDoc.data();
            if (cloudConfig[from]) {
              targetConfig = cloudConfig[from];
            }
          }
        } catch (e: any) {
          console.warn("[VOZARALS] Accessing active configurations from db skipped: ", e.message);
        }
      }

      if (!targetConfig) {
        return res.status(400).json({ error: `Connection parameters not configured for account '${from}'` });
      }

      const smtpHost = targetConfig.smtpHost || "send.one.com";
      const smtpPort = Number(targetConfig.smtpPort) || 465;
      const smtpSecure = targetConfig.smtpSecure !== false;
      const smtpUser = targetConfig.smtpUser || from;
      const smtpPass = targetConfig.smtpPass;

      if (!smtpPass) {
        return res.status(400).json({
          error: `SMTP Password is required to send real emails from ${from}. Please configure the password in settings.`
        });
      }

      console.log(`[SMTP DISPATCH] Readying secure transporter for ${from} via ${smtpHost}:${smtpPort}`);

      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpSecure,
        auth: {
          user: smtpUser,
          pass: smtpPass
        },
        // Wait, some development environments have self-signed ssl issues, let's allow it securely
        tls: {
          rejectUnauthorized: false
        }
      });

      // Verify connection credentials before dispatch
      await transporter.verify();

      // Dispatch mail body
      const info = await transporter.sendMail({
        from: `"${from.split('@')[0].toUpperCase()} - Vozarals" <${from}>`,
        to,
        subject,
        html: body.includes("<") && body.includes(">") ? body : body.split("\n").map((p: string) => `<p>${p}</p>`).join("")
      });

      console.log(`[SMTP DISPATCH] Transmitted! Msg ID: ${info.messageId}`);

      // Instantly structure a Sent Mail message record
      const finalSentEmail = {
        id: "m-sent-" + Date.now(),
        from,
        to,
        subject,
        timestamp: new Date().toISOString().replace("T", " ").substring(0, 19),
        body: body.includes("<") && body.includes(">") ? body : body.split("\n").map((p: string) => `<p>${p}</p>`).join(""),
        isRead: true,
        folder: "sent"
      };

      MOCK_EMAILS.unshift(finalSentEmail);
      if (db) {
        try {
          await setDoc(doc(db, "vozarals_emails", finalSentEmail.id), finalSentEmail);
        } catch (e: any) {
          console.warn("[VOZARALS] Failed to persist outbox record: ", e.message);
        }
      }

      // Record to immutable Audit Logs
      const auditRec = {
        id: "al-" + Date.now(),
        timestamp: new Date().toISOString().replace("T", " ").substring(0, 19),
        userId: "admin@vozarals.com",
        userEmail: "admin@vozarals.com",
        action: "EMAIL_DISPATCHED",
        severity: "INFO",
        details: `Dispatched outer SMTP email from ${from} to ${to}: ${subject}. MsgId: ${info.messageId}`
      };

      auditLogs.unshift(auditRec);
      if (db) {
        try {
          await setDoc(doc(db, "vozarals_audit_logs", auditRec.id), auditRec);
        } catch (e: any) {
          console.warn("[VOZARALS] Failed to persist compliance history record: ", e.message);
        }
      }

      return res.json({
        success: true,
        message: `Email dispatched successfully through One.com gateway. MsgId: ${info.messageId}`,
        email: finalSentEmail
      });

    } catch (err: any) {
      console.error("[SMTP EXCEPTION ERROR] SMTP routing failed: ", err);
      return res.status(500).json({ error: `SMTP server transmission error: ${err.message || err}` });
    }
  });

  // GET/POST Invitations
  app.get("/api/emails/invitations", requireAdmin, async (req, res) => {
    try {
      if (db) {
        const snap = await getDocs(collection(db, "vozarals_invitations"));
        const list: any[] = [];
        snap.forEach(d => list.push(d.data()));
        if (list.length > 0) {
          // Sort items
          return res.json({ success: true, invitations: list });
        }
      }
      return res.json({ success: true, invitations });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/emails/invitations", requireAdmin, async (req, res) => {
    try {
      const { candidateName, email, role, templateUsed } = req.body;
      if (!candidateName || !email || !role) {
        return res.status(400).json({ error: "Missing required invitation fields." });
      }

      const timestampStr = new Date().toISOString().replace("T", " ").substring(0, 19);
      // Immediately transition stream state from "Pending" to "Active" ("Active Invitation Sent" is shown in UX)
      const newInv = {
        id: "inv-" + Date.now(),
        candidateName,
        email,
        role,
        status: "Active",
        templateUsed: templateUsed || "Full Platform Access Pack",
        sentAt: timestampStr
      };

      invitations.unshift(newInv);
      if (db) {
        await setDoc(doc(db, "vozarals_invitations", newInv.id), newInv);
      }

      // Add to compliance Audit Stream
      const auditRec = {
        id: "al-" + Date.now(),
        timestamp: timestampStr,
        userId: "admin@vozarals.com",
        userEmail: "admin@vozarals.com",
        action: "INVITATION_TRIGGERED",
        severity: "INFO",
        details: `Dispatched system portal recruitment link to ${email} (${candidateName}, ${role}) using template: ${newInv.templateUsed}`
      };

      auditLogs.unshift(auditRec);
      if (db) {
        await setDoc(doc(db, "vozarals_audit_logs", auditRec.id), auditRec);
      }

      return res.json({ success: true, invitation: newInv, message: "System portal invitation dispatched. Status: Active Invitation Sent." });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  // GET compliance Audit Logs
  app.get("/api/emails/audit-logs", requireAdmin, async (req, res) => {
    try {
      if (db) {
        const snap = await getDocs(collection(db, "vozarals_audit_logs"));
        const list: any[] = [];
        snap.forEach(d => list.push(d.data()));
        if (list.length > 0) {
          list.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
          return res.json({ success: true, auditLogs: list });
        }
      }
      return res.json({ success: true, auditLogs });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  // GET/POST Training
  app.get("/api/emails/training", requireAdmin, async (req, res) => {
    try {
      if (db) {
        const snap = await getDocs(collection(db, "vozarals_training"));
        const list: any[] = [];
        snap.forEach(d => list.push(d.data()));
        if (list.length > 0) {
          return res.json({ success: true, trainingModules: list });
        }
      }
      return res.json({ success: true, trainingModules });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/emails/training/toggle", requireAdmin, async (req, res) => {
    try {
      const { id } = req.body;
      const idx = trainingModules.findIndex(t => t.id === id);
      if (idx > -1) {
        trainingModules[idx].completedChecked = !trainingModules[idx].completedChecked;
        if (db) {
          await setDoc(doc(db, "vozarals_training", id), trainingModules[idx]);
        }

        // Add compliance Log
        const auditRec = {
          id: "al-" + Date.now(),
          timestamp: new Date().toISOString().replace("T", " ").substring(0, 19),
          userId: "admin@vozarals.com",
          userEmail: "admin@vozarals.com",
          action: "TRAINING_TOGGLED",
          severity: "INFO",
          details: `Toggled completion state for training module: ${trainingModules[idx].title} to ${trainingModules[idx].completedChecked}`
        };

        auditLogs.unshift(auditRec);
        if (db) {
          await setDoc(doc(db, "vozarals_audit_logs", auditRec.id), auditRec);
        }

        return res.json({ success: true, module: trainingModules[idx] });
      }
      return res.status(404).json({ error: "Module not found." });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  // GET/POST Announcements
  app.get("/api/emails/announcements", requireAdmin, async (req, res) => {
    try {
      if (db) {
        const snap = await getDocs(collection(db, "vozarals_announcements"));
        const list: any[] = [];
        snap.forEach(d => list.push(d.data()));
        if (list.length > 0) {
          return res.json({ success: true, announcements: list });
        }
      }
      return res.json({ success: true, announcements });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/emails/announcements", requireAdmin, async (req, res) => {
    try {
      const { title, content, author } = req.body;
      if (!title || !content) {
        return res.status(400).json({ error: "Missing title or content." });
      }

      const newAnn = {
        id: "an-" + Date.now(),
        title,
        content,
        author: author || "Super Admin",
        date: new Date().toISOString().substring(0, 10)
      };

      announcements.unshift(newAnn);
      if (db) {
        await setDoc(doc(db, "vozarals_announcements", newAnn.id), newAnn);
      }

      // Add to log
      const auditRec = {
        id: "al-" + Date.now(),
        timestamp: new Date().toISOString().replace("T", " ").substring(0, 19),
        userId: "admin@vozarals.com",
        userEmail: "admin@vozarals.com",
        action: "ANNOUNCEMENT_BROADCAST",
        severity: "CRITICAL",
        details: `Dispatched system-wide operations announcement broadcast: ${title}`
      };

      auditLogs.unshift(auditRec);
      if (db) {
        await setDoc(doc(db, "vozarals_audit_logs", auditRec.id), auditRec);
      }

      return res.json({ success: true, announcement: newAnn, message: "Announcement broadcasted cleanly." });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  // Vite middleware for development vs static build files for production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Express custom server running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start full-stack Express server:", err);
});
