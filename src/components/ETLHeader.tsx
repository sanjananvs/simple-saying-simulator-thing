
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Users, Calendar, Eye, Plus, X, Edit } from "lucide-react";
import { useState } from "react";

interface ETLHeaderProps {
  activeTab: "pipeline" | "analytics" | "bad-data";
  onTabChange: (tab: "pipeline" | "analytics" | "bad-data") => void;
  partners: string[];
  selectedPartner: string;
  onPartnerSelect: (partner: string) => void;
  onAddPartner: (customName?: string) => void;
  onEditPartner: (oldName: string, newName: string) => void;
  onRemovePartner: (partner: string) => void;
}

export const ETLHeader = ({ 
  activeTab, 
  onTabChange, 
  partners, 
  selectedPartner, 
  onPartnerSelect,
  onAddPartner,
  onEditPartner,
  onRemovePartner
}: ETLHeaderProps) => {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [newPartnerName, setNewPartnerName] = useState("");
  const [editPartnerName, setEditPartnerName] = useState("");
  const [partnerToEdit, setPartnerToEdit] = useState("");

  const handleAddPartner = () => {
    if (newPartnerName.trim()) {
      onAddPartner(newPartnerName.trim());
      setNewPartnerName("");
      setShowAddDialog(false);
    } else {
      onAddPartner();
    }
  };

  const handleEditPartner = () => {
    if (editPartnerName.trim() && partnerToEdit) {
      onEditPartner(partnerToEdit, editPartnerName.trim());
      setEditPartnerName("");
      setPartnerToEdit("");
      setShowEditDialog(false);
    }
  };

  const openEditDialog = (partnerName: string) => {
    setPartnerToEdit(partnerName);
    setEditPartnerName(partnerName);
    setShowEditDialog(true);
  };
  return (
    <div className="bg-white border-b border-gray-200">
      <div className="px-6 py-4">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">ETL Data Flow Portal</h1>
          <p className="text-gray-600 mt-1">Comprehensive data processing monitoring and management solution</p>
        </div>
        
        {/* Filters */}
        <div className="flex items-center space-x-4 mb-6">
          <div className="flex items-center space-x-2">
            <Users className="h-4 w-4 text-gray-500" />
            <Select value={selectedPartner} onValueChange={onPartnerSelect}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Partners</SelectItem>
                {partners.map((partner) => (
                  <SelectItem key={partner} value={partner}>
                    <div className="flex items-center justify-between w-full">
                      <span>{partner}</span>
                      <div className="flex items-center space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditDialog(partner);
                          }}
                          className="h-4 w-4 p-0 hover:bg-blue-100"
                        >
                          <Edit className="h-3 w-3 text-blue-500" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            onRemovePartner(partner);
                          }}
                          className="h-4 w-4 p-0 hover:bg-red-100"
                        >
                          <X className="h-3 w-3 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-gray-500" />
            <Select defaultValue="2024-01">
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2024-01">2024-01</SelectItem>
                <SelectItem value="2023-12">2023-12</SelectItem>
                <SelectItem value="2023-11">2023-11</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center space-x-2">
            <Eye className="h-4 w-4 text-gray-500" />
            <div className="flex bg-gray-100 rounded-md p-1">
              <Button
                variant={activeTab === "pipeline" ? "default" : "ghost"}
                size="sm"
                onClick={() => onTabChange("pipeline")}
                className={activeTab === "pipeline" ? "bg-gray-900 text-white" : "text-gray-600"}
              >
                Linear
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-gray-400 cursor-not-allowed"
                disabled
              >
                Sankey
              </Button>
            </div>
          </div>

          {/* Add Partner Button */}
          <Button
            onClick={() => setShowAddDialog(true)}
            variant="outline"
            size="sm"
            className="flex items-center space-x-1"
          >
            <Plus className="h-4 w-4" />
            <span>Add Partner</span>
          </Button>
        </div>
        
        {/* Navigation Tabs */}
        <div className="flex space-x-8">
          <button
            onClick={() => onTabChange("pipeline")}
            className={`pb-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === "pipeline"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            Pipeline Visualization
          </button>
          <button
            onClick={() => onTabChange("analytics")}
            className={`pb-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === "analytics"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            Analytics & Reports
          </button>
          <button
            onClick={() => onTabChange("bad-data")}
            className={`pb-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === "bad-data"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            Bad Data Management
          </button>
        </div>
      </div>

      {/* Add Partner Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add New Data Partner</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Partner Name
              </label>
              <Input
                value={newPartnerName}
                onChange={(e) => setNewPartnerName(e.target.value)}
                placeholder="Enter partner name (optional)"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleAddPartner();
                  }
                }}
              />
              <p className="text-xs text-gray-500 mt-1">
                Leave empty to auto-generate name
              </p>
            </div>
            <div className="flex justify-end space-x-2">
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowAddDialog(false);
                  setNewPartnerName("");
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleAddPartner}>
                Add Partner
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Partner Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Partner Name</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Partner Name
              </label>
              <Input
                value={editPartnerName}
                onChange={(e) => setEditPartnerName(e.target.value)}
                placeholder="Enter new partner name"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleEditPartner();
                  }
                }}
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowEditDialog(false);
                  setEditPartnerName("");
                  setPartnerToEdit("");
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleEditPartner}>
                Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
