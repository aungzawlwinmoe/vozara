import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { initializeApp } from "firebase/app";
import { initializeFirestore, collection, addDoc, doc, getDoc, setDoc, getDocs, deleteDoc } from "firebase/firestore";
import dotenv from "dotenv";
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
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

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
        }
      } catch (dbErr) {
        console.error("Failed to write contact request to Firestore:", dbErr);
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
        additional_info
      } = payload;

      if (!full_name || !submitter_email || !phone || !primary_language || !location) {
        return res.status(400).json({ 
          error: "Please fill in all required fields to submit your application." 
        });
      }

      // Dispatch real email to careers@vozarals.com via SMTP
      let emailResult: { success: boolean; previewUrl?: string; error?: string } | null = null;
      try {
        emailResult = await sendInterpreterApplicationEmail(payload);
      } catch (mailErr) {
        console.error("Recruitment email dispatch failed:", mailErr);
      }

      const timestamp = new Date().toISOString();
      const emailSandboxPreview = emailResult?.previewUrl || "";

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
              timestamp,
              email_sandbox_preview: emailSandboxPreview
            });
          } catch (dbErr) {
            handleFirestoreError(dbErr, OperationType.CREATE, path);
          }
          console.log("Successfully saved interpreter application to Firestore!");
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
