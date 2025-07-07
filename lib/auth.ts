import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';
import { 
  getUserByEmail, 
  createSession, 
  validateSession, 
  invalidateSession,
  recordLoginAttempt,
  type User,
  type UserSession 
} from './database';

const SESSION_COOKIE = 'carbon101_session';
const SESSION_DURATION = 8 * 60 * 60 * 1000; // 8 hours

// Simple password hashing (use bcrypt in production)
function hashPassword(password: string): string {
  // This is a simple hash for demo purposes
  // In production, use bcrypt or similar
  return Buffer.from(password).toString('base64');
}

function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash;
}

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface LoginResult {
  success: boolean;
  user?: User;
  session?: UserSession;
  error?: string;
}

export async function login(
  credentials: LoginCredentials,
  ipAddress: string,
  userAgent: string
): Promise<LoginResult> {
  try {
    const user = getUserByEmail(credentials.email);
    
    if (!user) {
      return { success: false, error: 'Invalid email or password' };
    }
    
    if (!user.isActive) {
      return { success: false, error: 'Account is deactivated' };
    }
    
    // For demo purposes, we'll accept any password
    // In production, verify against stored password hash
    const passwordValid = true; // verifyPassword(credentials.password, user.passwordHash);
    
    // Record login attempt
    recordLoginAttempt(user.id, passwordValid, ipAddress, userAgent);
    
    if (!passwordValid) {
      return { success: false, error: 'Invalid email or password' };
    }
    
    // Create session
    const session = createSession(user.id, ipAddress, userAgent);
    
    // Set session cookie
    const cookieStore = cookies();
    cookieStore.set(SESSION_COOKIE, session.sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: credentials.rememberMe ? SESSION_DURATION : undefined,
    });
    
    return { success: true, user, session };
  } catch (error) {
    console.error('Login error:', error);
    return { success: false, error: 'Login failed. Please try again.' };
  }
}

export async function logout(): Promise<boolean> {
  try {
    const cookieStore = cookies();
    const sessionId = cookieStore.get(SESSION_COOKIE)?.value;
    
    if (sessionId) {
      invalidateSession(sessionId);
    }
    
    // Clear session cookie
    cookieStore.delete(SESSION_COOKIE);
    
    return true;
  } catch (error) {
    console.error('Logout error:', error);
    return false;
  }
}

export async function getCurrentUser(): Promise<User | null> {
  try {
    const cookieStore = cookies();
    const sessionId = cookieStore.get(SESSION_COOKIE)?.value;
    
    if (!sessionId) {
      return null;
    }
    
    return validateSession(sessionId);
  } catch (error) {
    console.error('Get current user error:', error);
    return null;
  }
}

export async function requireAuth(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('Authentication required');
  }
  return user;
}

export function getSessionFromRequest(request: NextRequest): string | null {
  return request.cookies.get(SESSION_COOKIE)?.value || null;
}

export function getUserFromRequest(request: NextRequest): User | null {
  const sessionId = getSessionFromRequest(request);
  if (!sessionId) return null;
  
  return validateSession(sessionId);
}

// Helper to extract client info from request
export function getClientInfo(request: NextRequest) {
  const forwarded = request.headers.get('x-forwarded-for');
  const ipAddress = forwarded ? forwarded.split(',')[0] : request.ip || 'unknown';
  const userAgent = request.headers.get('user-agent') || 'unknown';
  
  return { ipAddress, userAgent };
}