
import { useEffect, useRef, useState } from 'react';

interface WebSocketMessage {
  type: string;
  data: any;
  timestamp: number;
}

interface UseWebSocketOptions {
  onMessage?: (message: WebSocketMessage) => void;
  onError?: (error: Event) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
}

export const useWebSocket = (url: string, options: UseWebSocketOptions = {}) => {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const [error, setError] = useState<string | null>(null);
  const ws = useRef<WebSocket | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 3; // Reduced for better stability
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const connect = () => {
    try {
      // Convert relative URL to absolute WebSocket URL with correct port  
      const wsUrl = url.startsWith('ws') ? url : `ws://localhost:8000/ws/${url}`;
      console.log('🔌 Connecting to WebSocket:', wsUrl);
      ws.current = new WebSocket(wsUrl);

      ws.current.onopen = () => {
        setIsConnected(true);
        setError(null);
        reconnectAttempts.current = 0;
        options.onConnect?.();
      };

      ws.current.onmessage = (event) => {
        try {
          console.log('📨 WebSocket message received:', event.data);
          const message: WebSocketMessage = {
            type: 'generation_update',
            data: typeof event.data === 'string' ? JSON.parse(event.data) : event.data,
            timestamp: Date.now()
          };
          setLastMessage(message);
          options.onMessage?.(message);
        } catch (err) {
          console.error('Failed to parse WebSocket message:', err, event.data);
          // Try to handle raw string messages
          const fallbackMessage: WebSocketMessage = {
            type: 'raw_message',
            data: { message: event.data },
            timestamp: Date.now()
          };
          setLastMessage(fallbackMessage);
          options.onMessage?.(fallbackMessage);
        }
      };

      ws.current.onclose = () => {
        setIsConnected(false);
        options.onDisconnect?.();
        
        // Attempt to reconnect with exponential backoff
        if (reconnectAttempts.current < maxReconnectAttempts) {
          reconnectAttempts.current++;
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 10000);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            console.log(`Attempting WebSocket reconnection ${reconnectAttempts.current}/${maxReconnectAttempts}`);
            connect();
          }, delay);
        } else {
          setError('Failed to establish WebSocket connection after multiple attempts');
        }
      };

      ws.current.onerror = (event) => {
        console.warn('WebSocket connection error - this is expected if backend is not running');
        setError('WebSocket connection error - backend may not be available');
        options.onError?.(event);
      };
    } catch (err) {
      setError('Failed to create WebSocket connection');
      console.warn('WebSocket creation failed:', err);
    }
  };

  const sendMessage = (message: any) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket is not connected');
    }
  };

  const disconnect = () => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    if (ws.current) {
      ws.current.close();
    }
  };

  useEffect(() => {
    // Only try to connect if URL is provided
    if (url) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [url]);

  return {
    isConnected,
    lastMessage,
    error,
    sendMessage,
    disconnect,
  };
};
