import { doc, getDoc, setDoc } from "firebase/firestore";

export interface ConvexConfig {
  enabled: boolean;
  deploymentUrl: string;
  contactMutation: string;
  interpreterMutation: string;
  deployKey: string;
}

const DEFAULT_CONFIG: ConvexConfig = {
  enabled: false,
  deploymentUrl: "",
  contactMutation: "submissions:addContact",
  interpreterMutation: "submissions:addInterpreter",
  deployKey: "",
};

export async function getConvexConfig(): Promise<ConvexConfig> {
  try {
    const { db } = await import("./firebase");
    const docRef = doc(db, "vozarals_settings", "convex_config");
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return { ...DEFAULT_CONFIG, ...snap.data() };
    }
  } catch (err) {
    console.warn("Failed to get Convex config from Firestore:", err);
  }
  // Try localStorage as fallback for client-side builds
  try {
    const local = localStorage.getItem("convex_config");
    if (local) {
      return { ...DEFAULT_CONFIG, ...JSON.parse(local) };
    }
  } catch (_) {}
  return DEFAULT_CONFIG;
}

export async function saveConvexConfig(config: ConvexConfig): Promise<void> {
  try {
    const { db } = await import("./firebase");
    const docRef = doc(db, "vozarals_settings", "convex_config");
    await setDoc(docRef, config);
  } catch (err) {
    console.error("Failed to save Convex config to Firestore:", err);
  }
  try {
    localStorage.setItem("convex_config", JSON.stringify(config));
  } catch (_) {}
}

export async function syncSingleToConvex(
  type: "contact" | "interpreter",
  payload: any,
  providedConfig?: ConvexConfig
): Promise<{ success: boolean; error?: string }> {
  try {
    const config = providedConfig || (await getConvexConfig());
    if (!config.enabled || !config.deploymentUrl) {
      return { success: false, error: "Convex sync is not enabled or deployment URL is empty." };
    }

    // Standardize mutation path
    const mutationPath = type === "contact" ? config.contactMutation : config.interpreterMutation;
    if (!mutationPath) {
      return { success: false, error: `No mutation specified for ${type} submissions.` };
    }

    // Clean up deployment URL (remove trailing slash)
    let baseUrl = config.deploymentUrl.trim();
    if (baseUrl.endsWith("/")) {
      baseUrl = baseUrl.slice(0, -1);
    }

    // Ensure it starts with http/https
    if (!baseUrl.startsWith("http://") && !baseUrl.startsWith("https://")) {
      baseUrl = `https://${baseUrl}`;
    }

    const url = `${baseUrl}/api/1/mutation`;
    
    // Prep payload - we want to send clean human fields and timestamp
    const args = { ...payload };
    // Remove complex fields if any
    delete args.id;

    console.log(`Syncing ${type} to Convex at: ${url} (mutation: ${mutationPath})`);

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (config.deployKey) {
      headers["Authorization"] = `Bearer ${config.deployKey}`;
    }

    const res = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify({
        path: mutationPath,
        args,
      }),
    });

    if (!res.ok) {
      let errText = await res.text();
      if (errText.includes("<html") || errText.includes("<!DOCTYPE")) {
        errText = "HTML error page (likely 502/504 Bad Gateway from proxy or server issues)";
      } else if (errText.length > 160) {
        errText = errText.substring(0, 160) + "...";
      }
      return { success: false, error: `Convex server returned code ${res.status}: ${errText}` };
    }

    const result = await res.json();
    if (result.error) {
      return { success: false, error: result.error };
    }

    return { success: true };
  } catch (err: any) {
    console.error("Error in syncSingleToConvex:", err);
    return { success: false, error: err.message || String(err) };
  }
}
