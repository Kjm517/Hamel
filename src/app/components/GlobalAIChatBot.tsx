import { useState, useRef, useEffect } from 'react';
import { X, Send, Minus, Maximize2, Minimize2 } from 'lucide-react';
import { hamelAssets } from '../data/hamelAssets';
import { sendChatAssist, type StorefrontChatMessage } from '../lib/chat-api';
import { ApiError } from '../lib/api';
import { ChatMarkdown } from './ChatMarkdown';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

type ChatWindowSize = 'compact' | 'default' | 'maximized';

function toHistory(messages: Message[]): StorefrontChatMessage[] {
  return messages
    .filter((m) => m.id !== '1') // skip static welcome
    .map((m) => ({
      role: m.sender === 'ai' ? 'assistant' : 'user',
      content: m.text,
    }));
}

function windowSizeClasses(size: ChatWindowSize): string {
  if (size === 'maximized') {
    return 'inset-3 sm:inset-4 md:inset-6 w-auto max-w-none h-auto max-h-none rounded-2xl';
  }
  if (size === 'compact') {
    return 'bottom-24 right-4 md:right-6 w-[calc(100vw-2rem)] max-w-[320px] h-[360px] rounded-2xl';
  }
  return 'bottom-24 right-4 md:right-6 w-[calc(100vw-2rem)] md:w-[380px] h-[600px] max-h-[min(600px,calc(100vh-7rem))] rounded-2xl';
}

export function GlobalAIChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [windowSize, setWindowSize] = useState<ChatWindowSize>('default');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "Hi there! 👋 I'm Hamel's AI assistant. How can I help you today?\n\nYou can ask me about:\n• Product recommendations\n• Pricing and availability\n• Installation services\n• Warranty information\n• Energy efficiency tips",
      sender: 'ai',
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping, windowSize]);

  const handleSendMessage = async (text?: string) => {
    const messageText = (text || inputText).trim();
    if (!messageText || isTyping) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: messageText,
      sender: 'user',
      timestamp: new Date(),
    };

    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setInputText('');
    setIsTyping(true);

    try {
      const res = await sendChatAssist({
        message: messageText,
        history: toHistory(nextMessages),
      });
      const reply =
        res.reply?.trim() ||
        "Sorry — I couldn't generate a reply. Please try again, or contact our team on Messenger / WhatsApp.";
      setMessages((prev) => [
        ...prev,
        {
          id: `${Date.now()}-ai`,
          text: reply,
          sender: 'ai',
          timestamp: new Date(),
        },
      ]);
    } catch (err) {
      const fallback =
        err instanceof ApiError && err.message
          ? err.message.includes('ANTHROPIC') || err.message.includes('GEMINI') || err.message.includes('API')
            ? "AI isn't configured yet. Add your API key in the server `.env`, restart the API, then try again.\n\nMeanwhile, you can browse products or reach us on Messenger / WhatsApp."
            : "Sorry — I'm having trouble reaching the AI right now. Please try again, or talk to our team on Messenger / WhatsApp."
          : "Sorry — I'm having trouble reaching the AI right now. Please try again, or talk to our team on Messenger / WhatsApp.";
      setMessages((prev) => [
        ...prev,
        {
          id: `${Date.now()}-err`,
          text: fallback,
          sender: 'ai',
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void handleSendMessage();
    }
  };

  return (
    <>
      {isOpen && (
        <div
          className={`fixed z-50 flex flex-col overflow-hidden border border-gray-200 bg-white shadow-2xl transition-all duration-200 ${windowSizeClasses(windowSize)}`}
        >
          <div
            className="flex shrink-0 items-center justify-between rounded-t-2xl p-3 text-white sm:p-4"
            style={{ backgroundColor: '#0EA5E9' }}
          >
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white sm:h-10 sm:w-10">
                <img
                  src={hamelAssets.mascot.cta}
                  alt=""
                  className="h-full w-full object-contain p-0.5"
                />
              </div>
              <div className="min-w-0">
                <div className="truncate font-bold">Hamel AI Assistant</div>
                <div className="flex items-center gap-1.5 text-xs" style={{ color: '#E0F2FE' }}>
                  <div className="h-2 w-2 rounded-full bg-green-400"></div>
                  <span>Online now</span>
                </div>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-0.5">
              <button
                type="button"
                onClick={() =>
                  setWindowSize((s) => (s === 'compact' ? 'default' : 'compact'))
                }
                className="rounded-full p-1.5 transition-colors hover:bg-white/20"
                aria-label={windowSize === 'compact' ? 'Restore default size' : 'Compact window'}
                title={windowSize === 'compact' ? 'Default size' : 'Smaller window'}
              >
                <Minus size={18} />
              </button>
              <button
                type="button"
                onClick={() =>
                  setWindowSize((s) => (s === 'maximized' ? 'default' : 'maximized'))
                }
                className="rounded-full p-1.5 transition-colors hover:bg-white/20"
                aria-label={windowSize === 'maximized' ? 'Restore default size' : 'Maximize window'}
                title={windowSize === 'maximized' ? 'Default size' : 'Maximize'}
              >
                {windowSize === 'maximized' ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  setWindowSize('default');
                }}
                className="rounded-full p-1.5 transition-colors hover:bg-white/20"
                aria-label="Close chat"
                title="Close"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-gray-50 p-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] px-4 py-2.5 ${
                    message.sender === 'user'
                      ? 'rounded-2xl rounded-br-sm text-white'
                      : 'rounded-2xl rounded-bl-sm bg-white text-gray-800 shadow-sm'
                  } ${windowSize === 'maximized' ? 'md:max-w-[70%]' : ''}`}
                  style={message.sender === 'user' ? { backgroundColor: '#0EA5E9' } : {}}
                >
                  <ChatMarkdown
                    text={message.text}
                    tone={message.sender === 'user' ? 'user' : 'ai'}
                  />
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex justify-start">
                <div className="rounded-2xl rounded-bl-sm bg-white px-4 py-3 text-gray-800 shadow-sm">
                  <div className="flex gap-1">
                    <div
                      className="h-2 w-2 animate-bounce rounded-full bg-gray-400"
                      style={{ animationDelay: '0ms' }}
                    ></div>
                    <div
                      className="h-2 w-2 animate-bounce rounded-full bg-gray-400"
                      style={{ animationDelay: '150ms' }}
                    ></div>
                    <div
                      className="h-2 w-2 animate-bounce rounded-full bg-gray-400"
                      style={{ animationDelay: '300ms' }}
                    ></div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          <div className="shrink-0 rounded-b-2xl border-t bg-white p-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask me anything..."
                disabled={isTyping}
                className="flex-1 rounded-full border border-gray-300 px-4 py-2.5 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#0EA5E9] disabled:bg-gray-50"
              />
              <button
                type="button"
                onClick={() => void handleSendMessage()}
                disabled={!inputText.trim() || isTyping}
                className="rounded-full p-2.5 text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                style={{ backgroundColor: '#0EA5E9' }}
              >
                <Send size={20} />
              </button>
            </div>
          </div>
        </div>
      )}

      {!isOpen && (
        <button
          type="button"
          onClick={() => {
            setWindowSize('default');
            setIsOpen(true);
          }}
          className="fixed bottom-6 right-4 z-50 flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border-2 border-[#0EA5E9] bg-white shadow-lg transition-all hover:scale-110 hover:shadow-xl md:right-6"
          aria-label="Chat with AI Assistant"
        >
          <img
            src={hamelAssets.mascot.cta}
            alt="Chat assist"
            className="h-full w-full object-contain p-1"
          />
        </button>
      )}
    </>
  );
}
