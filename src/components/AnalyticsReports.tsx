
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from "recharts";
import { Users, AlertCircle, Play } from "lucide-react";
import { PartnerPipelineConfig } from "@/types/features";
import { Button } from "@/components/ui/button";

const taskStatusData = [
  { name: "Completed", value: 42, color: "#10B981" },
  { name: "In Progress", value: 28, color: "#F59E0B" },
  { name: "Not Started", value: 31, color: "#EF4444" }
];

const partnerCompletionData = [
  { name: "Partner A", completion: 35 },
  { name: "Partner B", completion: 58 },
  { name: "Partner C", completion: 34 },
  { name: "Partner D", completion: 45 }
];

const chartConfig = {
  completion: {
    label: "Completion Rate",
    color: "#3B82F6",
  },
};

interface AnalyticsReportsProps {
  partners: string[];
  selectedPartner: string;
  onPartnerSelect: (partner: string) => void;
  pipelineConfigs: PartnerPipelineConfig;
}

export const AnalyticsReports = ({ partners, selectedPartner, onPartnerSelect, pipelineConfigs }: AnalyticsReportsProps) => {
  // Check if any partner has pipeline data
  const hasAnyPipelineData = () => {
    return Object.keys(pipelineConfigs).length > 0 && 
           Object.values(pipelineConfigs).some(config => 
             config.selectedFeatures.some(f => f.status === 'completed' || f.status === 'in-progress')
           );
  };

  // Check if selected partner has data
  const hasSelectedPartnerData = () => {
    if (selectedPartner === "all") {
      return hasAnyPipelineData();
    }
    const config = pipelineConfigs[selectedPartner];
    return config && config.selectedFeatures.some(f => f.status === 'completed' || f.status === 'in-progress');
  };

  // Generate analytics data from pipeline configs
  const generateTaskStatusData = () => {
    const features = selectedPartner === "all" 
      ? Object.values(pipelineConfigs).flatMap(config => config.selectedFeatures)
      : pipelineConfigs[selectedPartner]?.selectedFeatures || [];
    
    const completed = features.filter(f => f.status === 'completed').length;
    const inProgress = features.filter(f => f.status === 'in-progress').length;
    const notStarted = features.filter(f => f.status === 'not-started').length;
    const total = features.length;

    if (total === 0) return [];

    return [
      { name: "Completed", value: Math.round((completed / total) * 100), color: "#10B981" },
      { name: "In Progress", value: Math.round((inProgress / total) * 100), color: "#F59E0B" },
      { name: "Not Started", value: Math.round((notStarted / total) * 100), color: "#EF4444" }
    ];
  };

  const generatePartnerCompletionData = () => {
    return partners.map(partner => {
      const config = pipelineConfigs[partner];
      if (!config) return { name: partner, completion: 0 };
      
      const features = config.selectedFeatures;
      const completed = features.filter(f => f.status === 'completed').length;
      const total = features.length;
      
      return {
        name: partner,
        completion: total > 0 ? Math.round((completed / total) * 100) : 0
      };
    }).filter(item => selectedPartner === "all" || item.name.includes(selectedPartner.split(' ').pop() || ''));
  };

  // Show placeholder if no data
  if (partners.length === 0) {
    return (
      <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <AlertCircle className="h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">No Data Partners Found</h3>
          <p className="text-gray-500 mb-4">Create a data partner first to view analytics and reports.</p>
        </div>
      </div>
    );
  }

  if (!hasSelectedPartnerData()) {
    return (
      <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
        <div className="flex items-center space-x-4 mb-6">
          <div className="flex items-center space-x-2">
            <Users className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Filter by Partner:</span>
            <Select value={selectedPartner} onValueChange={onPartnerSelect}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Partners</SelectItem>
                {partners.map((partner) => (
                  <SelectItem key={partner} value={partner}>
                    {partner}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center h-64 text-center">
          <Play className="h-12 w-12 text-blue-500 mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Pipeline Not Started</h3>
          <p className="text-gray-500 mb-4">
            {selectedPartner === "all" 
              ? "Run the pipeline for any data partner to view analytics and reports."
              : `Run the pipeline for ${selectedPartner} to view analytics and reports.`
            }
          </p>
          <Button onClick={() => window.location.href = "/"} variant="outline">
            Go to Pipeline
          </Button>
        </div>
      </div>
    );
  }

  const taskStatusData = generateTaskStatusData();
  const partnerCompletionData = generatePartnerCompletionData();
  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Partner Filter */}
      <div className="flex items-center space-x-4 mb-6">
        <div className="flex items-center space-x-2">
          <Users className="h-4 w-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Filter by Partner:</span>
          <Select value={selectedPartner} onValueChange={onPartnerSelect}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Partners</SelectItem>
              {partners.map((partner) => (
                <SelectItem key={partner} value={partner}>
                  {partner}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Task Status Distribution */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl font-semibold">
              Task Status Distribution
              {selectedPartner !== "all" && (
                <span className="text-sm font-normal text-gray-600 ml-2">
                  - {selectedPartner}
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80 flex items-center justify-center">
              <ChartContainer config={chartConfig} className="h-full w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={taskStatusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={120}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {taskStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <ChartTooltip content={<ChartTooltipContent />} />
                  </PieChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>
            <div className="mt-4 flex justify-center space-x-6">
              {taskStatusData.map((item) => (
                <div key={item.name} className="flex items-center space-x-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-sm font-medium" style={{ color: item.color }}>
                    {item.name.toUpperCase()} {item.value}%
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Partner Completion Rates */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl font-semibold">
              Partner Completion Rates
              {selectedPartner !== "all" && (
                <span className="text-sm font-normal text-gray-600 ml-2">
                  - {selectedPartner}
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                  data={selectedPartner === "all" 
                    ? partnerCompletionData 
                    : partnerCompletionData.filter(p => p.name.includes(selectedPartner.split(' ').pop() || ''))
                  } 
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <XAxis 
                    dataKey="name" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: '#6B7280' }}
                  />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: '#6B7280' }}
                    domain={[0, 60]}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar 
                    dataKey="completion" 
                    fill="#3B82F6"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Processing Timeline */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl font-semibold">
            Processing Timeline
            {selectedPartner !== "all" && (
              <span className="text-sm font-normal text-gray-600 ml-2">
                - {selectedPartner}
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32 text-gray-500">
            <p>Timeline visualization will be implemented with real-time data</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
