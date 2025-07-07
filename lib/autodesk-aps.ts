/**
 * Autodesk Platform Services (APS) Integration for Carbon101
 * Handles BIM 360 and ACC (Autodesk Construction Cloud) integration
 */

export interface APSHub {
  type: string;
  id: string;
  attributes: {
    name: string;
    extension: {
      type: string;
      version: string;
      data?: {
        region?: string;
        accountId?: string;
      };
    };
  };
  relationships: {
    projects: {
      links: {
        related: string;
      };
    };
  };
}

export interface APSProject {
  type: string;
  id: string;
  attributes: {
    name: string;
    extension: {
      type: string;
      version: string;
      data?: {
        projectType?: string;
        status?: string;
      };
    };
  };
  relationships: {
    hub: {
      data: {
        type: string;
        id: string;
      };
    };
    rootFolder: {
      data: {
        type: string;
        id: string;
      };
    };
    topFolders: {
      data: Array<{
        type: string;
        id: string;
      }>;
    };
  };
}

export interface APSFolder {
  type: string;
  id: string;
  attributes: {
    name: string;
    displayName: string;
    createTime: string;
    createUserId: string;
    createUserName: string;
    lastModifiedTime: string;
    lastModifiedUserId: string;
    lastModifiedUserName: string;
    hidden: boolean;
    extension: {
      type: string;
      version: string;
      data?: any;
    };
  };
  relationships: {
    contents: {
      links: {
        related: string;
      };
    };
    parent: {
      data: {
        type: string;
        id: string;
      };
    };
  };
}

export interface APSItem {
  type: string;
  id: string;
  attributes: {
    displayName: string;
    createTime: string;
    createUserId: string;
    createUserName: string;
    lastModifiedTime: string;
    lastModifiedUserId: string;
    lastModifiedUserName: string;
    fileName: string;
    fileType: string;
    extension: {
      type: string;
      version: string;
      data?: {
        mimeType?: string;
        projectGuid?: string;
        itemType?: string;
      };
    };
  };
  relationships: {
    tip: {
      data: {
        type: string;
        id: string;
      };
    };
    versions: {
      links: {
        related: string;
      };
    };
    parent: {
      data: {
        type: string;
        id: string;
      };
    };
  };
}

export interface APSVersion {
  type: string;
  id: string;
  attributes: {
    name: string;
    displayName: string;
    createTime: string;
    createUserId: string;
    createUserName: string;
    lastModifiedTime: string;
    versionNumber: number;
    mimeType: string;
    fileType: string;
    storageSize: number;
    extension: {
      type: string;
      version: string;
      data?: {
        extractorVersion?: string;
        extractorStatus?: string;
        thumbnailStatus?: string;
        viewableStatus?: string;
      };
    };
  };
  relationships: {
    item: {
      data: {
        type: string;
        id: string;
      };
    };
    storage: {
      data: {
        type: string;
        id: string;
      };
    };
    derivatives?: {
      data: {
        type: string;
        id: string;
      };
    };
  };
}

export interface APSUserInfo {
  userId: string;
  userName: string;
  emailId: string;
  firstName: string;
  lastName: string;
  emailVerified: boolean;
  '2FaEnabled': boolean;
  countryCode: string;
  language: string;
  optin: boolean;
}

export interface APSToken {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  scope: string;
}

export interface APSModelAssignment {
  id: string;
  hubId: string;
  projectId: string;
  itemId: string;
  versionId: string;
  name: string;
  fileName: string;
  fileType: string;
  viewerUrn: string;
  thumbnailUrl?: string;
  lastModified: string;
  assignedAt: string;
  status: 'ready' | 'processing' | 'failed';
}

class AutodeskAPSService {
  private baseUrl = 'https://developer.api.autodesk.com';
  private authUrl = 'https://developer.api.autodesk.com/authentication/v2';
  private clientId: string;
  private clientSecret: string;
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private tokenExpiry: number | null = null;

  constructor(clientId?: string, clientSecret?: string) {
    this.clientId = clientId || process.env.NEXT_PUBLIC_APS_CLIENT_ID || '';
    this.clientSecret = clientSecret || process.env.APS_CLIENT_SECRET || '';
  }

