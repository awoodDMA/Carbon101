'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, User, Building, Key, Settings as SettingsIcon, Save, Shield, Bell } from 'lucide-react';
import AutodeskAuth from '@/components/AutodeskAuth';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';

export default function SettingsPage() {
  const { user, isLoading, refreshUser } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState('profile');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    role: '',
  });
  const [isSaving, setIsSaving] = useState(false);

  // Remove redirect for demo purposes - user will always be available

  useEffect(() => {
    // Check URL parameters for tab selection
    const tabParam = searchParams.get('tab');
    if (tabParam && ['profile', 'security', 'notifications', 'integrations', 'api'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        company: user.company || '',
        role: user.role || '',
      });
    }
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // In a real app, you'd call an API to update user profile
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      await refreshUser();
    } catch (error) {
      console.error('Failed to save:', error);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container-spacing">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading user profile...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container-spacing">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
          <div className="text-sm text-muted-foreground">›</div>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <SettingsIcon className="w-6 h-6" />
            Settings
          </h1>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-border">
          <nav className="flex space-x-8">
            {[
              { id: 'profile', label: 'Profile', icon: User },
              { id: 'security', label: 'Security', icon: Shield },
              { id: 'notifications', label: 'Notifications', icon: Bell },
              { id: 'integrations', label: 'Integrations', icon: Building },
              { id: 'api', label: 'API', icon: Key },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="space-y-8 mt-8">
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="bg-card border rounded-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <User className="w-5 h-5 text-primary" />
                  <h2 className="text-lg font-medium">User Profile</h2>
                </div>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium mb-2">Name</label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    className="w-full px-3 py-2 border border-input rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
                    value={formData.name}
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium mb-2">Email</label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    className="w-full px-3 py-2 border border-input rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
                    value={formData.email}
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <label htmlFor="company" className="block text-sm font-medium mb-2">Company</label>
                  <input
                    id="company"
                    name="company"
                    type="text"
                    className="w-full px-3 py-2 border border-input rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
                    value={formData.company}
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <label htmlFor="role" className="block text-sm font-medium mb-2">Role</label>
                  <select 
                    id="role" 
                    name="role"
                    className="w-full px-3 py-2 border border-input rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
                    value={formData.role}
                    onChange={handleInputChange}
                  >
                    <option value="">Select a role</option>
                    <option value="Sustainability Consultant">Sustainability Consultant</option>
                    <option value="Architect">Architect</option>
                    <option value="Engineer">Engineer</option>
                    <option value="Project Manager">Project Manager</option>
                  </select>
                </div>
              </div>
              
              <div className="mt-6 pt-6 border-t border-border">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium">Account Information</h3>
                    <p className="text-sm text-muted-foreground">Member since {new Date().toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">Last login</p>
                    <p className="text-sm text-muted-foreground">{new Date().toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              <div className="bg-card border rounded-lg p-6">
                <div className="flex items-center gap-3 mb-6">
                  <Shield className="w-5 h-5 text-primary" />
                  <h2 className="text-lg font-medium">Security Settings</h2>
                </div>
                
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-medium">Two-Factor Authentication</h3>
                      <p className="text-sm text-muted-foreground">Add an extra layer of security to your account</p>
                    </div>
                    <button className="px-4 py-2 border border-input rounded-md text-sm hover:bg-accent transition-colors">
                      Enable
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-medium">Session Timeout</h3>
                      <p className="text-sm text-muted-foreground">Automatically log out after inactivity</p>
                    </div>
                    <select className="px-3 py-2 border border-input rounded-md text-sm">
                      <option value="480">8 hours</option>
                      <option value="240">4 hours</option>
                      <option value="60">1 hour</option>
                      <option value="30">30 minutes</option>
                    </select>
                  </div>
                </div>
              </div>
              
              <div className="bg-card border rounded-lg p-6">
                <h3 className="text-lg font-medium mb-4">Recent Login Activity</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between py-2 border-b border-border">
                    <div>
                      <p className="text-sm font-medium">Successful login</p>
                      <p className="text-xs text-muted-foreground">192.168.1.1</p>
                    </div>
                    <p className="text-xs text-muted-foreground">{new Date().toLocaleString()}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <div className="bg-card border rounded-lg p-6">
              <div className="flex items-center gap-3 mb-6">
                <Bell className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-medium">Notification Preferences</h2>
              </div>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-medium mb-4">Email Notifications</h3>
                  <div className="space-y-3">
                    {[
                      { key: 'projectUpdates', label: 'Project updates and changes' },
                      { key: 'carbonAlerts', label: 'Carbon threshold alerts' },
                      { key: 'weeklyReports', label: 'Weekly summary reports' },
                      { key: 'systemUpdates', label: 'System updates and maintenance' },
                    ].map((item) => (
                      <div key={item.key} className="flex items-center justify-between">
                        <label className="text-sm text-foreground">{item.label}</label>
                        <input
                          type="checkbox"
                          className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                          defaultChecked={true}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Integrations Tab */}
          {activeTab === 'integrations' && (
            <div className="bg-card border rounded-lg p-6">
              <div className="flex items-center gap-3 mb-6">
                <Building className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-medium">Autodesk ACC Integration</h2>
              </div>
              
              <div className="mb-4">
                <p className="text-sm text-muted-foreground mb-4">
                  Connect your Autodesk Construction Cloud (ACC) or BIM 360 account to access your projects and models. 
                  This allows you to link models directly to your carbon analysis options.
                </p>
              </div>

              <AutodeskAuth />

              {user?.accConnection && (
                <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-md">
                  <h4 className="font-medium text-green-900 mb-2">Connected Account</h4>
                  <div className="space-y-1 text-sm text-green-800">
                    <p><span className="font-medium">Account:</span> {user.accConnection.accountName}</p>
                    <p><span className="font-medium">Connected:</span> {new Date(user.accConnection.connectedAt).toLocaleDateString()}</p>
                    <p><span className="font-medium">Last Sync:</span> {new Date(user.accConnection.lastSync).toLocaleDateString()}</p>
                    <p><span className="font-medium">Status:</span> {user.accConnection.isActive ? 'Active' : 'Inactive'}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* API Tab */}
          {activeTab === 'api' && (
            <div className="bg-card border rounded-lg p-6">
              <div className="flex items-center gap-3 mb-6">
                <Key className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-medium">API Configuration</h2>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="api-key" className="block text-sm font-medium mb-2">Carbon Database API Key</label>
                  <div className="flex gap-2">
                    <input
                      id="api-key"
                      type="password"
                      className="flex-1 px-3 py-2 border border-input rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="Enter API key..."
                    />
                    <button className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors">
                      Save
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Required for accessing material carbon data
                  </p>
                </div>
                
                <div>
                  <label htmlFor="api-endpoint" className="block text-sm font-medium mb-2">Embodied Carbon API Endpoint</label>
                  <input
                    id="api-endpoint"
                    type="url"
                    className="w-full px-3 py-2 border border-input rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
                    defaultValue="https://api.carbon-database.com/v1"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}