'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { 
  User, 
  Settings, 
  LogOut, 
  Building, 
  ChevronDown,
  Check,
  AlertCircle 
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

export default function UserProfileDropdown() {
  const { user, logout, isLoading } = useAuth();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logout();
    setIsOpen(false);
    router.push('/login');
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-3 px-3 py-2 rounded-md bg-muted/50 w-full">
        <div className="w-8 h-8 bg-muted rounded-full animate-pulse"></div>
        <div className="flex-1 space-y-1">
          <div className="h-3 bg-muted rounded animate-pulse"></div>
          <div className="h-2 bg-muted rounded animate-pulse w-3/4"></div>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* User Profile Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 px-3 py-2 rounded-md bg-muted/50 hover:bg-muted transition-colors w-full text-left"
      >
        <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-sm font-medium">
          {user.name.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{user.name}</p>
          <p className="text-xs text-muted-foreground truncate">{user.email}</p>
        </div>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      <div className={`absolute bottom-full mb-2 left-0 right-0 bg-card border border-border rounded-lg shadow-lg z-50 transition-all duration-200 ease-out transform ${
        isOpen 
          ? 'opacity-100 scale-100 translate-y-0' 
          : 'opacity-0 scale-95 translate-y-2 pointer-events-none'
      }`}>
          {/* User Info Header */}
          <div className="p-4 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-base font-medium">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-medium truncate">{user.name}</h3>
                <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                {user.company && (
                  <p className="text-xs text-muted-foreground truncate">{user.company}</p>
                )}
              </div>
            </div>
          </div>

          {/* Account Status */}
          <div className="p-4 border-b border-border">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">Account Status</span>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-xs text-green-600">Active</span>
                </div>
              </div>
              
              {user.accConnection ? (
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">ACC Connection</span>
                  <div className="flex items-center gap-1">
                    <Check className="w-3 h-3 text-green-600" />
                    <span className="text-xs text-green-600">Connected</span>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">ACC Connection</span>
                  <div className="flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 text-amber-500" />
                    <span className="text-xs text-amber-600">Not Connected</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Menu Items */}
          <div className="p-2">
            <Link
              href="/settings"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-3 py-2 rounded-md text-sm hover:bg-accent transition-colors w-full"
            >
              <User className="w-4 h-4" />
              Profile Settings
            </Link>
            
            <Link
              href="/settings?tab=integrations"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-3 py-2 rounded-md text-sm hover:bg-accent transition-colors w-full"
            >
              <Building className="w-4 h-4" />
              {user.accConnection ? 'Manage ACC' : 'Connect ACC'}
            </Link>
            
            <Link
              href="/settings?tab=security"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-3 py-2 rounded-md text-sm hover:bg-accent transition-colors w-full"
            >
              <Settings className="w-4 h-4" />
              Security
            </Link>
          </div>

          {/* Logout */}
          <div className="p-2 border-t border-border">
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-3 py-2 rounded-md text-sm hover:bg-red-50 hover:text-red-600 transition-colors w-full text-left"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>
    </div>
  );
}