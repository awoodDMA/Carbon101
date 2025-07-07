'use client';

import { useState } from 'react';
import { Building2, Zap, TrendingDown, BarChart3, Plus } from 'lucide-react';
import MetricCard from '@/components/MetricCard';
import ProjectTile from '@/components/ProjectTile';

const mockMetrics = {
  totalProjects: 12,
  totalCarbon: 3456,
  carbonSaved: 789,
  averageCarbon: 288,
};

const mockProjects = [
  {
    id: 'p1',
    name: 'Office Building Complex',
    projectNumber: '001',
    thumbnail: undefined,
    carbon: 1247,
    carbonSaved: 267,
    carbonSavedPercent: 18,
    status: 'Live' as const,
    lastUpdated: 'Updated 2 hours ago',
  },
  {
    id: 'p2',
    name: 'Residential Tower',
    projectNumber: '002',
    thumbnail: undefined,
    carbon: 892,
    carbonSaved: 123,
    carbonSavedPercent: 12,
    status: 'Completed' as const,
    lastUpdated: 'Updated 1 day ago',
  },
  {
    id: 'p3',
    name: 'Shopping Center',
    projectNumber: '003',
    thumbnail: undefined,
    carbon: 2156,
    carbonSaved: 456,
    carbonSavedPercent: 17,
    status: 'Review' as const,
    lastUpdated: 'Updated 3 days ago',
  },
  {
    id: 'p4',
    name: 'Hospital Wing',
    projectNumber: '004',
    thumbnail: undefined,
    carbon: 2156,
    carbonSaved: 345,
    carbonSavedPercent: 14,
    status: 'Live' as const,
    lastUpdated: 'Updated 1 week ago',
  },
];

type SortOption = 'lastUpdated' | 'carbonSaved' | 'name';

export default function ProjectsPage() {
  const [sortBy, setSortBy] = useState<SortOption>('lastUpdated');
  const [filteredMetric, setFilteredMetric] = useState<string | null>(null);

  const sortedProjects = [...mockProjects].sort((a, b) => {
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

  return (
    <div className="container-spacing">
      <div className="max-w-7xl mx-auto">
        <h1 className="mb-6">Projects Dashboard</h1>
        
        {/* Metric Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <MetricCard
            title="Total Projects"
            value={mockMetrics.totalProjects}
            icon={Building2}
            onClick={() => handleMetricClick('totalProjects')}
            info="Total number of projects in your portfolio"
            className={filteredMetric === 'totalProjects' ? 'ring-2 ring-primary' : ''}
          />
          <MetricCard
            title="Total Carbon"
            value={mockMetrics.totalCarbon.toLocaleString()}
            unit="tCO₂e"
            icon={BarChart3}
            onClick={() => handleMetricClick('totalCarbon')}
            info="Combined embodied carbon across all projects"
            className={filteredMetric === 'totalCarbon' ? 'ring-2 ring-primary' : ''}
            carbonRelated={true}
          />
          <MetricCard
            title="Carbon Saved"
            value={mockMetrics.carbonSaved.toLocaleString()}
            unit="tCO₂e"
            icon={TrendingDown}
            onClick={() => handleMetricClick('carbonSaved')}
            info="Total carbon reduction achieved through design optimization"
            className={filteredMetric === 'carbonSaved' ? 'ring-2 ring-primary' : ''}
            carbonRelated={true}
          />
          <MetricCard
            title="Average Carbon"
            value={mockMetrics.averageCarbon}
            unit="tCO₂e"
            icon={Zap}
            onClick={() => handleMetricClick('averageCarbon')}
            info="Average embodied carbon per project"
            className={filteredMetric === 'averageCarbon' ? 'ring-2 ring-primary' : ''}
            carbonRelated={true}
          />
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between mb-6">
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
          <div className="group flex items-center justify-center min-h-[280px] rounded-lg border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 hover:bg-accent/50 transition-all duration-200 cursor-pointer">
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
  );
}
