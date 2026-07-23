import { useState } from 'react';
import { X, Send, MessageCircle } from 'lucide-react';

interface ChatModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ChatModal({ isOpen, onClose }: ChatModalProps) {
  const [messages, setMessages] = useState<Array<{ type: 'user' | 'ai'; text: string }>>([
    {
      type: 'ai',
      text: "Hi there! 👋 I'm Hamel's AI assistant. How can I help you today?\n\nYou can ask me about:\n• Product recommendations\n• Pricing and availability\n• Installation services\n• Warranty information"
    }
  ]);
  const [inputValue, setInputValue] = useState('');

  const handleSend = () => {
    if (!inputValue.trim()) return;

    const userMessage = inputValue.trim();
    setMessages(prev => [...prev, { type: 'user', text: userMessage }]);
    setInputValue('');

    setTimeout(() => {
      let response = '';
      const lower = userMessage.toLowerCase();

      if (lower.includes('price') || lower.includes('magkano') || lower.includes('how much')) {
        response = "Prices vary by brand and HP size:\n\n• 0.75HP: ₱12,500 - ₱18,900\n• 1HP: ₱18,900 - ₱28,500\n• 1.5HP: ₱25,500 - ₱38,900\n• 2HP: ₱35,500 - ₱52,900\n\nWould you like to see specific products or get a personalized quote?";
      } else if (lower.includes('installation') || lower.includes('install') || lower.includes('libre')) {
        response = "Yes! Professional installation is FREE with your purchase! 🔧\n\nOur TESDA-certified technicians will:\n• Install your unit properly\n• Test all functions\n• Clean up after installation\n• Show you how to use it\n\nAdditional charges may apply for high floors or special wall types.";
      } else if (lower.includes('warranty')) {
        response = "All units come with official manufacturer warranty:\n\n✓ 1 year parts & labor\n✓ Up to 5 years compressor (inverter models)\n✓ Nationwide service centers\n\nThe warranty is honored by the brand's service centers anywhere in the Philippines.";
      } else if (lower.includes('delivery') || lower.includes('deliver')) {
        response = "We deliver across Metro Cebu! 🚚\n\nCoverage areas:\n• Cebu City\n• Mandaue City\n• Lapu-Lapu City\n• Talisay City\n• Consolacion\n• And more!\n\nTypically 3-5 business days after order confirmation.";
      } else if (lower.includes('inverter') || lower.includes('difference')) {
        response = "Inverter aircons are MORE energy efficient! ⚡\n\nBenefits:\n• Save 30-50% on electricity\n• Quieter operation\n• Faster cooling\n• Longer compressor life\n\nNon-inverter units cost less upfront but use more power. Inverter pays for itself in 2-3 years through savings!";
      } else if (lower.includes('recommend') || lower.includes('which') || lower.includes('best')) {
        response = "I'd love to help you find the perfect aircon! 🎯\n\nTo give the best recommendation, I need to know:\n\n1. Room size (in sqm)\n2. Your budget range\n3. Preferred brand (if any)\n\nOr I can connect you with our team for a personalized consultation. What works best for you?";
      } else if (lower.includes('talk') || lower.includes('human') || lower.includes('person') || lower.includes('tao')) {
        response = "Of course! Let me connect you with our team. 😊\n\nYou can reach us via:\n\n💬 Messenger: m.me/hameltrading\n📲 WhatsApp: +63 917 123 4567\n📞 Call: (032) 234-5678\n\nOr click below to continue on your preferred platform.";
      } else {
        response = "Thanks for your message! I'm still learning, so let me connect you with our team for the best assistance. 😊\n\nYou can:\n• Browse our products page\n• Call us: (032) 234-5678\n• Message us on Facebook/WhatsApp\n\nOr ask me about pricing, installation, warranty, or delivery!";
      }

      setMessages(prev => [...prev, { type: 'ai', text: response }]);
    }, 1000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {}
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose} />

      {}
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl flex flex-col" style={{ height: '600px' }}>
        {}
        <div className="flex items-center justify-between p-4 border-b" style={{ backgroundColor: '#0EA5E9' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold" style={{ backgroundColor: '#1A3A6B' }}>
              H
            </div>
            <div className="text-white">
              <div className="font-bold">Hamel AI</div>
              <div className="text-xs text-blue-100">Typically replies instantly</div>
            </div>
          </div>
          <button onClick={onClose} className="text-white hover:bg-white/20 p-2 rounded-full transition-colors">
            <X size={24} />
          </button>
        </div>

        {}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message, index) => (
            <div key={index} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
              {message.type === 'ai' && (
                <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mr-2 text-white text-sm font-bold" style={{ backgroundColor: '#1A3A6B' }}>
                  H
                </div>
              )}
              <div
                className={`max-w-[75%] px-4 py-3 rounded-2xl whitespace-pre-line ${
                  message.type === 'user'
                    ? 'text-white rounded-br-sm'
                    : 'bg-gray-100 text-gray-900 rounded-bl-sm'
                }`}
                style={message.type === 'user' ? { backgroundColor: '#1A3A6B' } : {}}
              >
                {message.text}
              </div>
            </div>
          ))}
        </div>

        {}
        <div className="p-4 border-t">
          <div className="flex items-center gap-2 bg-gray-100 rounded-full px-4 py-2">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Type your message..."
              className="flex-1 bg-transparent outline-none"
            />
            <button
              onClick={handleSend}
              disabled={!inputValue.trim()}
              className="w-8 h-8 rounded-full flex items-center justify-center transition-colors disabled:opacity-50"
              style={{ backgroundColor: '#0EA5E9' }}
            >
              <Send size={18} className="text-white" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
