import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  User 
} from "firebase/auth";
import { 
  getFirestore, 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  deleteDoc,
  query,
  orderBy
} from "firebase/firestore";
import firebaseConfig from "../firebase-applet-config.json";

// Initialize Firebase App
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Provider Config
const provider = new GoogleAuthProvider();

let isSigningIn = false;
let cachedAccessToken: string | null = null;

// Initialize Auth listener
export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        // Auth state is active but token is not in cache (e.g. reload). 
        // We'll require signInWithPopup to get a fresh token.
        cachedAccessToken = null;
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

// Sign-In trigger (must be called from click handler)
export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error("Failed to secure active Access Token from Google Auth Gateway.");
    }
    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error("Firebase Google Auth Error:", error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

export const logout = async () => {
  await auth.signOut();
  cachedAccessToken = null;
};

// Direct Firestore Helpers for client Fallback (such as on GitHub Pages statically deployed apps)
export const submitContactFormDirect = async (payload: any) => {
  const timestamp = new Date().toISOString();
  await addDoc(collection(db, "contact_submissions"), {
    full_name: payload.full_name,
    submitter_email: payload.submitter_email,
    phone: payload.phone || "",
    organization: payload.organization || "",
    service: payload.service || "",
    language_pair: payload.language_pair || "",
    message: payload.message,
    timestamp
  });
};

export const submitInterpreterAppDirect = async (payload: any) => {
  const timestamp = new Date().toISOString();
  await addDoc(collection(db, "interpreter_submissions"), {
    full_name: payload.full_name,
    submitter_email: payload.submitter_email,
    phone: payload.phone,
    location: payload.location,
    primary_language: payload.primary_language,
    additional_languages: payload.additional_languages || "",
    interpreting_modes: payload.interpreting_modes || "Both",
    industries: payload.industries || "",
    experience_years: payload.experience_years || "",
    certifications: payload.certifications || "",
    medical_legal_knowledge: payload.medical_legal_knowledge || "",
    technical_setup: payload.technical_setup || "",
    availability: payload.availability || "",
    linkedin_or_portfolio: payload.linkedin_or_portfolio || "",
    additional_info: payload.additional_info || "",
    timestamp,
    email_sandbox_preview: ""
  });
};

export const getContactSubmissionsDirect = async (): Promise<any[]> => {
  const q = query(collection(db, "contact_submissions"));
  const snapshot = await getDocs(q);
  const items: any[] = [];
  snapshot.forEach((snapDoc) => {
    items.push({ id: snapDoc.id, ...snapDoc.data() });
  });
  // Sort by timestamp descending
  return items.sort((a, b) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime());
};

export const getInterpreterSubmissionsDirect = async (): Promise<any[]> => {
  const q = query(collection(db, "interpreter_submissions"));
  const snapshot = await getDocs(q);
  const items: any[] = [];
  snapshot.forEach((snapDoc) => {
    items.push({ id: snapDoc.id, ...snapDoc.data() });
  });
  // Sort by timestamp descending
  return items.sort((a, b) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime());
};

export const deleteSubmissionDirect = async (type: "contact" | "interpreter", id: string) => {
  const colName = type === "contact" ? "contact_submissions" : "interpreter_submissions";
  const docRef = doc(db, colName, id);
  await deleteDoc(docRef);
};

