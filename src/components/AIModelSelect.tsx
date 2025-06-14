
import React from "react";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { VENDORS, getModelsForVendor, AIVendor, AIModel } from "@/utils/aiModels";

type AIModelSelectProps = {
  vendor: AIVendor;
  setVendor: (v: AIVendor) => void;
  model: string;
  setModel: (m: string) => void;
};

export const AIModelSelect: React.FC<AIModelSelectProps> = ({
  vendor, setVendor, model, setModel,
}) => (
  <div className="flex flex-col sm:flex-row items-center gap-3 mb-2 mt-2">
    {/* Vendor select */}
    <div className="flex items-center gap-1">
      <div className="text-sm font-semibold text-muted-foreground">AI Vendor</div>
      <Select value={vendor} onValueChange={setVendor}>
        <SelectTrigger className="w-36 bg-secondary border shadow ml-2">
          <SelectValue placeholder="Select Vendor" />
        </SelectTrigger>
        <SelectContent>
          {VENDORS.map((v) => (
            <SelectItem key={v.value} value={v.value}>
              {v.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
    {/* Model select */}
    <div className="flex items-center gap-1">
      <div className="text-sm font-semibold text-muted-foreground">Model</div>
      <Select value={model} onValueChange={setModel}>
        <SelectTrigger className="w-64 max-w-full bg-secondary border shadow ml-2">
          <SelectValue placeholder="Select Model" />
        </SelectTrigger>
        <SelectContent>
          {getModelsForVendor(vendor).map((m) => (
            <SelectItem value={m.value} key={m.value}>
              {m.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  </div>
);

export default AIModelSelect;
