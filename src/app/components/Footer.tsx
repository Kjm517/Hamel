import { Facebook, MessageCircle, Mail, Phone, MapPin } from 'lucide-react';
import { Link } from 'react-router';
import { hamelAssets } from '../data/hamelAssets';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { useStoreSettings } from '../context/StoreSettingsContext';

export function Footer() {
  const { settings, whatsappUrl, whatsappDisplay, telHref } = useStoreSettings();
  const addressLines = settings.address.split('\n').filter(Boolean);

  return (
    <footer style={{ backgroundColor: '#0EA5E9' }} className="text-gray-300">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <ImageWithFallback
                src={hamelAssets.branding.logo}
                alt={settings.storeName}
                className="h-10 w-auto object-contain"
              />
              <div>
                <div className="text-xl font-bold text-white">HAMEL</div>
                <div className="text-sm" style={{ color: '#E0F2FE' }}>Trading</div>
              </div>
            </div>
            <p className="text-sm mb-4 text-white">
              The Cooling Experts. Quality brands, expert installation, unbeatable service since 2010.
            </p>
            <div className="flex gap-3">
              <a
                href={settings.messengerUrl || '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-full hover:opacity-80 transition-opacity"
                style={{ backgroundColor: '#FFC107' }}
              >
                <Facebook size={20} className="text-gray-900" />
              </a>
              <a
                href={whatsappUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-green-600 p-2 rounded-full hover:bg-green-700 transition-colors"
              >
                <MessageCircle size={20} className="text-white" />
              </a>
            </div>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/why-hamel" className="hover:text-white transition-colors">About Us</Link></li>
              <li><Link to="/products" className="hover:text-white transition-colors">Products</Link></li>
              <li><Link to="/brands" className="hover:text-white transition-colors">Brands</Link></li>
              <li><Link to="/cool-deals" className="hover:text-white transition-colors">Cool Deals</Link></li>
              <li><Link to="/why-hamel" className="hover:text-white transition-colors">Why Hamel</Link></li>
              <li><Link to="/contact" className="hover:text-white transition-colors">Contact</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">Shop</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/products" className="hover:text-white transition-colors">All Products</Link></li>
              <li><Link to="/cool-deals" className="hover:text-white transition-colors">Cool Deals</Link></li>
              <li><Link to="/brands" className="hover:text-white transition-colors">Shop by Brand</Link></li>
              <li><Link to="/contact" className="hover:text-white transition-colors">Get a Quote</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">Contact Us</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-2">
                <MapPin size={18} className="mt-0.5 flex-shrink-0" />
                <span>
                  {addressLines.map((line, i) => (
                    <span key={i}>
                      {line}
                      {i < addressLines.length - 1 ? <br /> : null}
                    </span>
                  ))}
                </span>
              </li>
              {settings.phoneDisplay ? (
                <li className="flex items-center gap-2">
                  <Phone size={18} />
                  <a href={telHref} className="hover:text-white">{settings.phoneDisplay}</a>
                </li>
              ) : null}
              <li className="flex items-center gap-2">
                <Phone size={18} />
                <a href={whatsappUrl()} className="hover:text-white" target="_blank" rel="noopener noreferrer">
                  {whatsappDisplay}
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Mail size={18} />
                <a href={`mailto:${settings.contactEmail}`} className="hover:text-white">
                  {settings.contactEmail}
                </a>
              </li>
            </ul>
            <div className="mt-4 text-sm">
              <p className="text-white font-semibold">Hours:</p>
              <p className="whitespace-pre-line">{settings.businessHours}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-white border-opacity-20">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="text-center text-sm text-white">
            <p>© {new Date().getFullYear()} {settings.storeName}. All rights reserved.</p>
            <Link to="/privacy-policy" className="mt-1 inline-block underline hover:text-sky-100">
              Privacy Policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
