import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  Users,
  Maximize2,
  Minimize2,
  Pause,
  Play,
  RotateCcw
} from 'lucide-react';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { Button } from './ui/button';
import { useWebSocket } from '../hooks/useWebSocket';
import { cn } from '../lib/utils';

interface ActivityLog {
  id: string;
  timestamp: Date;
  type: 'initialization' | 'domain_analysis' | 'privacy_assessment' | 'bias_detection' | 'relationship_mapping' | 'quality_planning' | 'data_generation' | 'quality_validation' | 'final_assembly' | 'completion' | 'error' | 'system';
  status: 'started' | 'in_progress' | 'completed' | 'error' | 'fallback';
  message: string;
  metadata?: Record<string, any>;
  duration?: number;
  progress?: number;
  agent?: string;
  level?: 'info' | 'success' | 'warning' | 'error';
}

interface RealTimeActivityMonitorProps {
  className?: string;
  maxLogs?: number;
  isGenerating?: boolean;
  isCollapsible?: boolean;
  isDraggable?: boolean;
  defaultCollapsed?: boolean;
}

export const RealTimeActivityMonitor: React.FC<RealTimeActivityMonitorProps> = ({ 
  className, 
  maxLogs = 100,
  isGenerating = false,
  isCollapsible = true,
  isDraggable = true,
  defaultCollapsed = false
}) => {
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [currentProgress, setCurrentProgress] = useState(0);
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
  const [isPaused, setIsPaused] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef({ x: 0, y: 0 });

  const { isConnected, lastMessage } = useWebSocket('guest_user');

  // Parse backend log messages into activity logs
  useEffect(() => {
    if (!lastMessage || isPaused) return;

    try {
      let logData: any = null;
      
      // Handle different message formats
      if (lastMessage.type === 'generation_update' && lastMessage.data) {
        logData = lastMessage.data;
      } else if (lastMessage.type === 'raw_message' && lastMessage.data?.message) {
        // Try to parse raw log messages from backend
        const message = lastMessage.data.message;
        const patterns = {
          progress: /\[(\d+)%\]\s*([^:]+):\s*(.+)/,
          agent: /(✅|🔄|❌|⚠️)\s*([^:]+):\s*(.+)/,
          status: /(🤖|🧠|🔒|⚖️|🔗|🎯|📦|🎉)\s*(.+)/
        };
        
        for (const [type, pattern] of Object.entries(patterns)) {
          const match = message.match(pattern);
          if (match) {
            if (type === 'progress') {
              logData = {
                progress: parseInt(match[1]),
                step: match[2].trim(),
                message: match[3].trim()
              };
            } else if (type === 'agent') {
              logData = {
                status: match[1],
                agent: match[2].trim(),
                message: match[3].trim()
              };
            } else if (type === 'status') {
              logData = {
                emoji: match[1],
                message: match[2].trim()
              };
            }
            break;
          }
        }
      }

      if (logData) {
        const newActivity: ActivityLog = {
          id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          timestamp: new Date(),
          type: detectActivityType(logData),
          status: detectStatus(logData),
          message: logData.message || 'Processing...',
          metadata: {
            progress: logData.progress,
            step: logData.step,
            agent_data: logData.agent_data,
            emoji: logData.emoji
          },
          progress: logData.progress,
          agent: detectAgent(logData),
          level: detectLevel(logData)
        };

        setActivities(prev => {
          const updated = [newActivity, ...prev.slice(0, maxLogs - 1)];
          return updated;
        });

        if (logData.progress !== undefined && logData.progress >= 0) {
          setCurrentProgress(logData.progress);
        }
      }
    } catch (error) {
      console.error('Failed to parse activity log:', error);
    }
  }, [lastMessage, maxLogs, isPaused]);

  // Initialize with system ready message
  useEffect(() => {
    if (activities.length === 0 && !isGenerating) {
      const systemLog: ActivityLog = {
        id: 'system-ready',
        timestamp: new Date(),
        type: 'system',
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
  }, [activities.length, isGenerating]);

  // Helper functions
  const detectActivityType = (data: any): ActivityLog['type'] => {
    const message = data.message?.toLowerCase() || '';
    const step = data.step?.toLowerCase() || '';
    
    if (step.includes('initialization') || message.includes('initializing')) return 'initialization';
    if (step.includes('domain') || message.includes('domain')) return 'domain_analysis';
    if (step.includes('privacy') || message.includes('privacy')) return 'privacy_assessment';
    if (step.includes('bias') || message.includes('bias')) return 'bias_detection';
    if (step.includes('relationship') || message.includes('relationship')) return 'relationship_mapping';
    if (step.includes('quality') || message.includes('quality')) return 'quality_planning';
    if (step.includes('generation') || message.includes('generating')) return 'data_generation';
    if (step.includes('validation') || message.includes('validating')) return 'quality_validation';
    if (step.includes('assembly') || message.includes('assembling')) return 'final_assembly';
    if (step.includes('completion') || message.includes('completed')) return 'completion';
    if (data.progress === -1 || message.includes('error') || message.includes('failed')) return 'error';
    return 'system';
  };

  const detectStatus = (data: any): ActivityLog['status'] => {
    if (data.progress === 100) return 'completed';
    if (data.progress === -1) return 'error';
    if (data.progress > 0) return 'in_progress';
    if (data.status === '✅') return 'completed';
    if (data.status === '❌') return 'error';
    if (data.status === '⚠️') return 'fallback';
    return 'started';
  };

  const detectAgent = (data: any): string => {
    const message = data.message?.toLowerCase() || '';
    const step = data.step?.toLowerCase() || '';
    
    if (message.includes('domain expert') || step.includes('domain')) return 'Domain Expert';
    if (message.includes('privacy agent') || step.includes('privacy')) return 'Privacy Agent';
    if (message.includes('bias detector') || step.includes('bias')) return 'Bias Detector';
    if (message.includes('quality agent') || step.includes('quality')) return 'Quality Agent';
    if (message.includes('relationship agent') || step.includes('relationship')) return 'Relationship Agent';
    if (message.includes('gemini') || message.includes('2.0 flash')) return 'Gemini AI';
    if (message.includes('ollama')) return 'Ollama';
    return 'System';
  };

  const detectLevel = (data: any): ActivityLog['level'] => {
    if (data.progress === -1 || data.status === '❌') return 'error';
    if (data.progress === 100 || data.status === '✅') return 'success';
    if (data.status === '⚠️') return 'warning';
    return 'info';
  };

  const getIcon = (type: ActivityLog['type']) => {
    const iconMap = {
      'initialization': <Cog className="h-4 w-4 text-blue-400" />,
      'domain_analysis': <Brain className="h-4 w-4 text-purple-400" />,
      'privacy_assessment': <Shield className="h-4 w-4 text-green-400" />,
      'bias_detection': <Users className="h-4 w-4 text-orange-400" />,
      'relationship_mapping': <Search className="h-4 w-4 text-cyan-400" />,
      'quality_planning': <Target className="h-4 w-4 text-yellow-400" />,
      'data_generation': <Zap className="h-4 w-4 text-pink-400" />,
      'quality_validation': <CheckCircle className="h-4 w-4 text-green-400" />,
      'final_assembly': <Package className="h-4 w-4 text-blue-400" />,
      'completion': <CheckCircle className="h-4 w-4 text-green-400" />,
      'error': <AlertCircle className="h-4 w-4 text-red-400" />,
      'system': <Activity className="h-4 w-4 text-blue-400" />
    };
    return iconMap[type] || <Activity className="h-4 w-4 text-gray-400" />;
  };

  const getStatusColor = (level: string) => {
    const colorMap: Record<string, string> = {
      'success': 'bg-green-500/20 border-green-500/30 text-green-300',
      'error': 'bg-red-500/20 border-red-500/30 text-red-300',
      'warning': 'bg-yellow-500/20 border-yellow-500/30 text-yellow-300',
      'info': 'bg-blue-500/20 border-blue-500/30 text-blue-300'
    };
    return colorMap[level] || 'bg-gray-500/20 border-gray-500/30 text-gray-300';
  };

  const clearLogs = () => {
    setActivities([]);
    setCurrentProgress(0);
  };

  // Dragging functionality
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isDraggable) return;
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y
    };
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStartRef.current.x,
      y: e.clientY - dragStartRef.current.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging]);

  const containerStyle = isDraggable ? {
    position: 'fixed' as const,
    top: position.y,
    left: position.x,
    zIndex: 1000,
    cursor: isDragging ? 'grabbing' : 'grab'
  } : {};

  return (
    <motion.div
      ref={dragRef}
      style={containerStyle}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        "bg-gray-800/95 backdrop-blur-xl border border-gray-700/50 rounded-xl shadow-2xl",
        isCollapsed ? "w-80" : "w-96",
        className
      )}
    >
      {/* Header */}
      <div 
        className="p-4 border-b border-gray-700/50 cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${
              isConnected ? 'bg-green-400 animate-pulse' : 'bg-red-400'
            }`} />
            <h3 className="text-lg font-semibold text-white">Live AI Activity Monitor</h3>
          </div>
          
          <div className="flex items-center gap-2">
            {isGenerating && currentProgress > 0 && (
              <Badge variant="outline" className="border-blue-500/30 text-blue-300">
                {currentProgress}%
              </Badge>
            )}
            
            <Badge variant={isConnected ? "default" : "secondary"} className="text-xs">
              {isConnected ? '🔴 Live' : '⚫ Offline'}
            </Badge>
            
            <div className="flex items-center gap-1">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsPaused(!isPaused)}
                className="h-6 w-6 p-0"
              >
                {isPaused ? <Play className="h-3 w-3" /> : <Pause className="h-3 w-3" />}
              </Button>
              
              <Button
                size="sm"
                variant="ghost"
                onClick={clearLogs}
                className="h-6 w-6 p-0"
              >
                <RotateCcw className="h-3 w-3" />
              </Button>
              
              {isCollapsible && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setIsCollapsed(!isCollapsed)}
                  className="h-6 w-6 p-0"
                >
                  {isCollapsed ? <Maximize2 className="h-3 w-3" /> : <Minimize2 className="h-3 w-3" />}
                </Button>
              )}
            </div>
          </div>
        </div>
        
        {/* Progress Bar */}
        {isGenerating && currentProgress > 0 && !isCollapsed && (
          <div className="mt-3">
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
      </div>

      {/* Content */}
      <AnimatePresence>
        {!isCollapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <ScrollArea className="h-[400px]">
              <div className="p-4 space-y-3">
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
                  <AnimatePresence mode="popLayout">
                    {activities.map((activity, index) => (
                      <motion.div
                        key={activity.id}
                        initial={{ opacity: 0, x: -20, scale: 0.95 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, x: 20, scale: 0.95 }}
                        transition={{ duration: 0.3, delay: index * 0.02 }}
                        className={`p-3 rounded-lg border ${getStatusColor(activity.level || 'info')}`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 mt-0.5">
                            {getIcon(activity.type)}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-medium">
                                {activity.agent || 'System'}
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
                            
                            <div className="flex items-center justify-between mt-2 text-xs opacity-60">
                              <span>{activity.timestamp.toLocaleTimeString()}</span>
                              {activity.duration && (
                                <span>{activity.duration < 1 ? `${(activity.duration * 1000).toFixed(0)}ms` : `${activity.duration.toFixed(1)}s`}</span>
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
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                )}
              </div>
            </ScrollArea>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default RealTimeActivityMonitor;