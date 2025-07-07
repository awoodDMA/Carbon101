'use client';

import { useState, useEffect } from 'react';
import { Building, CheckCircle, AlertCircle, Loader2, LogIn, Settings, ExternalLink } from 'lucide-react';
import { apsService, type APSUserInfo } from '@/lib/autodesk-aps';
import { useAuth } from '@/contexts/AuthContext';

interface AutodeskAuthProps {
  onAuthSuccess?: (token: string) => void;
  onUserInfo?: (userInfo: APSUserInfo) => void;
}

export default function AutodeskAuth({ onAuthSuccess, onUserInfo }: AutodeskAuthProps) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userInfo, setUserInfo] = useState<APSUserInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const clientId = process.env.NEXT_PUBLIC_APS_CLIENT_ID;
  const { refreshUser } = useAuth();

  // Check authentication status on mount
  useEffect(() => {
    checkAuthStatus();
  }, []);

  // Listen for auth success from URL params
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('auth_success') === 'true' && urlParams.get('refresh_user') === 'true') {
      // Refresh user context to update ACC connection status
      setTimeout(() => {
        refreshUser();
        // Clean up URL params
        window.history.replaceState({}, document.title, window.location.pathname);
      }, 1000);
    }
  }, [refreshUser]);

  const checkAuthStatus = async () => {
    try {
      console.log('AutodeskAuth: Checking auth status...');
      const response = await fetch('/api/auth/autodesk/status');
      console.log('AutodeskAuth: Status response:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('AutodeskAuth: Status data:', data);
        
        if (data.isConnected && data.userInfo) {
          setUserInfo(data.userInfo);
          setIsAuthenticated(true);
          onUserInfo?.(data.userInfo);
          console.log('AutodeskAuth: Set as authenticated');
        } else {
          setIsAuthenticated(false);
          setUserInfo(null);
          console.log('AutodeskAuth: Set as not authenticated');
        }
      } else {
        setIsAuthenticated(false);
        setUserInfo(null);
        console.log('AutodeskAuth: Status check failed');
      }
    } catch (error) {
      console.error('AutodeskAuth: Error checking status:', error);
      setIsAuthenticated(false);
      setUserInfo(null);
    }
  };

  const handleLogin = async () => {
    if (!clientId) {
      setError('Autodesk integration is not configured. Please contact your administrator to set up the APS Client ID.');
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      // Generate a random state for security
      const state = Math.random().toString(36).substring(2, 15);
      sessionStorage.setItem('aps_auth_state', state);

      // Open Autodesk login in a popup window
      const authUrl = apsService.getAuthorizationUrl(['data:read', 'data:create', 'data:write', 'viewables:read'], state);
      const popup = window.open(
        authUrl,
        'autodesk-login',
        'width=600,height=700,scrollbars=yes,resizable=yes'
      );

      // Listen for popup completion
      const checkClosed = setInterval(() => {
        if (popup?.closed) {
          clearInterval(checkClosed);
          setIsConnecting(false);
          // Check if authentication was successful
          checkAuthStatus();
          // Also refresh the user context
          setTimeout(() => refreshUser(), 1000);
        }
      }, 1000);
    } catch (error) {
      setError('Failed to start authentication process. Please check your network connection and try again.');
      setIsConnecting(false);
    }
  };

  const handleLogout = () => {
    apsService.logout();
    setIsAuthenticated(false);
    setUserInfo(null);
    sessionStorage.removeItem('aps_auth_state');
  };

  if (isAuthenticated && userInfo) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <div>
              <div className="font-medium text-green-800">
                Connected to Autodesk
              </div>
              <div className="text-sm text-green-700">
                {userInfo.firstName} {userInfo.lastName} ({userInfo.emailId})
              </div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="px-3 py-1 text-sm border border-green-300 rounded-md hover:bg-green-100 transition-colors"
          >
            Logout
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border rounded-lg p-6">
      <div className="flex items-center gap-2 mb-4">
        <Building className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-medium">Autodesk Construction Cloud</h3>
      </div>

      <p className="text-sm text-muted-foreground mb-6">
        Connect your Autodesk Construction Cloud account to access your BIM 360 projects and models directly within Carbon101.
      </p>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        </div>
      )}

      {/* Authentication Button */}
      <button
        onClick={handleLogin}
        disabled={isConnecting}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isConnecting ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Connecting to Autodesk...
          </>
        ) : (
          <>
            <LogIn className="w-4 h-4" />
            Connect to Autodesk
          </>
        )}
      </button>

      <div className="mt-4 text-xs text-muted-foreground text-center">
        You&apos;ll be redirected to Autodesk to sign in with your existing credentials
      </div>
    </div>
  );
}