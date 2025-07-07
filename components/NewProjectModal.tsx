'use client';

import { useState } from 'react';
import { X, Upload, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getProjectSectors, addProjectSector } from '@/lib/projectData';

interface NewProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (projectData: NewProjectData) => void;
}

export interface NewProjectData {
  name: string;
  gia: number; // Gross Internal Area
  nia: number; // Net Internal Area
  gea: number; // Gross External Area
  sector: string;
  thumbnail?: File;
}

export default function NewProjectModal({ isOpen, onClose, onSubmit }: NewProjectModalProps) {
  const [formData, setFormData] = useState<NewProjectData>({
    name: '',
    gia: 0,
    nia: 0,
    gea: 0,
    sector: '',
  });
  
  const [sectors, setSectors] = useState(getProjectSectors());
  const [newSector, setNewSector] = useState('');
  const [showNewSectorInput, setShowNewSectorInput] = useState(false);

  const [errors, setErrors] = useState<Partial<Record<keyof NewProjectData, string>>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    const newErrors: Partial<Record<keyof NewProjectData, string>> = {};
    if (!formData.name.trim()) newErrors.name = 'Project name is required';
    if (!formData.sector.trim()) newErrors.sector = 'Sector is required';
    if (!formData.thumbnail) newErrors.thumbnail = 'Thumbnail image is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSubmit(formData);
    
    // Reset form
    setFormData({
      name: '',
      gia: 0,
      nia: 0,
      gea: 0,
      sector: '',
    });
    setErrors({});
    setShowNewSectorInput(false);
    setNewSector('');
  };

  const handleChange = (field: keyof NewProjectData, value: string | number | File) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleChange('thumbnail', file);
    }
  };

  const handleAddNewSector = () => {
    if (newSector.trim()) {
      addProjectSector(newSector.trim());
      setSectors(getProjectSectors());
      setFormData(prev => ({ ...prev, sector: newSector.trim() }));
      setNewSector('');
      setShowNewSectorInput(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50" 
        onClick={onClose}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            onClose();
          }
        }}
        role="button"
        tabIndex={0}
        aria-label="Close modal"
      />
      
      {/* Modal */}
      <div className="relative bg-background rounded-lg border shadow-lg w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-xl font-semibold">New Project</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-accent rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Project Name */}
          <div>
            <label htmlFor="projectName" className="block text-sm font-medium mb-2">
              Project Name *
            </label>
            <input
              id="projectName"
              type="text"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              className={cn(
                'w-full px-3 py-2 border rounded-md text-sm bg-background focus:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                errors.name ? 'border-destructive' : 'border-input'
              )}
              placeholder="e.g. Office Building Renovation"
            />
            {errors.name && <p className="text-xs text-destructive mt-1">{errors.name}</p>}
          </div>

          {/* Thumbnail Upload */}
          <div>
            <label htmlFor="thumbnail" className="block text-sm font-medium mb-2">
              Thumbnail Image *
            </label>
            <div className="relative">
              <input
                id="thumbnail"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              <label
                htmlFor="thumbnail"
                className={cn(
                  'flex items-center justify-center w-full h-32 border-2 border-dashed rounded-md cursor-pointer transition-colors',
                  errors.thumbnail ? 'border-destructive' : 'border-input hover:border-primary'
                )}
              >
                {formData.thumbnail ? (
                  <div className="text-center">
                    <Upload className="w-6 h-6 text-green-600 mx-auto mb-2" />
                    <span className="text-sm text-green-600">{formData.thumbnail.name}</span>
                  </div>
                ) : (
                  <div className="text-center">
                    <Upload className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
                    <span className="text-sm text-muted-foreground">Click to upload thumbnail</span>
                  </div>
                )}
              </label>
            </div>
            {errors.thumbnail && <p className="text-xs text-destructive mt-1">{errors.thumbnail}</p>}
          </div>

          {/* Sector Selection */}
          <div>
            <label htmlFor="sector" className="block text-sm font-medium mb-2">
              Sector *
            </label>
            <div className="flex gap-2">
              <select
                id="sector"
                value={formData.sector}
                onChange={(e) => handleChange('sector', e.target.value)}
                className={cn(
                  'flex-1 px-3 py-2 border rounded-md text-sm bg-background focus:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                  errors.sector ? 'border-destructive' : 'border-input'
                )}
              >
                <option value="">Select a sector</option>
                {sectors.map((sector) => (
                  <option key={sector} value={sector}>
                    {sector}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setShowNewSectorInput(true)}
                className="px-3 py-2 border border-input rounded-md hover:bg-accent transition-colors"
                title="Add new sector"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            {showNewSectorInput && (
              <div className="flex gap-2 mt-2">
                <input
                  type="text"
                  value={newSector}
                  onChange={(e) => setNewSector(e.target.value)}
                  placeholder="Enter new sector"
                  className="flex-1 px-3 py-2 border border-input rounded-md text-sm bg-background focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddNewSector();
                    }
                    if (e.key === 'Escape') {
                      setShowNewSectorInput(false);
                      setNewSector('');
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={handleAddNewSector}
                  className="px-3 py-2 bg-primary text-primary-foreground rounded-md text-sm hover:bg-primary/90 transition-colors"
                >
                  Add
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowNewSectorInput(false);
                    setNewSector('');
                  }}
                  className="px-3 py-2 border border-input rounded-md text-sm hover:bg-accent transition-colors"
                >
                  Cancel
                </button>
              </div>
            )}
            {errors.sector && <p className="text-xs text-destructive mt-1">{errors.sector}</p>}
          </div>

          {/* Area Fields */}
          <div className="grid grid-cols-1 gap-4">
            {/* Gross Internal Area */}
            <div>
              <label htmlFor="gia" className="block text-sm font-medium mb-2">
                Gross Internal Area <span className="text-muted-foreground">m²</span>
              </label>
              <input
                id="gia"
                type="number"
                min="1"
                value={formData.gia || ''}
                onChange={(e) => handleChange('gia', parseFloat(e.target.value) || 0)}
                className={cn(
                  'w-full px-3 py-2 border rounded-md text-sm bg-background focus:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                  errors.gia ? 'border-destructive' : 'border-input'
                )}
                placeholder="12500"
              />
              {errors.gia && <p className="text-xs text-destructive mt-1">{errors.gia}</p>}
            </div>

            {/* Net Internal Area */}
            <div>
              <label htmlFor="nia" className="block text-sm font-medium mb-2">
                Net Internal Area <span className="text-muted-foreground">m²</span>
              </label>
              <input
                id="nia"
                type="number"
                min="1"
                value={formData.nia || ''}
                onChange={(e) => handleChange('nia', parseFloat(e.target.value) || 0)}
                className={cn(
                  'w-full px-3 py-2 border rounded-md text-sm bg-background focus:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                  errors.nia ? 'border-destructive' : 'border-input'
                )}
                placeholder="10800"
              />
              {errors.nia && <p className="text-xs text-destructive mt-1">{errors.nia}</p>}
            </div>

            {/* Gross External Area */}
            <div>
              <label htmlFor="gea" className="block text-sm font-medium mb-2">
                Gross External Area <span className="text-muted-foreground">m²</span>
              </label>
              <input
                id="gea"
                type="number"
                min="1"
                value={formData.gea || ''}
                onChange={(e) => handleChange('gea', parseFloat(e.target.value) || 0)}
                className={cn(
                  'w-full px-3 py-2 border rounded-md text-sm bg-background focus:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                  errors.gea ? 'border-destructive' : 'border-input'
                )}
                placeholder="15200"
              />
              {errors.gea && <p className="text-xs text-destructive mt-1">{errors.gea}</p>}
            </div>
          </div>

          {/* Help Text */}
          <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-md">
            <p className="font-medium mb-1">Area Guidelines:</p>
            <ul className="space-y-1">
              <li>• <strong>Gross Internal Area:</strong> Total floor area within external walls</li>
              <li>• <strong>Net Internal Area:</strong> Usable floor area (excludes cores, ducts)</li>
              <li>• <strong>Gross External Area:</strong> Total area including external walls</li>
            </ul>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-input rounded-md text-sm hover:bg-accent transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm hover:bg-primary/90 transition-colors"
            >
              Create Project
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}