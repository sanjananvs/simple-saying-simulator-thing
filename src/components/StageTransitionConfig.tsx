
import { MainStageTransitionConfig } from "./config/MainStageTransitionConfig";
import { Feature, StageTransition } from "@/types/features";

interface StageTransitionConfigProps {
  isOpen: boolean;
  onClose: () => void;
  transition: StageTransition | null;
  availableFeatures: Feature[];
  onSave: (transition: StageTransition) => void;
}

export const StageTransitionConfig = (props: StageTransitionConfigProps) => {
  return <MainStageTransitionConfig {...props} />;
};
