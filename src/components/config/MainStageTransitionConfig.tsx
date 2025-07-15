import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Settings, Save } from "lucide-react";
import { Feature, StageTransition, Step } from "@/types/features";
import { FeatureSelector } from "./FeatureSelector";
import { StepsConfiguration } from "./StepsConfiguration";
import { SaveConfirmationDialog } from "./SaveConfirmationDialog";
import { useToast } from "@/hooks/use-toast";

interface MainStageTransitionConfigProps {
  isOpen: boolean;
  onClose: () => void;
  transition: StageTransition | null;
  availableFeatures: Feature[];
  onSave: (transition: StageTransition) => void;
}

export const MainStageTransitionConfig = ({
  isOpen,
  onClose,
  transition,
  availableFeatures,
  onSave
}: MainStageTransitionConfigProps) => {
  const { toast } = useToast();
  const [selectedFeatures, setSelectedFeatures] = useState<Feature[]>([]);
  const [steps, setSteps] = useState<Step[]>([]);
  const [expandedSteps, setExpandedSteps] = useState<string[]>(['step-1']);
  const [draggedFeature, setDraggedFeature] = useState<Feature | null>(null);
  const [dragOverZone, setDragOverZone] = useState<string | null>(null);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Initialize state when dialog opens
  useEffect(() => {
    if (isOpen && transition) {
      const isConfigured = transition.stageConfig?.isConfigured || false;
      
      setSelectedFeatures(isConfigured ? (transition.features || []) : []);
      setSteps(isConfigured && transition.stageConfig?.steps?.length > 0 
        ? transition.stageConfig.steps 
        : [{ 
            id: 'step-1', 
            name: 'Step 1', 
            order: 1, 
            features: [], 
            executionType: 'required'
          }]
      );
      setExpandedSteps(['step-1']);
      setHasUnsavedChanges(false);
    }
  }, [isOpen, transition]);

  // Track changes
  useEffect(() => {
    if (transition) {
      const isConfigured = transition.stageConfig?.isConfigured || false;
      const originalFeatures = isConfigured ? (transition.features || []) : [];
      const originalSteps = isConfigured && transition.stageConfig?.steps?.length > 0 
        ? transition.stageConfig.steps 
        : [];

      const featuresChanged = selectedFeatures.length !== originalFeatures.length ||
        selectedFeatures.some(f => !originalFeatures.find(of => of.id === f.id));
      
      const stepsChanged = steps.length !== originalSteps.length ||
        steps.some(s => {
          const originalStep = originalSteps.find(os => os.id === s.id);
          return !originalStep || 
            s.executionType !== originalStep.executionType ||
            s.features.length !== originalStep.features.length ||
            s.features.some(f => !originalStep.features.includes(f));
        });

      setHasUnsavedChanges(featuresChanged || stepsChanged);
    }
  }, [selectedFeatures, steps, transition]);

  const handleFeatureToggle = (feature: Feature) => {
    const isSelected = selectedFeatures.some(f => f.id === feature.id);
    
    if (isSelected) {
      setSelectedFeatures(selectedFeatures.filter(f => f.id !== feature.id));
      // Remove from all steps when deselected
      setSteps(prevSteps => 
        prevSteps.map(step => ({
          ...step,
          features: step.features.filter(id => id !== feature.id)
        }))
      );
    } else {
      setSelectedFeatures([...selectedFeatures, feature]);
      // Auto-add to first available step
      autoAddFeatureToStep(feature);
    }
  };

  const autoAddFeatureToStep = (feature: Feature) => {
    const availableStep = steps.find(step => canAddToStep(step.id));
    
    if (availableStep) {
      setSteps(prevSteps => 
        prevSteps.map(step => {
          if (step.id === availableStep.id) {
            return {
              ...step,
              features: [...step.features, feature.id]
            };
          }
          return step;
        })
      );
    }
  };

  const canAddToStep = (stepId: string) => {
    const step = steps.find(s => s.id === stepId);
    if (!step) return false;

    const currentFeatures = step.features;

    switch (step.executionType) {
      case 'required':
        return currentFeatures.length < 1;
      case 'parallel':
        return true;
      default:
        return false;
    }
  };

  const handleDragStart = (e: React.DragEvent, feature: Feature) => {
    setDraggedFeature(feature);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('application/json', JSON.stringify(feature));
  };

  const handleDragEnd = () => {
    setDraggedFeature(null);
    setDragOverZone(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDragEnter = (e: React.DragEvent, zone: string) => {
    e.preventDefault();
    setDragOverZone(zone);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;
    
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      setDragOverZone(null);
    }
  };

  const handleDropOnStep = (e: React.DragEvent, stepId: string) => {
    e.preventDefault();
    
    const featureData = e.dataTransfer.getData('application/json');
    let feature: Feature | null = null;
    
    try {
      if (featureData) {
        feature = JSON.parse(featureData);
      } else if (draggedFeature) {
        feature = draggedFeature;
      }
    } catch (error) {
      feature = draggedFeature;
    }
    
    if (feature && canAddToStep(stepId)) {
      // Add to selected features if not already selected
      if (!selectedFeatures.some(f => f.id === feature.id)) {
        setSelectedFeatures(prev => [...prev, feature!]);
      }
      
      // Remove feature from all steps first, then add to target step
      setSteps(prevSteps => {
        const stepsWithoutFeature = prevSteps.map(step => ({
          ...step,
          features: step.features.filter(id => id !== feature!.id)
        }));
        
        const updatedSteps = stepsWithoutFeature.map(step => {
          if (step.id === stepId) {
            const currentFeatureCount = step.features.length;
            const canAdd = step.executionType === 'parallel' || currentFeatureCount === 0;
            
            if (canAdd) {
              return {
                ...step,
                features: [...step.features, feature!.id]
              };
            }
          }
          return step;
        });
        return updatedSteps;
      });
    }
    setDraggedFeature(null);
    setDragOverZone(null);
  };

  const addStep = () => {
    const newStepNumber = steps.length + 1;
    const newStep: Step = {
      id: `step-${newStepNumber}`,
      name: `Step ${newStepNumber}`,
      order: newStepNumber,
      features: [],
      executionType: 'required'
    };
    setSteps([...steps, newStep]);
    setExpandedSteps([...expandedSteps, newStep.id]);
  };

  const removeStep = (stepId: string) => {
    if (steps.length > 1) {
      setSteps(steps.filter(step => step.id !== stepId));
      setExpandedSteps(expandedSteps.filter(id => id !== stepId));
    }
  };

  const toggleStepExpansion = (stepId: string) => {
    setExpandedSteps(prev => 
      prev.includes(stepId) 
        ? prev.filter(id => id !== stepId)
        : [...prev, stepId]
    );
  };

  const updateStepExecutionType = (stepId: string, executionType: 'required' | 'parallel') => {
    setSteps(prevSteps =>
      prevSteps.map(step => {
        if (step.id === stepId) {
          return {
            ...step,
            executionType,
            features: [],
          };
        }
        return step;
      })
    );
  };

  const moveFeaturePriority = (stepId: string, featureId: string, direction: 'up' | 'down') => {
    setSteps(prevSteps => 
      prevSteps.map(step => {
        if (step.id === stepId) {
          const featureArray = [...step.features];
          const currentIndex = featureArray.indexOf(featureId);
          if (currentIndex === -1) return step;
          
          const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
          if (newIndex < 0 || newIndex >= featureArray.length) return step;
          
          [featureArray[currentIndex], featureArray[newIndex]] = [featureArray[newIndex], featureArray[currentIndex]];
          
          return {
            ...step,
            features: featureArray
          };
        }
        return step;
      })
    );
  };

  const removeFeatureFromStep = (stepId: string, featureId: string) => {
    setSteps(prevSteps => 
      prevSteps.map(step => {
        if (step.id === stepId) {
          return {
            ...step,
            features: step.features.filter(id => id !== featureId)
          };
        }
        return step;
      })
    );
  };

  const handleSaveConfiguration = () => {
    if (transition) {
      onSave({
        ...transition,
        features: selectedFeatures,
        stageConfig: {
          id: transition.id,
          name: `${transition.fromStage} → ${transition.toStage}`,
          steps: steps,
          isConfigured: true
        }
      });
      setHasUnsavedChanges(false);
      toast({
        title: "Configuration Saved",
        description: `Settings for ${transition.fromStage} → ${transition.toStage} have been saved successfully.`,
      });
    }
    onClose();
  };

  const handleClose = () => {
    if (hasUnsavedChanges) {
      setShowSaveDialog(true);
    } else {
      onClose();
    }
  };

  const handleDiscardChanges = () => {
    setShowSaveDialog(false);
    onClose();
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-7xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Settings className="h-5 w-5" />
                <span>Configure Stage Transition: {transition?.fromStage} → {transition?.toStage}</span>
              </div>
              <Button 
                onClick={handleSaveConfiguration}
                className="flex items-center space-x-2"
                disabled={!hasUnsavedChanges}
              >
                <Save className="h-4 w-4" />
                <span>Save Configuration</span>
              </Button>
            </DialogTitle>
          </DialogHeader>

          <div className="flex space-x-6 h-full overflow-hidden">
            <FeatureSelector
              availableFeatures={availableFeatures}
              selectedFeatures={selectedFeatures}
              onFeatureToggle={handleFeatureToggle}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            />

            <StepsConfiguration
              steps={steps}
              availableFeatures={availableFeatures}
              expandedSteps={expandedSteps}
              draggedFeature={draggedFeature}
              dragOverZone={dragOverZone}
              onAddStep={addStep}
              onRemoveStep={removeStep}
              onToggleStepExpansion={toggleStepExpansion}
              onUpdateStepExecutionType={updateStepExecutionType}
              onMoveFeaturePriority={moveFeaturePriority}
              onRemoveFeatureFromStep={removeFeatureFromStep}
              onDropOnStep={handleDropOnStep}
              onDragOver={handleDragOver}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              canAddToStep={canAddToStep}
            />
          </div>
        </DialogContent>
      </Dialog>

      <SaveConfirmationDialog
        isOpen={showSaveDialog}
        onSave={handleSaveConfiguration}
        onDiscard={handleDiscardChanges}
        onCancel={() => setShowSaveDialog(false)}
        transitionName={transition ? `${transition.fromStage} → ${transition.toStage}` : ""}
      />
    </>
  );
};
