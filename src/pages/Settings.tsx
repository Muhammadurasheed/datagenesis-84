import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Brain, 
  Shield, 
  Zap, 
  Database,
  Bell,
  User,
  Save,
  RefreshCw,
  Key,
  Cpu,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import ModelSelector from '../components/ModelSelector';
import { useModel } from '../components/ModelProvider';
import { toast } from 'sonner';

const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState('models');
  const [showModelSelector, setShowModelSelector] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { currentModel } = useModel();

  const handleSaveChanges = async () => {
    setIsSaving(true);
    try {
      // Save settings logic here
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      toast.success('Settings saved successfully!', {
        duration: 3000,
        icon: <CheckCircle className="w-4 h-4" />
      });
    } catch (error) {
      toast.error('Failed to save settings', {
        duration: 3000,
        icon: <AlertCircle className="w-4 h-4" />
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetDefaults = () => {
    toast.info('Settings reset to defaults', {
      duration: 3000,
      icon: <RefreshCw className="w-4 h-4" />
    });
  };

  const tabs = [
    { id: 'models', label: 'AI Models', icon: Cpu },
    { id: 'agents', label: 'AI Agents', icon: Brain },
    { id: 'privacy', label: 'Privacy & Security', icon: Shield },
    { id: 'performance', label: 'Performance', icon: Zap },
    { id: 'data', label: 'Data Sources', icon: Database },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  const agentSettings = [
    {
      name: 'Privacy Agent',
      description: 'Ensures data privacy and anonymization',
      enabled: true,
      performance: 98,
      settings: {
        privacyLevel: 'Maximum',
        anonymizationMethod: 'Differential Privacy',
        retentionPeriod: '30 days'
      }
    },
    {
      name: 'Quality Agent',
      description: 'Monitors and improves data quality',
      enabled: true,
      performance: 95,
      settings: {
        qualityThreshold: '90%',
        validationRules: 'Strict',
        autoCorrection: true
      }
    },
    {
      name: 'Domain Expert Agent',
      description: 'Provides domain-specific knowledge',
      enabled: true,
      performance: 97,
      settings: {
        knowledgeBase: 'Multi-Domain',
        adaptationSpeed: 'Fast',
        confidenceThreshold: '85%'
      }
    },
    {
      name: 'Bias Detection Agent',
      description: 'Identifies and mitigates data bias',
      enabled: true,
      performance: 92,
      settings: {
        biasTypes: 'All',
        correctionLevel: 'High',
        reportingFrequency: 'Real-time'
      }
    },
  ];

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
          <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
          <p className="text-gray-400">Configure your DataGenesis AI platform</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={handleResetDefaults}
            className="px-4 py-2 bg-gray-700/50 text-white rounded-lg hover:bg-gray-600/50 transition-colors flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Reset to Defaults
          </button>
          <button 
            onClick={handleSaveChanges}
            disabled={isSaving}
            className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all flex items-center gap-2 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </motion.div>

      <div className="flex gap-6">
        {/* Sidebar */}
        <motion.div
          className="w-64 bg-gray-800/50 backdrop-blur-xl border border-gray-700/50 rounded-xl p-4"
          initial={{ x: -50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <nav className="space-y-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-300 border border-purple-500/20'
                    : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                }`}
              >
                <tab.icon className="w-5 h-5" />
                {tab.label}
              </button>
            ))}
          </nav>
        </motion.div>

        {/* Main Content */}
        <motion.div
          className="flex-1 bg-gray-800/50 backdrop-blur-xl border border-gray-700/50 rounded-xl p-6"
          initial={{ x: 50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          {activeTab === 'models' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-semibold text-white">AI Model Configuration</h2>
                <button
                  onClick={() => setShowModelSelector(true)}
                  className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all flex items-center gap-2"
                >
                  <Key className="w-4 h-4" />
                  Configure Model
                </button>
              </div>

              {currentModel ? (
                <div className="p-6 bg-gray-700/30 rounded-xl border border-gray-600/30">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-3 h-3 rounded-full bg-green-400"></div>
                    <h3 className="text-lg font-semibold text-white">Active Configuration</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Provider</label>
                      <div className="px-3 py-2 bg-gray-600/50 border border-gray-600 rounded-lg text-white capitalize">
                        {currentModel.provider}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Model</label>
                      <div className="px-3 py-2 bg-gray-600/50 border border-gray-600 rounded-lg text-white">
                        {currentModel.model}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">API Key</label>
                      <div className="px-3 py-2 bg-gray-600/50 border border-gray-600 rounded-lg text-white">
                        {'*'.repeat(12)}
                      </div>
                    </div>
                    {currentModel.endpoint && (
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Endpoint</label>
                        <div className="px-3 py-2 bg-gray-600/50 border border-gray-600 rounded-lg text-white">
                          {currentModel.endpoint}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-8 bg-gray-700/30 rounded-xl border border-gray-600/30 text-center">
                  <Cpu className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-semibold text-white mb-2">No Model Configured</h3>
                  <p className="text-gray-400 mb-4">
                    Configure an AI model to start generating synthetic data
                  </p>
                  <button
                    onClick={() => setShowModelSelector(true)}
                    className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all flex items-center gap-2 mx-auto"
                  >
                    <Key className="w-4 h-4" />
                    Configure Your First Model
                  </button>
                </div>
              )}

              <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <h3 className="text-sm font-medium text-blue-300 mb-2">Supported Providers</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-gray-400">
                  <div className="flex items-center gap-2">
                    <Brain className="w-3 h-3" />
                    Google Gemini
                  </div>
                  <div className="flex items-center gap-2">
                    <Zap className="w-3 h-3" />
                    OpenAI GPT
                  </div>
                  <div className="flex items-center gap-2">
                    <Shield className="w-3 h-3" />
                    Anthropic Claude
                  </div>
                  <div className="flex items-center gap-2">
                    <Database className="w-3 h-3" />
                    Ollama (Local)
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'agents' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold text-white">AI Agents Configuration</h2>
              
              {agentSettings.map((agent, index) => (
                <div key={index} className="p-6 bg-gray-700/30 rounded-xl border border-gray-600/30">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${agent.enabled ? 'bg-green-400' : 'bg-gray-400'}`}></div>
                      <div>
                        <h3 className="text-lg font-semibold text-white">{agent.name}</h3>
                        <p className="text-gray-400 text-sm">{agent.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm text-gray-400">Performance</p>
                        <p className="text-lg font-semibold text-green-400">{agent.performance}%</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          className="sr-only peer" 
                          checked={agent.enabled}
                          onChange={() => {}}
                        />
                        <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-500"></div>
                      </label>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {Object.entries(agent.settings).map(([key, value]) => (
                      <div key={key}>
                        <label className="block text-sm font-medium text-gray-300 mb-1">
                          {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                        </label>
                        <input
                          type="text"
                          value={value.toString()}
                          className="w-full px-3 py-2 bg-gray-600/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                          onChange={() => {}}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'privacy' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold text-white">Privacy & Security Settings</h2>
              
              <div className="space-y-4">
                <div className="p-4 bg-gray-700/30 rounded-lg">
                  <h3 className="text-lg font-semibold text-white mb-3">Data Encryption</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-300">Encryption at Rest</span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" checked />
                        <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-500"></div>
                      </label>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-300">Encryption in Transit</span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" checked />
                        <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-500"></div>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-gray-700/30 rounded-lg">
                  <h3 className="text-lg font-semibold text-white mb-3">Data Retention</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Automatic Deletion Period
                      </label>
                      <select className="w-full px-3 py-2 bg-gray-600/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500">
                        <option>30 days</option>
                        <option>60 days</option>
                        <option>90 days</option>
                        <option>Never</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'performance' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold text-white">Performance Settings</h2>
              
              <div className="space-y-4">
                <div className="p-4 bg-gray-700/30 rounded-lg">
                  <h3 className="text-lg font-semibold text-white mb-3">Generation Settings</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Max Concurrent Generations
                      </label>
                      <input
                        type="number"
                        defaultValue={5}
                        className="w-full px-3 py-2 bg-gray-600/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Memory Limit (GB)
                      </label>
                      <input
                        type="number"
                        defaultValue={16}
                        className="w-full px-3 py-2 bg-gray-600/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-gray-700/30 rounded-lg">
                  <h3 className="text-lg font-semibold text-white mb-3">Optimization</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-300">Auto-scaling</span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" checked />
                        <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-500"></div>
                      </label>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-300">Adaptive Learning</span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" checked />
                        <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-500"></div>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Add more tab content as needed */}
        </motion.div>
      </div>

      <ModelSelector
        isOpen={showModelSelector}
        onClose={() => setShowModelSelector(false)}
      />
    </div>
  );
};

export default Settings;