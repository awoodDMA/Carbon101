// Simple in-memory database for demo purposes
// In production, you would use a proper database like PostgreSQL, MongoDB, etc.

export interface User {
  id: string;
  email: string;
  name: string;
  company?: string;
  role?: string;
  profileImage?: string;
  createdAt: string;
  lastLogin: string;
  isActive: boolean;
  preferences: UserPreferences;
  security: SecuritySettings;
  accConnection?: ACCConnection;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  language: string;
  notifications: {
    email: boolean;
    push: boolean;
    projectUpdates: boolean;
    carbonAlerts: boolean;
  };
  dashboard: {
    defaultView: 'grid' | 'list';
    showMetrics: boolean;
    autoRefresh: boolean;
  };
  units: {
    carbon: 'kg' | 'tons';
    area: 'm2' | 'ft2';
    currency: 'USD' | 'EUR' | 'GBP';
  };
}

export interface SecuritySettings {
  twoFactorEnabled: boolean;
  sessionTimeout: number; // minutes
  lastPasswordChange: string;
  loginHistory: LoginAttempt[];
  trustedDevices: string[];
  apiKeyAccess: boolean;
}

export interface LoginAttempt {
  timestamp: string;
  ipAddress: string;
  userAgent: string;
  success: boolean;
  location?: string;
}

export interface ACCConnection {
  connectedAt: string;
  accountId: string;
  accountName: string;
  accessToken?: string; // Encrypted
  refreshToken?: string; // Encrypted
  expiresAt: string;
  lastSync: string;
  permissions: string[];
  isActive: boolean;
}

export interface UserSession {
  sessionId: string;
  userId: string;
  createdAt: string;
  expiresAt: string;
  ipAddress: string;
  userAgent: string;
  isActive: boolean;
}

// In-memory storage (replace with actual database in production)
let users: User[] = [
  {
    id: 'user_1',
    email: 'john.doe@company.com',
    name: 'John Doe',
    company: 'Acme Corporation',
    role: 'Sustainability Consultant',
    createdAt: '2024-01-01T00:00:00Z',
    lastLogin: new Date().toISOString(),
    isActive: true,
    preferences: {
      theme: 'system',
      language: 'en',
      notifications: {
        email: true,
        push: true,
        projectUpdates: true,
        carbonAlerts: true,
      },
      dashboard: {
        defaultView: 'grid',
        showMetrics: true,
        autoRefresh: true,
      },
      units: {
        carbon: 'kg',
        area: 'm2',
        currency: 'USD',
      },
    },
    security: {
      twoFactorEnabled: false,
      sessionTimeout: 480, // 8 hours
      lastPasswordChange: '2024-01-01T00:00:00Z',
      loginHistory: [],
      trustedDevices: [],
      apiKeyAccess: true,
    },
  },
];

let sessions: UserSession[] = [];

// User management functions
export function createUser(userData: Omit<User, 'id' | 'createdAt' | 'lastLogin' | 'isActive'>): User {
  const user: User = {
    ...userData,
    id: `user_${Date.now()}`,
    createdAt: new Date().toISOString(),
    lastLogin: new Date().toISOString(),
    isActive: true,
  };
  
  users.push(user);
  return user;
}

export function getUserById(id: string): User | null {
  return users.find(user => user.id === id) || null;
}

export function getUserByEmail(email: string): User | null {
  return users.find(user => user.email === email) || null;
}

export function updateUser(id: string, updates: Partial<User>): User | null {
  const userIndex = users.findIndex(user => user.id === id);
  if (userIndex === -1) return null;
  
  users[userIndex] = { ...users[userIndex], ...updates };
  return users[userIndex];
}

export function updateUserPreferences(id: string, preferences: Partial<UserPreferences>): User | null {
  const user = getUserById(id);
  if (!user) return null;
  
  user.preferences = { ...user.preferences, ...preferences };
  return updateUser(id, { preferences: user.preferences });
}

export function updateUserSecurity(id: string, security: Partial<SecuritySettings>): User | null {
  const user = getUserById(id);
  if (!user) return null;
  
  user.security = { ...user.security, ...security };
  return updateUser(id, { security: user.security });
}

export function connectACCAccount(userId: string, accData: ACCConnection): User | null {
  return updateUser(userId, { accConnection: accData });
}

export function disconnectACCAccount(userId: string): User | null {
  return updateUser(userId, { accConnection: undefined });
}

// Session management
export function createSession(userId: string, ipAddress: string, userAgent: string): UserSession {
  const session: UserSession = {
    sessionId: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    userId,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(), // 8 hours
    ipAddress,
    userAgent,
    isActive: true,
  };
  
  sessions.push(session);
  return session;
}

export function getSession(sessionId: string): UserSession | null {
  const session = sessions.find(s => s.sessionId === sessionId && s.isActive);
  if (!session) return null;
  
  // Check if session is expired
  if (new Date(session.expiresAt) < new Date()) {
    session.isActive = false;
    return null;
  }
  
  return session;
}

export function validateSession(sessionId: string): User | null {
  const session = getSession(sessionId);
  if (!session) return null;
  
  return getUserById(session.userId);
}

export function invalidateSession(sessionId: string): boolean {
  const sessionIndex = sessions.findIndex(s => s.sessionId === sessionId);
  if (sessionIndex === -1) return false;
  
  sessions[sessionIndex].isActive = false;
  return true;
}

export function invalidateAllUserSessions(userId: string): number {
  let count = 0;
  sessions.forEach(session => {
    if (session.userId === userId && session.isActive) {
      session.isActive = false;
      count++;
    }
  });
  return count;
}

// Login tracking
export function recordLoginAttempt(
  userId: string, 
  success: boolean, 
  ipAddress: string, 
  userAgent: string
): void {
  const user = getUserById(userId);
  if (!user) return;
  
  const attempt: LoginAttempt = {
    timestamp: new Date().toISOString(),
    ipAddress,
    userAgent,
    success,
  };
  
  user.security.loginHistory.unshift(attempt);
  
  // Keep only last 50 login attempts
  if (user.security.loginHistory.length > 50) {
    user.security.loginHistory = user.security.loginHistory.slice(0, 50);
  }
  
  if (success) {
    user.lastLogin = new Date().toISOString();
  }
  
  updateUser(userId, { security: user.security, lastLogin: user.lastLogin });
}

// Helper functions
export function getAllUsers(): User[] {
  return users.filter(user => user.isActive);
}

export function getActiveSessionsForUser(userId: string): UserSession[] {
  return sessions.filter(s => s.userId === userId && s.isActive);
}

export function cleanupExpiredSessions(): number {
  const now = new Date();
  let count = 0;
  
  sessions.forEach(session => {
    if (session.isActive && new Date(session.expiresAt) < now) {
      session.isActive = false;
      count++;
    }
  });
  
  return count;
}