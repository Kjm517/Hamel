import { useState } from 'react';
import { ContactOptionsModal } from '../components/ContactOptionsModal';
import { CoolDealsHeroBanner } from '../components/CoolDealsHeroBanner';
import { CoolDealsSections } from '../components/cool-deals/CoolDealsSections';
import { useCoolDealsBanner } from '../hooks/useBanner';
import { useCoolDealsPage } from '../hooks/useCoolDealsPage';

export function CoolDealsPage() {
  const [isContactOpen, setIsContactOpen] = useState(false);
  const banner = useCoolDealsBanner();
  const page = useCoolDealsPage();

  return (
    <div className="bg-[#F4F8FC]">
      <CoolDealsHeroBanner config={banner} />
      <CoolDealsSections config={page} onContact={() => setIsContactOpen(true)} />
      <ContactOptionsModal isOpen={isContactOpen} onClose={() => setIsContactOpen(false)} />
    </div>
  );
}
