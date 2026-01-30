import * as React from 'react';
import { webSocketService } from '@/lib/websocket';

interface WebSocketContextType {
  isConnected: boolean;
  lastMessage: any;
  subscribe: (topic: string, callback: (data: any) => void) => () => void;
  send: (message: any) => boolean;
  connect: () => void;
  disconnect: () => void;
  subscriptions: string[];
}

const WebSocketContext = React.createContext<WebSocketContextType | undefined>(undefined);

export function WebSocketProvider({ children }: { children: React.ReactNode }) {
  const [isConnected, setIsConnected] = React.useState(webSocketService.isConnected);
  const [lastMessage, setLastMessage] = React.useState<any>(null);
  const [subscriptions, setSubscriptions] = React.useState<string[]>([]);

  React.useEffect(() => {
    const onConnect = () => {
      setIsConnected(true);
      setSubscriptions(Array.from(webSocketService.subscriptions));
    };

    const onDisconnect = () => {
      setIsConnected(false);
    };

    const onMessage = (message: any) => {
      setLastMessage(message);
    };

    const onError = (error: any) => {
      console.error('WebSocket context error:', error);
      // We don't necessarily update state here, as isConnected will be handled by onDisconnect
    };

    const onSubscriptionUpdate = () => {
      setSubscriptions(Array.from(webSocketService.subscriptions));
    };

    // Connect if not already connected
    if (!webSocketService.isConnected) {
      webSocketService.connect();
    }

    webSocketService.on('connect', onConnect);
    webSocketService.on('disconnect', onDisconnect);
    webSocketService.on('error', onError);
    webSocketService.on('message', onMessage);
    webSocketService.on('subscribe', onSubscriptionUpdate);
    webSocketService.on('unsubscribe', onSubscriptionUpdate);

    return () => {
      webSocketService.off('connect', onConnect);
      webSocketService.off('disconnect', onDisconnect);
      webSocketService.off('error', onError);
      webSocketService.off('message', onMessage);
      webSocketService.off('subscribe', onSubscriptionUpdate);
      webSocketService.off('unsubscribe', onSubscriptionUpdate);
    };
  }, []);

  const subscribe = React.useCallback((topic: string, callback: (data: any) => void) => {
    const messageHandler = (message: any) => {
      if (message.topic === topic) {
        callback(message.data);
      }
    };

    webSocketService.on('message', messageHandler);
    webSocketService.subscribe(topic);

    return () => {
      webSocketService.off('message', messageHandler);
      webSocketService.unsubscribe(topic);
    };
  }, []);

  const value = React.useMemo(() => ({
    isConnected,
    lastMessage,
    subscribe,
    send: webSocketService.send.bind(webSocketService),
    connect: webSocketService.connect.bind(webSocketService),
    disconnect: webSocketService.disconnect.bind(webSocketService),
    subscriptions,
  }), [isConnected, lastMessage, subscribe, subscriptions]);

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
}

export function useWebSocket() {
  const context = React.useContext(WebSocketContext);
  if (context === undefined) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
}
