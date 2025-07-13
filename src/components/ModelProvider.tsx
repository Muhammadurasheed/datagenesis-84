import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface ModelConfig {
  provider: 'gemini' | 'openai' | 'anthropic' | 'ollama';
  model: string;
  apiKey: string;
  endpoint?: string; // For Ollama custom endpoints
}

interface ModelContextType {
  currentModel: ModelConfig | null;
  availableModels: Record<string, string[]>;
  setModel: (config: ModelConfig) => void;
  removeModel: () => void;
}

const ModelContext = createContext<ModelContextType | undefined>(undefined);

const defaultModels = {
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
};

export const ModelProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentModel, setCurrentModel] = useState<ModelConfig | null>(null);
  const [availableModels] = useState(defaultModels);

  useEffect(() => {
    // Load saved model from localStorage
    const saved = localStorage.getItem('datagenesis-model-config');
    if (saved) {
      try {
        const config = JSON.parse(saved);
        setCurrentModel(config);
      } catch (error) {
        console.error('Failed to load saved model config:', error);
      }
    }
  }, []);

  const setModel = (config: ModelConfig) => {
    setCurrentModel(config);
    localStorage.setItem('datagenesis-model-config', JSON.stringify(config));
  };

  const removeModel = () => {
    setCurrentModel(null);
    localStorage.removeItem('datagenesis-model-config');
  };

  return (
    <ModelContext.Provider value={{
      currentModel,
      availableModels,
      setModel,
      removeModel
    }}>
      {children}
    </ModelContext.Provider>
  );
};

export const useModel = () => {
  const context = useContext(ModelContext);
  if (context === undefined) {
    throw new Error('useModel must be used within a ModelProvider');
  }
  return context;
};