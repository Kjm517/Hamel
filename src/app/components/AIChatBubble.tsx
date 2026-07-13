import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Lock } from 'lucide-react';
import type { Product } from '../data/products';
import type { InquiryData } from './InquiryModal';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

interface AIChatBubbleProps {
  product: Product;
  inquiryData: InquiryData | null;
}

export function AIChatBubble({ product, inquiryData }: AIChatBubbleProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showHandoff, setShowHandoff] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: `Hi! I'm Hamel's AI assistant. I can help you choose the right aircon, answer questions, or take your inquiry. What can I help you with today?`,
      sender: 'ai',
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showQuickReplies, setShowQuickReplies] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const initialQuickReplies = [
    'Help me choose an aircon',
    'I want to place an order',
    'Ask about installation',
  ];

  const followUpQuickReplies = [
    'Ask about installation',
    'Ask about warranty',
    'Talk to a person',
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // Handle inquiry data from modal
  useEffect(() => {
    if (inquiryData && !isOpen) {
      setIsOpen(true);
      setIsTyping(true);

      setTimeout(() => {
        const confirmationMessage: Message = {
          id: Date.now().toString(),
          text: `Hi! I received your inquiry for:\n\n${inquiryData.product.brand} ${inquiryData.product.model}\n${inquiryData.selectedHP} · Qty: ${inquiryData.quantity}\nDeliver to: ${inquiryData.deliveryAddress || 'Not specified'}\nDate: ${inquiryData.preferredSchedule || 'Not specified'}\nContact: ${inquiryData.contactNumber}\n\nLet me confirm this with our team and check availability for you!`,
          sender: 'ai',
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, confirmationMessage]);
        setIsTyping(false);

        // Follow-up message
        setTimeout(() => {
          setIsTyping(true);
          setTimeout(() => {
            const followUpMessage: Message = {
              id: (Date.now() + 1).toString(),
              text: `Great news! That unit is available. Our team will contact you at ${inquiryData.contactNumber} to confirm delivery schedule. Anything else I can help you with?`,
              sender: 'ai',
              timestamp: new Date(),
            };
            setMessages((prev) => [...prev, followUpMessage]);
            setIsTyping(false);
            setShowQuickReplies(true);
          }, 1500);
        }, 1000);
      }, 1000);
    }
  }, [inquiryData]);

  const generateAIResponse = (userMessage: string): string => {
    const lowerMessage = userMessage.toLowerCase();

    // Room size questions
    if (lowerMessage.includes('room') || lowerMessage.includes('sqm') || lowerMessage.includes('square')) {
      const coverage = product.specifications.find(s => s.label === 'Coverage Area')?.value || '15-20 sqm';
      return `The ${product.model} is ideal for rooms around ${coverage}. For best results, measure your room and choose an aircon with capacity slightly higher than your room size. Need help calculating?`;
    }

    // Energy/electricity questions
    if (lowerMessage.includes('electricity') || lowerMessage.includes('bill') || lowerMessage.includes('energy') || lowerMessage.includes('consume')) {
      const rating = product.specifications.find(s => s.label === 'Energy Rating')?.value || '4 Star';
      const consumption = product.specifications.find(s => s.label === 'Power Consumption')?.value || '900W';
      return `This model has a ${rating} energy rating and consumes ${consumption}. ${product.features.includes('Inverter Technology') ? 'With inverter technology, you can save up to 60% on electricity compared to non-inverter models!' : 'Consider upgrading to an inverter model to save more on electricity bills.'}`;
    }

    // Noise level questions
    if (lowerMessage.includes('noise') || lowerMessage.includes('quiet') || lowerMessage.includes('loud') || lowerMessage.includes('tahimik')) {
      const noise = product.specifications.find(s => s.label === 'Noise Level')?.value || '22 dB(A)';
      return `The noise level is ${noise}. This is very quiet - about as quiet as a whisper! Perfect for bedrooms and offices where you need peace and quiet.`;
    }

    // Installation questions
    if (lowerMessage.includes('install') || lowerMessage.includes('installation') || lowerMessage.includes('setup')) {
      return `Professional installation is available! Our certified technicians will handle everything - from mounting the indoor and outdoor units to testing. Installation typically takes 2-3 hours. Free delivery and installation included for Cebu area!`;
    }

    // Warranty questions
    if (lowerMessage.includes('warranty') || lowerMessage.includes('guarantee')) {
      const warranty = product.specifications.find(s => s.label === 'Warranty')?.value || '1 Year Full + 5 Years Compressor';
      return `This unit comes with ${warranty}. We also provide after-sales support and maintenance services. The warranty covers parts, labor, and compressor defects.`;
    }

    // Price/payment questions
    if (lowerMessage.includes('price') || lowerMessage.includes('cost') || lowerMessage.includes('payment') || lowerMessage.includes('installment') || lowerMessage.includes('magkano')) {
      return `The ${product.model} is priced at ₱${product.priceStart.toLocaleString()} - ₱${product.priceEnd.toLocaleString()} depending on HP. We offer 0% installment for up to 12 months! Would you like to inquire about specific payment terms?`;
    }

    // HP selection questions
    if (lowerMessage.includes('hp') || lowerMessage.includes('horsepower') || lowerMessage.includes('which hp')) {
      return `Available HP options: ${product.hp.join(', ')}. Generally: 0.75-1HP for 10-15 sqm, 1.5HP for 15-20 sqm, 2HP for 20-30 sqm. What's your room size?`;
    }

    // Inverter questions
    if (lowerMessage.includes('inverter') || lowerMessage.includes('non-inverter')) {
      if (product.features.includes('Inverter Technology')) {
        return `Yes! This is an inverter model. Inverter aircons adjust compressor speed based on room temperature, making them more energy-efficient and quieter than non-inverter types. You'll save significantly on electricity!`;
      } else {
        return `This is a non-inverter model. For better energy savings, you might want to check our inverter models which can reduce electricity consumption by up to 60%.`;
      }
    }

    // Features questions
    if (lowerMessage.includes('feature') || lowerMessage.includes('function')) {
      return `Key features: ${product.features.slice(0, 3).join(', ')}. ${product.features.includes('Wi-Fi Control') ? 'You can control it from your phone!' : ''} Would you like details on any specific feature?`;
    }

    // Comparison questions
    if (lowerMessage.includes('compare') || lowerMessage.includes('difference') || lowerMessage.includes('vs')) {
      return `I'd be happy to help you compare! This ${product.brand} model offers great value with ${product.rating} star rating. What other brand or model would you like to compare it with?`;
    }

    // Stock/availability questions
    if (lowerMessage.includes('stock') || lowerMessage.includes('available') || lowerMessage.includes('meron')) {
      return `We currently have this model in stock! Delivery to Cebu typically takes 1-2 days. Ready to inquire or would you like to ask more questions?`;
    }

    // Default responses based on message length
    if (userMessage.length < 10) {
      return `I'm here to help! Feel free to ask about room size requirements, energy consumption, installation, pricing, or any features you'd like to know more about.`;
    }

    return `That's a great question about the ${product.model}! For detailed information about "${userMessage}", I recommend clicking "Inquire Now" to speak with our sales team. They can provide personalized recommendations based on your specific needs. Is there anything else I can help clarify?`;
  };

  const handleSendMessage = (text?: string) => {
    const messageText = text || inputText;
    if (!messageText.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: messageText,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    setShowQuickReplies(false);
    setIsTyping(true);

    // Check if requesting human handoff
    const needsHandoff = messageText.toLowerCase().includes('talk to') ||
                        messageText.toLowerCase().includes('human') ||
                        messageText.toLowerCase().includes('person') ||
                        messageText.toLowerCase().includes('representative') ||
                        messageText.toLowerCase().includes('makausap') ||
                        messageText === 'Talk to a person';

    // Simulate AI typing delay
    setTimeout(() => {
      if (needsHandoff) {
        const handoffMessage: Message = {
          id: (Date.now() + 1).toString(),
          text: `Of course! Let me connect you with our team right away. I'll send them your complete inquiry details so you won't have to repeat yourself.`,
          sender: 'ai',
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, handoffMessage]);
        setIsTyping(false);
        setTimeout(() => {
          setShowHandoff(true);
        }, 800);
      } else {
        const response = generateAIResponse(messageText);
        const aiResponse: Message = {
          id: (Date.now() + 1).toString(),
          text: response,
          sender: 'ai',
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, aiResponse]);
        setIsTyping(false);
      }
    }, 1000 + Math.random() * 1000);
  };

  const handleHandoffClick = (platform: 'messenger' | 'whatsapp') => {
    const message = inquiryData
      ? `Hi Hamel Trading! I'd like to inquire about the following:\n\nProduct: ${inquiryData.product.brand} ${inquiryData.product.model}\nHP: ${inquiryData.selectedHP}\nQuantity: ${inquiryData.quantity}\nDelivery Address: ${inquiryData.deliveryAddress}\nPreferred Date: ${inquiryData.preferredSchedule}\nContact Number: ${inquiryData.contactNumber}\n\nAssisted by Hamel AI Assistant.`
      : `Hi Hamel Trading! I'm interested in the ${product.brand} ${product.model}.\n\nAssisted by Hamel AI Assistant.`;

    if (platform === 'messenger') {
      alert('Opening Messenger... (Demo mode)\n\n' + message);
    } else {
      const whatsappUrl = `https://wa.me/639171234567?text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, '_blank');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <>
      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-4 md:right-6 w-[calc(100vw-2rem)] md:w-[360px] bg-white shadow-2xl border border-gray-200 z-50 flex flex-col" style={{ height: '520px', borderRadius: '16px' }}>
          {/* Header */}
          <div className="text-white p-4 flex items-center justify-between" style={{ backgroundColor: '#0EA5E9', borderTopLeftRadius: '16px', borderTopRightRadius: '16px' }}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                <span className="text-2xl">❄️</span>
              </div>
              <div>
                <div className="font-semibold">Hamel AI Assistant</div>
                <div className="text-xs flex items-center gap-1.5" style={{ color: '#E0F2FE' }}>
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span>Typically replies instantly</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-white/10 rounded-full transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
            {messages.map((message, index) => (
              <div key={message.id}>
                <div
                  className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] px-4 py-2.5 ${
                      message.sender === 'user'
                        ? 'text-white rounded-2xl rounded-br-sm'
                        : 'bg-white text-gray-800 rounded-2xl rounded-bl-sm shadow-sm border border-gray-100'
                    }`}
                    style={message.sender === 'user' ? { backgroundColor: '#0EA5E9' } : {}}
                  >
                    <p className="text-sm leading-relaxed whitespace-pre-line">{message.text}</p>
                  </div>
                </div>
                {/* Quick replies after first AI message or after inquiry confirmation */}
                {((index === 0 && message.sender === 'ai' && !inquiryData) ||
                  (showQuickReplies && index === messages.length - 1 && message.sender === 'ai')) && (
                  <div className="flex flex-wrap gap-2 mt-3 ml-2">
                    {(inquiryData ? followUpQuickReplies : initialQuickReplies).map((reply) => (
                      <button
                        key={reply}
                        onClick={() => handleSendMessage(reply)}
                        className="px-3 py-1.5 text-xs font-medium rounded-full border-2 hover:bg-white transition-colors"
                        style={{ borderColor: '#0EA5E9', color: '#0EA5E9' }}
                      >
                        {reply}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-white text-gray-800 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm border border-gray-100">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              </div>
            )}

            {/* Human Handoff UI */}
            {showHandoff && (
              <div className="bg-white border-2 rounded-lg p-4 shadow-lg" style={{ borderColor: '#0EA5E9' }}>
                <div className="space-y-3">
                  <button
                    onClick={() => handleHandoffClick('messenger')}
                    className="w-full py-3 rounded-lg font-semibold text-white hover:opacity-90 transition-opacity"
                    style={{ backgroundColor: '#0EA5E9' }}
                  >
                    <div className="flex items-center justify-center gap-2 mb-1">
                      <MessageCircle size={20} />
                      <span>Continue on Messenger</span>
                    </div>
                    <div className="text-xs opacity-80">Chat opens with your details ready</div>
                  </button>
                  <button
                    onClick={() => handleHandoffClick('whatsapp')}
                    className="w-full py-3 rounded-lg font-semibold text-white hover:opacity-90 transition-opacity bg-green-600"
                  >
                    <div className="flex items-center justify-center gap-2 mb-1">
                      <Send size={20} />
                      <span>Continue on WhatsApp</span>
                    </div>
                    <div className="text-xs opacity-80">Message opens with your details ready</div>
                  </button>
                </div>
                <p className="text-xs text-gray-500 text-center mt-3">
                  Your inquiry summary will be automatically included in the message.
                </p>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t bg-white" style={{ borderBottomLeftRadius: '16px', borderBottomRightRadius: '16px' }}>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message..."
                className="flex-1 px-4 py-2.5 border-2 rounded-full focus:outline-none text-sm"
                style={{ borderColor: '#E5E7EB' }}
              />
              <button
                onClick={() => handleSendMessage()}
                disabled={!inputText.trim()}
                className="text-white p-2.5 rounded-full hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
                style={{ backgroundColor: '#0EA5E9' }}
              >
                <Send size={20} />
              </button>
            </div>
            <div className="flex items-center justify-center gap-1 text-xs text-gray-500">
              <Lock size={12} />
              <span>Secured and sent only to Hamel Trading</span>
            </div>
          </div>
        </div>
      )}

      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-4 md:right-6 w-14 h-14 text-white rounded-full shadow-lg hover:shadow-xl hover:scale-110 transition-all z-50 flex items-center justify-center group"
        style={{ backgroundColor: '#0EA5E9' }}
      >
        {isOpen ? (
          <X size={24} />
        ) : (
          <MessageCircle size={24} />
        )}
      </button>

      {/* Tooltip */}
      {!isOpen && (
        <div className="fixed bottom-20 right-4 md:right-6 text-white text-xs px-3 py-2 rounded-lg shadow-lg z-40 pointer-events-none whitespace-nowrap" style={{ backgroundColor: '#0EA5E9' }}>
          Hi! Need help choosing the right aircon? Ask me!
          <div className="absolute bottom-[-6px] right-6 w-3 h-3 rotate-45" style={{ backgroundColor: '#0EA5E9' }}></div>
        </div>
      )}
    </>
  );
}
