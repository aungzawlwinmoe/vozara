import { doc, getDoc, setDoc } from "firebase/firestore";

export interface VercelConfig {
  enabled: boolean;
  endpointUrl: string;
  authToken: string;
  customHeader: string;
}

const DEFAULT_CONFIG: VercelConfig = {
  enabled: false,
  endpointUrl: "",
  authToken: "",
  customHeader: "Authorization",
};

export async function getVercelConfig(): Promise<VercelConfig> {
  try {
    const { db } = await import("./firebase");
    const docRef = doc(db, "vozarals_settings", "vercel_config");
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return { ...DEFAULT_CONFIG, ...snap.data() };
    }
  } catch (err) {
    console.warn("Failed to get Vercel config from Firestore:", err);
  }
  try {
    const local = localStorage.getItem("vercel_config");
    if (local) {
      return { ...DEFAULT_CONFIG, ...JSON.parse(local) };
    }
  } catch (_) {}
  return DEFAULT_CONFIG;
}

export async function saveVercelConfig(config: VercelConfig): Promise<void> {
  try {
    const { db } = await import("./firebase");
    const docRef = doc(db, "vozarals_settings", "vercel_config");
    await setDoc(docRef, config);
  } catch (err) {
    console.error("Failed to save Vercel config to Firestore:", err);
  }
  try {
    localStorage.setItem("vercel_config", JSON.stringify(config));
  } catch (_) {}
}

export async function syncSingleToVercel(
  type: "contact" | "interpreter",
  payload: any,
  providedConfig?: VercelConfig
): Promise<{ success: boolean; error?: string }> {
  try {
    const config = providedConfig || (await getVercelConfig());
    if (!config.enabled || !config.endpointUrl) {
      return { success: false, error: "Vercel sync is not enabled or endpoint URL is empty." };
    }

    let url = config.endpointUrl.trim();
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      url = `https://${url}`;
    }

    console.log(`Syncing ${type} to Vercel at: ${url}`);

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (config.authToken) {
      const headerName = config.customHeader ? config.customHeader.trim() : "Authorization";
      if (headerName.toLowerCase() === "authorization") {
        headers[headerName] = config.authToken.startsWith("Bearer ")
          ? config.authToken
          : `Bearer ${config.authToken}`;
      } else {
        headers[headerName] = config.authToken;
      }
    }

    // Prepare a clean structured envelope payload for the custom Vercel backend
    const body = {
      type,
      source: "vozarals_portal",
      timestamp: new Date().toISOString(),
      data: { ...payload }
    };
    // Clean up internal properties if any
    delete body.data.id;

    const res = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      let errText = await res.text();
      if (errText.includes("<html") || errText.includes("<!DOCTYPE")) {
        errText = "HTML error page (likely 502/504 Bad Gateway or 404 Route Not Found on Vercel)";
      } else if (errText.length > 160) {
        errText = errText.substring(0, 160) + "...";
      }
      return { success: false, error: `Vercel server returned code ${res.status}: ${errText}` };
    }

    const result = await res.json().catch(() => ({}));
    if (result.error) {
      return { success: false, error: result.error };
    }

    return { success: true };
  } catch (err: any) {
    console.error("Error in syncSingleToVercel:", err);
    let errMsg = err.message || String(err);
    if (errMsg.includes("failed to fetch") || errMsg.includes("NetworkError") || errMsg.includes("ENOTFOUND")) {
      errMsg = `${errMsg}. (Sandbox Tip: To test Vercel sync without an external endpoint, configure the endpoint URL to: http://localhost:3000/api/sandbox/vercel-mock)`;
    }
    return { success: false, error: errMsg };
  }
}
