/**
 * ChatPanel Tests
 */

import { render, screen, waitFor } from '@/test/setup';
import userEvent from '@testing-library/user-event';
import { ChatPanel } from '../chat-panel';
import vi from 'vitest';

// Mock the AI SDK
vi.mock('@ai-sdk/react', () => ({
  useChat: vi.fn(() => ({
    messages: [],
    input: '',
    handleInputChange: vi.fn(),
    handleSubmit: vi.fn(),
    isLoading: false,
    error: null,
    stop: vi.fn(),
    reload: vi.fn(),
    setInput: vi.fn(),
  })),
}));

describe('ChatPanel', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  it('should render chat interface', () => {
    render(<ChatPanel />);
    expect(screen.getByText('AI Assistant')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/describe what you want to build/i)).toBeInTheDocument();
  });

  it('should display loading state', async () => {
    const { useChat } = await import('@ai-sdk/react');
    vi.mocked(useChat).mockReturnValue({
      ...vi.mocked(useChat)(),
      isLoading: true,
    } as any);

    render(<ChatPanel />);
    expect(screen.getByText(/thinking/i)).toBeInTheDocument();
  });

  it('should display error message with retry button', async () => {
    const { useChat } = await import('@ai-sdk/react');
    const mockReload = vi.fn();

    vi.mocked(useChat).mockReturnValue({
      ...vi.mocked(useChat)(),
      error: { message: 'API Error' },
      reload: mockReload,
    } as any);

    render(<ChatPanel />);
    expect(screen.getByText(/error: api error/i)).toBeInTheDocument();
    expect(screen.getByText(/retry/i)).toBeInTheDocument();
  });

  it('should call retry when retry button is clicked', async () => {
    const user = userEvent.setup();
    const { useChat } = await import('@ai-sdk/react');
    const mockReload = vi.fn();

    vi.mocked(useChat).mockReturnValue({
      ...vi.mocked(useChat)(),
      error: { message: 'API Error' },
      reload: mockReload,
    } as any);

    render(<ChatPanel />);

    const retryButton = screen.getByText(/retry/i);
    await user.click(retryButton);

    await waitFor(() => {
      expect(mockReload).toHaveBeenCalledTimes(1);
    });
  });

  it('should show clear history button when there are messages', async () => {
    const { useChat } = await import('@ai-sdk/react');

    vi.mocked(useChat).mockReturnValue({
      ...vi.mocked(useChat)(),
      messages: [
        { id: '1', role: 'user', content: 'Hello' },
        { id: '2', role: 'assistant', content: 'Hi there!' },
      ],
    } as any);

    render(<ChatPanel />);
    expect(screen.getByText(/clear history/i)).toBeInTheDocument();
  });

  it('should have proper accessibility attributes', () => {
    render(<ChatPanel />);

    const chatInterface = screen.getByRole('region', { name: /ai assistant/i }) || document.querySelector('.chat-panel');
    expect(chatInterface).toBeInTheDocument();
  });

  it('should display file upload button', () => {
    render(<ChatPanel />);
    const fileInput = document.querySelector('input[type="file"]');
    expect(fileInput).toBeInTheDocument();
  });

  it('should be disabled when loading', async () => {
    const { useChat } = await import('@ai-sdk/react');

    vi.mocked(useChat).mockReturnValue({
      ...vi.mocked(useChat)(),
      isLoading: true,
    } as any);

    render(<ChatPanel />);

    const textarea = screen.getByPlaceholderText(/describe what you want to build/i);
    expect(textarea).toBeDisabled();
  });
});
