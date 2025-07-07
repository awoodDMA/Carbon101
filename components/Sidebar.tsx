'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import {
  User,
  Settings,
  Home,
  BarChart,
  Plus,
  ChevronLeft,
  ChevronRight,
  Info,
  Pin,
  LogOut,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePathname, useRouter } from 'next/navigation';
import { getAllProjects, getOptionsByProjectId, type Project as RelationalProject, type DesignOption, type APSModelAssignment } from '@/lib/relational-data';

// Local type for sidebar that includes options (legacy compatibility)
interface Project extends RelationalProject {
  options: Array<{
    id: string;
    name: string;
    carbon: number;
    systems: any[];
    systemsData: any[];
    productsData: any[];
    linkedModel?: APSModelAssignment;
    metadata: any;
  }>;
}
import NewProjectModal, { type NewProjectData } from './NewProjectModal';
import ProjectInfoCard from './ProjectInfoCard';
import { useAuth } from '@/contexts/AuthContext';
import UserProfileDropdown from '@/components/UserProfileDropdown';

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(true);
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  // Helper function to get projects with options in the format expected by sidebar
  const getProjectsWithOptions = () => {
    const projects = getAllProjects();
    return projects.map(project => {
      const options = getOptionsByProjectId(project.id);
      return {
        ...project,
        options: options.map(option => ({
          id: option.optionLetter,
          name: option.name,
          carbon: option.carbon,
          systems: option.systems,
          systemsData: option.systemsData,
          productsData: option.productsData,
          linkedModel: option.linkedModel,
          metadata: option.metadata
        }))
      };
    });
  };

  const [currentProject, setCurrentProject] = useState<Project>(() => {
    const projects = getProjectsWithOptions();
    return projects[0] || {} as Project;
  });
  const [liveProjects, setLiveProjects] = useState<Project[]>([]);
  const [mounted, setMounted] = useState(false);
  const [showProjectInfo, setShowProjectInfo] = useState(false);

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };


  // Handle client-side mounting - Codespaces compatible
  useEffect(() => {
    setMounted(true);
    
    // Load saved states from localStorage after mounting (with error handling for Codespaces)
    try {
      const savedSidebarOpen = localStorage.getItem('sidebarOpen');
      if (savedSidebarOpen !== null) {
        setOpen(JSON.parse(savedSidebarOpen));
      }
      
      const savedCurrentProject = localStorage.getItem('currentProject');
      if (savedCurrentProject) {
        setCurrentProject(JSON.parse(savedCurrentProject));
      }
    } catch (error) {
      console.warn('Sidebar: localStorage not available (Codespaces environment)');
    }
    
    // Set live projects using relational data
    setLiveProjects(getProjectsWithOptions());
  }, []);
  
  // Force mounting in Codespaces environment
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!mounted) {
        console.log('Sidebar: Force mounting for Codespaces');
        setMounted(true);
      }
    }, 50);
    return () => clearTimeout(timer);
  }, [mounted]);

  // Debounced localStorage operations to reduce choppiness
  useEffect(() => {
    if (!mounted) return;
    
    const timeoutId = setTimeout(() => {
      localStorage.setItem('sidebarOpen', JSON.stringify(open));
    }, 100);
    
    return () => clearTimeout(timeoutId);
  }, [open, mounted]);

  // Sync current project with URL - optimized to reduce re-renders
  useEffect(() => {
    if (!mounted) return;
    
    const match = pathname.match(/\/projects\/([^/]+)/);
    if (match) {
      const projectId = match[1];
      const project = getProjectsWithOptions().find(p => p.id === projectId);
      if (project && project.id !== currentProject.id) {
        // Use a transition to make the switch smoother
        requestAnimationFrame(() => {
          setCurrentProject(project);
        });
      }
    }
  }, [pathname, mounted]); // Removed currentProject.id dependency to prevent loops

  // Debounced current project localStorage save
  useEffect(() => {
    if (!mounted) return;
    
    const timeoutId = setTimeout(() => {
      localStorage.setItem('currentProject', JSON.stringify(currentProject));
    }, 200);
    
    return () => clearTimeout(timeoutId);
  }, [currentProject, mounted]);

  const handleProjectSelect = useCallback((project: Project) => {
    // Optimistic update - set current project immediately for smooth UI
    setCurrentProject(project);
    
    // Navigate with a slight delay to let the UI update first
    setTimeout(() => {
      router.push(`/projects/${project.id}/option-${project.options[0].id}`);
    }, 50);
  }, [router]);

  // Memoize the current active option to prevent recalculations
  const mockActiveOption = useMemo(() => {
    const match = pathname.match(/\/projects\/[^/]+\/option-([A-Z])/);
    return match ? match[1] : 'A';
  }, [pathname]);

  const handleNewProject = (projectData: NewProjectData) => {
    // TODO: Implement project creation with relational data
    console.warn('Project creation temporarily disabled during relational migration');
    setShowNewProjectModal(false);
  };

  const handleProjectUpdate = (updatedData: Partial<Project>) => {
    // TODO: Implement project updates with relational data
    console.warn('Project updates temporarily disabled during relational migration');
  };

  return (
    <aside
      className={cn(
        'relative flex-col border-r bg-secondary text-foreground transition-all duration-300 ease-in-out',
        'hidden md:flex', // Hidden on mobile by default
        open ? 'w-60' : 'w-18',
      )}
    >
      {/* Home Section & Sidebar Toggle */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <Link
          href="/"
          className={cn(
            'flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-all duration-200 hover:bg-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 hover:scale-105 active:scale-95 group',
            pathname === '/' && 'bg-accent shadow-sm',
            !open && 'justify-center'
          )}
          title={!open ? 'Home' : undefined}
        >
          <Home aria-hidden="true" className="size-4 group-hover:scale-110 transition-transform duration-200" />
          <span className={cn(
            "transition-all duration-200",
            open ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-2"
          )}>
            {open && 'Home'}
          </span>
        </Link>
        <button
          aria-label={open ? 'Collapse sidebar' : 'Expand sidebar'}
          aria-expanded={open}
          onClick={() => setOpen((p: boolean) => !p)}
          className="rounded p-1 hover:bg-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 transition-all duration-200 hover:scale-110 active:scale-95"
        >
          <div className="transform transition-transform duration-200">
            {open ? (
              <ChevronLeft aria-hidden="true" className="size-4" />
            ) : (
              <ChevronRight aria-hidden="true" className="size-4" />
            )}
          </div>
        </button>
      </div>

      {/* Current Project Section */}
      <div className={cn(
        "transition-all duration-300 ease-in-out overflow-hidden border-b border-border",
        open && pathname.startsWith('/projects/') ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
      )} suppressHydrationWarning>
        <div className="px-6 py-4" key={currentProject?.id || 'no-project'}>
          <div className={cn(
            "transition-all duration-300 ease-in-out",
            currentProject ? "opacity-100 transform translate-y-0" : "opacity-0 transform translate-y-2"
          )}>
            <div className="text-xs text-muted-foreground mb-2">Current Project</div>
            <div className="text-2xl font-black mb-1 truncate text-orange-600" 
                 title={currentProject?.projectNumber || ''} 
                 style={{ fontFamily: 'Roboto Black, sans-serif' }}>
              {currentProject?.projectNumber || '000'}
            </div>
            <div className="flex items-center justify-between mb-5">
              <div className="text-sm font-bold truncate text-carbon-black" title={currentProject?.name || ''}>
                {currentProject?.name || 'Loading...'}
              </div>
              <button 
                onClick={() => setShowProjectInfo(true)}
                className="text-muted-foreground hover:text-foreground transition-all duration-200 ml-2 flex-shrink-0 hover:scale-110 tooltip-fast"
                data-tooltip="Project Information"
              >
                <Info className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="space-y-1 animate-in fade-in duration-400 delay-200">
            {currentProject?.options?.map((option, index: number) => (
              <button
                key={option.id}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-all duration-200 relative text-left hover:scale-[1.02] active:scale-[0.98]',
                  option.id === mockActiveOption
                    ? 'bg-accent shadow-sm'
                    : 'hover:bg-accent/50'
                )}
                style={{ animationDelay: `${index * 50}ms` }}
                onClick={() => {
                  router.push(`/projects/${currentProject?.id}/option-${option.id}`);
                }}
              >
                <div className="flex items-center justify-center w-5 h-5 bg-primary text-primary-foreground rounded-full text-xs font-medium transition-all duration-200 hover:scale-110">
                  {option.id}
                </div>
                <div className="flex-1 min-w-0 flex items-center justify-between">
                  <div className="text-sm truncate text-carbon-black">{option.name}</div>
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      // TODO: Implement primary option update with relational data
                      console.warn('Primary option update temporarily disabled');
                    }}
                    className={cn(
                      "transition-all duration-200 ml-2 flex-shrink-0 tooltip-fast hover:scale-110 active:scale-95 cursor-pointer",
                      currentProject?.primaryOptionId === option.id 
                        ? "text-primary" 
                        : "text-muted-foreground hover:text-foreground"
                    )}
                    data-tooltip={currentProject?.primaryOptionId === option.id ? "Primary option" : "Set as primary"}
                  >
                    <Pin className="w-3 h-3" />
                  </div>
                </div>
              </button>
            )) || []}
            
            {/* Create Option Button */}
            <button className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-all duration-200 hover:bg-accent/50 text-muted-foreground hover:text-foreground mt-2 hover:scale-[1.02] active:scale-[0.98]">
              <div className="flex items-center justify-center w-5 h-5 rounded-full border border-muted-foreground/50 transition-all duration-200 hover:border-primary/50 hover:scale-110">
                <Plus className="w-2 h-2" />
              </div>
              <span>Create Option</span>
            </button>
          </div>
        </div>
      </div>


      {/* All Projects Section */}
      <div className="flex-1 px-3 py-4 overflow-hidden">
        <div className={cn(
          "transition-all duration-300 ease-in-out",
          open ? "opacity-100 transform translate-x-0" : "opacity-0 transform -translate-x-4"
        )} suppressHydrationWarning>
          <div className="flex items-center justify-between mb-3 animate-in fade-in duration-200">
            <span className="text-xs text-muted-foreground font-medium">Live Projects</span>
            <button 
              onClick={() => setShowNewProjectModal(true)}
              className="p-1 hover:bg-accent rounded-md transition-all duration-200 text-muted-foreground hover:text-foreground hover:scale-110 active:scale-95"
              title="Add new project"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>
          <div className="space-y-1 animate-in fade-in duration-400 delay-100">
            {liveProjects.map((project: Project, index: number) => (
              <button
                key={project.id}
                className={cn(
                  'w-full text-left px-3 py-2 rounded-md text-sm transition-all duration-200 hover:bg-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 hover:scale-[1.02] active:scale-[0.98] group',
                  // Only highlight in projects list when NOT on a project page
                  currentProject.id === project.id && !pathname.startsWith('/projects/') && 'bg-accent shadow-sm'
                )}
                style={{ animationDelay: `${index * 30}ms` }}
                onClick={() => handleProjectSelect(project)}
              >
                <div className="truncate text-carbon-black group-hover:translate-x-1 transition-transform duration-200" title={project.name}>
                  {project.name}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>


      {/* Compare Section */}
      <nav className="px-3 py-4 border-t border-border">
        <Link
          href="/compare"
          className={cn(
            'flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-all duration-200 hover:bg-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 hover:scale-105 active:scale-95 group',
            pathname === '/compare' && 'bg-accent shadow-sm',
            !open && 'justify-center'
          )}
          title={!open ? 'Compare' : undefined}
        >
          <BarChart aria-hidden="true" className="size-4 group-hover:scale-110 transition-transform duration-200" />
          <span className={cn(
            "transition-all duration-200",
            open ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-2"
          )}>
            {open && 'Compare'}
          </span>
        </Link>
      </nav>

      {/* User Profile & Settings */}
      <div className={cn('px-3 py-4 border-t border-border', !open && 'flex justify-center')} suppressHydrationWarning>
        {open ? (
          <UserProfileDropdown />
        ) : (
          <div className="flex flex-col space-y-2">
            {/* Collapsed User Avatar */}
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-sm font-medium mx-auto transition-all duration-200 hover:scale-110 hover:shadow-md cursor-pointer" suppressHydrationWarning>
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            
            {/* Settings Link - Collapsed */}
            <Link
              href="/settings"
              className={cn(
                "flex items-center justify-center p-2 rounded-md text-sm transition-all duration-200 hover:bg-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 hover:scale-110 active:scale-95",
                pathname === '/settings' && 'bg-accent text-foreground shadow-sm'
              )}
              title="Settings"
            >
              <Settings aria-hidden="true" className="size-4 transition-transform duration-200 hover:rotate-90" />
            </Link>
            
            {/* Logout Button - Collapsed */}
            <button
              onClick={handleLogout}
              className="flex items-center justify-center p-2 rounded-md text-sm transition-all duration-200 hover:bg-red-50 hover:text-red-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 hover:scale-110 active:scale-95"
              title="Logout"
            >
              <LogOut aria-hidden="true" className="size-4 transition-transform duration-200 hover:translate-x-0.5" />
            </button>
          </div>
        )}
      </div>
      {/* Hover expand trigger - only on the toggle button area */}
      {!open && (
        <div
          className="absolute right-0 top-4 bottom-4 w-8 flex items-center justify-center group cursor-pointer"
          onClick={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setOpen(true);
            }
          }}
          role="button"
          tabIndex={0}
          title="Expand sidebar"
        >
          <div className="w-1 h-8 bg-border group-hover:bg-primary/50 transition-colors duration-200 rounded-full"></div>
        </div>
      )}

      {/* Skip link for accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-primary text-primary-foreground px-3 py-2 rounded-md text-sm z-50"
      >
        Skip to main content
      </a>

      {/* New Project Modal */}
      <NewProjectModal
        isOpen={showNewProjectModal}
        onClose={() => setShowNewProjectModal(false)}
        onSubmit={handleNewProject}
      />

      {/* Project Info Card */}
      {currentProject && (
        <ProjectInfoCard
          isOpen={showProjectInfo}
          onClose={() => setShowProjectInfo(false)}
          project={currentProject}
          onUpdate={handleProjectUpdate}
        />
      )}
    </aside>
  );
}
