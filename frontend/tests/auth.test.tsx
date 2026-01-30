import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import Login from '../pages/login';
import { apiClient } from '../lib/api';

// Mock the API client
jest.mock('../lib/api', () => ({
  apiClient: {
    login: jest.fn(),
    logout: jest.fn(),
    getCurrentUser: jest.fn(),
  },
}));

describe('Authentication Flow', () => {
  const queryClient = new QueryClient();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('successful login', async () => {
    (apiClient.login as jest.Mock).mockResolvedValueOnce({ token: 'test-token' });
    (apiClient.getCurrentUser as jest.Mock).mockResolvedValueOnce({ username: 'testuser', role: 'admin' });

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <Login />
        </MemoryRouter>
      </QueryClientProvider>
    );

    // Fill out and submit the form
    fireEvent.change(screen.getByLabelText(/username/i), { target: { value: 'testuser' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /login/i }));

    // Verify API was called with correct data
    await waitFor(() => {
      expect(apiClient.login).toHaveBeenCalledWith('testuser', 'password123');
      expect(apiClient.getCurrentUser).toHaveBeenCalled();
    });
  });

  test('failed login shows error', async () => {
    (apiClient.login as jest.Mock).mockRejectedValueOnce(new Error('Invalid credentials'));

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <Login />
        </MemoryRouter>
      </QueryClientProvider>
    );

    // Submit form with invalid credentials
    fireEvent.click(screen.getByRole('button', { name: /login/i }));

    // Verify error message is shown
    await waitFor(() => {
      expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
    });
  });
});
