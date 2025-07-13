import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Upload, FileText, File, X, CheckCircle, AlertTriangle } from 'lucide-react';
import { cn } from '../lib/utils';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';

interface UploadedFile {
  file: File;
  data: any[];
  headers: string[];
  status: 'success' | 'error';
  error?: string;
}

interface FileUploadZoneProps {
  onFileUpload: (data: any[], headers: string[]) => void;
  onError?: (error: string) => void;
  className?: string;
  accept?: string[];
  maxSize?: number;
  multiple?: boolean;
}

export const FileUploadZone: React.FC<FileUploadZoneProps> = ({
  onFileUpload,
  onError,
  className,
  accept = ['.csv', '.xlsx', '.xls', '.json'],
  maxSize = 10 * 1024 * 1024, // 10MB
  multiple = false
}) => {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const processFile = useCallback(async (file: File): Promise<UploadedFile> => {
    try {
      const extension = file.name.toLowerCase().split('.').pop();
      let data: any[] = [];
      let headers: string[] = [];

      if (extension === 'csv') {
        // Parse CSV with Papa Parse
        const text = await file.text();
        const result = Papa.parse(text, {
          header: true,
          skipEmptyLines: true,
          dynamicTyping: true
        });

        if (result.errors.length > 0) {
          throw new Error(`CSV parsing error: ${result.errors[0].message}`);
        }

        data = result.data as any[];
        headers = result.meta.fields || [];
      } else if (extension === 'xlsx' || extension === 'xls') {
        // Parse Excel with SheetJS
        const arrayBuffer = await file.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        
        // Use the first sheet
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // Convert to JSON with header row
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
          header: 1,
          defval: ''
        }) as any[][];

        if (jsonData.length === 0) {
          throw new Error('Excel file is empty');
        }

        // First row as headers
        headers = jsonData[0].map(h => String(h).trim()).filter(Boolean);
        
        // Rest as data
        data = jsonData.slice(1).map(row => {
          const obj: any = {};
          headers.forEach((header, index) => {
            obj[header] = row[index] || '';
          });
          return obj;
        }).filter(row => Object.values(row).some(v => v !== ''));

      } else if (extension === 'json') {
        // Parse JSON
        const text = await file.text();
        const jsonData = JSON.parse(text);
        
        if (Array.isArray(jsonData)) {
          data = jsonData;
          if (data.length > 0 && typeof data[0] === 'object') {
            headers = Object.keys(data[0]);
          }
        } else if (typeof jsonData === 'object') {
          data = [jsonData];
          headers = Object.keys(jsonData);
        } else {
          throw new Error('JSON must be an array or object');
        }
      } else {
        throw new Error(`Unsupported file type: ${extension}`);
      }

      if (data.length === 0) {
        throw new Error('File contains no data');
      }

      if (headers.length === 0) {
        throw new Error('Could not detect column headers');
      }

      return {
        file,
        data,
        headers,
        status: 'success'
      };
    } catch (error) {
      return {
        file,
        data: [],
        headers: [],
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }, []);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setIsProcessing(true);
    
    try {
      const results: UploadedFile[] = [];
      
      for (const file of acceptedFiles) {
        const result = await processFile(file);
        results.push(result);
        
        if (result.status === 'success') {
          onFileUpload(result.data, result.headers);
        } else if (result.error) {
          onError?.(result.error);
        }
      }
      
      setUploadedFiles(prev => [...prev, ...results]);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to process files';
      onError?.(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  }, [processFile, onFileUpload, onError]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
      'application/json': ['.json']
    },
    maxSize,
    multiple
  });

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const getFileIcon = (fileName: string) => {
    const extension = fileName.toLowerCase().split('.').pop();
    switch (extension) {
      case 'csv':
      case 'xlsx':
      case 'xls':
        return <FileText className="h-4 w-4" />;
      case 'json':
        return <File className="h-4 w-4" />;
      default:
        return <File className="h-4 w-4" />;
    }
  };

  return (
    <div className={cn("space-y-4", className)}>
      <Card>
        <CardContent className="p-0">
          <div
            {...getRootProps()}
            className={cn(
              "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
              "hover:border-primary/50 hover:bg-accent/50",
              isDragActive && "border-primary bg-primary/10",
              isProcessing && "pointer-events-none opacity-50"
            )}
          >
            <input {...getInputProps()} />
            <div className="flex flex-col items-center gap-3">
              <Upload className={cn(
                "h-10 w-10 transition-colors",
                isDragActive ? "text-primary" : "text-muted-foreground"
              )} />
              
              {isDragActive ? (
                <div>
                  <p className="text-lg font-medium text-primary">Drop files here</p>
                  <p className="text-sm text-muted-foreground">Release to upload</p>
                </div>
              ) : (
                <div>
                  <p className="text-lg font-medium">
                    {isProcessing ? 'Processing files...' : 'Upload your data files'}
                  </p>
                  <p className="text-sm text-muted-foreground mb-2">
                    Drag & drop or click to select files
                  </p>
                  <div className="flex flex-wrap gap-1 justify-center">
                    {accept.map(ext => (
                      <Badge key={ext} variant="outline" className="text-xs">
                        {ext.toUpperCase()}
                      </Badge>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Max file size: {(maxSize / (1024 * 1024)).toFixed(0)}MB
                  </p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Uploaded Files</h4>
          {uploadedFiles.map((uploadedFile, index) => (
            <Card key={index} className="p-3">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 flex-1">
                  {getFileIcon(uploadedFile.file.name)}
                  <span className="text-sm font-medium truncate">
                    {uploadedFile.file.name}
                  </span>
                  <Badge variant="outline" className="text-xs">
                    {(uploadedFile.file.size / 1024).toFixed(1)} KB
                  </Badge>
                </div>
                
                <div className="flex items-center gap-2">
                  {uploadedFile.status === 'success' ? (
                    <>
                      <CheckCircle className="h-4 w-4 text-success" />
                      <Badge variant="default" className="text-xs">
                        {uploadedFile.data.length} rows
                      </Badge>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="h-4 w-4 text-destructive" />
                      <Badge variant="destructive" className="text-xs">
                        Error
                      </Badge>
                    </>
                  )}
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(index)}
                    className="h-6 w-6 p-0"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              
              {uploadedFile.error && (
                <p className="text-xs text-destructive mt-2">
                  {uploadedFile.error}
                </p>
              )}
              
              {uploadedFile.status === 'success' && uploadedFile.headers.length > 0 && (
                <div className="mt-2">
                  <p className="text-xs text-muted-foreground mb-1">Columns:</p>
                  <div className="flex flex-wrap gap-1">
                    {uploadedFile.headers.slice(0, 10).map(header => (
                      <Badge key={header} variant="outline" className="text-xs">
                        {header}
                      </Badge>
                    ))}
                    {uploadedFile.headers.length > 10 && (
                      <Badge variant="outline" className="text-xs">
                        +{uploadedFile.headers.length - 10} more
                      </Badge>
                    )}
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};