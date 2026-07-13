import { useState, useEffect } from 'react';
import { X, Search } from 'lucide-react';
import { Link } from 'react-router';
import { useCatalog } from '../context/CatalogContext';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const { products } = useCatalog();
  const [searchQuery, setSearchQuery] = useState('');

  const searchResults = searchQuery.trim()
    ? products.filter(product =>
        product.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.features.some(f => f.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : [];

  // Close modal on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/20 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-2xl mx-4 bg-white rounded-lg shadow-2xl">
        {/* Header */}
        <div className="flex items-center gap-3 p-4 border-b">
          <Search size={24} style={{ color: '#0EA5E9' }} />
          <input
            type="text"
            placeholder="Search for aircon models, brands, or features..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 text-lg outline-none"
            autoFocus
          />
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={24} className="text-gray-600" />
          </button>
        </div>

        {/* Results */}
        <div className="max-h-96 overflow-y-auto">
          {searchQuery.trim() === '' ? (
            <div className="p-8 text-center text-gray-500">
              <Search size={48} className="mx-auto mb-4 text-gray-300" />
              <p>Start typing to search for products...</p>
            </div>
          ) : searchResults.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <p>No products found for "{searchQuery}"</p>
              <p className="text-sm mt-2">Try searching for brands like Samsung, Carrier, or Panasonic</p>
            </div>
          ) : (
            <div className="divide-y">
              {searchResults.map(product => (
                <Link
                  key={product.id}
                  to={`/product/${product.id}`}
                  onClick={onClose}
                  className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors"
                >
                  <img
                    src={product.images[0]}
                    alt={product.model}
                    className="w-20 h-20 object-contain flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-gray-500">{product.brand}</div>
                    <div className="font-semibold text-gray-900 truncate">{product.model}</div>
                    <div className="text-sm" style={{ color: '#0EA5E9' }}>
                      ₱{product.priceStart.toLocaleString()} - ₱{product.priceEnd.toLocaleString()}
                    </div>
                  </div>
                  {product.features.includes('Inverter Technology') && (
                    <div className="px-2 py-1 text-xs font-semibold text-white rounded flex-shrink-0" style={{ backgroundColor: '#0EA5E9' }}>
                      Inverter
                    </div>
                  )}
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {searchQuery.trim() && searchResults.length > 0 && (
          <div className="p-4 border-t bg-gray-50 text-center text-sm text-gray-600">
            Found {searchResults.length} product{searchResults.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>
    </div>
  );
}
