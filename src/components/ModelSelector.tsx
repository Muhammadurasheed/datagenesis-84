import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Settings, 
  Key, 
  Check,
  X,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { useModel, ModelConfig } from './ModelProvider';

// Import provider logos
import geminiLogo from '../assets/providers/gemini-logo.png';
import openaiLogo from '../assets/providers/openai-logo.png';
import anthropicLogo from '../assets/providers/anthropic-logo.png';
import ollamaLogo from '../assets/providers/ollama-logo.png';

interface ModelSelectorProps {
  isOpen: boolean;
  onClose: () => void;
}

const ModelSelector: React.FC<ModelSelectorProps> = ({ isOpen, onClose }) => {
  const { currentModel, availableModels, setModel } = useModel();
  const [selectedProvider, setSelectedProvider] = useState<string>(currentModel?.provider || 'gemini');
  const [selectedModel, setSelectedModel] = useState(currentModel?.model || (currentModel?.provider === 'ollama' ? 'llama3.2:3b' : 'gemini-1.5-flash'));
  const [apiKey, setApiKey] = useState(currentModel?.apiKey || '');
  const [endpoint, setEndpoint] = useState(currentModel?.endpoint || 'http://localhost:11434');
  const [showApiKey, setShowApiKey] = useState(false);
  
  // Validation states
  const [validationState, setValidationState] = useState<{
    isValidating: boolean;
    status: 'idle' | 'validating' | 'success' | 'error';
    message: string;
    logs: string[];
  }>({
    isValidating: false,
    status: 'idle',
    message: '',
    logs: []
  });

  const addLog = (message: string) => {
    setValidationState(prev => ({
      ...prev,
      logs: [...prev.logs, `${new Date().toLocaleTimeString()}: ${message}`].slice(-10)
    }));
  };

  const handleSave = async () => {
    if (selectedProvider !== 'ollama' && !apiKey.trim()) {
      setValidationState({
        isValidating: false,
        status: 'error',
        message: 'Please enter an API key',
        logs: []
      });
      return;
    }

    setValidationState({
      isValidating: true,
      status: 'validating',
      message: 'Validating configuration...',
      logs: []
    });

    const config: ModelConfig = {
      provider: selectedProvider as any,
      model: selectedModel,
      apiKey: apiKey.trim(),
      ...(selectedProvider === 'ollama' ? { endpoint } : {})
    };

    try {
      addLog(`🔧 Configuring ${selectedProvider.toUpperCase()} with model ${selectedModel}`);
      
      // Configure the backend AI service
      await import('../lib/api').then(({ ApiService }) => 
        ApiService.configureAI({
          provider: config.provider,
          model: config.model,
          api_key: config.apiKey,
          endpoint: config.endpoint
        })
      );

      addLog('✅ Backend AI service configured successfully');
      
      // Save locally
      setModel(config);
      addLog('💾 Configuration saved locally');
      
      // Test the connection
      try {
        addLog('🧪 Testing AI connection...');
        await import('../lib/api').then(({ ApiService }) => ApiService.testAIConnection());
        addLog('🎯 Connection test successful!');
        
        setValidationState(prev => ({
          ...prev,
          isValidating: false,
          status: 'success',
          message: 'Configuration saved and tested successfully!'
        }));
        
        setTimeout(() => {
          onClose();
        }, 2000);
        
      } catch (testError) {
        addLog('⚠️ Connection test failed - please verify credentials');
        setValidationState(prev => ({
          ...prev,
          isValidating: false,
          status: 'error',
          message: 'Configuration saved but connection test failed. Please check your credentials.'
        }));
      }
      
    } catch (error) {
      console.error('Failed to configure AI:', error);
      addLog(`❌ Configuration failed: ${error}`);
      setValidationState({
        isValidating: false,
        status: 'error',
        message: 'Failed to configure AI service. Please check your credentials.',
        logs: validationState.logs
      });
    }
  };

  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case 'gemini': 
        return <img src={geminiLogo} alt="Gemini" className="w-5 h-5 rounded" />;
      case 'openai': 
        return <img src={openaiLogo} alt="OpenAI" className="w-5 h-5 rounded" />;
      case 'anthropic': 
        return <img src={anthropicLogo} alt="Anthropic" className="w-5 h-5 rounded" />;
      case 'ollama': 
        return <img src={ollamaLogo} alt="Ollama" className="w-5 h-5 rounded" />;
      default: 
        return <Settings className="w-5 h-5" />;
    }
  };

  const getProviderDescription = (provider: string) => {
    switch (provider) {
      case 'gemini': return 'Google\'s Gemini models - Great for general tasks and coding';
      case 'openai': return 'OpenAI GPT models - Excellent for creative and analytical tasks';
      case 'anthropic': return 'Anthropic Claude models - Strong reasoning and safety';
      case 'ollama': return 'Local models via Ollama - Privacy-focused, runs locally';
      default: return '';
    }
  };

  const getApiKeyPlaceholder = (provider: string) => {
    switch (provider) {
      case 'gemini': return 'AIzaSy...';
      case 'openai': return 'sk-...';
      case 'anthropic': return 'sk-ant-...';
      case 'ollama': return 'Not required (local)';
      default: return 'Enter your API key';
    }
  };

  if (!isOpen) return null;

  return (
    <motion.div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="bg-gray-800 rounded-xl shadow-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Settings className="w-6 h-6 text-purple-400" />
            <h2 className="text-xl font-semibold text-white">AI Model Configuration</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-6">
          {/* Provider Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">
              Choose AI Provider
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {Object.keys(availableModels).map((provider) => (
                <button
                  key={provider}
                  onClick={() => {
                    setSelectedProvider(provider);
                    // Set appropriate default model for the provider (prioritize smaller models for Ollama)
                    const defaultModel = provider === 'ollama' ? 'llama3.2:3b' : availableModels[provider][0];
                    setSelectedModel(defaultModel);
                    // Reset API key if switching to Ollama
                    if (provider === 'ollama') {
                      setApiKey('');
                    }
                  }}
                  className={`p-4 rounded-lg border-2 transition-all text-left ${
                    selectedProvider === provider
                      ? 'border-purple-500 bg-purple-500/10 text-white'
                      : 'border-gray-600 bg-gray-700/30 text-gray-300 hover:border-gray-500'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    {getProviderIcon(provider)}
                    <span className="font-medium capitalize">{provider}</span>
                    {selectedProvider === provider && (
                      <Check className="w-4 h-4 text-purple-400 ml-auto" />
                    )}
                  </div>
                  <p className="text-xs text-gray-400">
                    {getProviderDescription(provider)}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Model Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Select Model
            </label>
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              {availableModels[selectedProvider]?.map((model) => (
                <option key={model} value={model}>
                  {model}
                </option>
              ))}
            </select>
          </div>

          {/* API Key */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              API Key {selectedProvider !== 'ollama' && <span className="text-red-400">*</span>}
            </label>
            <div className="relative">
              <input
                type={showApiKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder={getApiKeyPlaceholder(selectedProvider)}
                disabled={selectedProvider === 'ollama'}
                className="w-full px-3 py-2 pr-10 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
              />
              {selectedProvider !== 'ollama' && (
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
                >
                  {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              )}
            </div>
            {selectedProvider !== 'ollama' && (
              <p className="text-xs text-gray-400 mt-1">
                Your API key is stored locally and never sent to our servers
              </p>
            )}
          </div>

          {/* Ollama Endpoint */}
          {selectedProvider === 'ollama' && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Ollama Endpoint
              </label>
              <input
                type="text"
                value={endpoint}
                onChange={(e) => setEndpoint(e.target.value)}
                placeholder="http://localhost:11434"
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <p className="text-xs text-gray-400 mt-1">
                Make sure Ollama is running. For 4GB RAM systems, use smaller models like llama3.2:1b or llama3.2:3b
              </p>
            </div>
          )}

          {/* Current Configuration */}
          {currentModel && (
            <div className="p-4 bg-gray-700/30 rounded-lg">
              <h3 className="text-sm font-medium text-gray-300 mb-2">Current Configuration</h3>
              <div className="text-xs text-gray-400 space-y-1">
                <p>Provider: <span className="text-white capitalize">{currentModel.provider}</span></p>
                <p>Model: <span className="text-white">{currentModel.model}</span></p>
                <p>API Key: <span className="text-white">{'*'.repeat(8)}</span></p>
                {currentModel.endpoint && (
                  <p>Endpoint: <span className="text-white">{currentModel.endpoint}</span></p>
                )}
              </div>
            </div>
          )}

          {/* Real-time Validation Status */}
          <AnimatePresence>
            {validationState.status !== 'idle' && (
              <motion.div
                className={`p-4 rounded-lg border ${
                  validationState.status === 'success' 
                    ? 'bg-green-500/10 border-green-500/30' 
                    : validationState.status === 'error'
                    ? 'bg-red-500/10 border-red-500/30'
                    : 'bg-blue-500/10 border-blue-500/30'
                }`}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-1">
                    {validationState.isValidating ? (
                      <Loader2 className="w-5 h-5 animate-spin text-blue-400" />
                    ) : validationState.status === 'success' ? (
                      <CheckCircle className="w-5 h-5 text-green-400" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-red-400" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className={`font-medium ${
                      validationState.status === 'success' ? 'text-green-300' 
                      : validationState.status === 'error' ? 'text-red-300'
                      : 'text-blue-300'
                    }`}>
                      {validationState.message}
                    </div>
                    
                    {validationState.logs.length > 0 && (
                      <div className="mt-2 space-y-1 max-h-32 overflow-y-auto">
                        {validationState.logs.map((log, index) => (
                          <div key={index} className="text-xs text-gray-400 font-mono">
                            {log}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              onClick={onClose}
              disabled={validationState.isValidating}
              className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={validationState.isValidating || (selectedProvider !== 'ollama' && !apiKey.trim())}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {validationState.isValidating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Validating...
                </>
              ) : (
                <>
                  <Key className="w-4 h-4" />
                  Save Configuration
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ModelSelector;