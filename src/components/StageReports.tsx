
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Clock, CheckCircle, PlayCircle, PauseCircle, ArrowRight, Download } from "lucide-react";
import { StageReport, TaskReport } from "@/types/features";

interface StageReportsProps {
  reports: StageReport[];
  onClose: () => void;
}

export const StageReports = ({ reports, onClose }: StageReportsProps) => {
  const [selectedReport, setSelectedReport] = useState<StageReport | null>(null);

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed": return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "in-progress": return <PlayCircle className="h-4 w-4 text-yellow-600" />;
      case "not-started": return <PauseCircle className="h-4 w-4 text-red-600" />;
      default: return <PauseCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-green-100 text-green-800 border-green-200";
      case "in-progress": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "not-started": return "bg-red-100 text-red-800 border-red-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getExecutionTypeColor = (executionType: string) => {
    switch (executionType) {
      case 'required': return 'bg-red-100 text-red-800 border-red-200';
      case 'parallel': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'optional': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Group tasks by step name
  const groupTasksByStep = (tasks: TaskReport[]) => {
    const grouped = tasks.reduce((acc, task) => {
      if (!acc[task.stepName]) {
        acc[task.stepName] = [];
      }
      acc[task.stepName].push(task);
      return acc;
    }, {} as Record<string, TaskReport[]>);
    
    return grouped;
  };

  const downloadReportsAsJson = () => {
    const dataStr = JSON.stringify(reports, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `stage-reports-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-800">Stage Transition Reports</h2>
            <div className="flex items-center space-x-2">
              <Button variant="outline" onClick={downloadReportsAsJson}>
                <Download className="h-4 w-4 mr-2" />
                Download JSON
              </Button>
              <Button variant="outline" onClick={onClose}>Close</Button>
            </div>
          </div>
        </div>

        <div className="flex h-[70vh]">
          {/* Reports List */}
          <div className="w-1/3 border-r border-gray-200">
            <ScrollArea className="h-full">
              <div className="p-4 space-y-3">
                {reports.map((report) => (
                  <Card
                    key={report.transitionId}
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      selectedReport?.transitionId === report.transitionId ? 'ring-2 ring-blue-500' : ''
                    }`}
                    onClick={() => setSelectedReport(report)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium text-sm">{report.fromStage}</span>
                          <ArrowRight className="h-3 w-3 text-gray-400" />
                          <span className="font-medium text-sm">{report.toStage}</span>
                        </div>
                        {getStatusIcon(report.status)}
                      </div>
                      <div className="flex items-center justify-between text-xs text-gray-600">
                        <span>{report.tasks.length} tasks</span>
                        {report.totalDuration && (
                          <span>{formatDuration(report.totalDuration)}</span>
                        )}
                      </div>
                      <Badge variant="outline" className={`text-xs mt-2 ${getStatusColor(report.status)}`}>
                        {report.status.replace('-', ' ')}
                      </Badge>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Report Details */}
          <div className="flex-1">
            {selectedReport ? (
              <ScrollArea className="h-full">
                <div className="p-6">
                  <div className="mb-6">
                    <div className="flex items-center space-x-3 mb-4">
                      <h3 className="text-lg font-semibold">
                        {selectedReport.fromStage} → {selectedReport.toStage}
                      </h3>
                      {getStatusIcon(selectedReport.status)}
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 mb-6">
                      <div className="bg-gray-50 p-3 rounded">
                        <div className="text-sm text-gray-600">Total Tasks</div>
                        <div className="text-xl font-semibold">{selectedReport.tasks.length}</div>
                      </div>
                      <div className="bg-gray-50 p-3 rounded">
                        <div className="text-sm text-gray-600">Duration</div>
                        <div className="text-xl font-semibold">
                          {selectedReport.totalDuration ? formatDuration(selectedReport.totalDuration) : 'N/A'}
                        </div>
                      </div>
                      <div className="bg-gray-50 p-3 rounded">
                        <div className="text-sm text-gray-600">Status</div>
                        <div className="text-xl font-semibold capitalize">
                          {selectedReport.status.replace('-', ' ')}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <h4 className="font-medium text-gray-800">Task Details by Step</h4>
                    {Object.entries(groupTasksByStep(selectedReport.tasks)).map(([stepName, stepTasks]) => (
                      <div key={stepName} className="space-y-3">
                        <h5 className="font-medium text-gray-700 border-b pb-2">Step: {stepName}</h5>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {stepTasks.map((task) => (
                            <Card key={task.id} className="border">
                              <CardContent className="p-4">
                                <div className="flex items-start justify-between mb-3">
                                  <div className="flex-1">
                                    <div className="flex items-center space-x-2 mb-1">
                                      <span className="font-medium text-sm">{task.featureName}</span>
                                      {getStatusIcon(task.status)}
                                    </div>
                                    <div className="flex items-center space-x-2 mt-2">
                                      <Badge variant="outline" className={`text-xs ${getExecutionTypeColor(task.executionType)}`}>
                                        {task.executionType}
                                      </Badge>
                                      <Badge variant="outline" className={`text-xs ${getStatusColor(task.status)}`}>
                                        {task.status.replace('-', ' ')}
                                      </Badge>
                                    </div>
                                  </div>
                                  <div className="text-right text-sm text-gray-600">
                                    {task.duration && (
                                      <div className="flex items-center space-x-1">
                                        <Clock className="h-3 w-3" />
                                        <span>{formatDuration(task.duration)}</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                                
                                {(task.startTime || task.completedTime) && (
                                  <div className="text-xs text-gray-500 space-y-1">
                                    {task.startTime && (
                                      <div>Started: {task.startTime.toLocaleString()}</div>
                                    )}
                                    {task.completedTime && (
                                      <div>Completed: {task.completedTime.toLocaleString()}</div>
                                    )}
                                  </div>
                                )}
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </ScrollArea>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                Select a stage transition to view details
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
