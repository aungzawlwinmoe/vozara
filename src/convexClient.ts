import { ConvexHttpClient } from "convex/browser";
import { getConvexConfig } from "./convexSync";

let activeClient: ConvexHttpClient | null = null;
let currentUrl = "";

export async function getConvexHttpClient(): Promise<ConvexHttpClient | null> {
  const config = await getConvexConfig();
  if (!config.enabled || !config.deploymentUrl) {
    return null;
  }
  
  let baseUrl = config.deploymentUrl.trim();
  if (baseUrl.endsWith("/")) {
    baseUrl = baseUrl.slice(0, -1);
  }
  if (!baseUrl.startsWith("http://") && !baseUrl.startsWith("https://")) {
    baseUrl = `https://${baseUrl}`;
  }

  if (!activeClient || currentUrl !== baseUrl) {
    activeClient = new ConvexHttpClient(baseUrl);
    currentUrl = baseUrl;
  }
  return activeClient;
}

/**
 * Synchronize contact lead or interpreter request securely using official Convex client
 */
export async function syncWithConvexClient(
  type: "contact" | "interpreter",
  payload: any
): Promise<{ success: boolean; error?: string }> {
  try {
    const config = await getConvexConfig();
    if (!config.enabled || !config.deploymentUrl) {
      return { success: false, error: "Convex sync is not enabled or URL is empty." };
    }

    const client = await getConvexHttpClient();
    if (!client) {
      return { success: false, error: "Failed to initialize Convex client." };
    }

    const mutationName = type === "contact" ? config.contactMutation : config.interpreterMutation;
    if (!mutationName) {
      return { success: false, error: `No mutation specified for ${type} submissions.` };
    }

    // Clean up argument payload for Convex mutation
    const args = { ...payload };
    delete args.id;

    console.log(`[Convex Client] Mutating '${mutationName}' with payload:`, args);
    
    // Execute Mutation via Convex Client
    await client.mutation(mutationName as any, args);
    
    return { success: true };
  } catch (err: any) {
    console.error("[Convex Client] Synchronization mutation failed:", err);
    return { success: false, error: err.message || String(err) };
  }
}
