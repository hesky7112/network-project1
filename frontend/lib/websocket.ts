import { EventEmitter } from 'events';
import { apiClient } from './api';

// WebSocket event types
export type WebSocketEvent = 'connect' | 'disconnect' | 'error' | 'message' | 'subscribe' | 'unsubscribe';

class WebSocketService extends EventEmitter {
  private socket: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000; // Start with 1 second
  public isConnected = false;
  private readonly baseUrl: string;
  private messageQueue: any[] = [];
  public subscriptions: Set<string> = new Set();

  constructor() {
    super();
    // Initialize with default values that will be updated in the browser
    this.baseUrl = '';

    // Only set up the URL in the browser environment
    if (typeof window !== 'undefined') {
      const protocol = window.location.protocol === 'https:' ? 'wss://' : 'ws://';
      const host = process.env.NEXT_PUBLIC_WS_HOST || 'localhost:8080';
      this.baseUrl = `${protocol}${host}/api/v1/chat/ws`;
    }
  }

  connect() {
    // Only connect in the browser environment
    if (typeof window === 'undefined') {
      return;
    }

    if (this.socket) {
      this.socket.close();
    }

    const token = apiClient.getToken();
    if (!token) {
      return;
    }

    try {
      this.socket = new WebSocket(`${this.baseUrl}?token=${token}`);
      this.setupEventHandlers();
    } catch (error) {
      console.error('WebSocket connection error:', error);
      this.handleReconnect();
    }
  }

  private setupEventHandlers() {
    if (!this.socket) return;

    this.socket.onopen = () => {
      this.isConnected = true;
      if (this.reconnectAttempts > 0) {
        this.emit('reconnect');
      }
      this.reconnectAttempts = 0;
      this.emit('connect');
      this.processMessageQueue();
      this.resubscribeAll();
    };

    this.socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        this.emit('message', message);
        // Emit specific event types if present
        if (message.type) {
          this.emit(message.type, message);
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    this.socket.onclose = () => {
      this.isConnected = false;
      this.emit('disconnect');
      this.handleReconnect();
    };

    this.socket.onerror = (error) => {
      console.error('WebSocket error:', error);
      this.emit('error', error);
    };
  }

  private handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts);

      console.log(`Attempting to reconnect in ${delay}ms...`);

      setTimeout(() => {
        console.log(`Reconnection attempt ${this.reconnectAttempts}`);
        this.connect();
      }, Math.min(delay, 30000)); // Max 30s delay
    } else {
      console.error('Max reconnection attempts reached');
      this.emit('error', new Error('Max reconnection attempts reached'));
    }
  }

  private processMessageQueue() {
    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift();
      this.send(message);
    }
  }

  private resubscribeAll() {
    this.subscriptions.forEach(topic => {
      this.subscribe(topic);
    });
  }

  send(message: any) {
    if (!this.isConnected || !this.socket) {
      this.messageQueue.push(message);
      return false;
    }

    try {
      const messageString = typeof message === 'string' ? message : JSON.stringify(message);
      this.socket.send(messageString);
      return true;
    } catch (error) {
      console.error('Error sending WebSocket message:', error);
      return false;
    }
  }

  subscribe(topic: string) {
    this.subscriptions.add(topic);
    return this.send({
      type: 'subscribe',
      topic
    });
  }

  unsubscribe(topic: string) {
    this.subscriptions.delete(topic);
    return this.send({
      type: 'unsubscribe',
      topic
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
      this.isConnected = false;
    }
  }

  get status() {
    return {
      isConnected: this.isConnected,
      reconnectAttempts: this.reconnectAttempts,
      subscriptions: Array.from(this.subscriptions)
    };
  }
}

// Export singleton instance
export const webSocketService = new WebSocketService();

// Export the class type for type checking
export type { WebSocketService };
