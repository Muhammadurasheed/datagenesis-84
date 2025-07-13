import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useDropzone } from 'react-dropzone';
import { 
  Upload, 
  FileSpreadsheet, 
  Database,
  MessageSquare,
  Sparkles,
  CheckCircle,
  Loader2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { toast } from 'sonner';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';

interface EnterpriseUploadZoneProps {
  onFileUpload: (data: any[], metadata: any) => void;
  onDescriptionSubmit: (description: string, enhancedPrompt: string) => void;
  isProcessing?: boolean;
  mode: 'file' | 'description';
  onModeChange: (mode: 'file' | 'description') => void;
}

const EnterpriseUploadZone: React.FC<EnterpriseUploadZoneProps> = ({
  onFileUpload,
  onDescriptionSubmit,
  isProcessing = false,
  mode,
  onModeChange
}) => {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [description, setDescription] = useState('');
  const [enhancementPrompt, setEnhancementPrompt] = useState('');
  const [processingStatus, setProcessingStatus] = useState<'idle' | 'parsing' | 'analyzing' | 'complete'>('idle');

  const parseFile = useCallback(async (file: File): Promise<{ data: any[], metadata: any }> => {
    return new Promise((resolve, reject) => {
      const extension = file.name.split('.').pop()?.toLowerCase();
      
      const metadata = {
        filename: file.name,
        size: file.size,
        type: extension,
        uploadedAt: new Date().toISOString()
      };

      if (extension === 'csv') {
        Papa.parse(file, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            if (results.errors.length > 0) {
              reject(new Error(`CSV parsing error: ${results.errors[0].message}`));
            } else {
              const cleanData = results.data.filter((row: any) => 
                Object.values(row).some(val => val !== '' && val !== null && val !== undefined)
              );
              resolve({ 
                data: cleanData, 
                metadata: { 
                  ...metadata, 
                  columns: Object.keys(cleanData[0] || {}),
                  rows: cleanData.length,
                  detectedTypes: analyzeDataTypes(cleanData)
                }
              });
            }
          },
          error: (error) => reject(error)
        });
      } else if (extension === 'xlsx' || extension === 'xls') {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const data = e.target?.result;
            const workbook = XLSX.read(data, { type: 'binary' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet);
            const cleanData = jsonData.filter((row: any) => 
              Object.values(row).some(val => val !== null && val !== '' && val !== undefined)
            );
            resolve({ 
              data: cleanData, 
              metadata: { 
                ...metadata, 
                sheetName,
                columns: Object.keys(cleanData[0] || {}),
                rows: cleanData.length,
                detectedTypes: analyzeDataTypes(cleanData)
              }
            });
          } catch (error) {
            reject(error);
          }
        };
        reader.onerror = () => reject(new Error('Failed to read Excel file'));
        reader.readAsBinaryString(file);
      } else if (extension === 'json') {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const jsonData = JSON.parse(e.target?.result as string);
            const dataArray = Array.isArray(jsonData) ? jsonData : [jsonData];
            resolve({ 
              data: dataArray, 
              metadata: { 
                ...metadata,
                columns: Object.keys(dataArray[0] || {}),
                rows: dataArray.length,
                detectedTypes: analyzeDataTypes(dataArray)
              }
            });
          } catch (error) {
            reject(new Error('Invalid JSON format'));
          }
        };
        reader.onerror = () => reject(new Error('Failed to read JSON file'));
        reader.readAsText(file);
      } else {
        reject(new Error('Unsupported file format. Please use CSV, Excel, or JSON files.'));
      }
    });
  }, []);

  const analyzeDataTypes = (data: any[]) => {
    if (data.length === 0) return {};
    
    const sample = data[0];
    const types: Record<string, string> = {};
    
    Object.entries(sample).forEach(([key, value]) => {
      if (typeof value === 'number') {
        types[key] = 'number';
      } else if (typeof value === 'boolean') {
        types[key] = 'boolean';
      } else if (typeof value === 'string') {
        if (value.includes('@')) {
          types[key] = 'email';
        } else if (!isNaN(Date.parse(value))) {
          types[key] = 'date';
        } else {
          types[key] = 'string';
        }
      } else {
        types[key] = 'string';
      }
    });
    
    return types;
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: async (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        const file = acceptedFiles[0];
        setUploadedFile(file);
        setProcessingStatus('parsing');
        
        try {
          const result = await parseFile(file);
          setProcessingStatus('analyzing');
          
          // Simulate analysis time
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          setProcessingStatus('complete');
          onFileUpload(result.data, result.metadata);
          
          toast.success(`Successfully processed ${result.data.length} records from ${file.name}`);
        } catch (error) {
          setProcessingStatus('idle');
          toast.error(`Failed to process file: ${error}`);
        }
      }
    },
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
      'application/json': ['.json']
    },
    multiple: false,
    disabled: isProcessing
  });

  const handleDescriptionSubmit = () => {
    if (!description.trim()) {
      toast.error('Please provide a description for the data you want to generate');
      return;
    }

    const enhancedPrompt = enhancementPrompt.trim() 
      ? `${description}\n\nAdditional requirements: ${enhancementPrompt}`
      : description;

    onDescriptionSubmit(description, enhancedPrompt);
    toast.success('Starting data generation from description...');
  };

  const getProcessingIcon = () => {
    switch (processingStatus) {
      case 'parsing':
        return <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />;
      case 'analyzing':
        return <Sparkles className="w-8 h-8 text-purple-400 animate-pulse" />;
      case 'complete':
        return <CheckCircle className="w-8 h-8 text-green-400" />;
      default:
        return <Upload className="w-8 h-8 text-gray-400" />;
    }
  };

  const getProcessingText = () => {
    switch (processingStatus) {
      case 'parsing':
        return 'Parsing file structure...';
      case 'analyzing':
        return 'Analyzing data patterns...';
      case 'complete':
        return 'File processed successfully!';
      default:
        return 'Upload your data file';
    }
  };

  return (
    <div className="space-y-6">
      {/* Mode Selector */}
      <div className="flex gap-2 p-1 bg-gray-800/50 rounded-lg">
        <Button
          variant={mode === 'file' ? 'default' : 'ghost'}
          onClick={() => onModeChange('file')}
          className={`flex-1 ${mode === 'file' ? 'bg-purple-500 hover:bg-purple-600' : 'hover:bg-gray-700'}`}
        >
          <Upload className="w-4 h-4 mr-2" />
          Upload Sample Data
        </Button>
        <Button
          variant={mode === 'description' ? 'default' : 'ghost'}
          onClick={() => onModeChange('description')}
          className={`flex-1 ${mode === 'description' ? 'bg-purple-500 hover:bg-purple-600' : 'hover:bg-gray-700'}`}
        >
          <MessageSquare className="w-4 h-4 mr-2" />
          Describe Data
        </Button>
      </div>

      {/* File Upload Mode */}
      {mode === 'file' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <Card className="bg-gray-800/50 border-gray-700">
            <CardContent className="p-6">
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer ${
                  isDragActive
                    ? 'border-purple-400 bg-purple-500/10'
                    : processingStatus === 'complete'
                    ? 'border-green-400 bg-green-500/10'
                    : 'border-gray-600 hover:border-gray-500'
                } ${isProcessing ? 'opacity-50 pointer-events-none' : ''}`}
              >
                <input {...getInputProps()} />
                <div className="space-y-4">
                  <div className="w-16 h-16 mx-auto bg-gray-700 rounded-full flex items-center justify-center">
                    {getProcessingIcon()}
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-white mb-2">
                      {getProcessingText()}
                    </h3>
                    <p className="text-gray-400">
                      {processingStatus === 'idle' 
                        ? "Drop your CSV, Excel, or JSON file here, or click to browse"
                        : uploadedFile?.name
                      }
                    </p>
                  </div>
                  <div className="flex gap-2 justify-center text-sm text-gray-500">
                    <Badge variant="outline" className="border-gray-600">
                      <FileSpreadsheet className="w-3 h-3 mr-1" />
                      CSV
                    </Badge>
                    <Badge variant="outline" className="border-gray-600">
                      <FileSpreadsheet className="w-3 h-3 mr-1" />
                      Excel
                    </Badge>
                    <Badge variant="outline" className="border-gray-600">
                      <Database className="w-3 h-3 mr-1" />
                      JSON
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Description Mode */}
      {mode === 'description' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <MessageSquare className="w-5 h-5 text-purple-400" />
                Describe Your Data Requirements
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Primary Description *
                </label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the data you want to generate in detail. For example: 'Generate 100 user profiles for a dating app with names, ages between 21-40, short bios describing hobbies and interests, and locations from major cities...'"
                  className="bg-gray-700 border-gray-600 text-white min-h-[120px]"
                />
              </div>

              <Separator className="bg-gray-600" />

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Enhancement Prompt (Optional)
                </label>
                <Textarea
                  value={enhancementPrompt}
                  onChange={(e) => setEnhancementPrompt(e.target.value)}
                  placeholder="Add specific requirements, constraints, or enhancement instructions. For example: 'Ensure gender diversity', 'Include international names', 'Make bios more creative and engaging'..."
                  className="bg-gray-700 border-gray-600 text-white min-h-[80px]"
                />
                <p className="text-xs text-gray-500 mt-1">
                  This will be combined with your primary description for better results
                </p>
              </div>

              <div className="flex items-center gap-2 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <Sparkles className="w-4 h-4 text-blue-400" />
                <div className="text-sm text-blue-300">
                  <strong>Pro Tip:</strong> Be specific about data types, ranges, and relationships for better results
                </div>
              </div>

              <Button
                onClick={handleDescriptionSubmit}
                disabled={!description.trim() || isProcessing}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
              >
                {isProcessing ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4 mr-2" />
                )}
                Generate Data from Description
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
};

export default EnterpriseUploadZone;