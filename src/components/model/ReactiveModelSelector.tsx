/**
 * REACTIVE MODEL SELECTOR
 * Real-time model switching with zero-downtime failover
 * Enterprise-grade with performance monitoring
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAtom } from 'jotai';
import { 
  Settings, 
  Key, 
  Check,
  X,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  CheckCircle,
  Zap,
  Wifi,
  WifiOff,
  Activity
} from 'lucide-react';
import { 
  modelConfigAtom, 
  modelHealthAtom, 
  configureModelAtom, 
  testModelConnectionAtom,
  availableModelsAtom,
  modelStatusAtom,
  isConfiguringModelAtom,
  isTestingModelAtom
} from '../../store/modelStore';
import { toast } from 'sonner';

// Import provider logos
import geminiLogo from '../../assets/providers/gemini-logo.png';
import openaiLogo from '../../assets/providers/openai-logo.png';
import anthropicLogo from '../../assets/providers/anthropic-logo.png';
import ollamaLogo from '../../assets/providers/ollama-logo.png';

interface ReactiveModelSelectorProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ReactiveModelSelector: React.FC<ReactiveModelSelectorProps> = ({ isOpen, onClose }) => {
  const [currentModel] = useAtom(modelConfigAtom);
  const [modelHealth] = useAtom(modelHealthAtom);
  const [availableModels] = useAtom(availableModelsAtom);
  const [modelStatus] = useAtom(modelStatusAtom);
  const [isConfiguring] = useAtom(isConfiguringModelAtom);
  const [isTesting] = useAtom(isTestingModelAtom);
  const [, configureModel] = useAtom(configureModelAtom);
  const [, testConnection] = useAtom(testModelConnectionAtom);

  const [selectedProvider, setSelectedProvider] = useState<string>(currentModel?.provider || 'gemini');
  const [selectedModel, setSelectedModel] = useState(currentModel?.model || 'phi3:mini');
  const [apiKey, setApiKey] = useState(currentModel?.apiKey || '');
  const [endpoint, setEndpoint] = useState(currentModel?.endpoint || 'http://localhost:11434');
  const [showApiKey, setShowApiKey] = useState(false);

  const handleSave = async () => {
    if (selectedProvider !== 'ollama' && !apiKey.trim()) {
      toast.error('Please enter an API key');
      return;
    }

    try {
      await configureModel({
        provider: selectedProvider as any,
        model: selectedModel,
        apiKey: apiKey.trim(),
        ...(selectedProvider === 'ollama' ? { endpoint } : {})
      });

      toast.success(`${selectedProvider.toUpperCase()} model configured successfully!`);
      setTimeout(() => onClose(), 2000);
    } catch (error) {
      toast.error(`Configuration failed: ${error}`);
    }
  };

  const handleTest = async () => {
    try {
      await testConnection();
      toast.success('Connection test successful!');
    } catch (error) {
      toast.error(`Connection test failed: ${error}`);
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
      case 'gemini': return 'Google\'s latest models - Excellent for enterprise tasks';
      case 'openai': return 'OpenAI GPT models - Creative and analytical excellence';
      case 'anthropic': return 'Anthropic Claude - Advanced reasoning and safety';
      case 'ollama': return 'Local models - Complete privacy and control';
      default: return '';
    }
  };

  const getRecommendedModel = (provider: string) => {
    switch (provider) {
      case 'gemini': return 'gemini-2.0-flash-lite';
      case 'openai': return 'gpt-4.1-2025-04-14';
      case 'anthropic': return 'claude-sonnet-4-20250514';
      case 'ollama': return 'phi3:mini'; // Recommended for DataGenesis
      default: return availableModels[provider as keyof typeof availableModels]?.[0];
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
        className="bg-gray-800 rounded-xl shadow-2xl p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto"
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
              <Settings className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">AI Model Configuration</h2>
              <p className="text-sm text-gray-400">Enterprise-grade AI with real-time switching</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Current Status */}
        <div className="mb-6 p-4 bg-gray-700/30 rounded-lg border border-gray-600/30">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-300">Current Status</h3>
            <div className="flex items-center gap-2">
              {modelStatus.health.status === 'healthy' ? (
                <Wifi className="w-4 h-4 text-green-400" />
              ) : modelStatus.health.status === 'degraded' ? (
                <Activity className="w-4 h-4 text-yellow-400" />
              ) : (
                <WifiOff className="w-4 h-4 text-red-400" />
              )}
              <span className={`text-xs font-medium ${
                modelStatus.health.status === 'healthy' ? 'text-green-400' :
                modelStatus.health.status === 'degraded' ? 'text-yellow-400' : 'text-red-400'
              }`}>
                {modelStatus.health.status}
              </span>
            </div>
          </div>
          
          {currentModel ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-gray-400">Provider</p>
                <div className="flex items-center gap-2 mt-1">
                  {getProviderIcon(currentModel.provider)}
                  <span className="text-white capitalize">{currentModel.provider}</span>
                </div>
              </div>
              <div>
                <p className="text-gray-400">Model</p>
                <p className="text-white mt-1">{currentModel.model}</p>
              </div>
              <div>
                <p className="text-gray-400">Last Check</p>
                <p className="text-white mt-1">
                  {new Date(modelHealth.lastCheck).toLocaleTimeString()}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-gray-400 text-sm">No model configured</p>
          )}
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
                    setSelectedModel(getRecommendedModel(provider));
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
                    {provider === 'ollama' && (
                      <span className="ml-auto text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded">
                        RECOMMENDED
                      </span>
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
              {selectedProvider === 'ollama' && (
                <span className="ml-2 text-xs text-green-400">(phi3:mini recommended for best performance)</span>
              )}
            </label>
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              {availableModels[selectedProvider as keyof typeof availableModels]?.map((model: string) => (
                <option key={model} value={model}>
                  {model}
                  {selectedProvider === 'ollama' && model === 'phi3:mini' && ' (Recommended)'}
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
                placeholder={selectedProvider === 'ollama' ? 'Not required (local)' : 'Enter your API key'}
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
                Ensure Ollama is running. phi3:mini works best with 4GB+ RAM for optimal DataGenesis performance.
              </p>
            </div>
          )}

          {/* Real-time Status */}
          <AnimatePresence>
            {(isConfiguring || isTesting || modelHealth.status !== 'offline') && (
              <motion.div
                className={`p-4 rounded-lg border ${
                  modelHealth.status === 'healthy' 
                    ? 'bg-green-500/10 border-green-500/30' 
                    : modelHealth.status === 'degraded'
                    ? 'bg-yellow-500/10 border-yellow-500/30'
                    : 'bg-red-500/10 border-red-500/30'
                }`}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-1">
                    {isConfiguring || isTesting ? (
                      <Loader2 className="w-5 h-5 animate-spin text-blue-400" />
                    ) : modelHealth.status === 'healthy' ? (
                      <CheckCircle className="w-5 h-5 text-green-400" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-red-400" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className={`font-medium ${
                      modelHealth.status === 'healthy' ? 'text-green-300' 
                      : modelHealth.status === 'degraded' ? 'text-yellow-300'
                      : 'text-red-300'
                    }`}>
                      {isConfiguring ? 'Configuring AI model...' :
                       isTesting ? 'Testing connection...' :
                       modelHealth.message}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            {currentModel && (
              <button
                onClick={handleTest}
                disabled={isTesting || isConfiguring}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isTesting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Zap className="w-4 h-4" />
                )}
                Test Connection
              </button>
            )}

            <button
              onClick={onClose}
              disabled={isConfiguring || isTesting}
              className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            
            <button
              onClick={handleSave}
              disabled={isConfiguring || isTesting || (selectedProvider !== 'ollama' && !apiKey.trim())}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isConfiguring ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Configuring...
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