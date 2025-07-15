export interface Feature {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  priority: 'low' | 'medium' | 'high';
  estimatedTime: number; // in seconds
  status: 'not-started' | 'in-progress' | 'completed' | 'error';
  startTime?: Date;
  completedTime?: Date;
  originalStage?: string; // For tracking original stage when in error state
}

export interface FeatureGroup {
  id: string;
  name: string;
  description: string;
  color: string;
  features: Feature[];
}

export interface Step {
  id: string;
  name: string;
  order: number;
  features: string[]; // Feature IDs for this step
  executionType: 'required' | 'parallel';
}

export interface StageConfig {
  id: string;
  name: string;
  steps: Step[];
  isConfigured: boolean;
}

export interface StageTransition {
  id: string;
  fromStage: string;
  toStage: string;
  features: Feature[];
  allowParallelExecution: boolean;
  stageConfig?: StageConfig;
}

export interface PipelineConfig {
  transitions: StageTransition[];
  selectedFeatures: Feature[];
  stageConfigs: StageConfig[];
}

export interface PartnerPipelineConfig {
  [partnerName: string]: PipelineConfig;
}

export interface TaskReport {
  id: string;
  featureId: string;
  featureName: string;
  stepName: string;
  executionType: 'required' | 'parallel';
  fromStage: string;
  toStage: string;
  startTime: Date;
  completedTime?: Date;
  duration?: number; // in seconds
  status: 'not-started' | 'in-progress' | 'completed' | 'error';
}

export interface StageReport {
  transitionId: string;
  fromStage: string;
  toStage: string;
  tasks: TaskReport[];
  startTime: Date;
  completedTime?: Date;
  totalDuration?: number;
  status: 'not-started' | 'in-progress' | 'completed' | 'error';
}
