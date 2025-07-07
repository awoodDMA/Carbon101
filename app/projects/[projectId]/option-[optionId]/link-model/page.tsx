import Link from 'next/link';
import { ArrowLeft, Link2, AlertCircle } from 'lucide-react';
import SimpleModelLinker from '@/components/SimpleModelLinker';
import { getAllProjects, type APSModelAssignment } from '@/lib/projectData';

interface LinkModelPageProps {
  params: { projectId: string; optionId: string }
}

export const dynamic = 'force-dynamic';

export default function LinkModelPage({ params }: LinkModelPageProps) {
  const { projectId, optionId } = params;
  
  // Find the project and option
  const projects = getAllProjects();
  const project = projects.find(p => p.id === projectId) || projects[0];
  const optionLetter = optionId?.toUpperCase() || 'A';
  const currentOption = project.options.find(opt => opt.id === optionLetter) || project.options[0];

  return (
    <div className="container-spacing">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link
            href={`/projects/${projectId}/option-${optionLetter}`}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Option {optionLetter}
          </Link>
          <div className="text-sm text-muted-foreground">›</div>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <Link2 className="w-6 h-6" />
            Link Model to Option {optionLetter}
          </h1>
        </div>

        {/* Project Context */}
        <div className="bg-card border rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-medium">{project.name}</h2>
              <p className="text-sm text-muted-foreground">
                Project {project.projectNumber} • Option {currentOption.id}: {currentOption.name}
              </p>
            </div>
            {currentOption.linkedModel && (
              <div className="text-right">
                <p className="text-sm font-medium">Current Linked Model:</p>
                <p className="text-sm text-muted-foreground">
                  {currentOption.linkedModel.name}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h3 className="font-medium text-blue-900 mb-1">Link a Model from Your ACC Account</h3>
              <p className="text-sm text-blue-800 mb-2">
                Browse your Autodesk Construction Cloud projects and select a model to link to this design option.
              </p>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Only one model can be linked per option</li>
                <li>• Linking a new model will replace any existing model</li>
                <li>• You must have an authenticated ACC account (check Settings if needed)</li>
                <li>• The linked model will appear in the 3D viewer and carbon analysis</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Model Linker */}
        <SimpleModelLinker
          projectId={projectId}
          optionId={optionLetter}
          currentLinkedModel={currentOption.linkedModel}
        />

        {/* Actions */}
        <div className="flex justify-between items-center mt-8 pt-6 border-t">
          <Link
            href={`/projects/${projectId}/option-${optionLetter}`}
            className="flex items-center gap-2 px-4 py-2 border border-input rounded-md text-sm hover:bg-accent transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Cancel
          </Link>
          
          <div className="text-sm text-muted-foreground">
            Changes are saved automatically when you link a model
          </div>
        </div>
      </div>
    </div>
  );
}