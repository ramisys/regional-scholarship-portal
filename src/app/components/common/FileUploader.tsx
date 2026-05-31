import { useRef, useState, type ChangeEvent, type DragEvent } from "react";
import { CheckCircle2, FileText, Upload, X } from "lucide-react";

import { cn } from "../../utils/cn";
import { Button } from "../ui/button";

interface FileUploaderProps {
  onFileSelect: (files: File[]) => void;
  accept?: string;
  maxSize?: number;
  multiple?: boolean;
  uploadedFiles?: Array<{ id: string; name: string; url: string }>;
  onRemove?: (id: string) => void;
  disabled?: boolean;
}

export const FileUploader = ({
  onFileSelect,
  accept = ".pdf,.doc,.docx,.jpg,.jpeg,.png",
  maxSize = 5 * 1024 * 1024,
  multiple = true,
  uploadedFiles = [],
  onRemove,
  disabled = false,
}: FileUploaderProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    validateAndSelectFiles(files);
  };

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      validateAndSelectFiles(files);
      e.target.value = "";
    }
  };

  const validateAndSelectFiles = (files: File[]) => {
    setError("");
    const oversized = files.filter((file) => file.size > maxSize);

    if (oversized.length > 0) {
      setError(`Some files exceed ${maxSize / 1024 / 1024}MB limit`);
      return;
    }

    onFileSelect(files);
  };

  return (
    <div className="space-y-4">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={disabled ? undefined : handleDrop}
        className={cn(
          "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
          disabled ? "cursor-not-allowed border-gray-200 bg-gray-50 opacity-70" : "cursor-pointer",
          !disabled && (isDragging ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-gray-400"),
        )}
        onClick={() => {
          if (!disabled) {
            fileInputRef.current?.click();
          }
        }}
      >
        <Upload className="h-10 w-10 mx-auto mb-4 text-gray-400" />
        <p className="mb-2 font-medium text-gray-700">
          Drag and drop files here, or click to browse
        </p>
        <p className="text-sm text-gray-500">
          Accepted formats: {accept.split(",").join(", ")} (Max {maxSize / 1024 / 1024}MB)
        </p>
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept={accept}
          multiple={multiple}
          onChange={handleFileSelect}
          disabled={disabled}
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-medium text-gray-700">Uploaded Files</h4>
          {uploadedFiles.map((file) => (
            <div
              key={file.id}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
            >
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900">{file.name}</p>
                </div>
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              </div>
              {onRemove && (
                <Button variant="ghost" size="sm" onClick={() => onRemove(file.id)}>
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