  /**
   * Get 2-legged access token for app-only access
   * Updated scopes for AEC Data Model API integration
   */
  async getAppToken(scopes: string[] = [
    'data:read', 
    'viewables:read',
    'aecdm:read'  // Required for AEC Data Model GraphQL API (FREE)
    // 'code:all' scope REMOVED to prevent Model Derivative API charges
  ]): Promise<APSToken> {
    if (!this.clientId || !this.clientSecret) {
      throw new Error('APS Client ID and Client Secret are required');
    }

    const response = await fetch(`${this.authUrl}/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        grant_type: 'client_credentials',
        scope: scopes.join(' '),
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to get app token: ${error}`);
    }

    const token = await response.json();
    this.accessToken = token.access_token;
    this.tokenExpiry = Date.now() + (token.expires_in * 1000);
    return token;
  }

  /**
   * Start 3-legged OAuth flow for user authentication
   * Updated scopes for AEC Data Model API integration
   */
  getAuthorizationUrl(scopes: string[] = [
    'data:read', 
    'viewables:read',
    'aecdm:read'  // Required for AEC Data Model GraphQL API (FREE)
    // 'code:all' scope REMOVED to prevent Model Derivative API charges
  ], state?: string): string {
    const redirectUri = process.env.NEXT_PUBLIC_APS_CALLBACK_URL || `${window.location.origin}/api/auth/autodesk/callback`;
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.clientId,
      redirect_uri: redirectUri,
      scope: scopes.join(' '),
    });

    if (state) {
      params.append('state', state);
    }

    return `${this.authUrl}/authorize?${params.toString()}`;
  }

  /**
   * Exchange authorization code for access token
   */
  async exchangeCodeForToken(code: string): Promise<APSToken> {
    const redirectUri = process.env.NEXT_PUBLIC_APS_CALLBACK_URL || `${typeof window !== 'undefined' ? window.location.origin : ''}/api/auth/autodesk/callback`;
    const response = await fetch(`${this.authUrl}/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: redirectUri,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to exchange code for token: ${error}`);
    }

    const token = await response.json();
    this.accessToken = token.access_token;
    this.refreshToken = token.refresh_token;
    this.tokenExpiry = Date.now() + (token.expires_in * 1000);
    return token;
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(): Promise<APSToken> {
    if (!this.refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await fetch(`${this.authUrl}/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        grant_type: 'refresh_token',
        refresh_token: this.refreshToken,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to refresh token: ${error}`);
    }

    const token = await response.json();
    this.accessToken = token.access_token;
    if (token.refresh_token) {
      this.refreshToken = token.refresh_token;
    }
    this.tokenExpiry = Date.now() + (token.expires_in * 1000);
    return token;
  }

  /**
   * Get current user information
   */
  async getUserInfo(): Promise<APSUserInfo> {
    await this.ensureValidToken();

    const response = await fetch(`${this.baseUrl}/userprofile/v1/users/@me`, {
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to get user info');
    }

    return await response.json();
  }

  /**
   * Get all hubs (BIM 360/ACC accounts) accessible to the user
   */
  async getHubs(): Promise<APSHub[]> {
    await this.ensureValidToken();

    const response = await fetch(`${this.baseUrl}/project/v1/hubs`, {
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to get hubs');
    }

    const data = await response.json();
    return data.data || [];
  }

  /**
   * Get projects for a specific hub
   */
  async getProjects(hubId: string): Promise<APSProject[]> {
    await this.ensureValidToken();

    const response = await fetch(`${this.baseUrl}/project/v1/hubs/${hubId}/projects`, {
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to get projects');
    }

    const data = await response.json();
    return data.data || [];
  }

  /**
   * Get top folders for a project
   */
  async getProjectTopFolders(hubId: string, projectId: string): Promise<APSFolder[]> {
    await this.ensureValidToken();

    const response = await fetch(`${this.baseUrl}/project/v1/hubs/${hubId}/projects/${projectId}/topFolders`, {
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to get top folders');
    }

    const data = await response.json();
    return data.data || [];
  }

  /**
   * Get folder contents
   */
  async getFolderContents(projectId: string, folderId: string): Promise<(APSFolder | APSItem)[]> {
    await this.ensureValidToken();

    const response = await fetch(`${this.baseUrl}/data/v1/projects/${projectId}/folders/${folderId}/contents`, {
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to get folder contents');
    }

    const data = await response.json();
    return data.data || [];
  }

  /**
   * Get item versions
   */
  async getItemVersions(projectId: string, itemId: string): Promise<APSVersion[]> {
    await this.ensureValidToken();

    const response = await fetch(`${this.baseUrl}/data/v1/projects/${projectId}/items/${itemId}/versions`, {
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to get item versions');
    }

    const data = await response.json();
    return data.data || [];
  }

  /**
   * Get storage object URN from version data
   * This is the crucial step - we need the actual storage URN, not the version ID
   */
  async getStorageUrn(projectId: string, versionId: string): Promise<string> {
    await this.ensureValidToken();

    console.log('🔍 APS: Getting version details for:', versionId);
    console.log('🔍 APS: Project ID:', projectId);
    
    // Check if versionId is already a storage URN
    if (versionId.startsWith('urn:adsk.objects:os.object:')) {
      console.log('✅ APS: Version ID is already a storage URN:', versionId);
      return versionId;
    }
    
    // If it's a simple ID, we need to get the version details to extract storage URN
    // The version ID should be in format like "urn:adsk.wipprod:dm.version:..."
    
    if (!versionId.startsWith('urn:')) {
      console.log('❌ APS: Version ID does not appear to be a valid URN:', versionId);
      throw new Error(`Invalid version ID format: ${versionId}. Expected URN format.`);
    }
    
    // Use the proper Data Management API endpoint
    const url = `${this.baseUrl}/data/v1/projects/${encodeURIComponent(projectId)}/versions/${encodeURIComponent(versionId)}`;
    console.log('🔍 APS: Request URL:', url);
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/vnd.api+json'
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ APS: Failed to get version details:', response.status, errorText);
      console.error('❌ APS: Request URL was:', url);
      console.error('❌ APS: Original versionId:', versionId);
      console.error('❌ APS: Original projectId:', projectId);
      
      // Try to parse the error for more details
      try {
        const errorJson = JSON.parse(errorText);
        console.error('❌ APS: Parsed error details:', errorJson);
        
        // If URN format is bad, try alternative approach
        if (errorJson.errors?.[0]?.code === 'BAD_INPUT' && errorJson.errors?.[0]?.detail?.includes('Urn is not in the proper format')) {
          console.log('🔄 APS: Trying alternative storage URN extraction...');
          
          // Sometimes we can derive storage URN from version URN by looking at the relationships
          // This is a fallback when direct API calls fail
          return this.deriveStorageUrnFromVersion(versionId);
        }
      } catch (e) {
        console.error('❌ APS: Could not parse error as JSON');
      }
      
      throw new Error(`Failed to get version details: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('📄 APS: Version data received:', JSON.stringify(data, null, 2));
    
    console.log('📄 APS: Available relationships:', Object.keys(data.data?.relationships || {}));
    
    // Check for derivatives first (pre-translated models in BIM 360)
    const derivativeId = data.data?.relationships?.derivatives?.data?.id;
    if (derivativeId) {
      console.log('✅ APS: Found derivative URN (pre-translated model):', derivativeId);
      console.log('🎯 APS: Using derivative URN instead of storage URN for viewable model');
      return derivativeId;
    }
    
    // Check for viewable status in extension data
    const viewableStatus = data.data?.attributes?.extension?.data?.viewableStatus;
    console.log('📊 APS: Viewable status from extension:', viewableStatus);
    
    // Fall back to storage URN if no derivatives
    const storageId = data.data?.relationships?.storage?.data?.id;
    
    if (!storageId) {
      console.error('❌ APS: No storage ID found in version data');
      console.error('📄 APS: Available relationships:', Object.keys(data.data?.relationships || {}));
      throw new Error('No storage ID found for this version - file may not be uploaded properly');
    }

    console.log('✅ APS: Storage URN extracted:', storageId);
    console.log('ℹ️ APS: No derivatives found - using storage URN (may need translation)');
    return storageId;
  }

  /**
   * Derive storage URN from version URN when direct API calls fail
   * This is a fallback method based on URN patterns
   */
  private deriveStorageUrnFromVersion(versionUrn: string): string {
    console.log('🔄 APS: Deriving storage URN from version URN:', versionUrn);
    
    // Version URNs typically look like: urn:adsk.wipprod:dm.version:xxxxx
    // Storage URNs typically look like: urn:adsk.objects:os.object:xxxxx/yyyyy
    
    // Extract the object ID from the version URN
    const versionIdMatch = versionUrn.match(/urn:adsk\.wipprod:dm\.version:(.+)/);
    if (versionIdMatch) {
      const objectId = versionIdMatch[1];
      // For now, use the version URN directly as storage URN
      // This might need adjustment based on actual data patterns
      const storageUrn = versionUrn;
      console.log('🔄 APS: Derived storage URN:', storageUrn);
      return storageUrn;
    }
    
    // If we can't parse it, return as-is and let translation API handle it
    console.log('⚠️ APS: Could not derive storage URN, using version URN as-is');
    return versionUrn;
  }

  /**
   * Get viewer URN for a version (for Autodesk Viewer)
   * This creates the proper base64 URN needed for Model Derivative API
   */
  getViewerUrn(storageUrn: string): string {
    // Check if this is already a derivative URN (pre-translated from BIM 360)
    // Derivative URNs are base64 strings that may contain underscores and other URL-safe chars
    if (storageUrn.match(/^[A-Za-z0-9+/_-]+={0,2}$/) || storageUrn.includes('dXJu')) {
      console.log('🎯 APS: Using derivative URN directly (already base64 encoded):', storageUrn);
      return `urn:${storageUrn}`;
    }
    
    // Convert storage URN to base64 for viewer and add urn: prefix
    console.log('🔧 APS: Converting storage URN to base64 for viewer');
    const base64Urn = btoa(storageUrn).replace(/=/g, '');
    return `urn:${base64Urn}`;
  }

  /**
   * SMART Translation Check - Only checks existing translations, doesn't submit new ones
   * This prevents charges while allowing access to already-translated BIM 360 models
   */
  async translateModel(storageUrn: string): Promise<{ urn: string; status: string }> {
    await this.ensureValidToken();

    const viewerUrn = this.getViewerUrn(storageUrn);
    
    console.log('🔍 APS Smart Translation: Checking existing translation for storage URN:', storageUrn);
    console.log('🔍 APS Smart Translation: Generated viewer URN:', viewerUrn);

    // Check if translation already exists (FREE operation)
    try {
      const existingStatus = await this.getTranslationStatus(viewerUrn);
      console.log('📊 APS Smart Translation: Existing translation status:', existingStatus);
      
      if (existingStatus.status === 'success') {
        console.log('✅ APS Smart Translation: Model already translated successfully');
        return {
          urn: viewerUrn,
          status: 'success'
        };
      }
      
      if (existingStatus.status === 'inprogress') {
        console.log('⏳ APS Smart Translation: Model translation already in progress');
        return {
          urn: viewerUrn,
          status: 'inprogress'
        };
      }
      
      // If status is failed, pending, or not_started - refuse to submit new translation
      console.log('🚫 APS Smart Translation: Model needs new translation - refusing to prevent charges');
      return {
        urn: viewerUrn,
        status: 'not_translated'
      };
      
    } catch (statusError) {
      console.log('🚫 APS Smart Translation: No existing translation found - refusing to submit new job to prevent charges');
      return {
        urn: viewerUrn,
        status: 'not_translated'
      };
    }
  }

  /**
   * DEPRECATED: Original translateModel function that submits new translation jobs
   * This has been replaced with smart translation checking to prevent charges
   */
  private async submitNewTranslationJob(storageUrn: string): Promise<{ urn: string; status: string }> {
    // This method is intentionally disabled to prevent accidental translation charges
    throw new Error('New translation job submission is disabled to prevent charges. Use already-translated models from BIM 360 instead.');
    
    /*
    // ORIGINAL CODE COMMENTED OUT TO PREVENT CHARGES

    // For translation API, we need the base64 URN without the "urn:" prefix
    const base64Urn = viewerUrn.startsWith('urn:') ? viewerUrn.substring(4) : viewerUrn;
    console.log('🔧 APS: Viewer URN for display:', viewerUrn);
    console.log('🔧 APS: Base64 URN for API:', base64Urn);
    
    const requestBody = {
      input: {
        urn: base64Urn
      },
      output: {
        formats: [
          {
            type: 'svf2',
            views: ['2d', '3d']
          }
        ]
      }
    };

    console.log('🔧 APS: Translation request body:', JSON.stringify(requestBody, null, 2));

    const response = await fetch(`${this.baseUrl}/modelderivative/v2/designdata/job`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
        'x-ads-force': 'true'  // Force retranslation if needed
      },
      body: JSON.stringify(requestBody)
    });

    const responseText = await response.text();
    console.log('🔧 APS: Translation response status:', response.status);
    console.log('🔧 APS: Translation response:', responseText);

    if (!response.ok) {
      console.error('❌ APS: Translation failed with status:', response.status);
      console.error('❌ APS: Translation error response:', responseText);
      
      // Try to parse error response
      try {
        const errorData = JSON.parse(responseText);
        throw new Error(`Translation failed: ${errorData.errorMessage || errorData.detail || responseText}`);
      } catch (parseError) {
        throw new Error(`Translation failed: HTTP ${response.status} - ${responseText}`);
      }
    }

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error('❌ APS: Failed to parse translation response:', parseError);
      throw new Error('Translation response is not valid JSON');
    }

    console.log('✅ APS: Translation submitted successfully:', data);
    
    return {
      urn: viewerUrn,
      status: data.result || 'submitted'
    };
    */
  }

  /**
   * Check translation status
   */
  async getTranslationStatus(urn: string): Promise<{ status: string; progress: string; hasThumbnail: boolean }> {
    await this.ensureValidToken();

    // For API calls, we need the base64 URN without the "urn:" prefix
    const base64Urn = urn.startsWith('urn:') ? urn.substring(4) : urn;

    console.log('🔍 APS: Checking manifest for base64 URN:', base64Urn);
    console.log('🔍 APS: Full manifest URL:', `${this.baseUrl}/modelderivative/v2/designdata/${encodeURIComponent(base64Urn)}/manifest`);

    const response = await fetch(`${this.baseUrl}/modelderivative/v2/designdata/${encodeURIComponent(base64Urn)}/manifest`, {
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
      },
    });

    console.log('📊 APS: Manifest response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.log('📊 APS: Manifest error response:', errorText);
      
      // Try to parse the error for more details
      try {
        const errorJson = JSON.parse(errorText);
        console.log('📊 APS: Parsed manifest error:', errorJson);
      } catch (e) {
        console.log('📊 APS: Could not parse manifest error as JSON');
      }
      
      return { status: 'not_started', progress: '0%', hasThumbnail: false };
    }

    const data = await response.json();
    console.log('📊 APS: Manifest data received:', JSON.stringify(data, null, 2));
    
    return {
      status: data.status || 'unknown',
      progress: data.progress || '0%',
      hasThumbnail: data.hasThumbnail || false
    };
  }

  /**
   * Get thumbnail URL for a version
   */
  async getThumbnailUrl(versionUrn: string, size: 'small' | 'medium' | 'large' = 'medium'): Promise<string> {
    await this.ensureValidToken();

    // For API calls, we need the base64 URN without the "urn:" prefix
    const base64Urn = versionUrn.startsWith('urn:') ? versionUrn.substring(4) : versionUrn;

    const sizeMap = {
      small: 100,
      medium: 200,
      large: 400,
    };

    return `${this.baseUrl}/modelderivative/v2/designdata/${encodeURIComponent(base64Urn)}/thumbnail?width=${sizeMap[size]}&height=${sizeMap[size]}`;
  }

  /**
   * Set authentication token manually
   */
  setToken(token: string, refreshToken?: string, expiresIn?: number): void {
    this.accessToken = token;
    if (refreshToken) {
      this.refreshToken = refreshToken;
    }
    if (expiresIn) {
      this.tokenExpiry = Date.now() + (expiresIn * 1000);
    }
  }

  /**
   * Check if token is valid and refresh if needed
   */
  private async ensureValidToken(): Promise<void> {
    if (!this.accessToken) {
      throw new Error('No access token available. Please authenticate first.');
    }

    // Check if token is expired (with 5-minute buffer)
    if (this.tokenExpiry && (Date.now() + 300000) > this.tokenExpiry) {
      if (this.refreshToken) {
        await this.refreshAccessToken();
      } else {
        throw new Error('Token expired and no refresh token available');
      }
    }
  }

  /**
   * Clear authentication state
   */
  logout(): void {
    this.accessToken = null;
    this.refreshToken = null;
    this.tokenExpiry = null;
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!this.accessToken && (!this.tokenExpiry || Date.now() < this.tokenExpiry);
  }

  /**
   * Get current access token
   */
  getAccessToken(): string | null {
    return this.accessToken;
  }
}

// Export singleton instance
export const apsService = new AutodeskAPSService();

// Export class for testing
export { AutodeskAPSService };