
import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { FileText, Github } from "lucide-react";

export type AuditInputProps = {
  loading: boolean;
  onAudit: (input: { mode: "code" | "github"; value: string }) => void;
};

const CODE_SNIPPET_PLACEHOLDER = `// Paste your Solidity code here...
pragma solidity ^0.8.0;

contract SimpleStorage {
    uint public data;

    function set(uint x) public {
        data = x;
    }
    function get() public view returns (uint) {
        return data;
    }
}`;

export const AuditInput: React.FC<AuditInputProps> = ({ loading, onAudit }) => {
  const [mode, setMode] = useState<"code" | "github">("code");
  const [code, setCode] = useState("");
  const [github, setGithub] = useState("");

  const handleAudit = () => {
    if (mode === "code" && !code.trim()) {
      toast({ title: "Paste some Solidity code to audit", description: "The code area is empty.", variant: "destructive" });
      return;
    }
    if (mode === "github" && !/^(https:\/\/)?(www\.)?github\.com/.test(github.trim())) {
      toast({ title: "Invalid GitHub link", description: "Please enter a valid GitHub repository or file URL.", variant: "destructive" });
      return;
    }
    onAudit({ mode, value: mode === "code" ? code : github });
  };

  return (
    <div className="w-full">
      <Tabs value={mode} onValueChange={v => setMode(v as "code" | "github")} className="w-full mb-4">
        <TabsList className="grid grid-cols-2 w-72 mx-auto">
          <TabsTrigger value="code" className="flex items-center gap-1"><FileText size={16} />Paste Code</TabsTrigger>
          <TabsTrigger value="github" className="flex items-center gap-1"><Github size={16} />GitHub Link</TabsTrigger>
        </TabsList>
        <TabsContent value="code" className="mt-6">
          <textarea
            className="w-full min-h-[300px] max-h-[500px] p-4 resize-y font-mono text-base rounded-lg border bg-background focus:ring-primary focus:border-primary transition"
            placeholder={CODE_SNIPPET_PLACEHOLDER}
            value={code}
            onChange={e => setCode(e.target.value)}
            disabled={loading}
            spellCheck={false}
          />
        </TabsContent>
        <TabsContent value="github" className="mt-6">
          <Input
            className="w-full px-3 py-2 font-mono text-base"
            placeholder="Paste a public GitHub repo or file link (e.g., https://github.com/user/repo/blob/main/Contract.sol)"
            value={github}
            onChange={e => setGithub(e.target.value)}
            disabled={loading}
            type="url"
            autoFocus
          />
        </TabsContent>
      </Tabs>
      <div className="flex justify-end mt-4">
        <Button
          onClick={handleAudit}
          disabled={loading}
          className="px-8 py-2 text-lg"
        >
          {loading ? "Auditing..." : "Audit"}
        </Button>
      </div>
    </div>
  );
};

export default AuditInput;
