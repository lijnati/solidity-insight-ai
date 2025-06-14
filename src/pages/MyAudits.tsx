import React, { useState, useMemo } from "react";
import { useUserAudits } from "@/hooks/useAudits";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FileText, Download, Loader, Filter, Search } from "lucide-react";
import { format } from "date-fns";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";

const SEVERITY_LEVELS = ["high", "medium", "low"];

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

  // Try to extract severity from report.vulnerabilities
  let highestSeverity = null;
  try {
    if (Array.isArray(audit.report?.vulnerabilities) && audit.report.vulnerabilities.length > 0) {
      const priorities = { high: 3, medium: 2, low: 1 };
      highestSeverity =
        audit.report.vulnerabilities.reduce(
          (acc, v) => (priorities[v.severity] > priorities[acc] ? v.severity : acc),
          "low"
        );
    }
  } catch (e) {
    highestSeverity = null;
  }

  return (
    <Card className="p-3 flex flex-col gap-2 sm:p-4">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-4">
        <div className="flex items-center gap-2">
          <FileText className="text-primary" size={20} />
          <span className="text-base sm:text-lg font-semibold">
            Audit from {format(new Date(audit.created_at), "PPpp")}
          </span>
        </div>
        {highestSeverity && (
          <span
            className={
              "px-2 py-0.5 rounded text-xs font-semibold ml-1 " +
              (highestSeverity === "high"
                ? "bg-red-200 text-red-700"
                : highestSeverity === "medium"
                ? "bg-yellow-200 text-yellow-700"
                : "bg-blue-100 text-blue-700")
            }
          >
            {highestSeverity.charAt(0).toUpperCase() + highestSeverity.slice(1)} Severity
          </span>
        )}
      </div>
      <pre className="bg-muted text-xs rounded p-2 overflow-x-auto max-h-40">
        {audit.source_code.slice(0, 350)}
        {audit.source_code.length > 350 ? "..." : ""}
      </pre>
      <Button size="sm" variant="outline" onClick={handleDownload} className="w-fit mt-1 gap-2">
        <Download size={16} />
        Download Report
      </Button>
    </Card>
  );
};

export default function MyAudits() {
  const { user, loading } = useSupabaseAuth();
  const { data, isLoading, error } = useUserAudits();

  // Search/filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [severity, setSeverity] = useState<string | "">("");

  // Compute filtered audits
  const filtered = useMemo(() => {
    if (!data) return [];
    return data.filter((a) => {
      // Search: matches if found in code OR vulnerabilities
      let found = true;
      if (searchTerm) {
        const lc = searchTerm.toLowerCase();
        found =
          (a.source_code && a.source_code.toLowerCase().includes(lc)) ||
          (a.report?.vulnerabilities &&
            JSON.stringify(a.report.vulnerabilities).toLowerCase().includes(lc));
      }
      // Date filter
      let dateMatch = true;
      if (dateFrom) {
        dateMatch = new Date(a.created_at) >= new Date(dateFrom);
      }
      if (dateMatch && dateTo) {
        dateMatch = new Date(a.created_at) <= new Date(dateTo);
      }
      // Severity filter
      let severityMatch = true;
      if (severity && Array.isArray(a.report?.vulnerabilities) && a.report.vulnerabilities.length > 0) {
        severityMatch = a.report.vulnerabilities.some((v: any) => v.severity === severity);
      } else if (severity && (!a.report?.vulnerabilities || a.report.vulnerabilities.length === 0)) {
        severityMatch = false;
      }
      return found && dateMatch && severityMatch;
    });
  }, [data, searchTerm, dateFrom, dateTo, severity]);

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
      <div className="flex flex-col items-center mt-20 text-base sm:text-lg">
        Please{" "}
        <span className="text-blue-600 underline mx-1">
          <a href="/auth">log in</a>
        </span>{" "}
        to view your past audits.
      </div>
    );
  }

  if (error) {
    return <div className="text-red-600">{String(error.message || error)}</div>;
  }

  return (
    <div className="max-w-4xl mx-auto mt-8 flex flex-col gap-6 min-h-[300px] px-2">
      <h2 className="text-xl sm:text-2xl font-bold mb-2 sm:mb-4 text-left">My Past Solidity Audits</h2>
      {/* Search and filter UI */}
      <Card className="p-3 sm:p-4 mb-2 flex flex-col gap-3 sm:flex-row sm:items-end sm:gap-4">
        <div className="flex flex-col gap-1 w-full sm:w-1/2">
          <label className="text-xs font-semibold mb-1 flex items-center gap-1">
            <Search size={16} className="text-muted-foreground" />
            Search
          </label>
          <Input
            type="text"
            placeholder="Search by code or vulnerability..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold mb-1">Date From</label>
          <Input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="w-32 sm:w-40"
            max={dateTo || undefined}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold mb-1">Date To</label>
          <Input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="w-32 sm:w-40"
            min={dateFrom || undefined}
          />
        </div>
        <div className="flex flex-col gap-1 min-w-[80px] sm:min-w-[110px]">
          <label className="text-xs font-semibold mb-1">
            <Filter size={16} className="text-muted-foreground" /> Severity
          </label>
          <select
            className="w-full p-2 border rounded text-sm bg-background"
            value={severity}
            onChange={(e) => setSeverity(e.target.value)}
          >
            <option value="">All</option>
            {SEVERITY_LEVELS.map((s) => (
              <option key={s} value={s}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </option>
            ))}
          </select>
        </div>
        {(searchTerm || dateFrom || dateTo || severity) && (
          <Button
            variant="ghost"
            type="button"
            onClick={() => {
              setSearchTerm("");
              setDateFrom("");
              setDateTo("");
              setSeverity("");
            }}
            className="h-9 sm:h-10 mt-3 sm:mt-0"
          >
            Reset
          </Button>
        )}
      </Card>

      {!filtered || filtered.length === 0 ? (
        <Card className="p-8 text-base sm:text-xl text-muted-foreground flex justify-center">
          No past audits found.
        </Card>
      ) : (
        <div className="flex flex-col gap-3 sm:gap-4">
          {filtered.map((audit) => (
            <AuditItem audit={audit} key={audit.id} />
          ))}
        </div>
      )}
    </div>
  );
}
