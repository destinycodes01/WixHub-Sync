import { createClient, ApiKeyStrategy } from "@wix/sdk";
import { members } from "@wix/members";

export const wixClient = createClient({
  modules: { members },
  auth: ApiKeyStrategy({
    apiKey: process.env.WIX_API_KEY as string,
    // Note: WIX_SITE_ID might be required depending on the environment,
    // but the API key alone is sufficient for some operations.
    siteId: process.env.WIX_SITE_ID as string, // Ensure this is optionally set in your ENV if needed
  }),
});
