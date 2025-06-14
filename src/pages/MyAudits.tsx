
import React from "react";
import { useUserAudits } from "@/hooks/useAudits";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Download, Loader } from "lucide-react";
import { format } from "date-fns";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";

const AuditItem = ({ audit }: { audit: any }) => {
  const handleDownload = () => {
    const blob = new Blob([JSON.stringify(audit, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const now = new Date();
    const fileName = `solidity-audit-report-${format(now, "yyyyMMdd-HHmmss")}.json`;
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      URL.revokeObjectURL(url);
      document.body.removeChild(a);
    }, 250);
  };

  return (
    <Card className="p-4 flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <FileText className="text-primary" size={20} />
        <span className="text-lg font-semibold">Audit from {format(new Date(audit.created_at), "PPpp")}</span>
      </div>
      <pre className="bg-muted text-xs rounded p-2 overflow-x-auto max-h-40">{audit.source_code.slice(0, 350)}{audit.source_code.length > 350 ? "..." : ""}</pre>
      <Button size="sm" variant="outline" onClick={handleDownload} className="w-fit gap-2"><Download size={16}/>Download Report</Button>
    </Card>
  );
};

export default function MyAudits() {
  const { user, loading } = useSupabaseAuth();
  const { data, isLoading, error } = useUserAudits();

  if (loading || isLoading) {
    return (
      <div className="flex flex-col items-center mt-16">
        <Loader className="animate-spin mb-4" size={32} />
        <span>Loading audits...</span>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center mt-20 text-lg">
        Please <span className="text-blue-600 underline mx-1"><a href="/auth">log in</a></span> to view your past audits.
      </div>
    );
  }

  if (error) {
    return <div className="text-red-600">{String(error.message || error)}</div>;
  }

  return (
    <div className="max-w-4xl mx-auto mt-10 flex flex-col gap-6 min-h-[300px]">
      <h2 className="text-2xl font-bold mb-4">My Past Solidity Audits</h2>
      {(!data || data.length === 0) ? (
        <Card className="p-8 text-xl text-muted-foreground flex justify-center">
          No past audits found.
        </Card>
      ) : (
        <div className="flex flex-col gap-4">
          {data.map((audit) => (
            <AuditItem audit={audit} key={audit.id} />
          ))}
        </div>
      )}
    </div>
  );
}
