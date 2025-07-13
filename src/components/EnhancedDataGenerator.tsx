import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDropzone } from 'react-dropzone';
import { 
  Upload, 
  FileText, 
  Play, 
  Loader2, 
  CheckCircle, 
  Edit3,
  RefreshCw,
  FileSpreadsheet,
  Database
} from 'lucide-react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { toast } from 'sonner';
import { ApiService } from '../lib/api';
import AIProcessLogger from './AIProcessLogger';
import { useWebSocket } from '../hooks/useWebSocket';

interface GeneratedData {
  data: any[];
  metadata: {
    rows_generated: number;
    columns_generated: number;
    generation_time: string;
    quality_score: number;
    privacy_score: number;
    bias_score: number;
  };
}

const EnhancedDataGenerator: React.FC = () => {
  const [sourceData, setSourceData] = useState<any[]>([]);
  const [generatedData, setGeneratedData] = useState<GeneratedData | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentStep, setCurrentStep] = useState<'upload' | 'preview' | 'generate' | 'edit'>('upload');
  const [naturalLanguageDescription, setNaturalLanguageDescription] = useState('');
  const [generationMode, setGenerationMode] = useState<'file' | 'description'>('file');
  const [config, setConfig] = useState({
    rowCount: 100,
    domain: 'general',
    qualityLevel: 'high'
  });

  // Real-time logging
  const [logs, setLogs] = useState<any[]>([]);
  const [currentProgress, setCurrentProgress] = useState(0);
  const [showLogger, setShowLogger] = useState(false);

  // WebSocket for real-time updates
  const { lastMessage } = useWebSocket('ws://localhost:8000/ws/guest_user');

  // Handle WebSocket messages for real-time updates
  React.useEffect(() => {
    if (lastMessage) {
      try {
        const message = JSON.parse(lastMessage.data);
        if (message.type === 'generation_update') {
          const newLog = {
            id: Date.now().toString(),
            timestamp: new Date().toISOString(),
            level: message.data.status === 'error' ? 'error' : 'info',
            message: message.data.message,
            progress: message.data.progress,
            agent: message.data.phase,
            metrics: message.data.metrics
          };
          setLogs(prev => [...prev, newLog]);
          setCurrentProgress(message.data.progress || 0);
          
          if (message.data.status === 'completed') {
            setIsGenerating(false);
            setCurrentStep('edit');
          }
        }
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    }
  }, [lastMessage]);

  const parseFile = useCallback((file: File): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      const extension = file.name.split('.').pop()?.toLowerCase();
      
      if (extension === 'csv') {
        Papa.parse(file, {
          header: true,
          complete: (results) => {
            if (results.errors.length > 0) {
              reject(new Error(`CSV parsing error: ${results.errors[0].message}`));
            } else {
              resolve(results.data.filter((row: any) => Object.values(row).some(val => val !== '')));
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
            resolve(jsonData.filter((row: any) => Object.values(row).some(val => val !== null && val !== '')));
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
            resolve(Array.isArray(jsonData) ? jsonData : [jsonData]);
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

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: async (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        try {
          const file = acceptedFiles[0];
          const data = await parseFile(file);
          setSourceData(data);
          setCurrentStep('preview');
          toast.success(`Successfully loaded ${data.length} records from ${file.name}`);
        } catch (error) {
          toast.error(`Failed to parse file: ${error}`);
        }
      }
    },
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
      'application/json': ['.json']
    },
    multiple: false
  });

  const generateFromDescription = async () => {
    if (!naturalLanguageDescription.trim()) {
      toast.error('Please provide a description for the data you want to generate');
      return;
    }

    setIsGenerating(true);
    setShowLogger(true);
    setLogs([]);
    setCurrentProgress(0);

    try {
      // First generate schema from description
      const schemaResponse = await ApiService.generateSchemaFromDescription({
        description: naturalLanguageDescription,
        domain: config.domain,
        data_type: 'tabular'
      });

      // Then generate data using the schema
      const generationResponse = await ApiService.generateSyntheticData({
        schema: schemaResponse.dataset_schema,
        config,
        description: naturalLanguageDescription,
        sourceData: []
      });

      setGeneratedData(generationResponse);
      setCurrentStep('edit');
      toast.success('Data generated successfully!');
    } catch (error) {
      toast.error(`Generation failed: ${error}`);
      setIsGenerating(false);
    }
  };

  const generateFromFile = async () => {
    if (sourceData.length === 0) {
      toast.error('Please upload a data file first');
      return;
    }

    setIsGenerating(true);
    setShowLogger(true);
    setLogs([]);
    setCurrentProgress(0);

    try {
      const generationResponse = await ApiService.generateSyntheticData({
        sourceData: sourceData,
        config,
        description: `Generate synthetic data similar to the uploaded sample`,
        schema: {}
      });

      setGeneratedData(generationResponse);
      setCurrentStep('edit');
      toast.success('Data generated successfully!');
    } catch (error) {
      toast.error(`Generation failed: ${error}`);
      setIsGenerating(false);
    }
  };

  const downloadData = (format: 'csv' | 'json' | 'xlsx') => {
    if (!generatedData?.data) return;

    const data = generatedData.data;
    let blob: Blob;
    let filename: string;

    switch (format) {
      case 'csv':
        const csv = Papa.unparse(data);
        blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        filename = `synthetic_data_${Date.now()}.csv`;
        break;
      case 'json':
        blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        filename = `synthetic_data_${Date.now()}.json`;
        break;
      case 'xlsx':
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Synthetic Data');
        const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        filename = `synthetic_data_${Date.now()}.xlsx`;
        break;
      default:
        return;
    }

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Generation Mode Selector */}
      <div className="flex gap-4 p-1 bg-gray-800/50 rounded-lg">
        <button
          onClick={() => {
            setGenerationMode('file');
            setCurrentStep('upload');
          }}
          className={`flex-1 px-4 py-2 rounded-lg transition-all ${
            generationMode === 'file'
              ? 'bg-purple-500 text-white'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <Upload className="w-4 h-4 inline mr-2" />
          Upload Sample Data
        </button>
        <button
          onClick={() => {
            setGenerationMode('description');
            setCurrentStep('generate');
          }}
          className={`flex-1 px-4 py-2 rounded-lg transition-all ${
            generationMode === 'description'
              ? 'bg-purple-500 text-white'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <FileText className="w-4 h-4 inline mr-2" />
          Describe Data
        </button>
      </div>

      {/* File Upload Mode */}
      {generationMode === 'file' && (
        <AnimatePresence mode="wait">
          {currentStep === 'upload' && (
            <motion.div
              key="upload"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
                  isDragActive
                    ? 'border-purple-400 bg-purple-500/10'
                    : 'border-gray-600 hover:border-gray-500'
                }`}
              >
                <input {...getInputProps()} />
                <div className="space-y-4">
                  <div className="w-16 h-16 mx-auto bg-gray-700 rounded-full flex items-center justify-center">
                    <Upload className="w-8 h-8 text-gray-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-white mb-2">
                      Upload your sample data
                    </h3>
                    <p className="text-gray-400">
                      Drop your CSV, Excel, or JSON file here, or click to browse
                    </p>
                  </div>
                  <div className="flex gap-2 justify-center text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <FileSpreadsheet className="w-4 h-4" />
                      CSV
                    </span>
                    <span className="flex items-center gap-1">
                      <FileSpreadsheet className="w-4 h-4" />
                      Excel
                    </span>
                    <span className="flex items-center gap-1">
                      <Database className="w-4 h-4" />
                      JSON
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {currentStep === 'preview' && (
            <motion.div
              key="preview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">
                  Preview Sample Data ({sourceData.length} records)
                </h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentStep('upload')}
                    className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
                  >
                    Change File
                  </button>
                  <button
                    onClick={generateFromFile}
                    disabled={isGenerating}
                    className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all disabled:opacity-50 flex items-center gap-2"
                  >
                    {isGenerating ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Play className="w-4 h-4" />
                    )}
                    Generate Similar Data
                  </button>
                </div>
              </div>

              {/* Preview Table */}
              <div className="bg-gray-800/50 rounded-xl overflow-hidden">
                <div className="overflow-x-auto max-h-96">
                  <table className="w-full">
                    <thead className="bg-gray-700/50">
                      <tr>
                        {Object.keys(sourceData[0] || {}).map((key) => (
                          <th key={key} className="px-4 py-3 text-left text-sm font-medium text-gray-300">
                            {key}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {sourceData.slice(0, 5).map((row, index) => (
                        <tr key={index} className="border-t border-gray-700/50">
                          {Object.values(row).map((value: any, colIndex) => (
                            <td key={colIndex} className="px-4 py-3 text-sm text-gray-300">
                              {String(value).substring(0, 50)}
                              {String(value).length > 50 ? '...' : ''}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {sourceData.length > 5 && (
                  <div className="px-4 py-3 bg-gray-700/30 text-sm text-gray-400 text-center">
                    Showing 5 of {sourceData.length} rows
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      )}

      {/* Description Mode */}
      {generationMode === 'description' && currentStep === 'generate' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Describe the data you want to generate
            </label>
            <textarea
              value={naturalLanguageDescription}
              onChange={(e) => setNaturalLanguageDescription(e.target.value)}
              placeholder="E.g., Generate 100 user profiles for a dating app with names, ages, bios, interests, and locations..."
              className="w-full h-32 px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Number of Records
              </label>
              <input
                type="number"
                value={config.rowCount}
                onChange={(e) => setConfig(prev => ({ ...prev, rowCount: parseInt(e.target.value) || 100 }))}
                min="1"
                max="1000"
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Domain
              </label>
              <select
                value={config.domain}
                onChange={(e) => setConfig(prev => ({ ...prev, domain: e.target.value }))}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="general">General</option>
                <option value="healthcare">Healthcare</option>
                <option value="finance">Finance</option>
                <option value="education">Education</option>
                <option value="ecommerce">E-commerce</option>
                <option value="custom">Custom</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Quality Level
              </label>
              <select
                value={config.qualityLevel}
                onChange={(e) => setConfig(prev => ({ ...prev, qualityLevel: e.target.value }))}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="high">High Quality</option>
                <option value="medium">Medium Quality</option>
                <option value="fast">Fast Generation</option>
              </select>
            </div>
          </div>

          <button
            onClick={generateFromDescription}
            disabled={isGenerating || !naturalLanguageDescription.trim()}
            className="w-full px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Generating Data...
              </>
            ) : (
              <>
                <Play className="w-5 h-5" />
                Generate Data
              </>
            )}
          </button>
        </motion.div>
      )}

      {/* Results and Edit Mode */}
      {currentStep === 'edit' && generatedData && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Generation Results Summary */}
          <div className="bg-gradient-to-r from-green-500/10 to-blue-500/10 border border-green-500/20 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-400" />
                Generation Results
              </h3>
              <div className="flex gap-2">
                <button
                  onClick={() => downloadData('csv')}
                  className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                >
                  Download CSV
                </button>
                <button
                  onClick={() => downloadData('xlsx')}
                  className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                >
                  Download Excel
                </button>
                <button
                  onClick={() => downloadData('json')}
                  className="px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
                >
                  Download JSON
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-white">{generatedData.metadata.rows_generated}</div>
                <div className="text-sm text-gray-400">Records Generated</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-white">{generatedData.metadata.columns_generated}</div>
                <div className="text-sm text-gray-400">Columns</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-400">{generatedData.metadata.quality_score}%</div>
                <div className="text-sm text-gray-400">Quality Score</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-400">{generatedData.metadata.privacy_score}%</div>
                <div className="text-sm text-gray-400">Privacy Score</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-400">{generatedData.metadata.bias_score}%</div>
                <div className="text-sm text-gray-400">Bias Score</div>
              </div>
            </div>
          </div>

          {/* Data Preview and Edit */}
          <div className="bg-gray-800/50 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Generated Data Preview</h3>
              <div className="flex gap-2">
                <button
                  className="px-3 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm flex items-center gap-2"
                >
                  <Edit3 className="w-4 h-4" />
                  Edit Data
                </button>
                <button
                  onClick={() => {
                    setCurrentStep('upload');
                    setGeneratedData(null);
                  }}
                  className="px-3 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Generate New
                </button>
              </div>
            </div>

            <div className="overflow-x-auto max-h-96">
              <table className="w-full">
                <thead className="bg-gray-700/50 sticky top-0">
                  <tr>
                    {Object.keys(generatedData.data[0] || {}).map((key) => (
                      <th key={key} className="px-4 py-3 text-left text-sm font-medium text-gray-300">
                        {key}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {generatedData.data.slice(0, 10).map((row, index) => (
                    <tr key={index} className="border-t border-gray-700/50 hover:bg-gray-700/20">
                      {Object.values(row).map((value: any, colIndex) => (
                        <td key={colIndex} className="px-4 py-3 text-sm text-gray-300">
                          {String(value).substring(0, 50)}
                          {String(value).length > 50 ? '...' : ''}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {generatedData.data.length > 10 && (
              <div className="px-4 py-3 bg-gray-700/30 text-sm text-gray-400 text-center">
                Showing 10 of {generatedData.data.length} rows
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Real-time AI Process Logger */}
      <AIProcessLogger
        isVisible={showLogger}
        logs={logs}
        currentProgress={currentProgress}
      />
    </div>
  );
};

export default EnhancedDataGenerator;