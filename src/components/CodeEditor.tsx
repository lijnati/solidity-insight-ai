
import React from "react";
import MonacoEditor from "@monaco-editor/react";

export type CodeEditorProps = {
  value: string;
  onChange: (val: string) => void;
  height?: string;
  disabled?: boolean;
};

export const CodeEditor: React.FC<CodeEditorProps> = ({
  value,
  onChange,
  height = "300px",
  disabled = false,
}) => {
  return (
    <div className="border rounded-lg overflow-hidden bg-background shadow focus-within:ring-2 focus-within:ring-primary transition">
      <MonacoEditor
        height={height}
        defaultLanguage="solidity"
        language="solidity"
        theme="vs-dark"
        value={value}
        options={{
          minimap: { enabled: false },
          readOnly: disabled,
          fontSize: 15,
          fontFamily: "Fira Mono, monospace",
          scrollBeyondLastLine: false,
          wordWrap: "on",
          renderLineHighlight: "all",
        }}
        onChange={(v) => onChange(v || "")}
      />
    </div>
  );
};

export default CodeEditor;
