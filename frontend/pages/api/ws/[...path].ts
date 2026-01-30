import { NextApiRequest, NextApiResponse } from 'next';
import { IncomingMessage } from 'http';
import { parse } from 'url';

// Import WebSocket types
declare const WebSocket: {
  new(url: string): WebSocket;
  OPEN: number;
  CLOSED: number;
  CONNECTING: number;
  CLOSING: number;
};

interface WebSocket {
  send(data: any, cb?: (err?: Error) => void): void;
  close(code?: number, data?: string): void;
  readyState: number;
  on(event: string, listener: (...args: any[]) => void): void;
  off(event: string, listener: (...args: any[]) => void): void;
  terminate(): void;
}

interface WebSocketServer {
  on(event: 'connection', listener: (ws: WebSocket, req: IncomingMessage) => void): void;
  handleUpgrade(req: any, socket: any, head: Buffer, callback: (ws: WebSocket, req: IncomingMessage) => void): void;
}

// WebSocket server for proxying
let wss: WebSocketServer | null = null;

// Get WebSocket URL from environment or use default
const getWebSocketUrl = (path: string) => {
  const wsProtocol = process.env.NEXT_PUBLIC_WS_PROTOCOL || 'ws:';
  const wsHost = process.env.NEXT_PUBLIC_WS_HOST || 'localhost:8080';
  return `${wsProtocol}//${wsHost}${path}`;
};

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow WebSocket upgrade requests
  if (!req.headers.upgrade || req.headers.upgrade.toLowerCase() !== 'websocket') {
    res.status(400).json({ error: 'Expected WebSocket upgrade request' });
    return;
  }

  // Initialize WebSocket server if not already done
  if (!wss) {
    const WebSocketServer = require('ws').Server;
    wss = new WebSocketServer({ noServer: true }) as unknown as WebSocketServer;

    wss.on('connection', (client: WebSocket, request: IncomingMessage) => {
      // Add type assertion for request.url
      const url = request.url || '';
      const { pathname } = parse(url);
      if (!pathname) {
        client.close(1002, 'Invalid path');
        return;
      }

      // Connect to the target WebSocket server
      const targetUrl = getWebSocketUrl(pathname);
      const WebSocketClient = require('ws');
      const target = new WebSocketClient(targetUrl);

      // Forward messages from client to target
      client.on('message', (data: any) => {
        if (target.readyState === 1) { // WebSocket.OPEN
          target.send(data);
        }
      });

      // Forward messages from target to client
      target.on('message', (data: any) => {
        if (client.readyState === 1) { // WebSocket.OPEN
          client.send(data);
        }
      });

      // Clean up on close
      const cleanup = () => {
        if (target.readyState === 1) { // WebSocket.OPEN
          target.close();
        }
        if (client.readyState === 1) { // WebSocket.OPEN
          client.close();
        }
      };

      client.on('close', cleanup);
      target.on('close', cleanup);
      client.on('error', cleanup);
      target.on('error', cleanup);
    });
  }

  // Handle WebSocket upgrade
  const server = (req as any).wss;
  if (server && server.handleUpgrade) {
    server.handleUpgrade(req, req.socket, Buffer.alloc(0), (ws: WebSocket) => {
      // @ts-ignore - We know wss is not null here
      wss.emit('connection', ws, req);
    });
  } else {
    res.status(500).json({ error: 'WebSocket server not properly initialized' });
  }
}

export const config = {
  api: {
    bodyParser: false, // Disable body parsing for WebSocket upgrade
  },
};
