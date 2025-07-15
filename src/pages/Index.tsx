import { useState } from "react";
import { LinearPipelineWithFeatures } from "@/components/LinearPipelineWithFeatures";
import { AnalyticsReports } from "@/components/AnalyticsReports";
import { BadDataManagement } from "@/components/BadDataManagement";
import { ETLHeader } from "@/components/ETLHeader";
import { ETLData } from "@/types/etl";
import { PartnerPipelineConfig } from "@/types/features";

// Start with no partners - users must add them manually
const initialSampleData: ETLData[] = [];

const Index = () => {
  const [activeTab, setActiveTab] = useState<"pipeline" | "analytics" | "bad-data">("pipeline");
  const [partners, setPartners] = useState<string[]>([]);
  const [selectedPartner, setSelectedPartner] = useState<string>("all");
  const [sampleData, setSampleData] = useState<ETLData[]>(initialSampleData);
  const [pipelineConfigs, setPipelineConfigs] = useState<PartnerPipelineConfig>({});

  const addPartner = (customName?: string) => {
    const newPartnerName = customName || `Data Partner ${String.fromCharCode(65 + partners.length)}`;
    const newPartner: ETLData = {
      id: (partners.length + 1).toString(),
      partner: newPartnerName,
      tasks: [
        { id: `t${partners.length * 3 + 1}`, name: "Data Extraction", status: "not-started", stage: "Stage 0" },
        { id: `t${partners.length * 3 + 2}`, name: "Data Validation", status: "not-started", stage: "Stage 1" },
        { id: `t${partners.length * 3 + 3}`, name: "Data Transformation", status: "not-started", stage: "Stage 2" },
      ]
    };
    
    setPartners([...partners, newPartnerName]);
    setSampleData([...sampleData, newPartner]);
  };

  const removePartner = (partnerName: string) => {
    setPartners(partners.filter(p => p !== partnerName));
    setSampleData(sampleData.filter(data => data.partner !== partnerName));
    
    // Reset selected partner if it was the one being removed
    if (selectedPartner === partnerName) {
      setSelectedPartner("all");
    }
  };

  const editPartner = (oldName: string, newName: string) => {
    if (newName.trim() && !partners.includes(newName.trim())) {
      setPartners(partners.map(p => p === oldName ? newName.trim() : p));
      setSampleData(sampleData.map(data => 
        data.partner === oldName 
          ? { ...data, partner: newName.trim() }
          : data
      ));
      
      // Update selected partner if it was the one being edited
      if (selectedPartner === oldName) {
        setSelectedPartner(newName.trim());
      }
    }
  };

  const filteredData = selectedPartner === "all" 
    ? sampleData 
    : sampleData.filter(data => data.partner === selectedPartner);

  const renderContent = () => {
    switch (activeTab) {
      case "pipeline":
        return (
          <LinearPipelineWithFeatures 
            data={filteredData} 
            onRemovePartner={removePartner}
            onEditPartner={editPartner}
            onConfigUpdate={setPipelineConfigs}
          />
        );
      case "analytics":
        return (
          <AnalyticsReports 
            partners={partners} 
            selectedPartner={selectedPartner} 
            onPartnerSelect={setSelectedPartner}
            pipelineConfigs={pipelineConfigs}
          />
        );
      case "bad-data":
        return (
          <BadDataManagement 
            partners={partners}
            selectedPartner={selectedPartner}
            onPartnerSelect={setSelectedPartner}
            pipelineConfigs={pipelineConfigs}
          />
        );
      default:
        return (
          <LinearPipelineWithFeatures 
            data={filteredData} 
            onRemovePartner={removePartner}
            onEditPartner={editPartner}
            onConfigUpdate={setPipelineConfigs}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <ETLHeader 
        activeTab={activeTab} 
        onTabChange={setActiveTab}
        partners={partners}
        selectedPartner={selectedPartner}
        onPartnerSelect={setSelectedPartner}
        onAddPartner={addPartner}
        onEditPartner={editPartner}
        onRemovePartner={removePartner}
      />
      {renderContent()}
    </div>
  );
};

export default Index;
