import { useState, useEffect, useCallback } from 'react';
import { ApiService } from '../lib/api';

export interface SystemStatusData {
  backend: {
    healthy: boolean;
    lastCheck: Date | null;
    responseTime: number;
    error?: string;
  };
  ai_service: {
    provider: 'gemini' | 'openai' | 'anthropic' | 'ollama' | 'unknown';
    status: 'online' | 'offline' | 'unknown' | 'quota_exceeded';
    model: string;
    quotaPreserved: boolean;
    apiKeyConfigured: boolean;
    endpoint?: string;
  };
  agents: {
    active: boolean;
    total: number;
    operational: number;
    details?: any;
  };
  websockets: {
    connected: boolean;
    status: string;
  };
  overall: {
    status: 'healthy' | 'degraded' | 'unhealthy';
    message: string;
  };
}

export const useSystemStatus = (checkInterval = 30000) => {
  const [status, setStatus] = useState<SystemStatusData>({
    backend: { healthy: false, lastCheck: null, responseTime: 0 },
    ai_service: { 
      provider: 'unknown', 
      status: 'unknown', 
      model: 'unknown', 
      quotaPreserved: false, 
      apiKeyConfigured: false 
    },
    agents: { active: false, total: 5, operational: 0 },
    websockets: { connected: false, status: 'disconnected' },
    overall: { status: 'unhealthy', message: 'Checking system status...' }
  });

  const [isChecking, setIsChecking] = useState(false);

  const checkSystemStatus = useCallback(async () => {
    if (isChecking) return; // Prevent concurrent checks
    
    setIsChecking(true);
    const startTime = Date.now();

    try {
      // Check backend health
      const healthResponse = await ApiService.healthCheck();
      const responseTime = Date.now() - startTime;

      const newStatus: SystemStatusData = {
        backend: {
          healthy: healthResponse.healthy,
          lastCheck: new Date(),
          responseTime,
          error: healthResponse.healthy ? undefined : 'Connection failed'
        },
        ai_service: {
          provider: (healthResponse.data?.ai_service?.provider as any) || 'unknown',
          status: healthResponse.data?.ai_service?.status || 'unknown',
          model: healthResponse.data?.ai_service?.model || 'unknown',
          quotaPreserved: healthResponse.data?.ai_service?.quota_preserved || false,
          apiKeyConfigured: healthResponse.data?.ai_service?.api_key_configured || false,
          endpoint: healthResponse.data?.ai_service?.endpoint
        },
        agents: {
          active: healthResponse.data?.services?.agents === 'active',
          total: 5,
          operational: healthResponse.data?.services?.agents === 'active' ? 5 : 0
        },
        websockets: {
          connected: healthResponse.data?.services?.websockets === 'ready',
          status: healthResponse.data?.services?.websockets || 'unknown'
        },
        overall: { status: 'healthy', message: 'All systems operational' }
      };

      // Try to get detailed agent status if backend is healthy
      if (healthResponse.healthy) {
        try {
          const agentStatus = await ApiService.getAgentsStatus();
          if (agentStatus && agentStatus.agents) {
            const operationalAgents = Object.values(agentStatus.agents).filter(
              (agent: any) => agent.status === 'active'
            ).length;
            
            newStatus.agents = {
              active: agentStatus.orchestrator_status === 'active',
              total: agentStatus.total_agents || 5,
              operational: operationalAgents,
              details: agentStatus.agents
            };
          }
        } catch (error) {
          console.warn('Could not fetch detailed agent status:', error);
        }
      }

      // Determine overall system status
      if (newStatus.backend.healthy && newStatus.ai_service.status === 'online' && newStatus.agents.active) {
        newStatus.overall = {
          status: 'healthy',
          message: 'All systems operational - Full AI generation available'
        };
      } else if (newStatus.backend.healthy) {
        newStatus.overall = {
          status: 'degraded',
          message: newStatus.ai_service.status === 'offline' 
            ? `Backend healthy, ${newStatus.ai_service.provider} offline - Local generation available`
            : 'Partial functionality available'
        };
      } else {
        newStatus.overall = {
          status: 'unhealthy',
          message: 'AI system unavailable - Please check connection'
        };
      }

      setStatus(newStatus);

    } catch (error) {
      console.error('System status check failed:', error);
      
      const errorStatus: SystemStatusData = {
        backend: { 
          healthy: false, 
          lastCheck: new Date(), 
          responseTime: 0,
          error: error instanceof Error ? error.message : 'Unknown error'
        },
        ai_service: { 
          provider: 'unknown', 
          status: 'offline', 
          model: 'unknown', 
          quotaPreserved: false, 
          apiKeyConfigured: false 
        },
        agents: { active: false, total: 5, operational: 0 },
        websockets: { connected: false, status: 'error' },
        overall: { status: 'unhealthy', message: 'System health check failed' }
      };

      setStatus(errorStatus);
    } finally {
      setIsChecking(false);
    }
  }, [isChecking]);

  useEffect(() => {
    // Initial check
    checkSystemStatus();

    // Set up periodic checks if interval > 0
    if (checkInterval > 0) {
      const interval = setInterval(checkSystemStatus, checkInterval);
      return () => clearInterval(interval);
    }
  }, [checkSystemStatus, checkInterval]);

  const forceCheck = useCallback(() => {
    checkSystemStatus();
  }, [checkSystemStatus]);

  return {
    status,
    isChecking,
    forceCheck,
    // Convenience getters
    isHealthy: status.overall.status === 'healthy',
    isDegraded: status.overall.status === 'degraded',
    isUnhealthy: status.overall.status === 'unhealthy',
    backendHealthy: status.backend.healthy,
    aiServiceOnline: status.ai_service.status === 'online',
    agentsActive: status.agents.active
  };
};