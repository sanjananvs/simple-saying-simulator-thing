import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Settings, Play, Pause, Check, BarChart3, AlertTriangle, RefreshCw, X, Download, Edit2 } from "lucide-react";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ETLData } from "@/types/etl";
import { FeaturePanel } from "./FeaturePanel";
import { StageTransitionConfig } from "./StageTransitionConfig";
import { StageReports } from "./StageReports";
import { featureGroups } from "@/data/featureGroups";
import { Feature, StageTransition, PipelineConfig, StageConfig, StageReport, TaskReport, PartnerPipelineConfig } from "@/types/features";

interface LinearPipelineWithFeaturesProps {
  data: ETLData[];
  onRemovePartner: (partnerName: string) => void;
  onEditPartner?: (oldName: string, newName: string) => void;
  onConfigUpdate?: (configs: PartnerPipelineConfig) => void;
}

export const LinearPipelineWithFeatures = ({ data, onRemovePartner, onEditPartner, onConfigUpdate }: LinearPipelineWithFeaturesProps) => {
  const [isPanelCollapsed, setIsPanelCollapsed] = useState(false);
  const [configDialogOpen, setConfigDialogOpen] = useState(false);
  const [reportsOpen, setReportsOpen] = useState(false);
  const [currentTransition, setCurrentTransition] = useState<StageTransition | null>(null);
  const [currentPartner, setCurrentPartner] = useState<string>("");
  const [stageReports, setStageReports] = useState<StageReport[]>([]);
  const [runningPartners, setRunningPartners] = useState<Set<string>>(new Set());
  const [showValidationAlert, setShowValidationAlert] = useState(false);
  const [validationMessage, setValidationMessage] = useState("");
  
  // Define default stage configurations
  const createDefaultStageConfigs = (): StageConfig[] => [
    { id: "file-stage0", name: "File → Stage 0", steps: [], isConfigured: false },
    { id: "stage0-stage1", name: "Stage 0 → Stage 1", steps: [], isConfigured: false },
    { id: "stage1-stage1b", name: "Stage 1 → Stage 1B (Error Handling)", steps: [], isConfigured: false },
    { id: "stage1b-stage1", name: "Stage 1B → Stage 1 (Recovery)", steps: [], isConfigured: false },
    { id: "stage1-stage2", name: "Stage 1 → Stage 2", steps: [], isConfigured: false },
    { id: "stage2-target", name: "Stage 2 → Target", steps: [], isConfigured: false },
  ];

  const createDefaultPipelineConfig = (): PipelineConfig => {
    const stageConfigs = createDefaultStageConfigs();
    return {
      transitions: [
        { id: "file-stage0", fromStage: "File", toStage: "Stage 0", features: [], allowParallelExecution: false, stageConfig: stageConfigs[0] },
        { id: "stage0-stage1", fromStage: "Stage 0", toStage: "Stage 1", features: [], allowParallelExecution: false, stageConfig: stageConfigs[1] },
        { id: "stage1-stage1b", fromStage: "Stage 1", toStage: "Stage 1B", features: [], allowParallelExecution: false, stageConfig: stageConfigs[2] },
        { id: "stage1b-stage1", fromStage: "Stage 1B", toStage: "Stage 1", features: [], allowParallelExecution: false, stageConfig: stageConfigs[3] },
        { id: "stage1-stage2", fromStage: "Stage 1", toStage: "Stage 2", features: [], allowParallelExecution: false, stageConfig: stageConfigs[4] },
        { id: "stage2-target", fromStage: "Stage 2", toStage: "Target", features: [], allowParallelExecution: false, stageConfig: stageConfigs[5] },
      ],
      selectedFeatures: [],
      stageConfigs
    };
  };

  // Store configurations per partner
  const [partnerConfigs, setPartnerConfigs] = useState<PartnerPipelineConfig>({});
  const [errorFeatures, setErrorFeatures] = useState<{ [partnerName: string]: Feature[] }>({});

  // Initialize configurations for all partners
  useEffect(() => {
    const newConfigs: PartnerPipelineConfig = {};
    data.forEach(item => {
      if (!partnerConfigs[item.partner]) {
        newConfigs[item.partner] = createDefaultPipelineConfig();
      } else {
        newConfigs[item.partner] = partnerConfigs[item.partner];
      }
    });
    setPartnerConfigs(newConfigs);
  }, [data]);

  // Notify parent of config updates
  useEffect(() => {
    if (onConfigUpdate) {
      onConfigUpdate(partnerConfigs);
    }
  }, [partnerConfigs, onConfigUpdate]);

  const allFeatures = featureGroups.flatMap(group => group.features);

  // Save to JSON function for specific partner
  const saveToJson = (partnerName: string) => {
    const partnerConfig = partnerConfigs[partnerName];
    if (!partnerConfig) return;

    const configData = {
      partner: partnerName,
      pipelineConfig: partnerConfig,
      timestamp: new Date().toISOString()
    };
    
    const dataStr = JSON.stringify(configData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `${partnerName}-pipeline-config-${new Date().toISOString().slice(0, 10)}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  // Validation function to check if all required transitions are configured for a specific partner
  const validatePipelineConfiguration = (partnerName: string) => {
    const partnerConfig = partnerConfigs[partnerName];
    if (!partnerConfig) return { isValid: false, message: "Partner configuration not found" };

    const requiredTransitions = ["file-stage0", "stage0-stage1", "stage1-stage2", "stage2-target"];
    const unconfiguredTransitions = requiredTransitions.filter(transitionId => {
      const transition = partnerConfig.transitions.find(t => t.id === transitionId);
      return !transition?.stageConfig?.isConfigured;
    });

    if (unconfiguredTransitions.length > 0) {
      const transitionNames = unconfiguredTransitions.map(id => {
        const transition = partnerConfig.transitions.find(t => t.id === id);
        return `${transition?.fromStage} → ${transition?.toStage}`;
      });
      return {
        isValid: false,
        message: `Please configure the following transitions for ${partnerName} before running: ${transitionNames.join(", ")}`
      };
    }

    return { isValid: true, message: "" };
  };

  // Check if all stages are completed for a partner
  const isPartnerCompleted = (partnerName: string) => {
    const partnerConfig = partnerConfigs[partnerName];
    if (!partnerConfig) return false;

    const requiredTransitions = ["file-stage0", "stage0-stage1", "stage1-stage2", "stage2-target"];
    
    return requiredTransitions.every(transitionId => {
      const transition = partnerConfig.transitions.find(t => t.id === transitionId);
      if (!transition?.stageConfig?.isConfigured || transition.stageConfig.steps.length === 0) {
        return false;
      }

      const allFeatures = transition.stageConfig.steps.flatMap(step => 
        step.features.map(featureId => partnerConfig.selectedFeatures.find(f => f.id === featureId)).filter(Boolean)
      ) as Feature[];

      return allFeatures.length > 0 && allFeatures.every(f => f.status === 'completed');
    });
  };

  // Handle partner-specific run
  const handleRunPipeline = (partnerName: string) => {
    const validation = validatePipelineConfiguration(partnerName);
    if (!validation.isValid) {
      setValidationMessage(validation.message);
      setShowValidationAlert(true);
      return;
    }

    // Reset all features to not-started when starting a new run
    setPartnerConfigs(prev => ({
      ...prev,
      [partnerName]: {
        ...prev[partnerName],
        selectedFeatures: prev[partnerName].selectedFeatures.map(f => ({
          ...f,
          status: 'not-started',
          startTime: undefined,
          completedTime: undefined
        }))
      }
    }));

    setRunningPartners(prev => new Set([...prev, partnerName]));
    console.log(`Starting pipeline for partner: ${partnerName}`);
  };

  // Sequential execution with proper stage ordering
  useEffect(() => {
    if (runningPartners.size === 0) return;

    const interval = setInterval(() => {
      setPartnerConfigs(prev => {
        const updatedConfigs = { ...prev };
        const partnersToStop = new Set<string>();

        runningPartners.forEach(partnerName => {
          const partnerConfig = updatedConfigs[partnerName];
          if (!partnerConfig) return;

          const updatedFeatures = [...partnerConfig.selectedFeatures];

          // Define execution order for sequential processing
          const executionOrder = [
            "file-stage0",
            "stage0-stage1", 
            "stage1-stage2",
            "stage2-target"
          ];
          
          // Check if previous stage is completed before starting next
          const isStageCompleted = (transitionId: string) => {
            const transition = partnerConfig.transitions.find(t => t.id === transitionId);
            if (!transition?.stageConfig?.isConfigured || transition.stageConfig.steps.length === 0) {
              return false;
            }

            const allFeatures = transition.stageConfig.steps.flatMap(step => 
              step.features.map(featureId => updatedFeatures.find(f => f.id === featureId)).filter(Boolean)
            ) as Feature[];

            return allFeatures.length > 0 && allFeatures.every(f => f.status === 'completed');
          };

          // Process transitions in order
          for (let i = 0; i < executionOrder.length; i++) {
            const currentTransitionId = executionOrder[i];
            const previousTransitionId = i > 0 ? executionOrder[i - 1] : null;
            
            // Check if previous stage is completed (or if this is the first stage)
            const canStartCurrentStage = !previousTransitionId || isStageCompleted(previousTransitionId);
            
            if (!canStartCurrentStage) {
              continue; // Skip this stage and all subsequent stages
            }

            const transition = partnerConfig.transitions.find(t => t.id === currentTransitionId);
            if (transition?.stageConfig?.isConfigured && transition.stageConfig.steps.length > 0) {
              const steps = transition.stageConfig.steps.sort((a, b) => a.order - b.order);
              
              // Check each step in order
              for (let stepIndex = 0; stepIndex < steps.length; stepIndex++) {
                const currentStep = steps[stepIndex];
                const previousStep = stepIndex > 0 ? steps[stepIndex - 1] : null;
                
                // Get features for current step
                const currentStepFeatures = currentStep.features.map(featureId => 
                  updatedFeatures.find(f => f.id === featureId)
                ).filter(Boolean) as Feature[];
                
                // Check if previous step is completed (if exists)
                const canStartCurrentStep = !previousStep || 
                  previousStep.features.every(featureId => {
                    const prevFeature = updatedFeatures.find(f => f.id === featureId);
                    return prevFeature?.status === 'completed';
                  });
                
                if (canStartCurrentStep) {
                  // Process current step features
                  currentStepFeatures.forEach((feature, featureIndex) => {
                    const featureInArray = updatedFeatures.find(f => f.id === feature.id);
                    if (!featureInArray) return;
                    
                    if (currentStep.executionType === 'parallel') {
                      // Parallel execution - all features can start together
                      if (featureInArray.status === 'not-started') {
                        if (Math.random() > 0.7) {
                          const index = updatedFeatures.findIndex(f => f.id === feature.id);
                          updatedFeatures[index] = { ...featureInArray, status: 'in-progress', startTime: new Date() };
                        }
                      } else if (featureInArray.status === 'in-progress') {
                        if (featureInArray.startTime) {
                          const elapsed = (new Date().getTime() - featureInArray.startTime.getTime()) / 1000;
                          if (elapsed >= 15) {
                            const index = updatedFeatures.findIndex(f => f.id === feature.id);
                            updatedFeatures[index] = { ...featureInArray, status: 'completed', completedTime: new Date() };
                          }
                        }
                      }
                    } else {
                      // Sequential execution within step (required)
                      const previousFeatureInStep = featureIndex > 0 ? currentStepFeatures[featureIndex - 1] : null;
                      const canStartFeature = !previousFeatureInStep || 
                        updatedFeatures.find(f => f.id === previousFeatureInStep.id)?.status === 'completed';
                      
                      if (canStartFeature) {
                        if (featureInArray.status === 'not-started') {
                          if (Math.random() > 0.7) {
                            const index = updatedFeatures.findIndex(f => f.id === feature.id);
                            updatedFeatures[index] = { ...featureInArray, status: 'in-progress', startTime: new Date() };
                          }
                        } else if (featureInArray.status === 'in-progress') {
                          if (featureInArray.startTime) {
                            const elapsed = (new Date().getTime() - featureInArray.startTime.getTime()) / 1000;
                            if (elapsed >= 15) {
                              const index = updatedFeatures.findIndex(f => f.id === feature.id);
                              updatedFeatures[index] = { ...featureInArray, status: 'completed', completedTime: new Date() };
                            }
                          }
                        }
                      }
                    }
                  });
                }
              }
            }
          }

          // Check if partner is completed and should stop running
          if (isPartnerCompleted(partnerName)) {
            partnersToStop.add(partnerName);
          }

          updatedConfigs[partnerName] = {
            ...partnerConfig,
            selectedFeatures: updatedFeatures
          };
        });

        // Remove completed partners from running set
        if (partnersToStop.size > 0) {
          setRunningPartners(prev => {
            const newSet = new Set(prev);
            partnersToStop.forEach(partner => newSet.delete(partner));
            return newSet;
          });
        }
        
        // Update reports when features complete
        updateStageReports(updatedConfigs);

        return updatedConfigs;
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [partnerConfigs, runningPartners]);

  const updateStageReports = (configs: PartnerPipelineConfig) => {
    const reports: StageReport[] = [];
    
    Object.entries(configs).forEach(([partnerName, partnerConfig]) => {
      partnerConfig.transitions.forEach(transition => {
        if (transition.stageConfig?.isConfigured && transition.stageConfig.steps.length > 0) {
          const tasks: TaskReport[] = [];
          
          transition.stageConfig.steps.forEach(step => {
            step.features.forEach(featureId => {
              const feature = partnerConfig.selectedFeatures.find(f => f.id === featureId);
              if (feature) {
                tasks.push({
                  id: `${step.id}-${feature.id}`,
                  featureId: feature.id,
                  featureName: feature.name,
                  stepName: step.name,
                  executionType: step.executionType,
                  fromStage: transition.fromStage,
                  toStage: transition.toStage,
                  startTime: feature.startTime || new Date(),
                  completedTime: feature.completedTime,
                  duration: feature.completedTime && feature.startTime ? 
                    (feature.completedTime.getTime() - feature.startTime.getTime()) / 1000 : undefined,
                  status: feature.status
                });
              }
            });
          });

          if (tasks.length > 0) {
            const completedTasks = tasks.filter(t => t.status === 'completed');
            const inProgressTasks = tasks.filter(t => t.status === 'in-progress');
            
            let reportStatus: 'not-started' | 'in-progress' | 'completed' = 'not-started';
            if (completedTasks.length === tasks.length) {
              reportStatus = 'completed';
            } else if (inProgressTasks.length > 0 || completedTasks.length > 0) {
              reportStatus = 'in-progress';
            }

            reports.push({
              transitionId: transition.id,
              fromStage: transition.fromStage,
              toStage: transition.toStage,
              tasks,
              startTime: tasks[0]?.startTime || new Date(),
              completedTime: reportStatus === 'completed' ? 
                new Date(Math.max(...tasks.map(t => t.completedTime?.getTime() || 0))) : undefined,
              totalDuration: completedTasks.length === tasks.length ? 
                tasks.reduce((sum, t) => sum + (t.duration || 0), 0) : undefined,
              status: reportStatus
            });
          }
        }
      });
    });

    setStageReports(reports);
  };

  // Get all features used in configurations for a partner
  const getAllConfiguredFeatures = (partnerName: string): Feature[] => {
    const partnerConfig = partnerConfigs[partnerName];
    if (!partnerConfig) return [];

    const configuredFeatureIds = new Set<string>();
    
    partnerConfig.transitions.forEach(transition => {
      if (transition.stageConfig?.steps) {
        transition.stageConfig.steps.forEach(step => {
          step.features.forEach(featureId => {
            configuredFeatureIds.add(featureId);
          });
        });
      }
    });

    return Array.from(configuredFeatureIds).map(id => 
      allFeatures.find(f => f.id === id) || 
      partnerConfig.selectedFeatures.find(f => f.id === id)
    ).filter(Boolean) as Feature[];
  };

  const handleFeatureSelect = (feature: Feature, partnerName: string) => {
    const partnerConfig = partnerConfigs[partnerName];
    if (!partnerConfig) return;

    if (!partnerConfig.selectedFeatures.some(f => f.id === feature.id)) {
      setPartnerConfigs(prev => ({
        ...prev,
        [partnerName]: {
          ...partnerConfig,
          selectedFeatures: [...partnerConfig.selectedFeatures, { ...feature, status: 'not-started' }]
        }
      }));
    }
  };

  const handleFeatureRemove = (featureId: string, partnerName: string) => {
    const partnerConfig = partnerConfigs[partnerName];
    if (!partnerConfig) return;

    // Only remove from selectedFeatures, but keep in stage configurations
    setPartnerConfigs(prev => ({
      ...prev,
      [partnerName]: {
        ...partnerConfig,
        selectedFeatures: partnerConfig.selectedFeatures.filter(f => f.id !== featureId)
      }
    }));
  };

  const handleRecoverFeature = (featureId: string, partnerName: string) => {
    const partnerConfig = partnerConfigs[partnerName];
    if (!partnerConfig) return;

    setPartnerConfigs(prev => ({
      ...prev,
      [partnerName]: {
        ...partnerConfig,
        selectedFeatures: partnerConfig.selectedFeatures.map(f => 
          f.id === featureId ? { ...f, status: 'not-started' } : f
        )
      }
    }));

    setErrorFeatures(prev => ({
      ...prev,
      [partnerName]: (prev[partnerName] || []).filter(f => f.id !== featureId)
    }));
  };

  const handleDrop = (e: React.DragEvent, transitionId: string, partnerName: string) => {
    e.preventDefault();
    const featureData = e.dataTransfer.getData('application/json');
    if (featureData) {
      const feature: Feature = JSON.parse(featureData);
      
      const partnerConfig = partnerConfigs[partnerName];
      if (!partnerConfig) return;

      const transition = partnerConfig.transitions.find(t => t.id === transitionId);
      if (transition) {
        setCurrentTransition(transition);
        setCurrentPartner(partnerName);
        setConfigDialogOpen(true);
      }

      if (!partnerConfig.selectedFeatures.some(f => f.id === feature.id)) {
        setPartnerConfigs(prev => ({
          ...prev,
          [partnerName]: {
            ...partnerConfig,
            selectedFeatures: [...partnerConfig.selectedFeatures, { ...feature, status: 'not-started' }]
          }
        }));
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed": return <div className="w-2 h-2 rounded-full bg-green-500" />;
      case "in-progress": return <div className="w-2 h-2 rounded-full bg-yellow-500" />;
      case "error": return <div className="w-2 h-2 rounded-full bg-red-600" />;
      case "not-started": return <div className="w-2 h-2 rounded-full bg-red-500" />;
      default: return <div className="w-2 h-2 rounded-full bg-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-green-500";
      case "in-progress": return "bg-yellow-500";
      case "error": return "bg-red-600";
      case "not-started": return "bg-red-500";
      default: return "bg-gray-500";
    }
  };

  const getTransitionTasksInProgress = (transitionId: string, partnerName: string) => {
    const partnerConfig = partnerConfigs[partnerName];
    if (!partnerConfig) return false;

    const transition = partnerConfig.transitions.find(t => t.id === transitionId);
    if (!transition?.stageConfig?.steps || transition.stageConfig.steps.length === 0) {
      return false;
    }

    const allFeatures = transition.stageConfig.steps.flatMap(step => 
      step.features.map(featureId => partnerConfig.selectedFeatures.find(f => f.id === featureId)).filter(Boolean)
    ) as Feature[];

    return allFeatures.some(f => f.status === 'in-progress');
  };

  const renderStage = (stage: string) => {
    const isErrorStage = stage === "Stage 1B";
    const isFileStage = stage === "File";
    return (
      <div className={`w-20 h-12 shadow-lg border-2 rounded-lg flex items-center justify-center hover:shadow-xl transition-shadow duration-200 ${
        isErrorStage ? 'bg-red-50 border-red-300' : 
        isFileStage ? 'bg-blue-50 border-blue-300' : 
        'bg-white border-gray-300'
      }`}>
        <div className="text-center">
          <h3 className={`font-semibold text-xs ${
            isErrorStage ? 'text-red-700' : 
            isFileStage ? 'text-blue-700' : 
            'text-gray-700'
          }`}>
            {stage}
          </h3>
          {isErrorStage && (
            <div className="flex items-center justify-center mt-1">
              <AlertTriangle className="h-2 w-2 text-red-500" />
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderStepIndicators = (transitionId: string, partnerName: string) => {
    const partnerConfig = partnerConfigs[partnerName];
    if (!partnerConfig) return null;

    const transition = partnerConfig.transitions.find(t => t.id === transitionId);
    if (!transition?.stageConfig?.steps || transition.stageConfig.steps.length === 0) {
      return null;
    }

    const allFeatures = transition.stageConfig.steps.flatMap(step => 
      step.features.map(featureId => partnerConfig.selectedFeatures.find(f => f.id === featureId)).filter(Boolean)
    ) as Feature[];

    if (allFeatures.length === 0) {
      return null;
    }

    const completedCount = allFeatures.filter(f => f.status === 'completed').length;
    const inProgressCount = allFeatures.filter(f => f.status === 'in-progress').length;
    const errorCount = allFeatures.filter(f => (f.status as any) === 'error').length;
    const notStartedCount = allFeatures.filter(f => f.status === 'not-started').length;

    const completedFeatures = allFeatures.filter(f => f.status === 'completed');
    const inProgressFeatures = allFeatures.filter(f => f.status === 'in-progress');
    const errorFeatures = allFeatures.filter(f => (f.status as any) === 'error');
    const notStartedFeatures = allFeatures.filter(f => f.status === 'not-started');

    return (
      <HoverCard>
        <HoverCardTrigger asChild>
          <div className="absolute -top-10 left-1/2 transform -translate-x-1/2">
            <div className="bg-white border border-gray-200 rounded-lg p-1 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex items-center space-x-1">
                {notStartedCount > 0 && (
                  <div className="flex items-center space-x-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
                    <span className="text-xs text-gray-600">{notStartedCount}</span>
                  </div>
                )}
                {inProgressCount > 0 && (
                  <div className="flex items-center space-x-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-yellow-500"></div>
                    <span className="text-xs text-gray-600">{inProgressCount}</span>
                  </div>
                )}
                {errorCount > 0 && (
                  <div className="flex items-center space-x-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-600"></div>
                    <span className="text-xs text-gray-600">{errorCount}</span>
                  </div>
                )}
                {completedCount > 0 && (
                  <div className="flex items-center space-x-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                    <span className="text-xs text-gray-600">{completedCount}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </HoverCardTrigger>
        <HoverCardContent className="w-80 p-4">
          <div className="space-y-3">
            <h4 className="font-semibold text-sm text-gray-800">
              {transition.fromStage} → {transition.toStage} Features
            </h4>
            
            {/* Error Features */}
            {errorFeatures[partnerName]?.length > 0 && (
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 rounded-full bg-red-600"></div>
                  <span className="text-sm font-medium text-red-800">Error ({errorFeatures[partnerName].length})</span>
                </div>
                <div className="ml-4 space-y-1">
                  {errorFeatures[partnerName].map(feature => (
                    <div key={feature.id} className="flex items-center space-x-2 text-xs text-gray-600">
                      <span>{feature.icon}</span>
                      <span>{feature.name}</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleRecoverFeature(feature.id, partnerName)}
                        className="h-4 px-1 text-xs"
                      >
                        <RefreshCw className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Other status sections with updated icons */}
            {notStartedFeatures.length > 0 && (
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 rounded-full bg-red-500"></div>
                  <span className="text-sm font-medium text-red-800">Not Started ({notStartedFeatures.length})</span>
                </div>
                <div className="ml-4 space-y-1">
                  {notStartedFeatures.map(feature => (
                    <div key={feature.id} className="flex items-center space-x-2 text-xs text-gray-600">
                      <span>{feature.icon}</span>
                      <span>{feature.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {inProgressFeatures.length > 0 && (
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                  <span className="text-sm font-medium text-yellow-800">In Progress ({inProgressFeatures.length})</span>
                </div>
                <div className="ml-4 space-y-1">
                  {inProgressFeatures.map(feature => (
                    <div key={feature.id} className="flex items-center space-x-2 text-xs text-gray-600">
                      <span>{feature.icon}</span>
                      <span>{feature.name}</span>
                      {feature.startTime && (
                        <span className="text-xs text-gray-500">
                          ({Math.floor((new Date().getTime() - feature.startTime.getTime()) / 1000)}s)
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {completedFeatures.length > 0 && (
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  <span className="text-sm font-medium text-green-800">Completed ({completedFeatures.length})</span>
                </div>
                <div className="ml-4 space-y-1">
                  {completedFeatures.map(feature => (
                    <div key={feature.id} className="flex items-center space-x-2 text-xs text-gray-600">
                      <span>{feature.icon}</span>
                      <span>{feature.name}</span>
                      {feature.startTime && feature.completedTime && (
                        <span className="text-xs text-gray-500">
                          ({Math.floor((feature.completedTime.getTime() - feature.startTime.getTime()) / 1000)}s)
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </HoverCardContent>
      </HoverCard>
    );
  };

  const renderHorizontalConnection = (transitionId: string, partnerName: string) => {
    const partnerConfig = partnerConfigs[partnerName];
    if (!partnerConfig) return null;

    const transition = partnerConfig.transitions.find(t => t.id === transitionId);
    const isConfigured = transition?.stageConfig?.isConfigured || false;
    const isErrorConnection = transitionId.includes('stage1b');
    const hasTasksInProgress = getTransitionTasksInProgress(transitionId, partnerName);
    
    return (
      <div className="flex items-center justify-center h-12 relative" style={{ width: '60px' }}>
        {renderStepIndicators(transitionId, partnerName)}
        <div className={`relative overflow-hidden shadow-inner border-2 rounded ${
          isErrorConnection ? 'bg-red-100 border-red-300' : 'bg-gray-200 border-gray-300'
        }`} style={{ width: '48px', height: '4px' }}>
          <div 
            className={`absolute inset-0 opacity-80 ${hasTasksInProgress ? '' : 'hidden'}`}
            style={{
              backgroundImage: `repeating-linear-gradient(
                90deg,
                ${isErrorConnection ? '#dc2626' : '#1f2937'} 0px,
                ${isErrorConnection ? '#dc2626' : '#1f2937'} 8px,
                #ffffff 8px,
                #ffffff 16px
              )`,
              animation: 'slide-horizontal 1.5s linear infinite',
            }}
          />
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            const transition = partnerConfig.transitions.find(t => t.id === transitionId);
            if (transition) {
              setCurrentTransition(transition);
              setCurrentPartner(partnerName);
              setConfigDialogOpen(true);
            }
          }}
          onDrop={(e) => handleDrop(e, transitionId, partnerName)}
          onDragOver={handleDragOver}
          className={`absolute -bottom-5 left-1/2 transform -translate-x-1/2 h-5 w-5 p-0 border-2 rounded-full shadow-sm hover:shadow-md transition-all ${
            isConfigured 
              ? isErrorConnection 
                ? 'bg-red-100 border-red-400 text-red-700 hover:border-red-500'
                : 'bg-green-100 border-green-400 text-green-700 hover:border-green-500'
              : 'bg-white border-gray-300 hover:border-blue-400'
          }`}
        >
          <Settings className="h-2.5 w-2.5" />
        </Button>
        <style>
          {`
            @keyframes slide-horizontal {
              0% { background-position: 0 0; }
              100% { background-position: 16px 0; }
            }
          `}
        </style>
      </div>
    );
  };

  const renderVerticalConnection = (transitionId: string, partnerName: string, isRecovery = false) => {
    const partnerConfig = partnerConfigs[partnerName];
    if (!partnerConfig) return null;

    const transition = partnerConfig.transitions.find(t => t.id === transitionId);
    const isConfigured = transition?.stageConfig?.isConfigured || false;
    const isErrorConnection = transitionId.includes('stage1b');
    const isRecoveryConnection = transitionId === 'stage1b-stage1' || isRecovery;
    const hasTasksInProgress = getTransitionTasksInProgress(transitionId, partnerName);
    
    return (
      <div className="flex flex-col items-center justify-center relative" style={{ height: '20px' }}>
        {renderStepIndicators(transitionId, partnerName)}
        <div className={`relative overflow-hidden shadow-inner border-2 rounded ${
          isErrorConnection ? 'bg-red-100 border-red-300' : 'bg-gray-200 border-gray-300'
        }`} style={{ height: '14px', width: '4px' }}>
          <div 
            className={`absolute inset-0 opacity-80 ${hasTasksInProgress ? '' : 'hidden'}`}
            style={{
              backgroundImage: `repeating-linear-gradient(
                ${isRecoveryConnection ? '180deg' : '0deg'},
                ${isErrorConnection ? '#dc2626' : '#1f2937'} 0px,
                ${isErrorConnection ? '#dc2626' : '#1f2937'} 8px,
                #ffffff 8px,
                #ffffff 16px
              )`,
              animation: `slide-vertical-${isRecoveryConnection ? 'up' : 'down'} 1.5s linear infinite`,
            }}
          />
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            const transition = partnerConfig.transitions.find(t => t.id === transitionId);
            if (transition) {
              setCurrentTransition(transition);
              setCurrentPartner(partnerName);
              setConfigDialogOpen(true);
            }
          }}
          onDrop={(e) => handleDrop(e, transitionId, partnerName)}
          onDragOver={handleDragOver}
          className={`absolute -right-5 top-1/2 transform -translate-y-1/2 h-5 w-5 p-0 border-2 rounded-full shadow-sm hover:shadow-md transition-all ${
            isConfigured 
              ? isErrorConnection 
                ? 'bg-red-100 border-red-400 text-red-700 hover:border-red-500'
                : 'bg-green-100 border-green-400 text-green-700 hover:border-green-500'
              : 'bg-white border-gray-300 hover:border-blue-400'
          }`}
        >
          <Settings className="h-2.5 w-2.5" />
        </Button>
        <style>
          {`
            @keyframes slide-vertical-down {
              0% { background-position: 0 0; }
              100% { background-position: 0 16px; }
            }
            @keyframes slide-vertical-up {
              0% { background-position: 0 16px; }
              100% { background-position: 0 0; }
            }
          `}
        </style>
      </div>
    );
  };

  // Partner card header with edit functionality
  const PartnerCardHeader = ({ partner, onRemovePartner, onEditPartner }: { partner: string; onRemovePartner: (partner: string) => void; onEditPartner?: (oldName: string, newName: string) => void; }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState(partner);

    const handleEditSave = () => {
      if (editName.trim() && editName.trim() !== partner && onEditPartner) {
        onEditPartner(partner, editName.trim());
      }
      setIsEditing(false);
    };

    const handleEditCancel = () => {
      setEditName(partner);
      setIsEditing(false);
    };

    return (
      <>
        <div className="flex items-center">
          <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
          {isEditing ? (
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="border border-gray-300 rounded px-2 py-1 text-sm font-semibold"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleEditSave();
                  if (e.key === 'Escape') handleEditCancel();
                }}
                autoFocus
              />
              <Button size="sm" variant="outline" onClick={handleEditSave}>
                <Check className="h-3 w-3" />
              </Button>
              <Button size="sm" variant="outline" onClick={handleEditCancel}>
                <X className="h-3 w-3" />
              </Button>
            </div>
          ) : (
            <span 
              className="cursor-pointer hover:text-blue-600"
              onClick={() => setIsEditing(true)}
            >
              {partner}
            </span>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onRemovePartner(partner)}
          className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
        >
          <X className="h-4 w-4" />
        </Button>
      </>
    );
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Feature Panel */}
      <FeaturePanel
        featureGroups={featureGroups}
        selectedFeatures={[]}
        onFeatureSelect={(feature) => {}}
        onFeatureRemove={() => {}}
        isCollapsed={isPanelCollapsed}
        onToggleCollapse={() => setIsPanelCollapsed(!isPanelCollapsed)}
      />

      {/* Main Pipeline Area */}
      <div className="flex-1 overflow-auto p-4">
        {/* Top Actions */}
        <div className="mb-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            {Object.values(errorFeatures).flat().length > 0 && (
              <Badge variant="destructive" className="flex items-center space-x-1">
                <AlertTriangle className="h-3 w-3" />
                <span>{Object.values(errorFeatures).flat().length} Error{Object.values(errorFeatures).flat().length > 1 ? 's' : ''}</span>
              </Badge>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <Button
              onClick={() => setReportsOpen(true)}
              variant="outline"
              className="flex items-center space-x-2"
            >
              <BarChart3 className="h-4 w-4" />
              <span>View Reports</span>
              {stageReports.length > 0 && (
                <Badge variant="secondary">{stageReports.length}</Badge>
              )}
            </Button>
          </div>
        </div>

        <div className="space-y-6">
          {Object.entries(data.reduce((acc, item) => {
            if (!acc[item.partner]) acc[item.partner] = [];
            acc[item.partner].push(item);
            return acc;
          }, {} as Record<string, ETLData[]>)).map(([partner, partnerData]) => (
            <Card key={partner} className="shadow-lg border-0 overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200 pb-3">
                <CardTitle className="text-md text-gray-800 flex items-center justify-between">
                  <PartnerCardHeader partner={partner} onRemovePartner={onRemovePartner} onEditPartner={onEditPartner} />
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 bg-gradient-to-br from-gray-50 to-white">
                <div className="flex items-start justify-center mb-4">
                  <div className="flex flex-col items-center">
                    {renderStage("File")}
                  </div>

                  {renderHorizontalConnection("file-stage0", partner)}

                  <div className="flex flex-col items-center">
                    {renderStage("Stage 0")}
                  </div>

                  {renderHorizontalConnection("stage0-stage1", partner)}

                  <div className="flex flex-col items-center">
                    {renderStage("Stage 1")}

                    <div className="flex flex-row items-start space-x-3 mt-1 mb-1">
                      <div className="flex flex-col items-center space-y-1">
                        {renderVerticalConnection("stage1-stage1b", partner)}
                      </div>
                      <div className="flex flex-col items-center space-y-1">
                        {renderVerticalConnection("stage1b-stage1", partner, true)}
                      </div>
                    </div>

                    {renderStage("Stage 1B")}
                  </div>

                  {renderHorizontalConnection("stage1-stage2", partner)}

                  <div className="flex flex-col items-center">
                    {renderStage("Stage 2")}
                  </div>

                  {renderHorizontalConnection("stage2-target", partner)}

                  <div className="flex flex-col items-center">
                    {renderStage("Target")}
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200 px-2 py-1 text-xs">
                      {getStatusIcon("completed")}
                      <span className="ml-1">Completed</span>
                    </Badge>
                    <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200 px-2 py-1 text-xs">
                      {getStatusIcon("in-progress")}
                      <span className="ml-1">In Progress</span>
                    </Badge>
                    <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200 px-2 py-1 text-xs">
                      {getStatusIcon("error")}
                      <span className="ml-1">Error</span>
                    </Badge>
                    <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200 px-2 py-1 text-xs">
                      {getStatusIcon("not-started")}
                      <span className="ml-1">Not Started</span>
                    </Badge>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Button
                      onClick={() => saveToJson(partner)}
                      variant="outline"
                      className="flex items-center space-x-2"
                    >
                      <Download className="h-4 w-4" />
                      <span>Save to JSON</span>
                    </Button>
                    <Button
                      onClick={() => handleRunPipeline(partner)}
                      disabled={runningPartners.has(partner)}
                      className="bg-green-600 hover:bg-green-700 px-6 py-2"
                    >
                      <Play className="h-4 w-4 mr-2" />
                      {runningPartners.has(partner) ? 'Running...' : 'Run Pipeline'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Configuration Dialog */}
      <StageTransitionConfig
        isOpen={configDialogOpen}
        onClose={() => setConfigDialogOpen(false)}
        transition={currentTransition}
        availableFeatures={allFeatures}
        onSave={(updatedTransition) => {
          if (currentPartner && partnerConfigs[currentPartner]) {
            setPartnerConfigs(prev => ({
              ...prev,
              [currentPartner]: {
                ...prev[currentPartner],
                transitions: prev[currentPartner].transitions.map(t => 
                  t.id === updatedTransition.id ? updatedTransition : t
                )
              }
            }));
          }
          setConfigDialogOpen(false);
        }}
      />

      {/* Reports Dialog */}
      {reportsOpen && (
        <StageReports
          reports={stageReports}
          onClose={() => setReportsOpen(false)}
        />
      )}

      {/* Validation Alert */}
      <AlertDialog open={showValidationAlert} onOpenChange={setShowValidationAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Configuration Required</AlertDialogTitle>
            <AlertDialogDescription>
              {validationMessage}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setShowValidationAlert(false)}>
              OK
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
