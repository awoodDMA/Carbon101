// Relational database structure as suggested
// Separate projects and options with foreign key relationships

export interface Project {
  id: string;
  name: string;
  projectNumber: string;
  gia: number;
  nia: number;
  gea: number;
  status: 'Live' | 'Completed' | 'Review';
  sector: string;
  thumbnail?: string;
  primaryOptionId: string;
}

export interface DesignOption {
  id: string;
  projectId: string; // Foreign key to Project
  optionLetter: string; // A, B, C, etc.
  name: string;
  carbon: number;
  systems: System[];
  systemsData: SystemData[];
  productsData: ProductData[];
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

// Storage key for localStorage
const STORAGE_KEY = 'carbon101-design-options';

// Default data
const getDefaultOptions = (): DesignOption[] => [
  // Project 1 Options
  {
    id: 'p1-a',
    projectId: 'p1',
    optionLetter: 'A',
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
    id: 'p1-b',
    projectId: 'p1',
    optionLetter: 'B',
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
    id: 'p1-c',
    projectId: 'p1',
    optionLetter: 'C',
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
    metadata: {
      description: 'Sustainable timber frame construction with natural materials',
      lastModified: '2024-01-13T11:20:00Z',
      modifiedBy: 'Alex Johnson',
      version: 1,
      takeoffMethod: 'Manual',
      calculationStatus: 'Draft'
    }
  },
  // Project 2 Options  
  {
    id: 'p2-a',
    projectId: 'p2',
    optionLetter: 'A',
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
    id: 'p2-b',
    projectId: 'p2',
    optionLetter: 'B',
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
    metadata: {
      description: 'Energy-efficient residential design with modern systems',
      lastModified: '2024-01-11T16:45:00Z',
      modifiedBy: 'Michael Chen',
      version: 2,
      takeoffMethod: 'BIM 360/ACC',
      calculationStatus: 'Review'
    }
  }
];

// Initialize data with localStorage support
const initializeData = (): DesignOption[] => {
  if (typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        console.log('💾 Loaded data from localStorage:', parsed.length, 'options');
        return parsed;
      }
    } catch (error) {
      console.error('Failed to parse saved data:', error);
    }
  }
  console.log('💾 Using default data');
  return getDefaultOptions();
};

// Save data to localStorage
const saveData = (options: DesignOption[]) => {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(options));
      console.log('💾 Data saved to localStorage:', options.length, 'options');
    } catch (error) {
      console.error('Failed to save data to localStorage:', error);
    }
  }
};

// Separate data stores
let projects: Project[] = [
  {
    id: 'p1',
    name: 'Office Building Renovation',
    projectNumber: '001',
    gia: 12500,
    nia: 10800,
    gea: 15200,
    status: 'Live',
    sector: 'Commercial',
    primaryOptionId: 'p1-a'
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
    primaryOptionId: 'p2-a'
  }
];

let designOptions: DesignOption[] = initializeData();

// Function to reload data from localStorage
export const reloadDataFromStorage = (): void => {
  console.log('🔄 Reloading data from localStorage...');
  designOptions = initializeData();
  console.log('🔄 Reloaded', designOptions.length, 'options from storage');
};

// Relational query functions
export const getProjectById = (projectId: string): Project | undefined => {
  return projects.find(p => p.id === projectId);
};

export const getOptionsByProjectId = (projectId: string): DesignOption[] => {
  return designOptions.filter(o => o.projectId === projectId);
};

export const getOptionByProjectAndLetter = (projectId: string, optionLetter: string): DesignOption | undefined => {
  const option = designOptions.find(o => o.projectId === projectId && o.optionLetter === optionLetter);
  console.log('🔍 getOptionByProjectAndLetter called:', { 
    projectId, 
    optionLetter, 
    foundOption: option?.name, 
    linkedModel: option?.linkedModel?.name || 'undefined',
    linkedModelStatus: option?.linkedModel?.status || 'undefined',
    linkedModelUrn: option?.linkedModel?.viewerUrn || 'undefined'
  });
  return option;
};

export const getAllProjects = (): Project[] => {
  return projects;
};

// Update functions for modifying data
export const updateOptionLinkedModel = (projectId: string, optionLetter: string, linkedModel: APSModelAssignment | null | undefined): boolean => {
  console.log('🔧 updateOptionLinkedModel called:', { 
    projectId, 
    optionLetter, 
    linkedModel: linkedModel ? {
      name: linkedModel.name,
      status: linkedModel.status,
      viewerUrn: linkedModel.viewerUrn
    } : null
  });
  
  console.log('🔧 Current designOptions array length:', designOptions.length);
  console.log('🔧 Looking for option with projectId:', projectId, 'optionLetter:', optionLetter);
  
  // Debug: list all available options
  designOptions.forEach((opt, idx) => {
    console.log(`🔧 Option ${idx}:`, {
      id: opt.id,
      projectId: opt.projectId,
      optionLetter: opt.optionLetter,
      name: opt.name,
      hasLinkedModel: !!opt.linkedModel
    });
  });
  
  const optionIndex = designOptions.findIndex(o => o.projectId === projectId && o.optionLetter === optionLetter);
  console.log('🔧 Found option at index:', optionIndex);
  
  if (optionIndex === -1) {
    console.log('❌ Option not found for update');
    return false;
  }
  
  console.log('🔧 Before update - linkedModel:', designOptions[optionIndex].linkedModel?.name || 'undefined');
  
  designOptions[optionIndex] = {
    ...designOptions[optionIndex],
    linkedModel: linkedModel || undefined,
    metadata: {
      ...designOptions[optionIndex].metadata,
      lastModified: new Date().toISOString(),
      modifiedBy: 'System'
    }
  };
  
  console.log('✅ After update - linkedModel:', designOptions[optionIndex].linkedModel?.name);
  console.log('✅ After update - linkedModel status:', designOptions[optionIndex].linkedModel?.status);
  console.log('✅ After update - linkedModel URN:', designOptions[optionIndex].linkedModel?.viewerUrn);
  
  // Save to localStorage immediately
  saveData(designOptions);
  
  return true;
};

export const updateOptionApsModels = (projectId: string, optionLetter: string, apsModels: APSModelAssignment[]): boolean => {
  const optionIndex = designOptions.findIndex(o => o.projectId === projectId && o.optionLetter === optionLetter);
  
  if (optionIndex === -1) {
    return false;
  }
  
  // For now, store the first model as linkedModel (maintaining compatibility)
  const linkedModel = apsModels.length > 0 ? apsModels[0] : undefined;
  
  designOptions[optionIndex] = {
    ...designOptions[optionIndex],
    linkedModel,
    metadata: {
      ...designOptions[optionIndex].metadata,
      lastModified: new Date().toISOString(),
      modifiedBy: 'System'
    }
  };
  
  // Save to localStorage immediately
  saveData(designOptions);
  
  return true;
};

// Convert to old format for compatibility with existing components
export const getProjectWithOptions = (projectId: string) => {
  const project = getProjectById(projectId);
  if (!project) return null;
  
  const options = getOptionsByProjectId(projectId);
  
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
};