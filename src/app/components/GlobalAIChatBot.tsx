import { useState, useRef, useEffect } from 'react';
import { X, Send, Minus, Maximize2, Minimize2, ImagePlus, Mic, MicOff } from 'lucide-react';
import { hamelAssets } from '../data/hamelAssets';
import {
  sendChatAssist,
  uploadChatRoomPhoto,
  type StorefrontChatMessage,
} from '../lib/chat-api';
import { ApiError } from '../lib/api';
import { ChatMarkdown } from './ChatMarkdown';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  imageUrl?: string;
}

type ChatWindowSize = 'compact' | 'default' | 'maximized';

const WELCOME: Message = {
  id: '1',
  text: "Hi! I'm Hamel's AI assistant. Ask about products, pricing, install, or warranty.\n\nYou can also:\n• Describe your room size for an HP estimate\n• Upload a room photo\n• Speak your question (mic)",
  sender: 'ai',
  timestamp: new Date(),
};

function toHistory(messages: Message[]): StorefrontChatMessage[] {
  return messages
    .filter((m) => m.id !== '1')
    .map((m) => ({
      role: m.sender === 'ai' ? 'assistant' : 'user',
      content: m.text,
      imageUrl: m.imageUrl,
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

type SpeechRec = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  onresult: ((ev: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
};

function getSpeechRecognition(): (new () => SpeechRec) | null {
  const w = window as unknown as {
    SpeechRecognition?: new () => SpeechRec;
    webkitSpeechRecognition?: new () => SpeechRec;
  };
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

export function GlobalAIChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [windowSize, setWindowSize] = useState<ChatWindowSize>('default');
  const [messages, setMessages] = useState<Message[]>([WELCOME]);
  const [inputText, setInputText] = useState('');
  const [pendingImage, setPendingImage] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [listening, setListening] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<SpeechRec | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping, windowSize]);

  const handleSendMessage = async (text?: string, imageUrl?: string | null) => {
    const messageText = (text || inputText).trim();
    const img = imageUrl === undefined ? pendingImage : imageUrl;
    if ((!messageText && !img) || isTyping) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: messageText || 'Please estimate aircon HP for this room photo.',
      sender: 'user',
      timestamp: new Date(),
      imageUrl: img || undefined,
    };

    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setInputText('');
    setPendingImage(null);
    setIsTyping(true);

    try {
      const res = await sendChatAssist({
        message: userMessage.text,
        history: toHistory(nextMessages),
        imageUrl: userMessage.imageUrl,
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
          ? err.message.includes('ANTHROPIC') ||
            err.message.includes('GEMINI') ||
            err.message.includes('API')
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

  const onPickImage = async (file: File | null) => {
    if (!file || !file.type.startsWith('image/')) return;
    try {
      const url = await uploadChatRoomPhoto(file);
      setPendingImage(url);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: `${Date.now()}-up`,
          text:
            err instanceof Error
              ? `Couldn't upload photo: ${err.message}`
              : "Couldn't upload that photo. Try again.",
          sender: 'ai',
          timestamp: new Date(),
        },
      ]);
    }
  };

  const toggleMic = () => {
    if (listening && recognitionRef.current) {
      recognitionRef.current.stop();
      setListening(false);
      return;
    }
    const Ctor = getSpeechRecognition();
    if (!Ctor) {
      setMessages((prev) => [
        ...prev,
        {
          id: `${Date.now()}-mic`,
          text: 'Voice input isn’t supported in this browser. Type your room size (e.g. 3m × 4m) or upload a photo instead.',
          sender: 'ai',
          timestamp: new Date(),
        },
      ]);
      return;
    }
    const rec = new Ctor();
    recognitionRef.current = rec;
    rec.continuous = false;
    rec.interimResults = false;
    rec.lang = 'en-PH';
    rec.onresult = (ev) => {
      const transcript = ev.results?.[0]?.[0]?.transcript?.trim();
      if (transcript) setInputText((prev) => (prev ? `${prev} ${transcript}` : transcript));
    };
    rec.onerror = () => setListening(false);
    rec.onend = () => setListening(false);
    rec.start();
    setListening(true);
  };

  return (
    <>
      {isOpen && (
        <div
          className={`fixed z-50 flex flex-col overflow-hidden border border-gray-200 bg-white shadow-2xl transition-all duration-200 ${windowSizeClasses(windowSize)}`}
        >
          <div className="relative flex shrink-0 items-center justify-between gap-3 border-b border-gray-100 bg-white px-3 pb-3 pt-4 sm:px-4">
            <div
              className="absolute inset-x-0 top-0 h-1.5 rounded-t-2xl"
              style={{ backgroundColor: '#0EA5E9' }}
              aria-hidden
            />
            <div className="flex min-w-0 items-center gap-3 pt-1">
              <div className="flex h-14 w-14 shrink-0 items-end justify-center overflow-hidden sm:h-16 sm:w-16">
                <img
                  src={hamelAssets.mascot.assistance}
                  alt=""
                  className="h-full w-full object-contain object-bottom"
                />
              </div>
              <div className="min-w-0">
                <div className="truncate text-base font-bold text-gray-900 sm:text-lg">
                  Hamel AI Assistant
                </div>
                <div className="mt-0.5 flex items-center gap-1.5 text-xs text-gray-500">
                  <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-500" />
                  <span>Online now</span>
                </div>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-1.5 self-end pb-0.5">
              <button
                type="button"
                onClick={() =>
                  setWindowSize((s) => (s === 'compact' ? 'default' : 'compact'))
                }
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 text-gray-600 transition-colors hover:bg-gray-200"
                aria-label={windowSize === 'compact' ? 'Restore default size' : 'Compact window'}
                title={windowSize === 'compact' ? 'Default size' : 'Smaller window'}
              >
                <Minus size={16} strokeWidth={2.5} />
              </button>
              <button
                type="button"
                onClick={() =>
                  setWindowSize((s) => (s === 'maximized' ? 'default' : 'maximized'))
                }
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 text-gray-600 transition-colors hover:bg-gray-200"
                aria-label={windowSize === 'maximized' ? 'Restore default size' : 'Maximize window'}
                title={windowSize === 'maximized' ? 'Default size' : 'Maximize'}
              >
                {windowSize === 'maximized' ? (
                  <Minimize2 size={15} strokeWidth={2.5} />
                ) : (
                  <Maximize2 size={15} strokeWidth={2.5} />
                )}
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  setWindowSize('default');
                }}
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 text-gray-600 transition-colors hover:bg-gray-200"
                aria-label="Close chat"
                title="Close"
              >
                <X size={16} strokeWidth={2.5} />
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
                  {message.imageUrl && (
                    <img
                      src={message.imageUrl}
                      alt="Room"
                      className="mb-2 max-h-40 w-full rounded-lg object-cover"
                    />
                  )}
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
                    />
                    <div
                      className="h-2 w-2 animate-bounce rounded-full bg-gray-400"
                      style={{ animationDelay: '150ms' }}
                    />
                    <div
                      className="h-2 w-2 animate-bounce rounded-full bg-gray-400"
                      style={{ animationDelay: '300ms' }}
                    />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          <div className="shrink-0 space-y-2 rounded-b-2xl border-t bg-white p-3">
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                disabled={isTyping}
                onClick={() =>
                  void handleSendMessage(
                    'My room is about 12 square meters. What HP aircon do I need?'
                  )
                }
                className="rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-[11px] text-gray-700 hover:bg-gray-100 disabled:opacity-50"
              >
                Estimate HP (12 sqm)
              </button>
              <button
                type="button"
                disabled={isTyping}
                onClick={() => fileInputRef.current?.click()}
                className="rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-[11px] text-gray-700 hover:bg-gray-100 disabled:opacity-50"
              >
                Room photo → HP
              </button>
            </div>

            {pendingImage && (
              <div className="flex items-center gap-2 rounded-lg border border-sky-100 bg-sky-50 px-2 py-1.5">
                <img src={pendingImage} alt="" className="h-10 w-10 rounded object-cover" />
                <span className="flex-1 text-xs text-sky-900">Photo attached — send to estimate HP</span>
                <button
                  type="button"
                  className="text-xs text-sky-700 hover:underline"
                  onClick={() => setPendingImage(null)}
                >
                  Remove
                </button>
              </div>
            )}

            <div className="flex gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  void onPickImage(e.target.files?.[0] ?? null);
                  e.target.value = '';
                }}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isTyping}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                title="Upload room photo"
                aria-label="Upload room photo"
              >
                <ImagePlus size={18} />
              </button>
              <button
                type="button"
                onClick={toggleMic}
                disabled={isTyping}
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border text-gray-600 hover:bg-gray-50 disabled:opacity-50 ${
                  listening ? 'border-red-300 bg-red-50 text-red-600' : 'border-gray-300'
                }`}
                title={listening ? 'Stop listening' : 'Voice input'}
                aria-label={listening ? 'Stop listening' : 'Voice input'}
              >
                {listening ? <MicOff size={18} /> : <Mic size={18} />}
              </button>
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask in English, Tagalog, or Cebuano…"
                disabled={isTyping}
                className="min-w-0 flex-1 rounded-full border border-gray-300 px-4 py-2.5 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#0EA5E9] disabled:bg-gray-50"
              />
              <button
                type="button"
                onClick={() => void handleSendMessage()}
                disabled={(!inputText.trim() && !pendingImage) || isTyping}
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
            src={hamelAssets.mascot.assistance}
            alt="Chat assist"
            className="h-full w-full object-contain p-0.5"
          />
        </button>
      )}
    </>
  );
}
