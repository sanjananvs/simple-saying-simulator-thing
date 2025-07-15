
import { FeatureGroup } from "@/types/features";

export const featureGroups: FeatureGroup[] = [
  {
    id: "data-file-checks",
    name: "Data File Checks",
    description: "Features for validating data file integrity and structure",
    color: "bg-blue-500",
    features: [
      { id: "1001", name: "check for new file", description: "Verify if new data files are present", category: "data-file-checks", icon: "📄", priority: "high", estimatedTime: 25, status: "not-started" },
      { id: "1002", name: "check for blank file", description: "Detect empty or blank data files", category: "data-file-checks", icon: "📋", priority: "high", estimatedTime: 20, status: "not-started" },
      { id: "1003", name: "check for corrupt file", description: "Identify corrupted or damaged files", category: "data-file-checks", icon: "🔍", priority: "high", estimatedTime: 30, status: "not-started" },
      { id: "1004", name: "Load file", description: "Load data file into processing system", category: "data-file-checks", icon: "📥", priority: "medium", estimatedTime: 25, status: "not-started" }
    ]
  },
  {
    id: "formatting",
    name: "Formatting",
    description: "Features for data formatting and standardization",
    color: "bg-green-500",
    features: [
      { id: "1005", name: "check blank row", description: "Identify and handle blank rows in data", category: "formatting", icon: "📊", priority: "medium", estimatedTime: 20, status: "not-started" },
      { id: "1006", name: "check header row", description: "Validate header row structure and content", category: "formatting", icon: "🏷️", priority: "high", estimatedTime: 25, status: "not-started" },
      { id: "1007", name: "check data row", description: "Validate data row format and structure", category: "formatting", icon: "📋", priority: "high", estimatedTime: 30, status: "not-started" },
      { id: "1008", name: "check invalid row", description: "Detect and flag invalid data rows", category: "formatting", icon: "❌", priority: "medium", estimatedTime: 25, status: "not-started" },
      { id: "1014", name: "change date format of entire date", description: "Standardize date formats across dataset", category: "formatting", icon: "📅", priority: "medium", estimatedTime: 30, status: "not-started" },
      { id: "1015", name: "remove empty columns", description: "Clean up empty or unnecessary columns", category: "formatting", icon: "🗑️", priority: "low", estimatedTime: 15, status: "not-started" },
      { id: "1016", name: "convert number to standard number format", description: "Normalize numeric data formats", category: "formatting", icon: "🔢", priority: "medium", estimatedTime: 20, status: "not-started" },
      { id: "1013", name: "change date format of year", description: "Standardize year format in dates", category: "formatting", icon: "📆", priority: "low", estimatedTime: 18, status: "not-started" }
    ]
  },
  {
    id: "member-validation",
    name: "Member Validation",
    description: "Features for validating member data and status",
    color: "bg-purple-500",
    features: [
      { id: "1009", name: "check if member id is new", description: "Verify if member ID is new to the system", category: "member-validation", icon: "👤", priority: "high", estimatedTime: 25, status: "not-started" },
      { id: "1011", name: "check if member id is expired", description: "Validate member ID expiration status", category: "member-validation", icon: "⏰", priority: "medium", estimatedTime: 22, status: "not-started" },
      { id: "1012", name: "check if membership is expired", description: "Validate membership expiration status", category: "member-validation", icon: "🎫", priority: "medium", estimatedTime: 20, status: "not-started" }
    ]
  },
  {
    id: "product-validation",
    name: "Product Validation",
    description: "Features for validating product data",
    color: "bg-orange-500",
    features: [
      { id: "1010", name: "check if product is new", description: "Verify if product is new to the system", category: "product-validation", icon: "📦", priority: "high", estimatedTime: 28, status: "not-started" }
    ]
  }
];
