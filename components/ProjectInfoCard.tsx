'use client';

import { useState, useEffect } from 'react';
import { X, Edit, Save, Upload, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { type Project } from '@/lib/projectData';
import { getProjectSectors, addProjectSector } from '@/lib/projectData';

interface ProjectInfoCardProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
  onUpdate: (updatedProject: Partial<Project>) => void;
}

export default function ProjectInfoCard({ isOpen, onClose, project, onUpdate }: ProjectInfoCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    name: project.name,
    projectNumber: project.projectNumber,
    sector: project.sector,
    status: project.status,
    gia: project.gia,
    nia: project.nia,
    gea: project.gea,
    thumbnail: undefined as File | undefined,
    thumbnailPreview: undefined as string | undefined,
  });
  
  const [sectors, setSectors] = useState(getProjectSectors());
  const [newSector, setNewSector] = useState('');
  const [showNewSectorInput, setShowNewSectorInput] = useState(false);

  const handleSave = () => {
    const updates: Partial<Project> = {
      name: editData.name,
      projectNumber: editData.projectNumber,
      sector: editData.sector,
      status: editData.status,
      gia: editData.gia,
      nia: editData.nia,
      gea: editData.gea,
    };

    if (editData.thumbnail) {
      updates.thumbnail = URL.createObjectURL(editData.thumbnail);
    }

    onUpdate(updates);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditData({
      name: project.name,
      projectNumber: project.projectNumber,
      sector: project.sector,
      status: project.status,
      gia: project.gia,
      nia: project.nia,
      gea: project.gea,
      thumbnail: undefined,
      thumbnailPreview: undefined,
    });
    setIsEditing(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const previewUrl = URL.createObjectURL(file);
      setEditData(prev => ({ ...prev, thumbnail: file, thumbnailPreview: previewUrl }));
    }
  };

  const handleAddNewSector = () => {
    if (newSector.trim()) {
      addProjectSector(newSector.trim());
      setSectors(getProjectSectors());
      setEditData(prev => ({ ...prev, sector: newSector.trim() }));
      setNewSector('');
      setShowNewSectorInput(false);
    }
  };

  // Cleanup thumbnail preview URL when component unmounts or editing is cancelled
  useEffect(() => {
    return () => {
      if (editData.thumbnailPreview) {
        URL.revokeObjectURL(editData.thumbnailPreview);
      }
    };
  }, [editData.thumbnailPreview]);

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
      
      {/* Card */}
      <div className="relative bg-background rounded-lg border shadow-lg w-full max-w-lg mx-4">
        {/* Header */}
        <div className="p-6 border-b border-border">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              {/* Project Information title - smaller and less prominent */}
              <div className="text-xs text-muted-foreground mb-3">Project Information</div>
              
              {/* Project Number - primary focus */}
              <div className="mb-2">
                {isEditing ? (
                  <input
                    type="text"
                    value={editData.projectNumber}
                    onChange={(e) => setEditData(prev => ({ ...prev, projectNumber: e.target.value }))}
                    className="text-3xl font-black text-orange-600 bg-background border border-input rounded px-2 py-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    style={{ fontFamily: 'Roboto Black, sans-serif' }}
                    placeholder="000"
                  />
                ) : (
                  <div className="text-3xl font-black text-orange-600" style={{ fontFamily: 'Roboto Black, sans-serif' }}>
                    {project.projectNumber}
                  </div>
                )}
              </div>
              
              {/* Project Name - secondary under project number */}
              <div>
                {isEditing ? (
                  <input
                    type="text"
                    value={editData.name}
                    onChange={(e) => setEditData(prev => ({ ...prev, name: e.target.value }))}
                    className="text-lg font-medium text-carbon-black bg-background border border-input rounded px-2 py-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary w-full"
                  />
                ) : (
                  <div className="text-lg font-medium text-carbon-black">{project.name}</div>
                )}
              </div>
            </div>
            
            {/* Action buttons */}
            <div className="flex items-center gap-2 ml-4">
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="p-2 hover:bg-accent rounded-md transition-colors text-muted-foreground hover:text-foreground"
                  title="Edit project information"
                >
                  <Edit className="w-4 h-4" />
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={handleSave}
                    className="px-3 py-1 bg-primary text-primary-foreground rounded-md text-sm hover:bg-primary/90 transition-colors"
                  >
                    <Save className="w-3 h-3 mr-1 inline" />
                    Save
                  </button>
                  <button
                    onClick={handleCancel}
                    className="px-3 py-1 border border-input rounded-md text-sm hover:bg-accent transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              )}
              <button
                onClick={onClose}
                className="p-1 hover:bg-accent rounded-md transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Cover Image */}
          <div>
            {isEditing ? (
              <div className="relative">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                  id="thumbnail-edit"
                />
                <label
                  htmlFor="thumbnail-edit"
                  className="flex items-center justify-center w-full h-32 border-2 border-dashed border-input hover:border-primary rounded-lg cursor-pointer transition-colors"
                >
                  {editData.thumbnailPreview ? (
                    <div className="text-center">
                      <img
                        src={editData.thumbnailPreview}
                        alt="New thumbnail preview"
                        className="max-h-24 mx-auto rounded-lg mb-2"
                      />
                      <span className="text-sm text-green-600">{editData.thumbnail?.name}</span>
                    </div>
                  ) : project.thumbnail ? (
                    <div className="text-center">
                      <div className="text-sm text-muted-foreground mb-2">Click to change thumbnail</div>
                      <img
                        src={project.thumbnail}
                        alt="Current thumbnail"
                        className="max-h-20 mx-auto rounded-lg opacity-50"
                      />
                    </div>
                  ) : (
                    <div className="text-center">
                      <Upload className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
                      <span className="text-sm text-muted-foreground">Click to upload thumbnail</span>
                    </div>
                  )}
                </label>
              </div>
            ) : (
              <div className="w-full h-32 bg-muted rounded-lg flex items-center justify-center overflow-hidden">
                {project.thumbnail ? (
                  <img
                    src={project.thumbnail}
                    alt="Project thumbnail"
                    className="w-full h-full object-cover rounded-lg"
                  />
                ) : (
                  <div className="text-center text-muted-foreground">
                    <div className="w-12 h-12 border-2 border-dashed border-muted-foreground/30 rounded-lg flex items-center justify-center mx-auto mb-2">
                      <div className="w-6 h-6 bg-muted-foreground/20 rounded" />
                    </div>
                    <span className="text-sm">No thumbnail</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Status - moved below cover image */}
          <div>
            <div className="block text-sm font-medium mb-2 text-carbon-black">Status</div>
            {isEditing ? (
              <select
                value={editData.status}
                onChange={(e) => setEditData(prev => ({ ...prev, status: e.target.value as 'Live' | 'Completed' | 'Review' }))}
                className="px-3 py-2 border border-input rounded-md text-sm bg-background focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <option value="Live">Live</option>
                <option value="Review">Review</option>
                <option value="Completed">Completed</option>
              </select>
            ) : (
              <span
                className={cn(
                  'inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border',
                  project.status === 'Live' && 'bg-orange-100 text-orange-800 border-orange-200',
                  project.status === 'Review' && 'bg-blue-100 text-blue-800 border-blue-200',
                  project.status === 'Completed' && 'bg-green-100 text-green-800 border-green-200'
                )}
              >
                {project.status}
              </span>
            )}
          </div>

          {/* Sector */}
          <div>
            <div className="block text-sm font-medium mb-2 text-carbon-black">Sector</div>
            {isEditing ? (
              <div>
                <div className="flex gap-2">
                  <select
                    value={editData.sector}
                    onChange={(e) => setEditData(prev => ({ ...prev, sector: e.target.value }))}
                    className="flex-1 px-3 py-2 border border-input rounded-md text-sm bg-background focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
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
              </div>
            ) : (
              <div className="text-sm text-carbon-black">{project.sector}</div>
            )}
          </div>

          {/* Areas */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <div className="block text-xs font-medium mb-1 text-muted-foreground">Gross Internal Area</div>
              {isEditing ? (
                <input
                  type="number"
                  value={editData.gia || ''}
                  onChange={(e) => setEditData(prev => ({ ...prev, gia: parseFloat(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border border-input rounded-md text-sm bg-background focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                />
              ) : (
                <div className="text-sm font-medium text-carbon-black">{project.gia.toLocaleString()} m²</div>
              )}
            </div>
            <div>
              <div className="block text-xs font-medium mb-1 text-muted-foreground">Net Internal Area</div>
              {isEditing ? (
                <input
                  type="number"
                  value={editData.nia || ''}
                  onChange={(e) => setEditData(prev => ({ ...prev, nia: parseFloat(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border border-input rounded-md text-sm bg-background focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                />
              ) : (
                <div className="text-sm font-medium text-carbon-black">{project.nia.toLocaleString()} m²</div>
              )}
            </div>
            <div>
              <div className="block text-xs font-medium mb-1 text-muted-foreground">Gross External Area</div>
              {isEditing ? (
                <input
                  type="number"
                  value={editData.gea || ''}
                  onChange={(e) => setEditData(prev => ({ ...prev, gea: parseFloat(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border border-input rounded-md text-sm bg-background focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                />
              ) : (
                <div className="text-sm font-medium text-carbon-black">{project.gea.toLocaleString()} m²</div>
              )}
            </div>
          </div>

          {/* Options Info */}
          <div className="pt-4 border-t border-border">
            <div>
              <div className="block text-xs font-medium mb-1 text-muted-foreground">Design Options</div>
              <div className="text-sm font-medium text-carbon-black">{project.options.length} options</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}