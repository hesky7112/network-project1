declare module 'ws' {
  import { EventEmitter } from 'events';
  import { IncomingMessage } from 'http';

  interface WebSocket extends EventEmitter {
    send(data: any, cb?: (err?: Error) => void): void;
    close(code?: number, data?: string): void;
    readyState: number;
    OPEN: number;
    CLOSED: number;
    CONNECTING: number;
    CLOSING: number;
  }

  interface ServerOptions {
    noServer?: boolean;
  }

  class WebSocketServer extends EventEmitter {
    constructor(options?: ServerOptions);
    handleUpgrade(
      request: any,
      socket: any,
      upgradeHead: Buffer,
      callback: (client: WebSocket, request: IncomingMessage) => void
    ): void;
    close(cb?: (err?: Error) => void): void;
  }

  const WebSocket: {
    new(url: string): WebSocket;
    OPEN: number;
    CLOSED: number;
    CONNECTING: number;
    CLOSING: number;
  };

  const Server: typeof WebSocketServer;

  export { WebSocket, Server };
}
