
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GripVertical, Check, Plus } from "lucide-react";
import { Feature } from "@/types/features";

interface FeatureSelectorProps {
  availableFeatures: Feature[];
  selectedFeatures: Feature[];
  onFeatureToggle: (feature: Feature) => void;
  onDragStart: (e: React.DragEvent, feature: Feature) => void;
  onDragEnd: () => void;
}

export const FeatureSelector = ({
  availableFeatures,
  selectedFeatures,
  onFeatureToggle,
  onDragStart,
  onDragEnd
}: FeatureSelectorProps) => {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "bg-red-100 text-red-800 border-red-200";
      case "medium": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "low": return "bg-green-100 text-green-800 border-green-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
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
                onDragStart={(e) => onDragStart(e, feature)}
                onDragEnd={onDragEnd}
                onClick={() => onFeatureToggle(feature)}
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
  );
};
