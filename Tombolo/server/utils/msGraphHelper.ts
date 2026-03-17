import logger from '../config/logger.js';

interface MSGraphUser {
  id: string;
  displayName: string;
  mail: string;
  userPrincipalName: string;
  jobTitle?: string;
  department?: string;
}

interface MSGraphTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

interface UserWithManager {
  user: MSGraphUser | null;
  manager: MSGraphManager | null;
}

// Manager has the same structure as MSGraphUser
type MSGraphManager = MSGraphUser;

class MSGraphClient {
  private accessToken: string | null = null;
  private tokenExpiresAt: number = 0;
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly tenantId: string;
  private readonly isConfigured: boolean;

  constructor() {
    this.clientId = process.env.CLIENT_ID_MS_GRAPH || '';
    this.clientSecret = process.env.CLIENT_SECRET_MS_GRAPH || '';
    this.tenantId = process.env.TENANT_ID || '';
    this.isConfigured = !!(this.clientId && this.clientSecret && this.tenantId);

    if (!this.isConfigured) {
      logger.warn(
        'MS Graph credentials not configured in environment variables'
      );
    }
  }

  /**
   * Get or refresh the access token for MS Graph API
   */
  private async getAccessToken(): Promise<string> {
    // Return cached token if still valid (with 5 min buffer)
    if (this.accessToken && Date.now() < this.tokenExpiresAt - 300000) {
      return this.accessToken;
    }

    try {
      const params = new URLSearchParams({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        scope: 'https://graph.microsoft.com/.default',
        grant_type: 'client_credentials',
      });

      const response = await fetch(
        `https://login.microsoftonline.com/${this.tenantId}/oauth2/v2.0/token`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: params.toString(),
        }
      );

      if (!response.ok) {
        throw new Error(`Token request failed: ${response.statusText}`);
      }

      const data: MSGraphTokenResponse = await response.json();
      this.accessToken = data.access_token;
      this.tokenExpiresAt = Date.now() + data.expires_in * 1000;

      return this.accessToken;
    } catch (error) {
      logger.error(`Failed to obtain MS Graph access token: ${error.message}`);
      throw error;
    }
  }

  /**
   * Search for a user by UPN prefix (username only, without domain)
   * Returns the first matching user
   */
  async getUserByUpnPrefix(upnPrefix: string): Promise<MSGraphUser | null> {
    if (!this.isConfigured) {
      return null;
    }

    try {
      const token = await this.getAccessToken();
      const fields =
        'id,displayName,mail,userPrincipalName,jobTitle,department';

      const url = `https://graph.microsoft.com/v1.0/users?$filter=startswith(userPrincipalName,'${encodeURIComponent(upnPrefix)}')&$select=${fields}`;

      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error(`Graph API request failed: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.value && data.value.length > 0) {
        return data.value[0] as MSGraphUser;
      }

      return null;
    } catch (error) {
      logger.error(
        `Failed to fetch user by UPN prefix '${upnPrefix}': ${error.message}`
      );
      return null;
    }
  }

  /**
   * Get a user's manager by their email or UPN
   */
  async getUserManager(emailOrUpn: string): Promise<MSGraphManager | null> {
    if (!this.isConfigured) {
      return null;
    }

    try {
      const token = await this.getAccessToken();
      const fields =
        'id,displayName,mail,userPrincipalName,jobTitle,department';

      const url = `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(emailOrUpn)}/manager?$select=${fields}`;

      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        if (response.status === 404) {
          // No manager found
          return null;
        }
        throw new Error(`Graph API request failed: ${response.statusText}`);
      }

      const manager: MSGraphManager = await response.json();
      return manager;
    } catch (error) {
      logger.error(
        `Failed to fetch manager for '${emailOrUpn}': ${error.message}`
      );
      return null;
    }
  }

  /**
   * Get user and their manager information by UPN prefix
   * Convenience method that combines getUserByUpnPrefix and getUserManager
   */
  async getUserWithManager(upnPrefix: string): Promise<UserWithManager> {
    if (!this.isConfigured) {
      return { user: null, manager: null };
    }

    const user = await this.getUserByUpnPrefix(upnPrefix);

    if (!user) {
      return { user: null, manager: null };
    }

    const manager = await this.getUserManager(user.userPrincipalName);

    return { user, manager };
  }

  /**
   * Batch fetch multiple users and their managers
   * More efficient for fetching multiple users at once
   */
  async getUsersWithManagers(
    upnPrefixes: string[]
  ): Promise<Map<string, UserWithManager>> {
    if (!this.isConfigured) {
      return new Map();
    }

    const results = new Map<string, UserWithManager>();

    // Process in parallel but with reasonable concurrency
    const batchSize = 5;
    for (let i = 0; i < upnPrefixes.length; i += batchSize) {
      const batch = upnPrefixes.slice(i, i + batchSize);
      const promises = batch.map(async upn => {
        const data = await this.getUserWithManager(upn);
        return { upn, data };
      });

      const batchResults = await Promise.all(promises);
      batchResults.forEach(({ upn, data }) => {
        results.set(upn, data);
      });
    }

    return results;
  }
}

// Export a singleton instance
export const msGraphClient = new MSGraphClient();

/**
 * Extract first name from MS Graph displayName
 * Example: "Dahal, Yadhap (RIS-ATL)" -> "Yadhap"
 */
export function extractFirstName(
  displayName: string | null | undefined
): string {
  if (!displayName) return 'User';

  // Handle format: "LastName, FirstName (Department)"
  const match = displayName.match(/,\s*([^(\s]+)/);
  if (match && match[1]) {
    return match[1];
  }

  // Fallback: split by comma and take second part
  const parts = displayName.split(',');
  if (parts.length > 1) {
    return parts[1].trim().split(/\s+/)[0];
  }

  // Last resort: take first word
  return displayName.split(/\s+/)[0];
}

// Export types for use in other modules
export type { MSGraphUser, UserWithManager, MSGraphManager };
