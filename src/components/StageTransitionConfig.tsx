import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Plus, Settings, Trash2, GripVertical, ChevronRight, ChevronDown, ArrowUp, ArrowDown, Check } from "lucide-react";
import { Feature, StageTransition, Step } from "@/types/features";

interface StageTransitionConfigProps {
  isOpen: boolean;
  onClose: () => void;
  transition: StageTransition | null;
  availableFeatures: Feature[];
  onSave: (transition: StageTransition) => void;
}

export const StageTransitionConfig = ({
  isOpen,
  onClose,
  transition,
  availableFeatures,
  onSave
}: StageTransitionConfigProps) => {
  // Initialize with empty state for each new transition, ensuring no dependencies
  const [selectedFeatures, setSelectedFeatures] = useState<Feature[]>(() => {
    // Only use existing features if this specific transition has been configured before
    return transition?.stageConfig?.isConfigured ? (transition.features || []) : [];
  });
  
  const [steps, setSteps] = useState<Step[]>(() => {
    // Only use existing steps if this specific transition has been configured before
    if (transition?.stageConfig?.isConfigured && transition.stageConfig.steps?.length > 0) {
      return transition.stageConfig.steps;
    }
    // Otherwise start with one empty step
    return [
      { 
        id: 'step-1', 
        name: 'Step 1', 
        order: 1, 
        features: [], // Always start empty
        executionType: 'required'
      }
    ];
  });
  
  const [expandedSteps, setExpandedSteps] = useState<string[]>(['step-1']);
  const [draggedFeature, setDraggedFeature] = useState<Feature | null>(null);
  const [dragOverZone, setDragOverZone] = useState<string | null>(null);

  const handleFeatureToggle = (feature: Feature) => {
    console.log('Feature toggle clicked:', feature.name);
    const isSelected = selectedFeatures.some(f => f.id === feature.id);
    console.log('Is feature selected:', isSelected);
    
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
      // Auto-add clicked feature to the first available step
      autoAddFeatureToStep(feature);
    }
  };

  const autoAddFeatureToStep = (feature: Feature) => {
    console.log('Auto-adding feature to step:', feature.name);
    // Find the first step that can accept this feature
    const availableStep = steps.find(step => canAddToStep(step.id));
    console.log('Available step found:', availableStep?.id);
    
    if (availableStep) {
      setSteps(prevSteps => 
        prevSteps.map(step => {
          if (step.id === availableStep.id) {
            console.log('Adding feature to step:', step.id, 'feature:', feature.id);
            return {
              ...step,
              features: [...step.features, feature.id]
            };
          }
          return step;
        })
      );
    } else {
      console.log('No available step found for feature:', feature.name);
    }
  };

  const handleDragStart = (e: React.DragEvent, feature: Feature) => {
    console.log('Drag started for feature:', feature.name);
    setDraggedFeature(feature);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('application/json', JSON.stringify(feature));
  };

  const handleDragEnd = () => {
    console.log('Drag ended');
    setDraggedFeature(null);
    setDragOverZone(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDragEnter = (e: React.DragEvent, zone: string) => {
    e.preventDefault();
    console.log('Drag enter zone:', zone);
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

  const canAddToStep = (stepId: string) => {
    const step = steps.find(s => s.id === stepId);
    if (!step) return false;

    const executionType = step.executionType;
    const currentFeatures = step.features;

    switch (executionType) {
      case 'required':
        return currentFeatures.length < 1;
      case 'parallel':
        return true; // No upper limit for parallel
      default:
        return false;
    }
  };

  const handleDropOnStep = (e: React.DragEvent, stepId: string) => {
    e.preventDefault();
    console.log('Drop on step:', stepId);
    
    const featureData = e.dataTransfer.getData('application/json');
    let feature: Feature | null = null;
    
    try {
      if (featureData) {
        feature = JSON.parse(featureData);
        console.log('Feature from drag data:', feature?.name);
      } else if (draggedFeature) {
        feature = draggedFeature;
        console.log('Feature from state:', feature?.name);
      }
    } catch (error) {
      console.error('Error parsing dropped feature data:', error);
      feature = draggedFeature;
    }
    
    if (feature && canAddToStep(stepId)) {
      console.log('Moving feature:', feature.name, 'to step:', stepId);
      
      // Add to selected features if not already selected
      if (!selectedFeatures.some(f => f.id === feature.id)) {
        console.log('Adding feature to selected features');
        setSelectedFeatures(prev => [...prev, feature!]);
      }
      
      // Remove feature from all steps first, then add to target step
      setSteps(prevSteps => {
        console.log('Current steps before update:', prevSteps);
        // First pass: remove feature from all steps
        const stepsWithoutFeature = prevSteps.map(step => ({
          ...step,
          features: step.features.filter(id => id !== feature!.id)
        }));
        
        // Second pass: add feature to target step if possible
        const updatedSteps = stepsWithoutFeature.map(step => {
          if (step.id === stepId) {
            const currentFeatureCount = step.features.length;
            const canAdd = step.executionType === 'parallel' || currentFeatureCount === 0;
            
            if (canAdd) {
              console.log('Adding feature to step:', stepId, 'feature ID:', feature!.id);
              return {
                ...step,
                features: [...step.features, feature!.id]
              };
            }
          }
          return step;
        });
        console.log('Updated steps after drop:', updatedSteps);
        return updatedSteps;
      });
    } else {
      console.log('Cannot add feature to step:', stepId, 'feature:', feature?.name, 'canAddToStep:', canAddToStep(stepId));
    }
    setDraggedFeature(null);
    setDragOverZone(null);
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
          
          // Swap features
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

  const addStep = () => {
    const newStepNumber = steps.length + 1;
    const newStep: Step = {
      id: `step-${newStepNumber}`,
      name: `Step ${newStepNumber}`,
      order: newStepNumber,
      features: [], // Always start empty
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
          // Clear all features when changing execution type to ensure clean state
          return {
            ...step,
            executionType,
            features: [], // Always clear features when changing execution type
          };
        }
        return step;
      })
    );
  };

  const getFeaturesByStep = (stepId: string) => {
    const step = steps.find(s => s.id === stepId);
    if (!step) return [];
    
    console.log('Getting features for step:', stepId, 'feature IDs:', step.features);
    const features = step.features.map(id => availableFeatures.find(f => f.id === id)).filter(Boolean) as Feature[];
    console.log('Resolved features:', features.map(f => f.name));
    return features;
  };

  const handleClose = () => {
    console.log('Closing configuration with steps:', steps);
    
    if (transition) {
      onSave({
        ...transition,
        features: selectedFeatures,
        stageConfig: {
          id: transition.id,
          name: `${transition.fromStage} → ${transition.toStage}`,
          steps: steps,
          isConfigured: true // Mark as configured only when user saves
        }
      });
    }
    onClose();
  };

  // Reset state when dialog opens with a new transition
  const handleDialogChange = (open: boolean) => {
    if (open && transition) {
      // Reset to empty state for new transitions or preserve existing for configured ones
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
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "bg-red-100 text-red-800 border-red-200";
      case "medium": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "low": return "bg-green-100 text-green-800 border-green-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getDropZoneStyle = (stepId: string) => {
    const isDragOver = dragOverZone === stepId;
    const canDrop = draggedFeature ? canAddToStep(stepId) : true;
    const step = steps.find(s => s.id === stepId);
    const baseStyle = "min-h-24 p-3 border-2 border-dashed rounded-lg transition-all";
    
    let colorClass = 'border-gray-300 bg-gray-50';
    if (isDragOver) {
      colorClass = canDrop ? 'border-blue-400 bg-blue-100' : 'border-red-400 bg-red-100';
    }
    
    return `${baseStyle} ${colorClass}`;
  };

  const getExecutionTypeColor = (executionType: 'required' | 'parallel') => {
    switch (executionType) {
      case 'required': return 'text-red-800';
      case 'parallel': return 'text-blue-800';
    }
  };

  const getExecutionTypeRequirement = (executionType: 'required' | 'parallel') => {
    switch (executionType) {
      case 'required': return 'exactly 1 task';
      case 'parallel': return 'minimum 2 tasks';
    }
  };

  const renderFeatureInStep = (feature: Feature, stepId: string, index: number, totalCount: number) => {
    return (
      <div
        key={feature.id}
        className="flex items-center space-x-2 p-2 bg-white rounded border hover:shadow-sm group"
      >
        <div className="flex flex-col">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => moveFeaturePriority(stepId, feature.id, 'up')}
            disabled={index === 0}
            className="h-4 w-4 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <ArrowUp className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => moveFeaturePriority(stepId, feature.id, 'down')}
            disabled={index === totalCount - 1}
            className="h-4 w-4 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <ArrowDown className="h-3 w-3" />
          </Button>
        </div>
        <Badge variant="outline" className="text-xs px-1 py-0">
          {index + 1}
        </Badge>
        <span className="text-sm">{feature.icon}</span>
        <span className="text-sm font-medium flex-1">{feature.name}</span>
        <Badge
          variant="outline"
          className={`text-xs px-2 py-0 ${getPriorityColor(feature.priority)}`}
        >
          {feature.priority}
        </Badge>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => removeFeatureFromStep(stepId, feature.id)}
          className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      handleDialogChange(open);
      if (!open) onClose();
    }}>
      <DialogContent className="max-w-7xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Settings className="h-5 w-5" />
              <span>Configure Stage Transition: {transition?.fromStage} → {transition?.toStage}</span>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="flex space-x-6 h-full overflow-hidden">
          {/* Available Features */}
          <div className="w-80">
            <h3 className="font-medium text-gray-800 mb-3">Available Features</h3>
            <ScrollArea className="h-[600px]">
              <div className="space-y-2 pr-4">
                {availableFeatures.map((feature) => {
                  const isSelected = selectedFeatures.some(f => f.id === feature.id);
                  return (
                    <Card
                      key={feature.id}
                      className={`cursor-pointer transition-all hover:shadow-md ${
                        isSelected ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:bg-gray-50'
                      }`}
                      draggable
                      onDragStart={(e) => handleDragStart(e, feature)}
                      onDragEnd={handleDragEnd}
                      onClick={() => handleFeatureToggle(feature)}
                      title="Click to select/deselect or drag to specific step"
                    >
                      <CardContent className="p-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <GripVertical className="h-4 w-4 text-gray-400 cursor-grab" />
                              <span className="text-lg">{feature.icon}</span>
                              <h4 className="font-medium text-sm">{feature.name}</h4>
                              {isSelected ? (
                                <Check className="h-4 w-4 text-blue-500" />
                              ) : (
                                <Plus className="h-4 w-4 text-gray-400" />
                              )}
                            </div>
                            <p className="text-xs text-gray-600 mt-1 ml-6">{feature.description}</p>
                            <div className="flex items-center space-x-2 mt-2 ml-6">
                              <Badge
                                variant="outline"
                                className={`text-xs px-2 py-0 ${getPriorityColor(feature.priority)}`}
                              >
                                {feature.priority}
                              </Badge>
                              <span className="text-xs text-gray-500">
                                ~{feature.estimatedTime}s
                              </span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </ScrollArea>
          </div>

          {/* Steps Configuration */}
          <div className="flex-1 overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-gray-800">Configure Steps</h3>
              <Button onClick={addStep} size="sm" variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Add Step
              </Button>
            </div>

            <ScrollArea className="h-[560px]">
              <div className="space-y-4 pr-4">
                {steps.map((step) => {
                  const stepFeatures = getFeaturesByStep(step.id);
                  return (
                    <Card key={step.id} className="border-2">
                      <CardHeader 
                        className="pb-2 cursor-pointer hover:bg-gray-50"
                        onClick={() => toggleStepExpansion(step.id)}
                      >
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg flex items-center space-x-2">
                            {expandedSteps.includes(step.id) ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                            <span>{step.name}</span>
                            <Badge variant="outline" className="text-xs capitalize">
                              {step.executionType}: {stepFeatures.length}
                            </Badge>
                          </CardTitle>
                          {steps.length > 1 && (
                            <Button
                              onClick={(e) => {
                                e.stopPropagation();
                                removeStep(step.id);
                              }}
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </CardHeader>

                      {expandedSteps.includes(step.id) && (
                        <CardContent className="space-y-4">
                          {/* Execution Type Selector */}
                          <div className="flex items-center space-x-2">
                            <label className="text-sm font-medium">Execution Type:</label>
                            <Select
                              value={step.executionType}
                              onValueChange={(value: 'required' | 'parallel') => 
                                updateStepExecutionType(step.id, value)
                              }
                            >
                              <SelectTrigger className="w-40">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="required">Required</SelectItem>
                                <SelectItem value="parallel">Parallel</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          {/* Drop Zone */}
                          <div 
                            className={getDropZoneStyle(step.id)}
                            onDragOver={handleDragOver}
                            onDragEnter={(e) => handleDragEnter(e, step.id)}
                            onDragLeave={handleDragLeave}
                            onDrop={(e) => handleDropOnStep(e, step.id)}
                          >
                            <div className="flex items-center space-x-2 mb-2">
                              <h4 className={`font-medium text-sm ${getExecutionTypeColor(step.executionType)}`}>
                                {step.executionType.charAt(0).toUpperCase() + step.executionType.slice(1)} Features ({getExecutionTypeRequirement(step.executionType)})
                              </h4>
                              <Badge variant="outline" className="text-xs bg-white">
                                {stepFeatures.length}
                              </Badge>
                            </div>
                            <div className="space-y-1">
                              {stepFeatures.map((feature, idx, arr) => 
                                renderFeatureInStep(feature, step.id, idx, arr.length)
                              )}
                              {stepFeatures.length === 0 && (
                                <div className="text-xs text-gray-500 text-center py-2">
                                  Drag features here for {step.executionType} execution ({getExecutionTypeRequirement(step.executionType)})
                                </div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      )}
                    </Card>
                  );
                })}
              </div>
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
