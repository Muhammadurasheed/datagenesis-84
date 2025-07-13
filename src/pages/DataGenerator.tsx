import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { DataGeneratorService } from '../lib/dataGenerator';
import { useStore } from '../store/useStore';
import { ApiService } from '../lib/api';
import { useWebSocket } from '../hooks/useWebSocket';
import { useModel } from '../components/ModelProvider';
  import RealTimeActivityMonitor from '../components/RealTimeActivityMonitor';
  import { DataReviewEditor } from '../components/data/DataReviewEditor';
  import { 
    Database, 
    Upload, 
    Play, 
    Download,
    FileText,
    Image,
    BarChart3,
    Brain,
    CheckCircle,
    MessageSquare,
    Lightbulb,
    Sparkles,
    AlertCircle,
    Wifi,
    WifiOff,
    Activity,
    Edit3,
    XCircle
  } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import toast from 'react-hot-toast';

const DataGenerator: React.FC = () => {
  const [selectedDataType, setSelectedDataType] = useState('tabular');
  const [selectedDomain, setSelectedDomain] = useState('');
  const [generationStep, setGenerationStep] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [uploadedData, setUploadedData] = useState<any>(null);
  const [generatedData, setGeneratedData] = useState<any>(null);
  const [generationProgress, setGenerationProgress] = useState(0);
  
  const [geminiStatus, setGeminiStatus] = useState<'unknown' | 'online' | 'offline'>('unknown');
  const [inputMethod, setInputMethod] = useState<'upload' | 'describe'>('describe');
  const [naturalLanguageDescription, setNaturalLanguageDescription] = useState('');
  const [generatedSchema, setGeneratedSchema] = useState<any>(null);
  const [isGeneratingSchema, setIsGeneratingSchema] = useState(false);
  const [backendHealthy, setBackendHealthy] = useState<boolean | null>(null);
  const [lastHealthCheck, setLastHealthCheck] = useState<Date | null>(null);
  const [generationConfig, setGenerationConfig] = useState({
    rowCount: 10000,
    quality_level: 'high',
    privacy_level: 'maximum'
  });
  
  const [showProcessLogger, setShowProcessLogger] = useState(false);
  const [aiConfigured, setAiConfigured] = useState(false);
  const [showDataEditor, setShowDataEditor] = useState(false);
  
  const { user, isGuest } = useStore();
  const { currentModel } = useModel();
  const dataService = new DataGeneratorService();
  const { lastMessage } = useWebSocket("guest_user");

  // Check backend health and AI configuration on component mount
  useEffect(() => {
    checkBackendHealth();
    checkAIConfiguration();
    const healthInterval = setInterval(checkBackendHealth, 15000);
    return () => clearInterval(healthInterval);
  }, []);

  // Check AI configuration when model changes
  useEffect(() => {
    checkAIConfiguration();
  }, [currentModel]);

  const checkBackendHealth = async () => {
    try {
      const health = await ApiService.healthCheck();
      setBackendHealthy(health.healthy);
      setLastHealthCheck(new Date());
      
      if (health.data?.services?.gemini?.status) {
        setGeminiStatus(health.data.services.gemini.status === 'ready' ? 'online' : 'online');
      }
    } catch (error) {
      setBackendHealthy(false);
      setGeminiStatus('offline');
      setLastHealthCheck(new Date());
    }
  };

  const checkAIConfiguration = async () => {
    try {
      const status = await ApiService.getAIStatus();
      setAiConfigured(status.is_configured);
      
      if (status.is_configured) {
        setGeminiStatus('online');
      }
    } catch (error) {
      setAiConfigured(false);
    }
  };
  
  
  // Listen for WebSocket updates
  useEffect(() => {
    if (lastMessage?.type === 'generation_update') {
      const { data } = lastMessage;
      
      if (data.progress !== undefined && data.progress >= 0) {
        setGenerationProgress(data.progress);
      }
      
      // Real-time logs are now handled by RealTimeActivityLogger component
      
      if (data.progress === 100) {
        setIsGenerating(false);
        setGenerationStep(4);
        toast.success('Generation completed successfully! Review your data before downloading.');
      } else if (data.progress === -1) {
        setIsGenerating(false);
        toast.error('Generation failed: ' + data.message);
      }
    }
  }, [lastMessage]);

  const dataTypes = [
    { id: 'tabular', label: 'Tabular Data', icon: Database, description: 'CSV, Excel, structured data' },
    { id: 'timeseries', label: 'Time Series', icon: BarChart3, description: 'Sequential data with timestamps' },
    { id: 'text', label: 'Text Data', icon: FileText, description: 'Natural language, documents' },
    { id: 'image', label: 'Image Data', icon: Image, description: 'Synthetic images and visual data' },
  ];

  const domains = [
    { id: 'healthcare', label: 'Healthcare', icon: '🏥' },
    { id: 'finance', label: 'Finance', icon: '💰' },
    { id: 'retail', label: 'Retail', icon: '🛍️' },
    { id: 'manufacturing', label: 'Manufacturing', icon: '🏭' },
    { id: 'education', label: 'Education', icon: '🎓' },
    { id: 'custom', label: 'Custom', icon: '⚙️' },
  ];

  const exampleDescriptions = [
    "Generate customer data for an e-commerce platform with demographics, purchase history, and preferences",
    "Create patient records for a hospital with medical conditions, treatments, and outcomes",
    "Generate financial transaction data with account information, amounts, and categories",
    "Create employee data with departments, salaries, performance metrics, and attendance",
    "Generate sensor data from IoT devices with timestamps, readings, and device status"
  ];

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/json': ['.json'],
    },
    onDrop: async (acceptedFiles) => {
      if (acceptedFiles.length === 0) return;
      
      const file = acceptedFiles[0];
      toast.loading('Processing uploaded file...');
      
      try {
        const processedData = await dataService.processUploadedData(file);
        setUploadedData(processedData);
        setGenerationStep(2);
        toast.dismiss();
        toast.success('File processed successfully!');
      } catch (error) {
        toast.dismiss();
        toast.error(`Failed to process file: ${(error as Error).message}`);
        console.error('File processing error:', error);
      }
    },
  });

  const handleGenerateSchema = async () => {
    const description = naturalLanguageDescription.trim();
    
    if (!description) {
      toast.error('Please describe the data you want to generate');
      return;
    }
    
    if (description.length < 10) {
      toast.error('Please provide a more detailed description (at least 10 characters)');
      return;
    }
    
    if (!selectedDomain) {
      toast.error('Please select a domain first');
      return;
    }
    
    if (!selectedDataType) {
      toast.error('Please select a data type first');
      return;
    }

    setIsGeneratingSchema(true);
    setGeneratedSchema(null);

    try {
      const schema = await dataService.generateSchemaFromDescription(
        description,
        selectedDomain,
        selectedDataType
      );
      
      if (!schema || !schema.schema || Object.keys(schema.schema).length === 0) {
        throw new Error('Generated schema is empty or invalid');
      }
      
      setGeneratedSchema(schema);
      setGenerationStep(2);
      
      toast.dismiss();
      toast.success(
        `Schema generated successfully! Found ${Object.keys(schema.schema).length} fields.`,
        { duration: 4000 }
      );
      
    } catch (error) {
      console.error('❌ Schema generation failed:', error);
      toast.dismiss();

      const err = error as Error & { message?: string };
      toast.error(`Schema generation failed: ${err.message ?? 'Please try again'}`, { duration: 4000 });

      setGenerationStep(1);
    } finally {
      setIsGeneratingSchema(false);
    }
  };

  const handleGenerate = async () => {
    if (!user && !isGuest) {
      toast.error('Please sign in or enter as guest to generate data');
      return;
    }
    
    setIsGenerating(true);
    setGenerationStep(3);
    setGenerationProgress(0);
    setShowProcessLogger(true);
    // Logs handled by RealTimeActivityLogger
    
    try {
      let sourceData = [];
      let schema = {};
      
      if (inputMethod === 'upload' && uploadedData) {
        sourceData = uploadedData.data || [];
        schema = uploadedData.schema || {};
      } else if (inputMethod === 'describe' && generatedSchema) {
        sourceData = generatedSchema.sample_data || [];
        schema = generatedSchema.schema || {};
      }

      // Validate inputs
      if (!selectedDomain || !selectedDataType) {
        throw new Error('Please select both domain and data type');
      }

      if (Object.keys(schema).length === 0) {
        throw new Error('No valid schema available for generation');
      }

      

      const result = await dataService.generateSyntheticDataset({
        domain: selectedDomain,
        data_type: selectedDataType,
        sourceData,
        schema,
        description: naturalLanguageDescription,
        isGuest: isGuest || !user,
        ...generationConfig
      });
      
      // Enhanced validation of result
      if (!result || !result.data || !Array.isArray(result.data)) {
        throw new Error('Invalid generation result received');
      }

      if (result.data.length === 0) {
        throw new Error('No data was generated');
      }
      
      setGeneratedData(result);
      setGenerationStep(4);
      setGenerationProgress(100);
      toast.dismiss();
      
      const rowsGenerated = result.metadata?.rowsGenerated || result.data.length;
      
      toast.success(
        `Data generation complete! ${rowsGenerated} high-quality rows generated.`, 
        { duration: 5000 }
      );
      setIsGenerating(false);
      
    } catch (error) {
      toast.dismiss();
      const err = error as Error & { message?: string };
      const errorMessage = err.message || 'Unknown generation error';
      
      toast.error(`Generation failed: ${errorMessage}`, { duration: 4000 });
      console.error('❌ Generation error:', error);
      
      setIsGenerating(false);
      setGenerationStep(2);
      setGenerationProgress(0);
    }
  };
  
  const handleExportData = async (format: 'csv' | 'json' | 'excel') => {
    if (!generatedData) return;
    
    try {
      const exportedData = await dataService.exportData(generatedData.data, format);
      
      const blob = new Blob([exportedData], { 
        type: format === 'json' ? 'application/json' : 'text/csv' 
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `synthetic-data-${Date.now()}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success(`Data exported as ${format.toUpperCase()}`);
    } catch (error) {
      toast.error('Failed to export data');
      console.error('Export error:', error);
    }
  };

  const isGenerationButtonEnabled = () => {
    const hasBasicRequirements = selectedDomain && selectedDataType;
    const hasValidInput = (inputMethod === 'describe' && generatedSchema) || 
                         (inputMethod === 'upload' && uploadedData);
    return hasBasicRequirements && hasValidInput && !isGenerating && !isGeneratingSchema;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div 
        className="flex items-center justify-between"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Data Generator</h1>
          <p className="text-gray-400">Create high-quality synthetic data with AI-powered agents</p>
          {isGuest && (
            <div className="flex items-center gap-2 mt-2 px-3 py-1 bg-blue-500/20 rounded-full border border-blue-500/30 w-fit">
              <CheckCircle className="w-4 h-4 text-blue-400" />
              <span className="text-sm text-blue-300">Guest Mode - Full Access</span>
            </div>
          )}
        </div>
        
        {/* Status Indicators */}
        <div className="flex items-center gap-2">
          {currentModel && (
            <div className="flex items-center gap-2 px-3 py-1 rounded-full border text-sm bg-purple-500/20 border-purple-500/30">
              <Brain className="w-4 h-4 text-purple-400" />
              <span className="text-purple-300 capitalize">{currentModel.provider}</span>
              <span className="text-purple-200 text-xs">{currentModel.model}</span>
            </div>
          )}
          
          {isGenerating && (
            <motion.div 
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full border border-blue-500/30"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <div className="w-3 h-3 bg-blue-400 rounded-full animate-pulse"></div>
              <span className="text-blue-300 text-sm font-medium">Processing</span>
              <span className="text-blue-200 text-xs">{generationProgress}%</span>
            </motion.div>
          )}
          
          {backendHealthy && (
            <div className="flex items-center gap-2 px-3 py-1 rounded-full border text-sm bg-green-500/20 border-green-500/30">
              <Activity className="w-4 h-4 text-green-400" />
              <span className="text-green-300">System Ready</span>
            </div>
          )}
        </div>
      </motion.div>


      {backendHealthy && geminiStatus === 'offline' && (
        <motion.div
          className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-yellow-400" />
            <div>
              <p className="text-yellow-300 font-medium">Gemini 2.0 Flash Offline</p>
              <p className="text-yellow-200 text-sm">
                Backend connected but AI service unavailable. Using intelligent fallback generation.
                Check your Gemini API key configuration for full AI capabilities.
                {lastHealthCheck && ` Last checked: ${lastHealthCheck.toLocaleTimeString()}`}
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {backendHealthy && (aiConfigured || geminiStatus === 'online') && (
        <motion.div
          className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-400" />
            <div>
              <p className="text-green-300 font-medium">
                🎯 {aiConfigured ? `${currentModel?.provider?.toUpperCase()} AI Configured` : 'Default Gemini Ready'}
              </p>
              <p className="text-green-200 text-sm">
                {aiConfigured 
                  ? `Using ${currentModel?.model} for enterprise-grade synthetic data generation.`
                  : 'Enterprise AI system operational with default configuration.'
                }
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {!aiConfigured && !geminiStatus && currentModel && (
        <motion.div
          className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-blue-400" />
            <div>
              <p className="text-blue-300 font-medium">Custom AI Model Ready</p>
              <p className="text-blue-200 text-sm">
                Using your configured {currentModel.provider} {currentModel.model} for data generation.
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Generation Steps */}
      <div className="flex items-center gap-4 p-4 bg-gray-800/50 backdrop-blur-xl border border-gray-700/50 rounded-xl">
        {['Data Input', 'Configuration', 'Generation', 'Review'].map((step, index) => (
          <div key={index} className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              index + 1 <= generationStep 
                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white' 
                : 'bg-gray-700 text-gray-400'
            }`}>
              {index + 1 <= generationStep ? <CheckCircle className="w-4 h-4" /> : index + 1}
            </div>
            <span className={`text-sm ${
              index + 1 <= generationStep ? 'text-white' : 'text-gray-400'
            }`}>
              {step}
            </span>
            {index < 3 && <div className="w-8 h-0.5 bg-gray-700"></div>}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Configuration */}
        <div className="lg:col-span-2 space-y-6">
          {/* Input Method Selection */}
          <motion.div
            className="p-6 bg-gray-800/50 backdrop-blur-xl border border-gray-700/50 rounded-xl"
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <h3 className="text-xl font-semibold text-white mb-4">How would you like to create data?</h3>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div
                onClick={() => setInputMethod('describe')}
                className={`p-4 rounded-lg cursor-pointer transition-all duration-200 ${
                  inputMethod === 'describe'
                    ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-2 border-purple-500/50'
                    : 'bg-gray-700/30 border-2 border-transparent hover:border-gray-600'
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <MessageSquare className="w-6 h-6 text-purple-400" />
                  <span className="font-medium text-white">Describe in Words</span>
                </div>
                <p className="text-sm text-gray-400">Tell us what data you need in natural language</p>
              </div>
              
              <div
                onClick={() => setInputMethod('upload')}
                className={`p-4 rounded-lg cursor-pointer transition-all duration-200 ${
                  inputMethod === 'upload'
                    ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-2 border-purple-500/50'
                    : 'bg-gray-700/30 border-2 border-transparent hover:border-gray-600'
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <Upload className="w-6 h-6 text-purple-400" />
                  <span className="font-medium text-white">Upload Sample Data</span>
                </div>
                <p className="text-sm text-gray-400">Upload a file to use as a template</p>
              </div>
            </div>

            {/* Natural Language Description */}
            {inputMethod === 'describe' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Describe the data you want to generate
                  </label>
                  <textarea
                    value={naturalLanguageDescription}
                    onChange={(e) => setNaturalLanguageDescription(e.target.value)}
                    placeholder="Example: Generate customer data for an e-commerce platform with demographics, purchase history, and preferences..."
                    className="w-full h-32 px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                  />
                </div>
                
                <div>
                  <p className="text-sm text-gray-400 mb-2">Need inspiration? Try these examples:</p>
                  <div className="grid grid-cols-1 gap-2">
                    {exampleDescriptions.slice(0, 3).map((example, index) => (
                      <button
                        key={index}
                        onClick={() => setNaturalLanguageDescription(example)}
                        className="text-left p-3 bg-gray-700/20 hover:bg-gray-600/30 rounded-lg border border-gray-600/30 hover:border-purple-500/30 transition-all duration-200"
                      >
                        <div className="flex items-start gap-2">
                          <Lightbulb className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                          <span className="text-sm text-gray-300">{example}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={handleGenerateSchema}
                  disabled={isGeneratingSchema || !naturalLanguageDescription.trim() || !selectedDomain || !selectedDataType}
                  title={
                    !naturalLanguageDescription.trim() ? 'Please enter a description' :
                    !selectedDomain ? 'Please select a domain first' :
                    !selectedDataType ? 'Please select a data type first' :
                    'Generate schema from description'
                  }
                  className={`w-full py-3 px-4 rounded-lg font-semibold transition-all duration-300 ${
                    isGeneratingSchema || !naturalLanguageDescription.trim() || !selectedDomain || !selectedDataType
                      ? 'bg-gray-600 cursor-not-allowed'
                      : 'bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600'
                  } text-white flex items-center justify-center gap-2`}
                >
                  {isGeneratingSchema ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Generating Schema...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      Generate Schema from Description
                    </>
                  )}
                </button>
              </div>
            )}

            {/* File Upload */}
            {inputMethod === 'upload' && (
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-200 ${
                  isDragActive
                    ? 'border-purple-500 bg-purple-500/10'
                    : 'border-gray-600 hover:border-gray-500'
                }`}
              >
                <input {...getInputProps()} />
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-white mb-2">
                  {isDragActive
                    ? 'Drop your files here...'
                    : 'Drag & drop files here, or click to select'}
                </p>
                <p className="text-gray-400 text-sm">
                  Supports CSV, Excel, JSON files
                </p>
              </div>
            )}
          </motion.div>

          {/* Data Type Selection */}
          <motion.div
            className="p-6 bg-gray-800/50 backdrop-blur-xl border border-gray-700/50 rounded-xl"
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <h3 className="text-xl font-semibold text-white mb-4">Select Data Type</h3>
            <div className="grid grid-cols-2 gap-4">
              {dataTypes.map((type) => (
                <div
                  key={type.id}
                  onClick={() => setSelectedDataType(type.id)}
                  className={`p-4 rounded-lg cursor-pointer transition-all duration-200 ${
                    selectedDataType === type.id
                      ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-2 border-purple-500/50'
                      : 'bg-gray-700/30 border-2 border-transparent hover:border-gray-600'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <type.icon className="w-6 h-6 text-purple-400" />
                    <span className="font-medium text-white">{type.label}</span>
                  </div>
                  <p className="text-sm text-gray-400">{type.description}</p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Domain Selection */}
          <motion.div
            className="p-6 bg-gray-800/50 backdrop-blur-xl border border-gray-700/50 rounded-xl"
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <h3 className="text-xl font-semibold text-white mb-4">Select Domain</h3>
            <div className="grid grid-cols-3 gap-4">
              {domains.map((domain) => (
                <div
                  key={domain.id}
                  onClick={() => setSelectedDomain(domain.id)}
                  className={`p-4 rounded-lg cursor-pointer transition-all duration-200 text-center ${
                    selectedDomain === domain.id
                      ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-2 border-purple-500/50'
                      : 'bg-gray-700/30 hover:bg-gray-600/30 border-2 border-transparent'
                  }`}
                >
                  <div className="text-2xl mb-2">{domain.icon}</div>
                  <span className="text-sm text-white">{domain.label}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Generation Parameters */}
          <motion.div
            className="p-6 bg-gray-800/50 backdrop-blur-xl border border-gray-700/50 rounded-xl"
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <h3 className="text-xl font-semibold text-white mb-4">Generation Parameters</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Number of Records
                </label>
                <input
                  type="number"
                  value={generationConfig.rowCount}
                  onChange={(e) => setGenerationConfig(prev => ({ 
                    ...prev, 
                    rowCount: parseInt(e.target.value) || 10000 
                  }))}
                  className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Quality Level
                </label>
                <select 
                  value={generationConfig.quality_level}
                  onChange={(e) => setGenerationConfig(prev => ({ 
                    ...prev, 
                    quality_level: e.target.value 
                  }))}
                  className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="high">High Quality (Slower)</option>
                  <option value="balanced">Balanced</option>
                  <option value="fast">Fast Generation</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Privacy Level
                </label>
                <select 
                  value={generationConfig.privacy_level}
                  onChange={(e) => setGenerationConfig(prev => ({ 
                    ...prev, 
                    privacy_level: e.target.value 
                  }))}
                  className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="maximum">Maximum Privacy</option>
                  <option value="high">High Privacy</option>
                  <option value="balanced">Balanced</option>
                </select>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status Panel */}
          <motion.div
            className="p-6 bg-gray-800/50 backdrop-blur-xl border border-gray-700/50 rounded-xl"
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <h3 className="text-lg font-semibold text-white mb-4">System Status</h3>
            
            <div className="space-y-3">
              {/* Backend Status */}
              <div className="flex items-center justify-between p-2 bg-gray-700/30 rounded">
                <div className="flex items-center gap-2">
                  {backendHealthy ? (
                    <Wifi className="w-4 h-4 text-green-400" />
                  ) : (
                    <WifiOff className="w-4 h-4 text-red-400" />
                  )}
                  <span className="text-sm text-gray-300">Backend</span>
                </div>
                <span className={`text-xs ${backendHealthy ? 'text-green-400' : 'text-red-400'}`}>
                  {backendHealthy ? 'Active' : 'Inactive'}
                </span>
              </div>
              
              {/* Gemini Status */}
              <div className="flex items-center justify-between p-2 bg-gray-700/30 rounded">
                <div className="flex items-center gap-2">
                  <Brain className="w-4 h-4 text-purple-400" />
                  <span className="text-sm text-gray-300">Gemini 2.0 Flash</span>
                </div>
                <span className={`text-xs ${geminiStatus === 'online' ? 'text-green-400' : 'text-yellow-400'}`}>
                  {geminiStatus === 'online' ? 'Ready' : 'Initializing'}
                </span>
              </div>
              
              {/* Generation Progress - Only when generating */}
              {isGenerating && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-300">AI Generation</span>
                    <span className="text-purple-300 font-medium">{generationProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <motion.div
                      className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${generationProgress}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                  <div className="text-xs text-gray-400">
                    Using {geminiStatus === 'online' ? 'Gemini 2.0 Flash' : 'Local AI Agents'}
                  </div>
                </div>
              )}
            </div>
          </motion.div>


          {/* Generate Button */}
          <motion.div
            className="p-6 bg-gray-800/50 backdrop-blur-xl border border-gray-700/50 rounded-xl"
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <button
              onClick={handleGenerate}
              disabled={!isGenerationButtonEnabled()}
              title={
                !selectedDomain ? 'Please select a domain first' :
                !selectedDataType ? 'Please select a data type first' :
                inputMethod === 'describe' && !generatedSchema ? 'Please generate schema first' :
                inputMethod === 'upload' && !uploadedData ? 'Please upload data first' :
                geminiStatus === 'online' ? 'Generate with Gemini 2.0 Flash' : 'Generate with Local AI'
              }
              className={`w-full py-3 px-4 rounded-lg font-semibold transition-all duration-300 ${
                !isGenerationButtonEnabled()
                  ? 'bg-gray-600 cursor-not-allowed'
                  : 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600'
              } text-white flex items-center justify-center gap-2`}
            >
              {isGenerating ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  {geminiStatus === 'online' ? 'Gemini Generating...' : 'AI Generating...'} {generationProgress}%
                </>
              ) : (
                <>
                  <Play className="w-5 h-5" />
                  {geminiStatus === 'online' ? 'Generate with Gemini' : 'Generate with AI'}
                </>
              )}
            </button>
          </motion.div>

          {/* Results */}
          {generatedData && (
            <motion.div
              className="p-6 bg-gray-800/50 backdrop-blur-xl border border-gray-700/50 rounded-xl"
              initial={{ x: 50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <h3 className="text-lg font-semibold text-white mb-4">Generation Results</h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Records Generated:</span>
                  <span className="text-white font-medium">
                    {generatedData.metadata?.rowsGenerated?.toLocaleString() || 0}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Columns:</span>
                  <span className="text-white font-medium">
                    {generatedData.metadata?.columnsGenerated || 0}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Quality Score:</span>
                  <span className="text-green-400 font-medium">{generatedData.qualityScore}%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Privacy Score:</span>
                  <span className="text-green-400 font-medium">{generatedData.privacyScore}%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Bias Score:</span>
                  <span className="text-green-400 font-medium">{generatedData.biasScore}%</span>
                </div>
              </div>
              <div className="space-y-2 mt-4">
                <button 
                  onClick={() => setShowDataEditor(true)}
                  className="w-full py-2 px-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all duration-300 flex items-center justify-center gap-2"
                >
                  <Edit3 className="w-4 h-4" />
                  Review & Edit Data
                </button>
                <button 
                  onClick={() => handleExportData('csv')}
                  className="w-full py-2 px-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg hover:from-green-600 hover:to-emerald-600 transition-all duration-300 flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download CSV
                </button>
                <div className="grid grid-cols-2 gap-2">
                  <button 
                    onClick={() => handleExportData('json')}
                    className="py-2 px-4 bg-gray-700/50 text-white rounded-lg hover:bg-gray-600/50 transition-all duration-300 text-sm"
                  >
                    JSON
                  </button>
                  <button 
                    onClick={() => handleExportData('excel')}
                    className="py-2 px-4 bg-gray-700/50 text-white rounded-lg hover:bg-gray-600/50 transition-all duration-300 text-sm"
                  >
                    Excel
                  </button>
                </div>
              </div>
            </motion.div>
          )}
          
          {/* Generated Schema Info */}
          {generatedSchema && inputMethod === 'describe' && (
            <motion.div
              className="p-6 bg-gray-800/50 backdrop-blur-xl border border-gray-700/50 rounded-xl"
              initial={{ x: 50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <h3 className="text-lg font-semibold text-white mb-4">Generated Schema</h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Fields:</span>
                  <span className="text-white font-medium">
                    {Object.keys(generatedSchema.schema || {}).length}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Domain:</span>
                  <span className="text-purple-400 font-medium">
                    {generatedSchema.detected_domain || selectedDomain}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Sample Rows:</span>
                  <span className="text-green-400 font-medium">
                    {generatedSchema.sample_data?.length || 0}
                  </span>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Real-time Activity Logger */}
      {(showProcessLogger && isGenerating) && (
        <motion.div
          className="fixed bottom-4 right-4 w-96 z-50"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
        >
          <RealTimeActivityMonitor 
            isGenerating={isGenerating}
            maxLogs={50}
            isCollapsible={true}
            isDraggable={true}
          />
        </motion.div>
      )}

      {/* Data Review Modal */}
      {showDataEditor && generatedData && (
        <motion.div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="bg-gray-800 rounded-xl border border-gray-700 w-full max-w-6xl h-[80vh] flex flex-col"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
          >
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
              <h2 className="text-xl font-semibold text-white">Review & Edit Generated Data</h2>
              <button
                onClick={() => setShowDataEditor(false)}
                className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
              >
                <XCircle className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              <DataReviewEditor 
                initialData={generatedData.data}
                onDataChange={(newData: any[]) => {
                  setGeneratedData((prev: any) => ({
                    ...prev,
                    data: newData
                  }));
                }}
                metadata={{
                  rowsGenerated: generatedData.data?.length || 0,
                  qualityScore: generatedData.quality_score || 0,
                  privacyScore: generatedData.privacy_score || 0,
                  biasScore: generatedData.bias_score || 0
                }}
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

export default DataGenerator;