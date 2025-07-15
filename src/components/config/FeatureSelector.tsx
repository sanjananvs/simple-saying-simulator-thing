
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
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
  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-green-100 text-green-800 border-green-200";
      case "in-progress": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "error": return "bg-red-100 text-red-800 border-red-200";
      case "not-started": return "bg-gray-100 text-gray-800 border-gray-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
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

  return (
    <div className="w-1/3 border-r border-gray-200 pr-4">
      <h3 className="font-medium text-gray-800 mb-4">Feature Library</h3>
      <ScrollArea className="h-[560px]">
        <div className="space-y-2">
          {availableFeatures.map((feature) => {
            const isSelected = selectedFeatures.some(f => f.id === feature.id);
            
            return (
              <div
                key={feature.id}
                className={`p-3 border rounded-lg cursor-move hover:shadow-sm transition-all ${
                  isSelected ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-200'
                }`}
                draggable
                onDragStart={(e) => onDragStart(e, feature)}
                onDragEnd={onDragEnd}
              >
                <div className="flex items-start space-x-3">
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => onFeatureToggle(feature)}
                    className="mt-1"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="text-lg">{feature.icon}</span>
                      <span className="font-medium text-sm truncate">{feature.name}</span>
                    </div>
                    
                    <p className="text-xs text-gray-600 mb-3 line-clamp-2">
                      {feature.description}
                    </p>
                    
                    <div className="flex flex-wrap gap-1">
                      <Badge
                        variant="outline"
                        className={`text-xs px-2 py-0 ${getStatusColor(feature.status || 'not-started')}`}
                      >
                        {(feature.status || 'not-started').replace('-', ' ')}
                      </Badge>
                      <Badge
                        variant="outline"
                        className={`text-xs px-2 py-0 ${getPriorityColor(feature.priority)}`}
                      >
                        {feature.priority}
                      </Badge>
                      <Badge variant="outline" className="text-xs px-2 py-0 bg-blue-100 text-blue-800 border-blue-200">
                        {feature.category}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
};
