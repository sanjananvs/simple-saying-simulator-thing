
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronRight, ChevronDown, Trash2, ArrowUp, ArrowDown } from "lucide-react";
import { Step, Feature } from "@/types/features";

interface StepManagerProps {
  step: Step;
  stepFeatures: Feature[];
  isExpanded: boolean;
  canRemove: boolean;
  onToggleExpansion: () => void;
  onRemoveStep: () => void;
  onUpdateExecutionType: (executionType: 'required' | 'parallel') => void;
  onMoveFeaturePriority: (featureId: string, direction: 'up' | 'down') => void;
  onRemoveFeature: (featureId: string) => void;
  onDrop: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragEnter: (e: React.DragEvent) => void;
  onDragLeave: (e: React.DragEvent) => void;
  isDragOver: boolean;
  canDrop: boolean;
}

export const StepManager = ({
  step,
  stepFeatures,
  isExpanded,
  canRemove,
  onToggleExpansion,
  onRemoveStep,
  onUpdateExecutionType,
  onMoveFeaturePriority,
  onRemoveFeature,
  onDrop,
  onDragOver,
  onDragEnter,
  onDragLeave,
  isDragOver,
  canDrop
}: StepManagerProps) => {
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

  const getDropZoneStyle = () => {
    const baseStyle = "min-h-24 p-3 border-2 border-dashed rounded-lg transition-all";
    let colorClass = 'border-gray-300 bg-gray-50';
    if (isDragOver) {
      colorClass = canDrop ? 'border-blue-400 bg-blue-100' : 'border-red-400 bg-red-100';
    }
    return `${baseStyle} ${colorClass}`;
  };

  return (
    <Card className="border-2">
      <CardHeader 
        className="pb-2 cursor-pointer hover:bg-gray-50"
        onClick={onToggleExpansion}
      >
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center space-x-2">
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
            <span>{step.name}</span>
            <Badge variant="outline" className="text-xs capitalize">
              {step.executionType}: {stepFeatures.length}
            </Badge>
          </CardTitle>
          {canRemove && (
            <Button
              onClick={(e) => {
                e.stopPropagation();
                onRemoveStep();
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

      {isExpanded && (
        <CardContent className="space-y-4">
          {/* Execution Type Selector */}
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium">Execution Type:</label>
            <Select
              value={step.executionType}
              onValueChange={(value: 'required' | 'parallel') => 
                onUpdateExecutionType(value)
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
            className={getDropZoneStyle()}
            onDragOver={onDragOver}
            onDragEnter={onDragEnter}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
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
              {stepFeatures.map((feature, idx, arr) => (
                <div
                  key={feature.id}
                  className="flex items-center space-x-2 p-2 bg-white rounded border hover:shadow-sm group"
                >
                  <div className="flex flex-col">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onMoveFeaturePriority(feature.id, 'up')}
                      disabled={idx === 0}
                      className="h-4 w-4 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <ArrowUp className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onMoveFeaturePriority(feature.id, 'down')}
                      disabled={idx === arr.length - 1}
                      className="h-4 w-4 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <ArrowDown className="h-3 w-3" />
                    </Button>
                  </div>
                  <Badge variant="outline" className="text-xs px-1 py-0">
                    {idx + 1}
                  </Badge>
                  <span className="text-sm">{feature.icon}</span>
                  <span className="text-sm font-medium flex-1">{feature.name}</span>
                  
                  {/* Status and Priority Badges - Always Visible */}
                  <div className="flex items-center space-x-1">
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
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onRemoveFeature(feature.id)}
                    className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
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
};
