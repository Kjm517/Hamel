import { X, MessageCircle, Send } from 'lucide-react';
import { useState } from 'react';
import type { Product } from '../data/products';
import { useStoreSettings } from '../context/StoreSettingsContext';
import { openUrlBlank } from '../lib/open-external';

interface InquiryModalProps {
  product: Product;
  onClose: () => void;
  onChatWithAI: (inquiryData: InquiryData) => void;
}

export interface InquiryData {
  product: Product;
  selectedHP: string;
  quantity: string;
  deliveryAddress: string;
  preferredSchedule: string;
  contactNumber: string;
}

export function InquiryModal({ product, onClose, onChatWithAI }: InquiryModalProps) {
  const { whatsappUrl, messengerUrl } = useStoreSettings();
  const [formData, setFormData] = useState({
    quantity: '1',
    deliveryAddress: '',
    preferredSchedule: '',
    contactNumber: '',
    selectedHP: product.hp[0] || '',
  });

  const handleChatWithAI = () => {
    const inquiryData: InquiryData = {
      product,
      selectedHP: formData.selectedHP,
      quantity: formData.quantity,
      deliveryAddress: formData.deliveryAddress,
      preferredSchedule: formData.preferredSchedule,
      contactNumber: formData.contactNumber,
    };
    onChatWithAI(inquiryData);
    onClose();
  };

  const handleDirectContact = (platform: 'messenger' | 'whatsapp') => {
    const message = `Hi Hamel Trading! I'd like to inquire about the following:\n\nProduct: ${product.brand} ${product.model}\nHP: ${formData.selectedHP}\nQuantity: ${formData.quantity}\nDelivery Address: ${formData.deliveryAddress}\nPreferred Date: ${formData.preferredSchedule}\nContact Number: ${formData.contactNumber}`;

    if (platform === 'messenger') {
      openUrlBlank(messengerUrl({ message }));
    } else {
      openUrlBlank(whatsappUrl(message));
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between rounded-t-xl">
          <h2 className="text-xl font-bold" style={{ color: '#0EA5E9' }}>Send Inquiry</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Product Summary */}
        <div className="px-6 py-4 border-b" style={{ backgroundColor: '#E0F2FE' }}>
          <div className="flex gap-4">
            <img
              src={product.image}
              alt={product.model}
              className="w-16 h-16 object-contain bg-white rounded"
            />
            <div className="flex-1">
              <div className="text-xs text-gray-500">{product.brand}</div>
              <div className="font-bold text-gray-900">{product.model}</div>
              <div className="text-sm font-bold mt-1" style={{ color: '#0EA5E9' }}>
                ₱{product.priceStart.toLocaleString()} - ₱{product.priceEnd.toLocaleString()}
              </div>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="px-6 py-6 space-y-4">
          {/* HP Selection */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: '#0EA5E9' }}>
              Select HP <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.selectedHP}
              onChange={(e) => setFormData({ ...formData, selectedHP: e.target.value })}
              className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-[#0EA5E9]"
            >
              {product.hp.map((hp) => (
                <option key={hp} value={hp}>
                  {hp}
                </option>
              ))}
            </select>
          </div>

          {/* Quantity */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: '#0EA5E9' }}>
              Quantity <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="1"
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
              className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-[#0EA5E9]"
            />
          </div>

          {/* Delivery Address */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: '#0EA5E9' }}>
              Delivery Address <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={3}
              value={formData.deliveryAddress}
              onChange={(e) => setFormData({ ...formData, deliveryAddress: e.target.value })}
              placeholder="Enter your complete address in Cebu"
              className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-[#0EA5E9]"
            />
          </div>

          {/* Preferred Schedule */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: '#0EA5E9' }}>
              Preferred Delivery/Installation Date
            </label>
            <input
              type="date"
              value={formData.preferredSchedule}
              onChange={(e) => setFormData({ ...formData, preferredSchedule: e.target.value })}
              className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-[#0EA5E9]"
            />
          </div>

          {/* Contact Number */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: '#0EA5E9' }}>
              Contact Number <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              value={formData.contactNumber}
              onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
              placeholder="09XX-XXX-XXXX"
              className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-[#0EA5E9]"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="px-6 py-6 border-t bg-gray-50 space-y-4 rounded-b-xl">
          {/* Primary CTA */}
          <div>
            <button
              onClick={handleChatWithAI}
              className="w-full py-4 rounded-lg font-bold text-base flex items-center justify-center gap-2 hover:opacity-90 transition-opacity shadow-md text-gray-900"
              style={{ backgroundColor: '#FFC107' }}
            >
              <MessageCircle size={22} />
              Chat with Hamel AI
            </button>
            <p className="text-xs text-gray-500 text-center mt-2">
              AI handles your inquiry instantly — available 24/7
            </p>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 border-t border-gray-300"></div>
            <span className="text-sm text-gray-500">Prefer to contact directly?</span>
            <div className="flex-1 border-t border-gray-300"></div>
          </div>

          {/* Secondary Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => handleDirectContact('messenger')}
              className="px-4 py-3 border-2 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 hover:bg-blue-50 transition-colors"
              style={{ borderColor: '#0EA5E9', color: '#0EA5E9' }}
            >
              <MessageCircle size={18} />
              Messenger
            </button>
            <button
              onClick={() => handleDirectContact('whatsapp')}
              className="px-4 py-3 border-2 border-green-600 rounded-lg font-semibold text-sm text-green-600 flex items-center justify-center gap-2 hover:bg-green-50 transition-colors"
            >
              <Send size={18} />
              WhatsApp
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
