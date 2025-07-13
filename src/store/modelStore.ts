/**
 * REVOLUTIONARY AI MODEL STORE
 * Single source of truth for AI model state with reactive updates
 * Enterprise-grade with real-time synchronization across frontend/backend
 */

import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';

export interface ModelConfig {
  provider: 'gemini' | 'openai' | 'anthropic' | 'ollama';
  model: string;
  apiKey: string;
  endpoint?: string;
  isActive: boolean;
  lastTested?: string;
  performance?: {
    latency: number;
    reliability: number;
    cost: number;
  };
}

export interface ModelState {
  currentModel: ModelConfig | null;
  availableModels: Record<string, string[]>;
  isConfiguring: boolean;
  isTesting: boolean;
  lastSync: string | null;
  health: {
    status: 'healthy' | 'degraded' | 'offline';
    message: string;
    lastCheck: string;
  };
}

// Reactive atoms for real-time state management
export const modelConfigAtom = atomWithStorage<ModelConfig | null>('datagenesis-model-config', null);
export const modelHealthAtom = atom<ModelState['health']>({
  status: 'offline',
  message: 'Not configured',
  lastCheck: new Date().toISOString()
});

export const isConfiguringModelAtom = atom(false);
export const isTestingModelAtom = atom(false);

// Available models with latest releases
export const availableModelsAtom = atom({
  gemini: [
    'gemini-2.0-flash-lite',
    'gemini-1.5-flash',
    'gemini-1.5-pro',
    'gemini-2.0-flash-exp',
    'gemini-1.0-pro'
  ],
  openai: [
    'gpt-4.1-2025-04-14',
    'o3-2025-04-16',
    'o4-mini-2025-04-16',
    'gpt-4o',
    'gpt-4o-mini',
    'gpt-4-turbo',
    'gpt-3.5-turbo'
  ],
  anthropic: [
    'claude-opus-4-20250514',
    'claude-sonnet-4-20250514',
    'claude-3-5-haiku-20241022',
    'claude-3-5-sonnet-20241022',
    'claude-3-opus-20240229',
    'claude-3-sonnet-20240229',
    'claude-3-haiku-20240307'
  ],
  ollama: [
    'phi3:mini',
    'phi3:3.8b',
    'llama3.2:1b',
    'llama3.2:3b',
    'llama3:8b',
    'llama3:70b',
    'llama2:7b',
    'mistral:7b',
    'deepseek-coder:6.7b',
    'gemma2:2b',
    'gemma2:9b',
    'codellama:7b',
    'qwen2.5:7b',
    'custom'
  ]
});

// Computed atoms
export const modelStatusAtom = atom((get) => {
  const model = get(modelConfigAtom);
  const health = get(modelHealthAtom);
  const isConfiguring = get(isConfiguringModelAtom);
  const isTesting = get(isTestingModelAtom);

  return {
    hasModel: !!model,
    isReady: model?.isActive && health.status === 'healthy',
    isWorking: isConfiguring || isTesting,
    provider: model?.provider,
    model: model?.model,
    health
  };
});

// Action atoms for model operations
export const configureModelAtom = atom(
  null,
  async (_get, set, config: Omit<ModelConfig, 'isActive' | 'lastTested'>) => {
    set(isConfiguringModelAtom, true);
    
    try {
      // Configure backend
      const { ApiService } = await import('../lib/api');
      await ApiService.configureAI({
        provider: config.provider,
        model: config.model,
        api_key: config.apiKey,
        endpoint: config.endpoint
      });

      // Test connection
      set(isTestingModelAtom, true);
      await ApiService.testAIConnection();

      // Save successful configuration
      const fullConfig: ModelConfig = {
        ...config,
        isActive: true,
        lastTested: new Date().toISOString()
      };

      set(modelConfigAtom, fullConfig);
      set(modelHealthAtom, {
        status: 'healthy',
        message: `${config.provider} model configured successfully`,
        lastCheck: new Date().toISOString()
      });

      return { success: true };
    } catch (error) {
      set(modelHealthAtom, {
        status: 'offline',
        message: `Configuration failed: ${error}`,
        lastCheck: new Date().toISOString()
      });
      throw error;
    } finally {
      set(isConfiguringModelAtom, false);
      set(isTestingModelAtom, false);
    }
  }
);

export const testModelConnectionAtom = atom(
  null,
  async (get, set) => {
    const model = get(modelConfigAtom);
    if (!model) throw new Error('No model configured');

    set(isTestingModelAtom, true);
    
    try {
      const { ApiService } = await import('../lib/api');
      await ApiService.testAIConnection();
      
      set(modelHealthAtom, {
        status: 'healthy',
        message: 'Connection test successful',
        lastCheck: new Date().toISOString()
      });

      return { success: true };
    } catch (error) {
      set(modelHealthAtom, {
        status: 'offline',
        message: `Connection test failed: ${error}`,
        lastCheck: new Date().toISOString()
      });
      throw error;
    } finally {
      set(isTestingModelAtom, false);
    }
  }
);

export const removeModelAtom = atom(
  null,
  (_get, set) => {
    set(modelConfigAtom, null);
    set(modelHealthAtom, {
      status: 'offline',
      message: 'Model removed',
      lastCheck: new Date().toISOString()
    });
  }
);