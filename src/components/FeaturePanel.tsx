
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X, Plus, Minus, Play, Pause, Check } from "lucide-react";
import { FeatureGroup, Feature } from "@/types/features";

interface FeaturePanelProps {
  featureGroups: FeatureGroup[];
  selectedFeatures: Feature[];
  onFeatureSelect: (feature: Feature) => void;
  onFeatureRemove: (featureId: string) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export const FeaturePanel = ({
  featureGroups,
  selectedFeatures,
  onFeatureSelect,
  onFeatureRemove,
  isCollapsed,
  onToggleCollapse
}: FeaturePanelProps) => {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  const toggleGroup = (groupId: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupId)) {
      newExpanded.delete(groupId);
    } else {
      newExpanded.add(groupId);
    }
    setExpandedGroups(newExpanded);
  };

  const isFeatureSelected = (featureId: string) => 
    selectedFeatures.some(f => f.id === featureId);

  const handleDragStart = (e: React.DragEvent, feature: Feature) => {
    e.dataTransfer.setData('application/json', JSON.stringify(feature));
  };

  if (isCollapsed) {
    return (
      <div className="w-12 h-full bg-white border-r border-gray-200 shadow-sm">
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleCollapse}
          className="w-full h-12 border-b border-gray-200"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="w-96 h-full bg-white border-r border-gray-200 shadow-sm overflow-hidden flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
        <h2 className="font-semibold text-gray-800">Feature Library</h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleCollapse}
        >
          <Minus className="h-4 w-4" />
        </Button>
      </div>

      {/* Selected Features Counter */}
      <div className="p-4 bg-blue-50 border-b border-gray-200">
        <div className="text-sm text-gray-600">
          Selected Features: <span className="font-semibold text-blue-600">{selectedFeatures.length}</span>
        </div>
      </div>

      {/* Feature Groups */}
      <div className="flex-1 overflow-y-auto">
        {featureGroups.map((group) => (
          <div key={group.id} className="border-b border-gray-100">
            <div
              className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${group.color} bg-opacity-10`}
              onClick={() => toggleGroup(group.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${group.color}`}></div>
                  <div>
                    <h3 className="font-medium text-gray-800">{group.name}</h3>
                    <p className="text-xs text-gray-600">{group.description}</p>
                  </div>
                </div>
                <div className="text-sm text-gray-500">
                  {expandedGroups.has(group.id) ? '−' : '+'}
                </div>
              </div>
            </div>

            {expandedGroups.has(group.id) && (
              <div className="bg-gray-50">
                {group.features.map((feature) => (
                  <div
                    key={feature.id}
                    className={`p-3 border-b border-gray-100 hover:bg-white transition-colors cursor-pointer ${
                      isFeatureSelected(feature.id) ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                    }`}
                    draggable
                    onDragStart={(e) => handleDragStart(e, feature)}
                    onClick={() => {
                      if (isFeatureSelected(feature.id)) {
                        onFeatureRemove(feature.id);
                      } else {
                        onFeatureSelect(feature);
                      }
                    }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="text-lg">{feature.icon}</span>
                          <div className="flex-1">
                            <h4 className="font-medium text-sm text-gray-800">{feature.name}</h4>
                          </div>
                          {isFeatureSelected(feature.id) ? (
                            <X className="h-3 w-3 text-blue-500" />
                          ) : (
                            <Plus className="h-3 w-3 text-gray-400" />
                          )}
                        </div>
                        <p className="text-xs text-gray-600">{feature.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
