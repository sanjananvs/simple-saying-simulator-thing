
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { StepManager } from "./StepManager";
import { Step, Feature } from "@/types/features";

interface StepsConfigurationProps {
  steps: Step[];
  availableFeatures: Feature[];
  expandedSteps: string[];
  draggedFeature: Feature | null;
  dragOverZone: string | null;
  onAddStep: () => void;
  onRemoveStep: (stepId: string) => void;
  onToggleStepExpansion: (stepId: string) => void;
  onUpdateStepExecutionType: (stepId: string, executionType: 'required' | 'parallel') => void;
  onMoveFeaturePriority: (stepId: string, featureId: string, direction: 'up' | 'down') => void;
  onRemoveFeatureFromStep: (stepId: string, featureId: string) => void;
  onDropOnStep: (e: React.DragEvent, stepId: string) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragEnter: (e: React.DragEvent, zone: string) => void;
  onDragLeave: (e: React.DragEvent) => void;
  canAddToStep: (stepId: string) => boolean;
}

export const StepsConfiguration = ({
  steps,
  availableFeatures,
  expandedSteps,
  draggedFeature,
  dragOverZone,
  onAddStep,
  onRemoveStep,
  onToggleStepExpansion,
  onUpdateStepExecutionType,
  onMoveFeaturePriority,
  onRemoveFeatureFromStep,
  onDropOnStep,
  onDragOver,
  onDragEnter,
  onDragLeave,
  canAddToStep
}: StepsConfigurationProps) => {
  const getFeaturesByStep = (stepId: string) => {
    const step = steps.find(s => s.id === stepId);
    if (!step) return [];
    
    const features = step.features.map(id => availableFeatures.find(f => f.id === id)).filter(Boolean) as Feature[];
    return features;
  };

  return (
    <div className="flex-1 overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium text-gray-800">Configure Steps</h3>
        <Button onClick={onAddStep} size="sm" variant="outline">
          <Plus className="h-4 w-4 mr-2" />
          Add Step
        </Button>
      </div>

      <ScrollArea className="h-[560px]">
        <div className="space-y-4 pr-4">
          {steps.map((step) => {
            const stepFeatures = getFeaturesByStep(step.id);
            const isDragOver = dragOverZone === step.id;
            const canDrop = draggedFeature ? canAddToStep(step.id) : true;

            return (
              <StepManager
                key={step.id}
                step={step}
                stepFeatures={stepFeatures}
                isExpanded={expandedSteps.includes(step.id)}
                canRemove={steps.length > 1}
                onToggleExpansion={() => onToggleStepExpansion(step.id)}
                onRemoveStep={() => onRemoveStep(step.id)}
                onUpdateExecutionType={(executionType) => onUpdateStepExecutionType(step.id, executionType)}
                onMoveFeaturePriority={(featureId, direction) => onMoveFeaturePriority(step.id, featureId, direction)}
                onRemoveFeature={(featureId) => onRemoveFeatureFromStep(step.id, featureId)}
                onDrop={(e) => onDropOnStep(e, step.id)}
                onDragOver={onDragOver}
                onDragEnter={(e) => onDragEnter(e, step.id)}
                onDragLeave={onDragLeave}
                isDragOver={isDragOver}
                canDrop={canDrop}
              />
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
};
