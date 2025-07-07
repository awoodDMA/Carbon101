export interface Project {
  id: string;
  name: string;
  projectNumber: string;
  gia: number; // Gross Internal Area
  nia: number; // Net Internal Area  
  gea: number; // Gross External Area
  status: 'Live' | 'Completed' | 'Review';
  sector: string;
  thumbnail?: string;
  primaryOptionId: string;
  options: DesignOption[];
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

export interface OptionMetadata {
  description?: string;
  lastModified: string;
  modifiedBy: string;
  version: number;
  takeoffMethod: 'Manual' | 'BIM 360/ACC' | 'Hybrid';
  calculationStatus: 'Draft' | 'In Progress' | 'Complete' | 'Review';
}

export interface DesignOption {
  id: string;
  name: string;
  carbon: number;
  systems: System[];
  systemsData: SystemData[];
  productsData: ProductData[];
  // Legacy speckleModels property removed - now using apsModels and linkedModel
  apsModels?: APSModelAssignment[];
  linkedModel?: APSModelAssignment;
  metadata: OptionMetadata;
}

export interface System {
  id: string;
  name: string;
  carbon: number;
  color: string;
  percentage: number;
}

export interface SystemData {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  carbon: number;
  percentage: number;
}

export interface ProductData {
  id: string;
  guid: string;
  name: string;
  quantity: number;
  unit: string;
  carbon: number;
  percentage: number;
}

// Legacy SpeckleModel interface removed - now using APSModelAssignment

export const mockProjects: Project[] = [
  {
    id: 'p1',
    name: 'Office Building Renovation',
    projectNumber: '001',
    gia: 12500,
    nia: 10800,
    gea: 15200,
    status: 'Live',
    sector: 'Commercial',
    primaryOptionId: 'A',
    options: [
      {
        id: 'A',
        name: 'Steel Frame',
        carbon: 245,
        systems: [
          { id: 'foundation', name: 'Foundation', carbon: 45, color: '#3B82F6', percentage: 18 },
          { id: 'structure', name: 'Structure', carbon: 89, color: '#10B981', percentage: 36 },
          { id: 'envelope', name: 'Envelope', carbon: 67, color: '#F59E0B', percentage: 27 },
          { id: 'mechanical', name: 'Mechanical', carbon: 34, color: '#EF4444', percentage: 14 },
          { id: 'electrical', name: 'Electrical', carbon: 10, color: '#8B5CF6', percentage: 4 },
        ],
        systemsData: [
          { id: '1', name: 'Foundation', quantity: 450, unit: 'm³', carbon: 45, percentage: 18 },
          { id: '2', name: 'Structure', quantity: 1200, unit: 'm³', carbon: 89, percentage: 36 },
          { id: '3', name: 'Envelope', quantity: 2400, unit: 'm²', carbon: 67, percentage: 27 },
          { id: '4', name: 'Mechanical', quantity: 85, unit: 'units', carbon: 34, percentage: 14 },
          { id: '5', name: 'Electrical', quantity: 45, unit: 'units', carbon: 10, percentage: 4 },
        ],
        productsData: [
          { id: '1', guid: 'ABC123-DEF456', name: 'Steel Beam 300x150', quantity: 24, unit: 'pcs', carbon: 18, percentage: 7 },
          { id: '2', guid: 'GHI789-JKL012', name: 'Concrete Foundation Slab', quantity: 450, unit: 'm³', carbon: 45, percentage: 18 },
          { id: '3', guid: 'MNO345-PQR678', name: 'Curtain Wall System', quantity: 1200, unit: 'm²', carbon: 67, percentage: 27 },
          { id: '4', guid: 'STU901-VWX234', name: 'HVAC Unit 50kW', quantity: 4, unit: 'units', carbon: 34, percentage: 14 },
          { id: '5', guid: 'YZA567-BCD890', name: 'LED Lighting Fixture', quantity: 120, unit: 'pcs', carbon: 10, percentage: 4 },
        ],
        apsModels: [],
        metadata: {
          description: 'Steel frame construction with curtain wall system',
          lastModified: '2024-01-15T14:30:00Z',
          modifiedBy: 'John Doe',
          version: 3,
          takeoffMethod: 'BIM 360/ACC',
          calculationStatus: 'Complete'
        }
      },
      {
        id: 'B',
        name: 'Concrete Frame',
        carbon: 198,
        systems: [
          { id: 'foundation', name: 'Foundation', carbon: 38, color: '#3B82F6', percentage: 19 },
          { id: 'structure', name: 'Structure', carbon: 72, color: '#10B981', percentage: 36 },
          { id: 'envelope', name: 'Envelope', carbon: 54, color: '#F59E0B', percentage: 27 },
          { id: 'mechanical', name: 'Mechanical', carbon: 26, color: '#EF4444', percentage: 13 },
          { id: 'electrical', name: 'Electrical', carbon: 8, color: '#8B5CF6', percentage: 4 },
        ],
        systemsData: [
          { id: '1', name: 'Foundation', quantity: 380, unit: 'm³', carbon: 38, percentage: 19 },
          { id: '2', name: 'Structure', quantity: 960, unit: 'm³', carbon: 72, percentage: 36 },
          { id: '3', name: 'Envelope', quantity: 2100, unit: 'm²', carbon: 54, percentage: 27 },
          { id: '4', name: 'Mechanical', quantity: 75, unit: 'units', carbon: 26, percentage: 13 },
          { id: '5', name: 'Electrical', quantity: 40, unit: 'units', carbon: 8, percentage: 4 },
        ],
        productsData: [
          { id: '1', guid: 'ABC123-DEF457', name: 'Concrete Beam 300x300', quantity: 32, unit: 'pcs', carbon: 15, percentage: 8 },
          { id: '2', guid: 'GHI789-JKL013', name: 'Concrete Foundation', quantity: 380, unit: 'm³', carbon: 38, percentage: 19 },
          { id: '3', guid: 'MNO345-PQR679', name: 'Insulated Wall Panel', quantity: 2100, unit: 'm²', carbon: 54, percentage: 27 },
          { id: '4', guid: 'STU901-VWX235', name: 'HVAC Unit 40kW', quantity: 3, unit: 'units', carbon: 26, percentage: 13 },
          { id: '5', guid: 'YZA567-BCD891', name: 'Energy Efficient Lighting', quantity: 100, unit: 'pcs', carbon: 8, percentage: 4 },
        ],
        apsModels: [],
        metadata: {
          description: 'Concrete frame construction with insulated wall panels',
          lastModified: '2024-01-14T16:00:00Z',
          modifiedBy: 'Jane Smith',
          version: 2,
          takeoffMethod: 'Hybrid',
          calculationStatus: 'In Progress'
        }
      },
      {
        id: 'C',
        name: 'Timber Frame',
        carbon: 156,
        systems: [
          { id: 'foundation', name: 'Foundation', carbon: 30, color: '#3B82F6', percentage: 19 },
          { id: 'structure', name: 'Structure', carbon: 45, color: '#10B981', percentage: 29 },
          { id: 'envelope', name: 'Envelope', carbon: 48, color: '#F59E0B', percentage: 31 },
          { id: 'mechanical', name: 'Mechanical', carbon: 24, color: '#EF4444', percentage: 15 },
          { id: 'electrical', name: 'Electrical', carbon: 9, color: '#8B5CF6', percentage: 6 },
        ],
        systemsData: [
          { id: '1', name: 'Foundation', quantity: 300, unit: 'm³', carbon: 30, percentage: 19 },
          { id: '2', name: 'Structure', quantity: 850, unit: 'm³', carbon: 45, percentage: 29 },
          { id: '3', name: 'Envelope', quantity: 2200, unit: 'm²', carbon: 48, percentage: 31 },
          { id: '4', name: 'Mechanical', quantity: 65, unit: 'units', carbon: 24, percentage: 15 },
          { id: '5', name: 'Electrical', quantity: 50, unit: 'units', carbon: 9, percentage: 6 },
        ],
        productsData: [
          { id: '1', guid: 'ABC123-DEF458', name: 'Glue Laminated Timber Beam', quantity: 28, unit: 'pcs', carbon: 12, percentage: 8 },
          { id: '2', guid: 'GHI789-JKL014', name: 'Reduced Concrete Foundation', quantity: 300, unit: 'm³', carbon: 30, percentage: 19 },
          { id: '3', guid: 'MNO345-PQR680', name: 'Natural Insulation Panel', quantity: 2200, unit: 'm²', carbon: 48, percentage: 31 },
          { id: '4', guid: 'STU901-VWX236', name: 'Heat Pump 35kW', quantity: 2, unit: 'units', carbon: 24, percentage: 15 },
          { id: '5', guid: 'YZA567-BCD892', name: 'Smart LED System', quantity: 80, unit: 'pcs', carbon: 9, percentage: 6 },
        ],
        apsModels: [],
        metadata: {
          description: 'Sustainable timber frame construction with natural materials',
          lastModified: '2024-01-13T11:20:00Z',
          modifiedBy: 'Alex Johnson',
          version: 1,
          takeoffMethod: 'Manual',
          calculationStatus: 'Draft'
        }
      },
    ],
  },
  {
    id: 'p2',
    name: 'Residential Complex Phase 2',
    projectNumber: '002',
    gia: 8500,
    nia: 7200,
    gea: 9800,
    status: 'Live',
    sector: 'Residential',
    primaryOptionId: 'A',
    options: [
      {
        id: 'A',
        name: 'Traditional Build',
        carbon: 456,
        systems: [
          { id: 'foundation', name: 'Foundation', carbon: 92, color: '#3B82F6', percentage: 20 },
          { id: 'structure', name: 'Structure', carbon: 164, color: '#10B981', percentage: 36 },
          { id: 'envelope', name: 'Envelope', carbon: 123, color: '#F59E0B', percentage: 27 },
          { id: 'mechanical', name: 'Mechanical', carbon: 55, color: '#EF4444', percentage: 12 },
          { id: 'electrical', name: 'Electrical', carbon: 22, color: '#8B5CF6', percentage: 5 },
        ],
        systemsData: [
          { id: '1', name: 'Foundation', quantity: 920, unit: 'm³', carbon: 92, percentage: 20 },
          { id: '2', name: 'Structure', quantity: 2200, unit: 'm³', carbon: 164, percentage: 36 },
          { id: '3', name: 'Envelope', quantity: 4100, unit: 'm²', carbon: 123, percentage: 27 },
          { id: '4', name: 'Mechanical', quantity: 125, unit: 'units', carbon: 55, percentage: 12 },
          { id: '5', name: 'Electrical', quantity: 85, unit: 'units', carbon: 22, percentage: 5 },
        ],
        productsData: [
          { id: '1', guid: 'RES123-DEF456', name: 'Residential Steel Frame', quantity: 45, unit: 'pcs', carbon: 35, percentage: 8 },
          { id: '2', guid: 'RES789-JKL012', name: 'Residential Foundation', quantity: 920, unit: 'm³', carbon: 92, percentage: 20 },
          { id: '3', guid: 'RES345-PQR678', name: 'Standard Wall System', quantity: 4100, unit: 'm²', carbon: 123, percentage: 27 },
          { id: '4', guid: 'RES901-VWX234', name: 'Central Heating System', quantity: 8, unit: 'units', carbon: 55, percentage: 12 },
          { id: '5', guid: 'RES567-BCD890', name: 'Standard Electrical', quantity: 200, unit: 'pcs', carbon: 22, percentage: 5 },
        ],
        apsModels: [],
        metadata: {
          description: 'Traditional residential construction approach',
          lastModified: '2024-01-12T08:30:00Z',
          modifiedBy: 'Sarah Wilson',
          version: 1,
          takeoffMethod: 'Manual',
          calculationStatus: 'Complete'
        }
      },
      {
        id: 'B',
        name: 'Modern Efficiency',
        carbon: 389,
        systems: [
          { id: 'foundation', name: 'Foundation', carbon: 78, color: '#3B82F6', percentage: 20 },
          { id: 'structure', name: 'Structure', carbon: 140, color: '#10B981', percentage: 36 },
          { id: 'envelope', name: 'Envelope', carbon: 105, color: '#F59E0B', percentage: 27 },
          { id: 'mechanical', name: 'Mechanical', carbon: 47, color: '#EF4444', percentage: 12 },
          { id: 'electrical', name: 'Electrical', carbon: 19, color: '#8B5CF6', percentage: 5 },
        ],
        systemsData: [
          { id: '1', name: 'Foundation', quantity: 780, unit: 'm³', carbon: 78, percentage: 20 },
          { id: '2', name: 'Structure', quantity: 1900, unit: 'm³', carbon: 140, percentage: 36 },
          { id: '3', name: 'Envelope', quantity: 3800, unit: 'm²', carbon: 105, percentage: 27 },
          { id: '4', name: 'Mechanical', quantity: 105, unit: 'units', carbon: 47, percentage: 12 },
          { id: '5', name: 'Electrical', quantity: 75, unit: 'units', carbon: 19, percentage: 5 },
        ],
        productsData: [
          { id: '1', guid: 'RES123-DEF457', name: 'Efficient Steel Frame', quantity: 38, unit: 'pcs', carbon: 28, percentage: 7 },
          { id: '2', guid: 'RES789-JKL013', name: 'Optimized Foundation', quantity: 780, unit: 'm³', carbon: 78, percentage: 20 },
          { id: '3', guid: 'RES345-PQR679', name: 'High-Performance Wall', quantity: 3800, unit: 'm²', carbon: 105, percentage: 27 },
          { id: '4', guid: 'RES901-VWX235', name: 'Heat Pump System', quantity: 6, unit: 'units', carbon: 47, percentage: 12 },
          { id: '5', guid: 'RES567-BCD891', name: 'Smart Electrical', quantity: 180, unit: 'pcs', carbon: 19, percentage: 5 },
        ],
        apsModels: [],
        metadata: {
          description: 'Energy-efficient residential design with modern systems',
          lastModified: '2024-01-11T16:45:00Z',
          modifiedBy: 'Michael Chen',
          version: 2,
          takeoffMethod: 'BIM 360/ACC',
          calculationStatus: 'Review'
        }
      },
    ],
  },
];

// Global project store for managing dynamic projects
let allProjects: Project[] = [...mockProjects];

// Global refresh callbacks
let refreshCallbacks: (() => void)[] = [];

export const addRefreshCallback = (callback: () => void) => {
  refreshCallbacks.push(callback);
};

export const removeRefreshCallback = (callback: () => void) => {
  refreshCallbacks = refreshCallbacks.filter(cb => cb !== callback);
};

const triggerRefresh = () => {
  refreshCallbacks.forEach(callback => callback());
};

export const addProject = (project: Project) => {
  allProjects.push(project);
  triggerRefresh();
};

export const getAllProjects = () => allProjects;

export const getLiveProjects = () => allProjects.filter(p => p.status === 'Live');

// Sector management
let projectSectors = ['Commercial', 'Residential', 'Industrial', 'Healthcare', 'Education', 'Life Sciences', 'Mixed Use'];

export const getProjectSectors = () => projectSectors;

export const addProjectSector = (sector: string) => {
  if (!projectSectors.includes(sector)) {
    projectSectors.push(sector);
  }
};

export const updateProjectPrimaryOption = (projectId: string, optionId: string) => {
  const project = allProjects.find(p => p.id === projectId);
  if (project) {
    project.primaryOptionId = optionId;
  }
};

export const updateProject = (projectId: string, updates: Partial<Project>) => {
  const projectIndex = allProjects.findIndex(p => p.id === projectId);
  if (projectIndex !== -1) {
    allProjects[projectIndex] = { ...allProjects[projectIndex], ...updates };
    triggerRefresh();
    return allProjects[projectIndex];
  }
  return null;
};

// Calculate dashboard metrics from primary options
export const calculateDashboardMetrics = () => {
  const liveProjects = getLiveProjects();
  
  const totalProjects = liveProjects.length;
  
  let totalCarbon = 0;
  let totalCarbonSaved = 0;
  
  liveProjects.forEach(project => {
    const primaryOption = project.options.find(opt => opt.id === project.primaryOptionId);
    if (primaryOption) {
      totalCarbon += primaryOption.carbon;
      // Calculate saved carbon as 15% of total (mock calculation)
      totalCarbonSaved += Math.floor(primaryOption.carbon * 0.15);
    }
  });
  
  const averageCarbon = totalProjects > 0 ? Math.floor(totalCarbon / totalProjects) : 0;
  
  return {
    totalProjects,
    totalCarbon,
    carbonSaved: totalCarbonSaved,
    averageCarbon,
  };
};