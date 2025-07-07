'use client';

import { useState, useEffect } from 'react';
import { Building2, Zap, TrendingDown, BarChart3, Plus } from 'lucide-react';
import MetricCard from '@/components/MetricCard';
import ProjectTile from '@/components/ProjectTile';
import NewProjectModal, { type NewProjectData } from '@/components/NewProjectModal';
import { getAllProjects, addProject, calculateDashboardMetrics, addRefreshCallback, removeRefreshCallback } from '@/lib/projectData';

const mockMetrics = {
  totalProjects: 12,
  totalCarbon: 3456,
  carbonSaved: 789,
  averageCarbon: 288,
};

// Mock project tiles with additional display data
const createProjectTilesFromGlobalProjects = () => {
  const projects = getAllProjects();
  return projects.map((project, index) => ({
    id: project.id,
    name: project.name,
    projectNumber: project.projectNumber,
    thumbnail: project.thumbnail, // Use actual thumbnail from project
    carbon: project.options[0]?.carbon || 1200 + (index * 300), // Mock carbon data
    carbonSaved: Math.floor((project.options[0]?.carbon || 1200) * 0.15), // Mock 15% savings
    carbonSavedPercent: 15 + (index * 2), // Mock percentage
    status: project.status,
    lastUpdated: `Updated ${index === 0 ? '2 hours' : index === 1 ? '1 day' : index + ' days'} ago`,
  }));
};

type SortOption = 'lastUpdated' | 'carbonSaved' | 'name';

