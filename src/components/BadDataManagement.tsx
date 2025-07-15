
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertTriangle, AlertCircle, Play, Users } from "lucide-react";
import { PartnerPipelineConfig } from "@/types/features";
import { Button } from "@/components/ui/button";

const summaryData = [
  { title: "Total Issues", value: 6, color: "bg-red-50 text-red-700 border-red-200" },
  { title: "Critical Issues", value: 1, color: "bg-yellow-50 text-yellow-700 border-yellow-200" },
  { title: "Affected Partners", value: 4, color: "bg-blue-50 text-blue-700 border-blue-200" }
];

const badDataIssues = [
  {
    partner: "Partner A",
    issueType: "Range Error",
    description: "Value exceeds maximum allowed range",
    severity: "high",
    date: "2024-01-15"
  },
  {
    partner: "Partner B",
    issueType: "Range Error",
    description: "Value exceeds maximum allowed range",
    severity: "critical",
    date: "2024-01-15"
  },
  {
    partner: "Partner C",
    issueType: "Constraint Violation",
    description: "Duplicate primary key detected",
    severity: "high",
    date: "2024-01-15"
  },
  {
    partner: "Partner C",
    issueType: "Format Error",
    description: "Invalid date format in column DATE_FIELD",
    severity: "high",
    date: "2024-01-15"
  },
  {
    partner: "Partner D",
    issueType: "Constraint Violation",
    description: "Duplicate primary key detected",
    severity: "high",
    date: "2024-01-15"
  },
  {
    partner: "Partner D",
    issueType: "Format Error",
    description: "Invalid date format in column DATE_FIELD",
    severity: "high",
    date: "2024-01-15"
  }
];

interface BadDataManagementProps {
  partners: string[];
  selectedPartner: string;
  onPartnerSelect: (partner: string) => void;
  pipelineConfigs: PartnerPipelineConfig;
}

export const BadDataManagement = ({ partners, selectedPartner, onPartnerSelect, pipelineConfigs }: BadDataManagementProps) => {
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

  // Generate bad data issues from pipeline configs (only show data for Stage 1B)
  const generateBadDataIssues = () => {
    const filteredConfigs = selectedPartner === "all" 
      ? pipelineConfigs 
      : { [selectedPartner]: pipelineConfigs[selectedPartner] };

    const issues: any[] = [];
    
    Object.entries(filteredConfigs).forEach(([partnerName, config]) => {
      if (!config) return;
      
      // Find Stage 1B transition
      const stage1bTransition = config.transitions.find(t => t.id === 'stage1-stage1b');
      if (stage1bTransition?.stageConfig?.steps) {
        stage1bTransition.stageConfig.steps.forEach(step => {
          step.features.forEach(featureId => {
            const feature = config.selectedFeatures.find(f => f.id === featureId);
            if (feature && (feature.status === 'completed' || feature.status === 'in-progress')) {
              issues.push({
                partner: partnerName,
                issueType: "Range Error",
                description: `Error detected in ${feature.name}`,
                severity: "high",
                date: new Date().toISOString().slice(0, 10)
              });
            }
          });
        });
      }
    });

    return issues;
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "critical":
        return <Badge className="bg-red-100 text-red-800 border-red-300">critical</Badge>;
      case "high":
        return <span className="text-gray-700 font-medium">high</span>;
      default:
        return <span className="text-gray-700 font-medium">{severity}</span>;
    }
  };

  // Show placeholder if no partners
  if (partners.length === 0) {
    return (
      <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <AlertCircle className="h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">No Data Partners Found</h3>
          <p className="text-gray-500 mb-4">Create a data partner first to view bad data management.</p>
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
              ? "Run the pipeline for any data partner to view bad data management."
              : `Run the pipeline for ${selectedPartner} to view bad data management.`
            }
          </p>
          <Button onClick={() => window.location.href = "/"} variant="outline">
            Go to Pipeline
          </Button>
        </div>
      </div>
    );
  }

  const badDataIssues = generateBadDataIssues();
  const totalIssues = badDataIssues.length;
  const criticalIssues = badDataIssues.filter(issue => issue.severity === "critical").length;
  const affectedPartners = new Set(badDataIssues.map(issue => issue.partner)).size;

  const summaryData = [
    { title: "Total Issues", value: totalIssues, color: "bg-red-50 text-red-700 border-red-200" },
    { title: "Critical Issues", value: criticalIssues, color: "bg-yellow-50 text-yellow-700 border-yellow-200" },
    { title: "Affected Partners", value: affectedPartners, color: "bg-blue-50 text-blue-700 border-blue-200" }
  ];

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

      {/* Header with warning icon */}
      <div className="flex items-center space-x-2 mb-6">
        <AlertTriangle className="h-6 w-6 text-red-500" />
        <h2 className="text-2xl font-bold text-gray-900">Bad Data Overview</h2>
        {selectedPartner !== "all" && (
          <span className="text-sm font-normal text-gray-600 ml-2">
            - {selectedPartner}
          </span>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {summaryData.map((item, index) => (
          <Card key={index} className={`shadow-sm border ${item.color}`}>
            <CardContent className="p-4">
              <div className="text-sm font-medium text-gray-600 mb-1">{item.title}</div>
              <div className="text-2xl font-bold">{item.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Bad Data Issues Table */}
      <Card className="shadow-lg">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="font-semibold text-gray-700">Partner</TableHead>
                <TableHead className="font-semibold text-gray-700">Issue Type</TableHead>
                <TableHead className="font-semibold text-gray-700">Description</TableHead>
                <TableHead className="font-semibold text-gray-700">Severity</TableHead>
                <TableHead className="font-semibold text-gray-700">Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {badDataIssues.map((issue, index) => (
                <TableRow key={index} className="hover:bg-gray-50">
                  <TableCell className="font-medium text-gray-700">{issue.partner}</TableCell>
                  <TableCell>
                    <span className="text-blue-600 font-medium">{issue.issueType}</span>
                  </TableCell>
                  <TableCell className="text-gray-700">{issue.description}</TableCell>
                  <TableCell>
                    {getSeverityBadge(issue.severity)}
                  </TableCell>
                  <TableCell className="text-gray-700">{issue.date}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
