import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Activity, 
  Brain, 
  Database, 
  Shield, 
  Zap,
  Users,
  Target
} from 'lucide-react';

interface LogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'success' | 'warning' | 'error';
  message: string;
  progress?: number;
  agent?: string;
  metrics?: {
    qualityScore?: number;
    privacyScore?: number;
    biasScore?: number;
  };
}

interface AIProcessLoggerProps {
  isVisible: boolean;
  logs: LogEntry[];
  currentProgress: number;
}

const AIProcessLogger: React.FC<AIProcessLoggerProps> = ({ 
  isVisible, 
  logs = [], 
  currentProgress = 0 
}) => {
  const [expandedLogs, setExpandedLogs] = useState(true);

  const getAgentIcon = (agent: string) => {
    switch (agent?.toLowerCase()) {
      case 'domain': return <Brain className="w-4 h-4" />;
      case 'privacy': return <Shield className="w-4 h-4" />;
      case 'bias': return <Users className="w-4 h-4" />;
      case 'quality': return <Target className="w-4 h-4" />;
      case 'relationship': return <Database className="w-4 h-4" />;
      case 'gemini': return <Zap className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'success': return 'text-green-400';
      case 'warning': return 'text-yellow-400';
      case 'error': return 'text-red-400';
      default: return 'text-blue-400';
    }
  };

  const getLevelBg = (level: string) => {
    switch (level) {
      case 'success': return 'bg-green-500/10 border-green-500/20';
      case 'warning': return 'bg-yellow-500/10 border-yellow-500/20';
      case 'error': return 'bg-red-500/10 border-red-500/20';
      default: return 'bg-blue-500/10 border-blue-500/20';
    }
  };

  if (!isVisible) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="fixed bottom-4 right-4 w-96 max-h-96 bg-gray-800/95 backdrop-blur-xl border border-gray-700/50 rounded-xl shadow-2xl z-50"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700/50">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
          <h3 className="text-white font-medium">AI Agent Performance</h3>
        </div>
        <button
          onClick={() => setExpandedLogs(!expandedLogs)}
          className="text-gray-400 hover:text-white transition-colors"
        >
          {expandedLogs ? '−' : '+'}
        </button>
      </div>

      {/* Progress Bar */}
      {currentProgress > 0 && currentProgress < 100 && (
        <div className="p-4 border-b border-gray-700/50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-300">Overall Progress</span>
            <span className="text-sm text-blue-400 font-medium">{currentProgress}%</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <motion.div
              className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${currentProgress}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>
      )}

      {/* Logs */}
      <AnimatePresence>
        {expandedLogs && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            className="max-h-64 overflow-y-auto"
          >
            <div className="p-2 space-y-2">
              {logs.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <Activity className="w-6 h-6 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Waiting for agent activity...</p>
                </div>
              ) : (
                logs.slice(-10).map((log) => (
                  <motion.div
                    key={log.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`p-3 rounded-lg border ${getLevelBg(log.level)}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`mt-0.5 ${getLevelColor(log.level)}`}>
                        {getAgentIcon(log.agent || '')}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {log.agent && (
                            <span className="text-xs font-medium text-purple-400 uppercase tracking-wide">
                              {log.agent}
                            </span>
                          )}
                          <span className="text-xs text-gray-400">
                            {new Date(log.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="text-sm text-gray-200 leading-relaxed">
                          {log.message}
                        </p>
                        
                        {/* Progress indicator */}
                        {log.progress !== undefined && (
                          <div className="mt-2 flex items-center gap-2">
                            <div className="w-full bg-gray-700 rounded-full h-1">
                              <div 
                                className="bg-blue-400 h-1 rounded-full transition-all duration-300"
                                style={{ width: `${log.progress}%` }}
                              />
                            </div>
                            <span className="text-xs text-gray-400 whitespace-nowrap">
                              {log.progress}%
                            </span>
                          </div>
                        )}

                        {/* Metrics */}
                        {log.metrics && (
                          <div className="mt-2 flex gap-3 text-xs">
                            {log.metrics.qualityScore && (
                              <span className="text-green-400">
                                Quality: {log.metrics.qualityScore}%
                              </span>
                            )}
                            {log.metrics.privacyScore && (
                              <span className="text-blue-400">
                                Privacy: {log.metrics.privacyScore}%
                              </span>
                            )}
                            {log.metrics.biasScore && (
                              <span className="text-purple-400">
                                Bias: {log.metrics.biasScore}%
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default AIProcessLogger;