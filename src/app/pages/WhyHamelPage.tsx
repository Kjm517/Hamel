import { Shield, Award, Star, TrendingUp } from 'lucide-react';
import { PageBanner } from '../components/PageBanner';
import { useBanner } from '../hooks/useBanner';
import { hamelAssets } from '../data/hamelAssets';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';

export function WhyHamelPage() {
  const whyHamelBanner = useBanner('why-hamel');
  const stats = [
    { number: '500+', label: 'Happy Customers' },
    { number: '6', label: 'Top Brands Carried' },
    { number: '5-Star', label: 'Rated Service' },
    { number: '10+', label: 'Years in Business' },
  ];

  const process = [
    {
      number: 1,
      title: 'Consultation',
      description: 'We assess your space and cooling needs. No pressure, just honest advice on what works best for your budget and room size.',
    },
    {
      number: 2,
      title: 'Transparent Pricing',
      description: 'You get a clear quote upfront — unit cost, installation, and any accessories needed. No hidden charges, ever.',
    },
    {
      number: 3,
      title: 'Scheduled Installation',
      description: 'Our TESDA-certified team arrives on time, completes installation professionally, and tests everything thoroughly.',
    },
    {
      number: 4,
      title: 'After-Sales Support',
      description: 'We follow up to ensure everything works perfectly. Need maintenance or repairs? Call us directly — we\'re always here.',
    },
  ];

  return (
    <div className="bg-white">
      {}
      <PageBanner config={whyHamelBanner} />

      {}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-6" style={{ color: '#0EA5E9' }}>
                Our Story
              </h2>
              <div className="space-y-4 text-gray-700 leading-relaxed">
                <p>
                  Hamel Trading started in 2010 with a simple mission: provide Cebu families with quality air conditioning solutions and honest, reliable service.
                </p>
                <p>
                  As a local, family-owned business, we understand the unique challenges of Cebu's tropical climate. We know that choosing an aircon isn't just about cooling — it's about comfort, energy savings, and peace of mind.
                </p>
                <p>
                  That's why we only carry trusted brands, employ certified installers, and stand behind every unit we sell. When you buy from Hamel, you're not just getting an aircon — you're gaining a partner committed to keeping you cool for years to come.
                </p>
              </div>
            </div>
            <div className="bg-gray-100 rounded-lg aspect-video overflow-hidden">
              <ImageWithFallback
                src={hamelAssets.clients.commercial01}
                alt="Hamel professional installation project"
                className="w-full h-full object-cover rounded-lg"
              />
            </div>
          </div>
        </div>
      </section>

      {}
      <section className="py-16" style={{ backgroundColor: '#0EA5E9' }}>
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            {stats.map((stat) => (
              <div key={stat.label} className="text-white">
                <div className="text-5xl font-bold mb-2">{stat.number}</div>
                <div className="text-blue-200">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {}
      <section className="py-16" style={{ backgroundColor: '#E0F2FE' }}>
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12" style={{ color: '#0EA5E9' }}>
            Our Process: Simple, Transparent, Professional
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            {process.map((step) => (
              <div key={step.number} className="bg-white p-6 rounded-lg shadow-sm">
                <div className="flex items-start gap-4">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-xl flex-shrink-0"
                    style={{ backgroundColor: step.number === 4 ? '#FFC107' : '#0EA5E9' }}
                  >
                    {step.number}
                  </div>
                  <div>
                    <h3 className="font-bold text-xl mb-2" style={{ color: '#0EA5E9' }}>
                      {step.title}
                    </h3>
                    <p className="text-gray-700">{step.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12" style={{ color: '#0EA5E9' }}>
            Certifications & Affiliations
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-8 border-2 rounded-lg" style={{ borderColor: '#E0F2FE' }}>
              <Award className="mx-auto mb-4" style={{ color: '#FFC107' }} size={48} />
              <h3 className="font-bold mb-2" style={{ color: '#0EA5E9' }}>TESDA Certified</h3>
              <p className="text-sm text-gray-600">
                All our installers are TESDA-certified professionals
              </p>
            </div>
            <div className="text-center p-8 border-2 rounded-lg" style={{ borderColor: '#E0F2FE' }}>
              <Shield className="mx-auto mb-4" style={{ color: '#FFC107' }} size={48} />
              <h3 className="font-bold mb-2" style={{ color: '#0EA5E9' }}>Authorized Dealer</h3>
              <p className="text-sm text-gray-600">
                Official dealer for Samsung, Carrier, Panasonic, Daikin, Midea, LG
              </p>
            </div>
            <div className="text-center p-8 border-2 rounded-lg" style={{ borderColor: '#E0F2FE' }}>
              <Star className="mx-auto mb-4" style={{ color: '#FFC107' }} size={48} />
              <h3 className="font-bold mb-2" style={{ color: '#0EA5E9' }}>5-Star Rated</h3>
              <p className="text-sm text-gray-600">
                Consistently rated 5 stars by our customers on Google
              </p>
            </div>
          </div>
        </div>
      </section>

      {}
      <section className="py-16" style={{ backgroundColor: '#0EA5E9' }}>
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-6">
            Ready to Experience the Hamel Difference?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Let's find the perfect aircon for your space. Talk to our team today.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <button
              className="px-8 py-4 rounded-full font-bold text-white shadow-lg hover:opacity-90 transition-opacity"
              style={{ backgroundColor: '#FFC107' }}
            >
              Shop Aircons
            </button>
            <button className="px-8 py-4 rounded-full font-bold text-white border-2 border-white transition-colors hover:bg-white hover:text-[#0EA5E9]">
              Contact Our Team
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
