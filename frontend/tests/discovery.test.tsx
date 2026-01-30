import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Discovery from '../pages/discovery';
import { apiClient } from '../lib/api';
import { useWebSocket } from '../contexts/websocket-context';

// Mock the API client and WebSocket
jest.mock('../lib/api');
jest.mock('../contexts/websocket-context');

const mockUseWebSocket = useWebSocket as jest.MockedFunction<typeof useWebSocket>;

const mockDevices = [
  { id: 1, name: 'Switch 1', ip: '192.168.1.1', status: 'online', type: 'switch' },
  { id: 2, name: 'Router 1', ip: '192.168.1.2', status: 'online', type: 'router' },
];

describe('Discovery Page', () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock WebSocket
    mockUseWebSocket.mockReturnValue({
      isConnected: true,
      lastMessage: null,
      subscribe: jest.fn(),
      send: jest.fn(),
      connect: jest.fn(),
      disconnect: jest.fn(),
      subscriptions: [],
    });

    // Mock API responses
    (apiClient.getDevices as jest.Mock).mockResolvedValue(mockDevices);
    (apiClient.post as jest.Mock).mockResolvedValue({});
  });

  test('displays device list and handles discovery', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <Discovery />
      </QueryClientProvider>
    );

    // Check if device list is displayed
    await waitFor(() => {
      expect(screen.getByText('Switch 1')).toBeInTheDocument();
      expect(screen.getByText('Router 1')).toBeInTheDocument();
    });

    // Test device selection
    fireEvent.click(screen.getByText('Switch 1'));
    expect(screen.getByText('Device Details')).toBeInTheDocument();

    // Test discovery start
    fireEvent.click(screen.getByText('Start Discovery'));
    await waitFor(() => {
      expect(apiClient.post).toHaveBeenCalledWith('/discovery/start', expect.anything());
    });
  });

  test('handles real-time updates', async () => {
    const mockSubscribe = jest.fn();
    mockUseWebSocket.mockReturnValue({
      isConnected: true,
      lastMessage: { type: 'device_update', data: { id: 1, status: 'offline' } },
      subscribe: mockSubscribe,
      send: jest.fn(),
      connect: jest.fn(),
      disconnect: jest.fn(),
      subscriptions: [],
    });

    render(
      <QueryClientProvider client={queryClient}>
        <Discovery />
      </QueryClientProvider>
    );

    // Verify WebSocket subscription
    await waitFor(() => {
      expect(mockSubscribe).toHaveBeenCalledWith('devices', expect.any(Function));
    });
  });
});
