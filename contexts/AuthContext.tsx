'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  company?: string;
  role?: string;
  profileImage?: string;
  preferences?: {
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
  };
  accConnection?: {
    connectedAt: string;
    accountName: string;
    lastSync: string;
    isActive: boolean;
  } | null;
}

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUser = async () => {
    try {
      const response = await fetch('/api/auth/me');
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      } else {
        // For demo purposes, create a mock user if not authenticated
        const mockUser: AuthUser = {
          id: 'demo_user',
          email: 'john.doe@company.com',
          name: 'John Doe',
          company: 'Acme Corporation',
          role: 'Sustainability Consultant',
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
          accConnection: await checkAPSConnection(),
        };
        setUser(mockUser);
      }
    } catch (error) {
      console.error('Failed to fetch user:', error);
      // For demo purposes, still create a mock user
      const mockUser: AuthUser = {
        id: 'demo_user',
        email: 'john.doe@company.com',
        name: 'John Doe',
        company: 'Acme Corporation',
        role: 'Sustainability Consultant',
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
        accConnection: await checkAPSConnection(),
      };
      setUser(mockUser);
    } finally {
      setIsLoading(false);
    }
  };

  const checkAPSConnection = async (): Promise<AuthUser['accConnection']> => {
    try {
      console.log('Checking APS connection...');
      const response = await fetch('/api/auth/autodesk/status');
      console.log('APS status response:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('APS status data:', data);
        
        if (data.isConnected && data.userInfo) {
          console.log('APS is connected, returning connection info');
          return {
            connectedAt: new Date().toISOString(),
            accountName: `${data.userInfo.firstName} ${data.userInfo.lastName}`,
            lastSync: new Date().toISOString(),
            isActive: true,
          };
        }
      } else {
        console.log('APS status check failed:', response.status);
      }
    } catch (error) {
      console.error('Failed to check APS connection:', error);
    }
    console.log('APS not connected, returning null');
    return null;
  };

  const login = async (email: string, password: string, rememberMe = false): Promise<boolean> => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, rememberMe }),
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Login failed:', error);
      // For demo purposes, simulate successful login with any credentials
      const mockUser: AuthUser = {
        id: 'demo_user',
        email: email,
        name: 'John Doe',
        company: 'Acme Corporation',
        role: 'Sustainability Consultant',
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
      };
      setUser(mockUser);
      return true;
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
      });
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      setUser(null);
    }
  };

  const refreshUser = async () => {
    await fetchUser();
  };

  useEffect(() => {
    fetchUser();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}