export default function HomePage() {
  const [sortBy, setSortBy] = useState<SortOption>('lastUpdated');
  const [filteredMetric, setFilteredMetric] = useState<string | null>(null);
  const [projectTiles, setProjectTiles] = useState<any[]>([]);
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [metrics, setMetrics] = useState({ totalProjects: 0, totalCarbon: 0, carbonSaved: 0, averageCarbon: 0 });
  const [mounted, setMounted] = useState(false);

  const refreshData = () => {
    if (mounted) {
      setProjectTiles(createProjectTilesFromGlobalProjects());
      setMetrics(calculateDashboardMetrics());
    }
  };

  // Update project tiles and metrics when component mounts or projects change
  useEffect(() => {
    setMounted(true);
    setProjectTiles(createProjectTilesFromGlobalProjects());
    setMetrics(calculateDashboardMetrics());
    
    // Register refresh callback
    addRefreshCallback(refreshData);
    
    // Cleanup on unmount
    return () => {
      removeRefreshCallback(refreshData);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted]);

  const handleNewProject = (projectData: NewProjectData) => {
    // Generate next 3-digit project number
    const existingProjects = getAllProjects();
    const maxNumber = existingProjects.reduce((max, project) => {
      const num = parseInt(project.projectNumber);
      return isNaN(num) ? max : Math.max(max, num);
    }, 0);
    const nextNumber = (maxNumber + 1).toString().padStart(3, '0');

    const newProject = {
      id: `p${Date.now()}`,
      name: projectData.name,
      projectNumber: nextNumber,
      gia: projectData.gia,
      nia: projectData.nia,
      gea: projectData.gea,
      status: 'Live' as const,
      sector: projectData.sector,
      thumbnail: projectData.thumbnail ? URL.createObjectURL(projectData.thumbnail) : undefined,
      primaryOptionId: 'A',
      options: [
        {
          id: 'A',
          name: 'Default Option',
          carbon: 0,
          systems: [],
          systemsData: [],
          productsData: [],
          apsModels: [],
          metadata: {
            description: 'Initial option for new project',
            lastModified: new Date().toISOString(),
            modifiedBy: 'System',
            version: 1,
            takeoffMethod: 'Manual' as const,
            calculationStatus: 'Draft' as const
          }
        },
      ],
    };

    addProject(newProject);
    refreshData();
    setShowNewProjectModal(false);
  };

  const sortedProjects = [...projectTiles].sort((a, b) => {
    switch (sortBy) {
      case 'carbonSaved':
        return (b.carbonSavedPercent || 0) - (a.carbonSavedPercent || 0);
      case 'name':
        return a.name.localeCompare(b.name);
      case 'lastUpdated':
      default:
        return a.id.localeCompare(b.id);
    }
  });

  const handleMetricClick = (metricType: string) => {
    setFilteredMetric(filteredMetric === metricType ? null : metricType);
  };

  // Show loading or placeholder until mounted
  if (!mounted) {
    return (
      <div className="container-spacing">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="mb-6">Dashboard</h1>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {Array(4).fill(0).map((_, i) => (
                <div key={i} className="h-32 bg-muted animate-pulse rounded-lg"></div>
              ))}
            </div>
          </div>
          <div className="border-t border-border mb-8"></div>
          <div>
            <h2 className="mb-6">Projects</h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {Array(3).fill(0).map((_, i) => (
                <div key={i} className="h-80 bg-muted animate-pulse rounded-lg"></div>
              ))}
              {/* New Project Tile Placeholder */}
              <div 
                role="button"
                tabIndex={0}
                className="group flex items-center justify-center min-h-[280px] rounded-lg border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 hover:bg-accent/50 transition-all duration-200 cursor-pointer"
              >
                <div className="text-center">
                  <Plus className="w-12 h-12 text-muted-foreground/50 group-hover:text-primary/70 mx-auto mb-4 transition-colors" />
                  <div className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                    Create New Project
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container-spacing">
      <div className="max-w-7xl mx-auto">
        {/* Dashboard Section */}
        <div className="mb-8">
          <h1 className="mb-6">Dashboard</h1>
          
          {/* Metric Cards */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <MetricCard
              title="Total Projects"
              value={metrics.totalProjects}
              icon={Building2}
              onClick={() => handleMetricClick('totalProjects')}
              info="Total number of live projects in your portfolio"
              className={filteredMetric === 'totalProjects' ? 'ring-2 ring-primary' : ''}
            />
            <MetricCard
              title="Total Carbon"
              value={metrics.totalCarbon.toLocaleString()}
              unit="tCO₂e"
              icon={BarChart3}
              onClick={() => handleMetricClick('totalCarbon')}
              info="Combined embodied carbon from primary options"
              className={filteredMetric === 'totalCarbon' ? 'ring-2 ring-primary' : ''}
              carbonRelated={true}
            />
            <MetricCard
              title="Carbon Saved"
              value={metrics.carbonSaved.toLocaleString()}
              unit="tCO₂e"
              icon={TrendingDown}
              onClick={() => handleMetricClick('carbonSaved')}
              info="Total carbon reduction from primary options"
              className={filteredMetric === 'carbonSaved' ? 'ring-2 ring-primary' : ''}
              carbonRelated={true}
            />
            <MetricCard
              title="Average Carbon"
              value={metrics.averageCarbon}
              unit="tCO₂e"
              icon={Zap}
              onClick={() => handleMetricClick('averageCarbon')}
              info="Average embodied carbon per project"
              className={filteredMetric === 'averageCarbon' ? 'ring-2 ring-primary' : ''}
              carbonRelated={true}
            />
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-border mb-8"></div>

        {/* Projects Section */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="mb-0">Projects</h2>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-4">
                <label htmlFor="sort-select" className="text-sm font-medium">
                  Sort by:
                </label>
                <select
                  id="sort-select"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="px-3 py-2 border border-input rounded-md text-sm bg-background focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                >
                  <option value="lastUpdated">Last Updated</option>
                  <option value="carbonSaved">Carbon Saved</option>
                  <option value="name">Name</option>
                </select>
              </div>
              
              {filteredMetric && (
                <button
                  onClick={() => setFilteredMetric(null)}
                  className="text-sm text-primary hover:text-primary/80 underline"
                >
                  Clear filter
                </button>
              )}
            </div>
          </div>

          {/* Project Grid */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {sortedProjects.map((project) => (
              <ProjectTile
                key={project.id}
                id={project.id}
                name={project.name}
                projectNumber={project.projectNumber}
                thumbnail={project.thumbnail}
                carbon={project.carbon}
                carbonSaved={project.carbonSaved}
                carbonSavedPercent={project.carbonSavedPercent}
                status={project.status}
                lastUpdated={project.lastUpdated}
              />
            ))}
            
            {/* New Project Tile */}
            <div 
              onClick={() => setShowNewProjectModal(true)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  setShowNewProjectModal(true);
                }
              }}
              role="button"
              tabIndex={0}
              className="group flex items-center justify-center min-h-[280px] rounded-lg border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 hover:bg-accent/50 transition-all duration-200 cursor-pointer"
            >
              <div className="text-center">
                <Plus className="w-12 h-12 text-muted-foreground/50 group-hover:text-primary/70 mx-auto mb-4 transition-colors" />
                <div className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                  Create New Project
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* New Project Modal */}
        <NewProjectModal
          isOpen={showNewProjectModal}
          onClose={() => setShowNewProjectModal(false)}
          onSubmit={handleNewProject}
        />
      </div>
    </div>
  );
}