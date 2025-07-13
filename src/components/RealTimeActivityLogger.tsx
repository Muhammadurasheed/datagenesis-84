import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { 
  Activity, 
  Brain, 
  Zap, 
  CheckCircle, 
  AlertCircle, 
  Shield,
  Target,
  Search,
  Cog,
  Package,
  Users
} from 'lucide-react';
import { useWebSocket } from '../hooks/useWebSocket';
import { cn } from '../lib/utils';

interface ActivityLog {
  id: string;
  timestamp: Date;
  type: 'initialization' | 'domain_analysis' | 'privacy_assessment' | 'bias_detection' | 'relationship_mapping' | 'quality_planning' | 'data_generation' | 'quality_validation' | 'final_assembly' | 'completion' | 'error';
  status: 'started' | 'in_progress' | 'completed' | 'error' | 'fallback';
  message: string;
  metadata?: Record<string, any>;
  duration?: number;
  progress?: number;
  agent?: string;
  level?: 'info' | 'success' | 'warning' | 'error';
}

interface RealTimeActivityLoggerProps {
  className?: string;
  maxLogs?: number;
  isGenerating?: boolean;
}

export const RealTimeActivityLogger: React.FC<RealTimeActivityLoggerProps> = ({ 
  className, 
  maxLogs = 100,
  isGenerating = false
}) => {
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [currentProgress, setCurrentProgress] = useState(0);
  const { isConnected, lastMessage } = useWebSocket('guest_user');

  // Parse real backend logs from WebSocket
  useEffect(() => {
    if (lastMessage?.type === 'generation_update' || lastMessage?.type === 'job_update') {
      const data = lastMessage.data;
      
      // Parse the backend log format exactly as shown in the user's logs
      const newActivity: ActivityLog = {
        id: data.job_id || Date.now().toString(),
        timestamp: new Date(),
        type: data.step || 'system_event',
        status: data.progress === 100 ? 'completed' : 
                data.progress === -1 ? 'error' : 
                data.progress >= 0 ? 'in_progress' : 'started',
        message: data.message || 'Processing...',
        metadata: {
          job_id: data.job_id,
          progress: data.progress,
          agent_data: data.agent_data,
          gemini_status: data.gemini_status
        },
        progress: data.progress,
        agent: data.step?.includes('domain') ? 'Domain Expert' :
               data.step?.includes('privacy') ? 'Privacy Agent' :
               data.step?.includes('bias') ? 'Bias Detector' :
               data.step?.includes('relationship') ? 'Relationship Agent' :
               data.step?.includes('quality') ? 'Quality Agent' :
               data.step?.includes('generation') ? 'Gemini' : 'System',
        level: data.progress === -1 ? 'error' : 
               data.progress === 100 ? 'success' : 'info'
      };

      setActivities(prev => {
        const updated = [newActivity, ...prev];
        return updated.slice(0, maxLogs);
      });

      if (data.progress !== undefined) {
        setCurrentProgress(data.progress);
      }
    }
  }, [lastMessage, maxLogs]);

  // Clear logs when not generating
  useEffect(() => {
    if (!isGenerating && activities.length === 0) {
      // Add initial system status log
      const systemLog: ActivityLog = {
        id: 'system-ready',
        timestamp: new Date(),
        type: 'initialization',
        status: 'completed',
        message: 'AI Multi-Agent System Ready',
        metadata: { 
          agents: ['Domain Expert', 'Privacy Agent', 'Quality Agent', 'Bias Detector', 'Relationship Agent'],
          status: 'operational'
        },
        agent: 'System',
        level: 'success'
      };
      setActivities([systemLog]);
    }
  }, [isGenerating, activities.length]);

  const getIcon = (type: ActivityLog['type']) => {
    switch (type) {
      case 'initialization': return <Cog className="h-4 w-4 text-blue-400" />;
      case 'domain_analysis': return <Brain className="h-4 w-4 text-purple-400" />;
      case 'privacy_assessment': return <Shield className="h-4 w-4 text-green-400" />;
      case 'bias_detection': return <Users className="h-4 w-4 text-orange-400" />;
      case 'relationship_mapping': return <Search className="h-4 w-4 text-cyan-400" />;
      case 'quality_planning': return <Target className="h-4 w-4 text-yellow-400" />;
      case 'data_generation': return <Brain className="h-4 w-4 text-pink-400" />;
      case 'quality_validation': return <CheckCircle className="h-4 w-4 text-green-400" />;
      case 'final_assembly': return <Package className="h-4 w-4 text-blue-400" />;
      case 'completion': return <CheckCircle className="h-4 w-4 text-green-400" />;
      case 'error': return <AlertCircle className="h-4 w-4 text-red-400" />;
      default: return <Activity className="h-4 w-4 text-gray-400" />;
    }
  };

  const getAgentIcon = (agent: string) => {
    switch (agent?.toLowerCase()) {
      case 'domain expert': return <Brain className="h-4 w-4 text-purple-400" />;
      case 'privacy agent': return <Shield className="h-4 w-4 text-green-400" />;
      case 'bias detector': return <Users className="h-4 w-4 text-orange-400" />;
      case 'quality agent': return <Target className="h-4 w-4 text-yellow-400" />;
      case 'relationship agent': return <Search className="h-4 w-4 text-cyan-400" />;
      case 'gemini': return <Zap className="h-4 w-4 text-pink-400" />;
      case 'system': return <Activity className="h-4 w-4 text-blue-400" />;
      default: return <Activity className="h-4 w-4 text-gray-400" />;
    }
  };


  const getStatusColor = (level: string) => {
    switch (level) {
      case 'success': return 'bg-green-500/20 border-green-500/30 text-green-300';
      case 'error': return 'bg-red-500/20 border-red-500/30 text-red-300';
      case 'warning': return 'bg-yellow-500/20 border-yellow-500/30 text-yellow-300';
      case 'info': return 'bg-blue-500/20 border-blue-500/30 text-blue-300';
      default: return 'bg-gray-500/20 border-gray-500/30 text-gray-300';
    }
  };

  const getStepLabel = (type: string) => {
    const labels: Record<string, string> = {
      'initialization': '🤖 Initializing AI Agents',
      'domain_analysis': '🧠 Domain Expert Analysis',
      'privacy_assessment': '🔒 Privacy Assessment',
      'bias_detection': '⚖️ Bias Detection',
      'relationship_mapping': '🔗 Relationship Mapping',
      'quality_planning': '🎯 Quality Planning',
      'data_generation': '🤖 Data Generation',
      'quality_validation': '🔍 Quality Validation',
      'final_assembly': '📦 Final Assembly',
      'completion': '🎉 Generation Complete',
      'error': '❌ Error Occurred'
    };
    return labels[type] || type.replace('_', ' ').toUpperCase();
  };

  const formatDuration = (duration?: number) => {
    if (!duration) return '';
    return duration < 1 ? `${(duration * 1000).toFixed(0)}ms` : `${duration.toFixed(1)}s`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn("h-full bg-gray-800/90 backdrop-blur-xl border border-gray-700/50 rounded-xl", className)}
    >
      <div className="p-4 border-b border-gray-700/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
            <h3 className="text-lg font-semibold text-white">Live AI Activity Monitor</h3>
          </div>
          <div className="flex items-center gap-2">
            {isGenerating && currentProgress > 0 && (
              <div className="flex items-center gap-2 px-3 py-1 bg-blue-500/20 rounded-full">
                <span className="text-xs text-blue-300">{currentProgress}%</span>
              </div>
            )}
            <Badge variant={isConnected ? "default" : "secondary"} className="text-xs">
              {isConnected ? '🔴 Live' : '⚫ Offline'}
            </Badge>
          </div>
        </div>
        
        {/* Progress Bar */}
        {isGenerating && currentProgress > 0 && (
          <div className="mt-3">
            <div className="w-full bg-gray-700 rounded-full h-2">
              <motion.div
                className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full"
                style={{ width: `${currentProgress}%` }}
                initial={{ width: 0 }}
                animate={{ width: `${currentProgress}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>
        )}
      </div>

      <ScrollArea className="h-[400px]">
        <div className="p-4 space-y-3">
          <AnimatePresence mode="popLayout">
            {activities.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-8 text-gray-400"
              >
                <Activity className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p className="font-medium">AI System Ready</p>
                <p className="text-sm">Monitoring multi-agent orchestration</p>
              </motion.div>
            ) : (
              activities.map((activity, index) => (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, x: -20, scale: 0.95 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: 20, scale: 0.95 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className={`p-3 rounded-lg border ${getStatusColor(activity.level || 'info')}`}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                      {activity.agent ? getAgentIcon(activity.agent) : getIcon(activity.type)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium">
                          {getStepLabel(activity.type)}
                        </span>
                        {activity.progress !== undefined && activity.progress >= 0 && (
                          <span className="text-xs opacity-75">
                            {activity.progress}%
                          </span>
                        )}
                      </div>
                      
                      <p className="text-xs opacity-90 leading-relaxed">
                        {activity.message}
                      </p>
                      
                      <div className="flex items-center gap-3 mt-2 text-xs opacity-60">
                        <span>{activity.timestamp.toLocaleTimeString()}</span>
                        {activity.agent && (
                          <span className="font-medium">{activity.agent}</span>
                        )}
                        {activity.duration && (
                          <span>{formatDuration(activity.duration)}</span>
                        )}
                      </div>
                      
                      {/* Progress indicator for in-progress tasks */}
                      {activity.progress !== undefined && activity.progress > 0 && activity.progress < 100 && (
                        <div className="mt-2">
                          <div className="w-full bg-gray-700/50 rounded-full h-1">
                            <div 
                              className="bg-current h-1 rounded-full transition-all duration-300"
                              style={{ width: `${activity.progress}%` }}
                            />
                          </div>
                        </div>
                      )}
                      
                      {activity.metadata && Object.keys(activity.metadata).length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {Object.entries(activity.metadata).slice(0, 3).map(([key, value]) => (
                            <span key={key} className="text-xs px-2 py-1 bg-black/20 rounded border">
                              {key}: {typeof value === 'object' ? JSON.stringify(value).slice(0, 20) : String(value).slice(0, 20)}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </ScrollArea>
    </motion.div>
  );
};