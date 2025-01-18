import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";

export const ModelSelector = () => {
  const [model, setModel] = useState("gpt-4-turbo-preview");

  return (
    <Select value={model} onValueChange={setModel}>
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="Select a model" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="gpt-4-turbo-preview">GPT-4 Turbo</SelectItem>
        <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
      </SelectContent>
    </Select>
  );
};