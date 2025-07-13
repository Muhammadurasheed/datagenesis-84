import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Wifi, 
  WifiOff, 
  Activity, 
  Zap, 
  Brain, 
  Shield, 
  Users,
  CheckCircle,
  AlertCircle,
  Clock,
  Cog,
  Database,
  Target,
  Lock,
  Search,
  Package
} from 'lucide-react';
import { useWebSocket } from '../hooks/useWebSocket';
import { ApiService } from '../lib/api';

interface BackendStatus {
  healthy: boolean;
  geminiStatus: 'online' | 'offline' | 'unknown';
  agentsActive: boolean;
  lastCheck: Date | null;
}

interface AgentStatus {
  name: string;
  status: 'active' | 'processing' | 'error' | 'idle';
  performance: number;
  lastUpdate: string;
}

interface ProcessLog {
  step: string;
  progress: number;
  message: string;
  timestamp: string;
  job_id?: string;
  agent_data?: any;
  gemini_status?: string;
}

export const RealTimeStatus: React.FC = () => {
  const [backendStatus, setBackendStatus] = useState<BackendStatus>({
    healthy: false,
    geminiStatus: 'unknown',
    agentsActive: false,
    lastCheck: null
  });
  
  const [agents, setAgents] = useState<AgentStatus[]>([
    { name: 'Privacy Agent', status: 'idle', performance: 95, lastUpdate: '' },
    { name: 'Quality Agent', status: 'idle', performance: 92, lastUpdate: '' },
    { name: 'Domain Expert', status: 'idle', performance: 98, lastUpdate: '' },
    { name: 'Bias Detector', status: 'idle', performance: 88, lastUpdate: '' }
  ]);
  
  const [processLogs, setProcessLogs] = useState<ProcessLog[]>([]);
  const [currentGeneration, setCurrentGeneration] = useState<{
    active: boolean;
    job_id?: string;
    current_step?: string;
    progress?: number;
  }>({ active: false });

  const { isConnected, lastMessage } = useWebSocket("generation");

  // Check backend health periodically
  useEffect(() => {
    const checkHealth = async () => {
      try {
        const health = await ApiService.healthCheck();
        setBackendStatus({
          healthy: health.healthy,
          geminiStatus: health.data?.services?.gemini?.status === 'ready' ? 'online' : 'offline',
          agentsActive: health.data?.services?.agents === 'active',
          lastCheck: new Date()
        });
      } catch (error) {
        setBackendStatus(prev => ({
          ...prev,
          healthy: false,
          geminiStatus: 'offline',
          lastCheck: new Date()
        }));
      }
    };

    checkHealth();
    const interval = setInterval(checkHealth, 10000); // Check every 10 seconds
    return () => clearInterval(interval);
  }, []);

  // Listen for real-time updates via WebSocket
  useEffect(() => {
    if (lastMessage?.type === 'generation_update') {
      const data = lastMessage.data as ProcessLog;
      
      // Update process logs
      setProcessLogs(prev => {
        const newLogs = [...prev, data].slice(-20); // Keep last 20 logs
        return newLogs;
      });
      
      // Update current generation status
      setCurrentGeneration({
        active: data.progress < 100 && data.progress >= 0,
        job_id: data.job_id,
        current_step: data.step,
        progress: data.progress
      });
      
      // Clear logs after completion or error
      if (data.progress === 100 || data.progress === -1) {
        setTimeout(() => {
          setCurrentGeneration({ active: false });
          // Keep successful completion log for 5 seconds, then clear
          if (data.progress === 100) {
            setTimeout(() => setProcessLogs([]), 5000);
          }
        }, 2000);
      }
    }
    
    // Legacy agent updates
    if (lastMessage?.type === 'agent_update') {
      const { agent_id, status } = lastMessage.data;
      setAgents(prev => prev.map(agent => 
        agent.name.toLowerCase().includes(agent_id.toLowerCase()) 
          ? { ...agent, status: status.status, performance: status.performance, lastUpdate: new Date().toLocaleTimeString() }
          : agent
      ));
    }
  }, [lastMessage]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online':
      case 'active':
        return 'text-green-400 bg-green-500/20 border-green-500/30';
      case 'processing':
        return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30';
      case 'offline':
      case 'error':
        return 'text-red-400 bg-red-500/20 border-red-500/30';
      default:
        return 'text-gray-400 bg-gray-500/20 border-gray-500/30';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online':
      case 'active':
        return <CheckCircle className="w-4 h-4" />;
      case 'processing':
        return <Activity className="w-4 h-4 animate-pulse" />;
      case 'offline':
      case 'error':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getStepIcon = (step: string) => {
    switch (step) {
      case 'initialization':
        return <Cog className="w-4 h-4 text-blue-400" />;
      case 'domain_analysis':
        return <Brain className="w-4 h-4 text-purple-400" />;
      case 'privacy_assessment':
        return <Lock className="w-4 h-4 text-green-400" />;
      case 'bias_detection':
        return <Target className="w-4 h-4 text-orange-400" />;
      case 'relationship_mapping':
        return <Search className="w-4 h-4 text-cyan-400" />;
      case 'quality_planning':
        return <Target className="w-4 h-4 text-yellow-400" />;
      case 'data_generation':
        return <Brain className="w-4 h-4 text-pink-400" />;
      case 'quality_validation':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'final_assembly':
        return <Package className="w-4 h-4 text-blue-400" />;
      case 'completion':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-400" />;
      default:
        return <Activity className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStepLabel = (step: string) => {
    const labels: Record<string, string> = {
      'initialization': 'Initializing',
      'domain_analysis': 'Domain Analysis',
      'privacy_assessment': 'Privacy Assessment',
      'bias_detection': 'Bias Detection',
      'relationship_mapping': 'Relationship Mapping',
      'quality_planning': 'Quality Planning',
      'data_generation': 'Data Generation',
      'quality_validation': 'Quality Validation',
      'final_assembly': 'Final Assembly',
      'completion': 'Completed',
      'error': 'Error'
    };
    return labels[step] || step;
  };

  return (
    <div className="space-y-4">
      {/* Backend Connection Status */}
      <motion.div
        className={`p-4 rounded-lg border ${getStatusColor(backendStatus.healthy ? 'active' : 'offline')}`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            {backendStatus.healthy ? (
              <Wifi className="w-5 h-5 text-green-400" />
            ) : (
              <WifiOff className="w-5 h-5 text-red-400" />
            )}
            <span className="font-medium">AI Generation System</span>
          </div>
          <div className="flex items-center gap-2">
            {isConnected && (
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            )}
            <span className="text-sm">
              {backendStatus.healthy ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Brain className="w-4 h-4" />
            <span>AI Engine:</span>
            <span className={backendStatus.geminiStatus === 'online' ? 'text-green-400' : 'text-yellow-400'}>
              {backendStatus.geminiStatus === 'online' ? 'Ready' : 'Starting'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            <span>AI Agents:</span>
            <span className={backendStatus.agentsActive ? 'text-green-400' : 'text-gray-400'}>
              {backendStatus.agentsActive ? 'Active' : 'Idle'}
            </span>
          </div>
        </div>

        {backendStatus.lastCheck && (
          <div className="mt-2 text-xs text-gray-400">
            Last checked: {backendStatus.lastCheck.toLocaleTimeString()}
          </div>
        )}
      </motion.div>

      {/* AI Agents Status */}
      <motion.div
        className="p-4 bg-gray-800/50 rounded-lg border border-gray-700"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <div className="flex items-center gap-2 mb-3">
          <Zap className="w-5 h-5 text-purple-400" />
          <span className="font-medium text-white">AI Agents Status</span>
        </div>
        
        <div className="space-y-2">
          <AnimatePresence>
            {agents.map((agent, index) => (
              <motion.div
                key={agent.name}
                className="flex items-center justify-between p-2 bg-gray-700/30 rounded border border-gray-600/30"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2, delay: index * 0.05 }}
              >
                <div className="flex items-center gap-2">
                  {agent.name === 'Privacy Agent' && <Shield className="w-4 h-4 text-blue-400" />}
                  {agent.name === 'Quality Agent' && <CheckCircle className="w-4 h-4 text-green-400" />}
                  {agent.name === 'Domain Expert' && <Brain className="w-4 h-4 text-purple-400" />}
                  {agent.name === 'Bias Detector' && <Activity className="w-4 h-4 text-orange-400" />}
                  <span className="text-sm text-gray-300">{agent.name}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <div className="text-xs text-gray-400">
                    {agent.performance}%
                  </div>
                  <div className={`px-2 py-1 rounded text-xs border ${getStatusColor(agent.status)}`}>
                    <div className="flex items-center gap-1">
                      {getStatusIcon(agent.status)}
                      <span className="capitalize">{agent.status}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Real-time Generation Process Logs */}
      {(currentGeneration.active || processLogs.length > 0) && (
        <motion.div
          className="p-4 bg-gray-800/50 rounded-lg border border-gray-700"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <div className="flex items-center gap-2 mb-3">
            <Database className="w-5 h-5 text-blue-400" />
            <span className="font-medium text-white">
              {currentGeneration.active ? 'Live Generation Process' : 'Latest Generation'}
            </span>
            {currentGeneration.active && (
              <div className="ml-auto text-sm text-blue-300">
                {currentGeneration.progress}%
              </div>
            )}
          </div>
          
          <div className="space-y-2 max-h-60 overflow-y-auto">
            <AnimatePresence>
              {processLogs.map((log, index) => (
                <motion.div
                  key={`${log.step}-${log.timestamp}-${index}`}
                  className={`flex items-start gap-3 p-2 rounded text-sm ${
                    log.progress === -1 
                      ? 'bg-red-500/10 border-l-2 border-red-500' 
                      : log.progress === 100
                      ? 'bg-green-500/10 border-l-2 border-green-500'
                      : 'bg-gray-700/30 border-l-2 border-blue-500'
                  }`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="flex-shrink-0 mt-0.5">
                    {getStepIcon(log.step)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-gray-200">
                        {getStepLabel(log.step)}
                      </span>
                      {log.progress >= 0 && log.progress < 100 && (
                        <span className="text-xs text-gray-400">
                          {log.progress}%
                        </span>
                      )}
                    </div>
                    <div className={`text-xs ${
                      log.progress === -1 ? 'text-red-300' : 'text-gray-300'
                    }`}>
                      {log.message}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
          
          {currentGeneration.active && (
            <div className="mt-3">
              <div className="w-full bg-gray-700 rounded-full h-2">
                <motion.div
                  className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full"
                  style={{ width: `${currentGeneration.progress || 0}%` }}
                  initial={{ width: 0 }}
                  animate={{ width: `${currentGeneration.progress || 0}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* WebSocket Connection Status */}
      <motion.div
        className={`p-3 rounded-lg border text-sm ${isConnected 
          ? 'bg-green-500/10 border-green-500/30 text-green-300' 
          : 'bg-yellow-500/10 border-yellow-500/30 text-yellow-300'
        }`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.4 }}
      >
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400 animate-pulse' : 'bg-yellow-400'}`}></div>
          <span>
            {isConnected ? 'Real-time updates connected' : 'Connecting to real-time updates...'}
          </span>
        </div>
      </motion.div>
    </div>
  );
};

export default RealTimeStatus;