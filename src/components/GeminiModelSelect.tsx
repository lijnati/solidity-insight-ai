
import React from "react";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";

export type GeminiModel = {
  value: string;
  label: string;
};

type GeminiModelSelectProps = {
  models: GeminiModel[];
  value: string;
  onChange: (val: string) => void;
};

export const GeminiModelSelect: React.FC<GeminiModelSelectProps> = ({
  models,
  value,
  onChange,
}) => (
  <div className="flex flex-col sm:flex-row items-center gap-2 mb-1 mt-1">
    <div className="text-sm font-semibold text-muted-foreground mr-2 whitespace-nowrap">
      AI Model
    </div>
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-64 max-w-full bg-secondary border shadow">
        <SelectValue placeholder="Select Model" />
      </SelectTrigger>
      <SelectContent>
        {models.map((m) => (
          <SelectItem value={m.value} key={m.value}>
            {m.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  </div>
);

export default GeminiModelSelect;
