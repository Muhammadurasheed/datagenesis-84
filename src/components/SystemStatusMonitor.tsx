import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Wifi, 
  WifiOff, 
  Activity, 
  Brain, 
  CheckCircle,
  AlertCircle,
  Clock
} from 'lucide-react';
import { ApiService } from '../lib/api';

interface SystemStatus {
  backend: {
    healthy: boolean;
    lastCheck: Date | null;
    responseTime: number;
  };
  gemini: {
    status: 'online' | 'offline' | 'unknown';
    model: string;
    quotaPreserved: boolean;
  };
  agents: {
    active: boolean;
    total: number;
    operational: number;
  };
  websockets: {
    connected: boolean;
    status: string;
  };
}

interface Props {
  onStatusChange?: (status: SystemStatus) => void;
  compact?: boolean;
}

export const SystemStatusMonitor: React.FC<Props> = ({ onStatusChange, compact = false }) => {
  const [status, setStatus] = useState<SystemStatus>({
    backend: { healthy: false, lastCheck: null, responseTime: 0 },
    gemini: { status: 'unknown', model: 'gemini-2.0-flash-exp', quotaPreserved: false },
    agents: { active: false, total: 0, operational: 0 },
    websockets: { connected: false, status: 'disconnected' }
  });

  const [isChecking, setIsChecking] = useState(false);

  const checkSystemStatus = async () => {
    setIsChecking(true);
    const startTime = Date.now();

    try {
      // Check backend health
      const healthResponse = await ApiService.healthCheck();
      const responseTime = Date.now() - startTime;

      const newStatus: SystemStatus = {
        backend: {
          healthy: healthResponse.healthy,
          lastCheck: new Date(),
          responseTime
        },
        gemini: {
          status: healthResponse.data?.services?.gemini?.status === 'ready' ? 'online' : 'offline',
          model: healthResponse.data?.services?.gemini?.model || 'gemini-2.0-flash-exp',
          quotaPreserved: healthResponse.data?.services?.gemini?.quota_preserved || false
        },
        agents: {
          active: healthResponse.data?.services?.agents === 'active',
          total: 5, // We have 5 agents
          operational: healthResponse.data?.services?.agents === 'active' ? 5 : 0
        },
        websockets: {
          connected: healthResponse.data?.services?.websockets === 'ready',
          status: healthResponse.data?.services?.websockets || 'unknown'
        }
      };

      // Try to get detailed agent status if backend is healthy
      if (healthResponse.healthy) {
        try {
          const agentStatus = await ApiService.getAgentsStatus();
          if (agentStatus) {
            newStatus.agents = {
              active: agentStatus.orchestrator_status === 'active',
              total: agentStatus.total_agents || 5,
              operational: Object.values(agentStatus.agents || {}).filter(
                (agent: any) => agent.status === 'active'
              ).length
            };
          }
        } catch (error) {
          console.warn('Could not fetch detailed agent status:', error);
        }
      }

      setStatus(newStatus);
      onStatusChange?.(newStatus);

    } catch (error) {
      console.error('System status check failed:', error);
      
      const errorStatus: SystemStatus = {
        backend: { healthy: false, lastCheck: new Date(), responseTime: 0 },
        gemini: { status: 'offline', model: 'gemini-2.0-flash-exp', quotaPreserved: false },
        agents: { active: false, total: 5, operational: 0 },
        websockets: { connected: false, status: 'error' }
      };

      setStatus(errorStatus);
      onStatusChange?.(errorStatus);
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    // Initial check
    checkSystemStatus();

    // Set up periodic checks
    const interval = setInterval(checkSystemStatus, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, []);

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <motion.div
          className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
            status.backend.healthy 
              ? 'bg-green-500/20 text-green-300' 
              : 'bg-red-500/20 text-red-300'
          }`}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
        >
          {status.backend.healthy ? (
            <Wifi className="w-3 h-3" />
          ) : (
            <WifiOff className="w-3 h-3" />
          )}
          <span>Backend</span>
        </motion.div>

        <motion.div
          className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
            status.gemini.status === 'online' 
              ? 'bg-purple-500/20 text-purple-300' 
              : 'bg-yellow-500/20 text-yellow-300'
          }`}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
        >
          <Brain className="w-3 h-3" />
          <span>Gemini</span>
        </motion.div>

        {isChecking && (
          <div className="w-3 h-3 border border-gray-400 border-t-transparent rounded-full animate-spin" />
        )}
      </div>
    );
  }

  return (
    <motion.div
      className="p-4 bg-gray-800/50 backdrop-blur-xl border border-gray-700/50 rounded-xl"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">System Status</h3>
        <motion.button
          onClick={checkSystemStatus}
          disabled={isChecking}
          className="p-1 rounded hover:bg-gray-700/50 transition-colors"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <Activity 
            className={`w-4 h-4 text-gray-400 ${isChecking ? 'animate-spin' : ''}`} 
          />
        </motion.button>
      </div>

      <div className="space-y-3">
        {/* Backend Status */}
        <motion.div 
          className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg"
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex items-center gap-3">
            {status.backend.healthy ? (
              <Wifi className="w-5 h-5 text-green-400" />
            ) : (
              <WifiOff className="w-5 h-5 text-red-400" />
            )}
            <div>
              <div className="text-sm font-medium text-white">Backend API</div>
              <div className="text-xs text-gray-400">
                {status.backend.lastCheck ? (
                  <>Response: {status.backend.responseTime}ms</>
                ) : (
                  'Not checked'
                )}
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className={`text-sm font-medium ${
              status.backend.healthy ? 'text-green-400' : 'text-red-400'
            }`}>
              {status.backend.healthy ? 'Connected' : 'Disconnected'}
            </div>
            {status.backend.lastCheck && (
              <div className="text-xs text-gray-500">
                {status.backend.lastCheck.toLocaleTimeString()}
              </div>
            )}
          </div>
        </motion.div>

        {/* Gemini Status */}
        <motion.div 
          className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg"
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center gap-3">
            <Brain className={`w-5 h-5 ${
              status.gemini.status === 'online' ? 'text-purple-400' : 'text-yellow-400'
            }`} />
            <div>
              <div className="text-sm font-medium text-white">Gemini 2.0 Flash</div>
              <div className="text-xs text-gray-400">
                {status.gemini.quotaPreserved ? 'Quota preserved' : 'Active generation'}
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className={`text-sm font-medium ${
              status.gemini.status === 'online' ? 'text-purple-400' : 'text-yellow-400'
            }`}>
              {status.gemini.status === 'online' ? 'Ready' : 'Starting'}
            </div>
            <div className="text-xs text-gray-500">
              {status.gemini.model}
            </div>
          </div>
        </motion.div>

        {/* Multi-Agent System */}
        <motion.div 
          className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg"
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center gap-3">
            {status.agents.active ? (
              <CheckCircle className="w-5 h-5 text-green-400" />
            ) : (
              <AlertCircle className="w-5 h-5 text-yellow-400" />
            )}
            <div>
              <div className="text-sm font-medium text-white">AI Agents</div>
              <div className="text-xs text-gray-400">
                {status.agents.operational}/{status.agents.total} operational
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className={`text-sm font-medium ${
              status.agents.active ? 'text-green-400' : 'text-yellow-400'
            }`}>
              {status.agents.active ? 'Active' : 'Standby'}
            </div>
            <div className="text-xs text-gray-500">
              Multi-agent orchestration
            </div>
          </div>
        </motion.div>

        {/* WebSocket Connection */}
        <motion.div 
          className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg"
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <div className="flex items-center gap-3">
            {status.websockets.connected ? (
              <Activity className="w-5 h-5 text-blue-400" />
            ) : (
              <Clock className="w-5 h-5 text-gray-400" />
            )}
            <div>
              <div className="text-sm font-medium text-white">Real-time Updates</div>
              <div className="text-xs text-gray-400">
                WebSocket connection
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className={`text-sm font-medium ${
              status.websockets.connected ? 'text-blue-400' : 'text-gray-400'
            }`}>
              {status.websockets.connected ? 'Connected' : 'Disconnected'}
            </div>
            <div className="text-xs text-gray-500">
              {status.websockets.status}
            </div>
          </div>
        </motion.div>

        {/* Overall System Health */}
        <motion.div 
          className={`p-3 rounded-lg border-2 ${
            status.backend.healthy && status.gemini.status === 'online' && status.agents.active
              ? 'bg-green-500/10 border-green-500/30'
              : status.backend.healthy
              ? 'bg-yellow-500/10 border-yellow-500/30'
              : 'bg-red-500/10 border-red-500/30'
          }`}
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <div className="text-center">
            <div className={`text-sm font-semibold ${
              status.backend.healthy && status.gemini.status === 'online' && status.agents.active
                ? 'text-green-300'
                : status.backend.healthy
                ? 'text-yellow-300'
                : 'text-red-300'
            }`}>
              {status.backend.healthy && status.gemini.status === 'online' && status.agents.active
                ? '🎯 All Systems Operational'
                : status.backend.healthy
                ? '⚡ Partial Functionality'
                : '🔧 System Issues Detected'
              }
            </div>
            <div className="text-xs text-gray-400 mt-1">
              {status.backend.healthy && status.gemini.status === 'online' && status.agents.active
                ? 'Full AI-powered generation available'
                : status.backend.healthy
                ? 'Local fallback generation available'
                : 'Limited functionality - check connections'
              }
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default SystemStatusMonitor;