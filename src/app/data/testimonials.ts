export interface Testimonial {
  id: string;
  name: string;
  /** City or review date / source line */
  location: string;
  rating: number;
  text: string;
  /** Product mentioned, or short label (e.g. Facebook recommend) */
  model: string;
  source?: 'facebook';
}

/**
 * Customer quotes from Hamel Trading’s public Facebook reviews.
 * @see https://www.facebook.com/hameltrading/reviews/?id=100064107279848&sk=reviews
 */
export const testimonials: Testimonial[] = [
  {
    id: 'fb-riva-coleen',
    name: 'Riva Coleen',
    location: 'July 28, 2025 · Facebook',
    rating: 5,
    text: 'I recently purchased a 1.5HP Daikin Amihan from Hamel Trading, and I couldn’t be happier with the experience. It’s one of the most recommended units out there — fast cooling, quiet performance, and energy-efficient. And the price? Easily one of the cheapest in the market, without compromising on quality. To top it off, installation was free, and the entire process was smooth and hassle-free. The team at Hamel Trading was friendly, responsive, and professional from start to finish. One of my best buys so far. I highly recommend Hamel Trading for great deals, quality products, and excellent service.',
    model: 'Daikin Amihan 1.5HP',
    source: 'facebook',
  },
  {
    id: 'fb-john-mykel',
    name: 'John Mykel Olmilla',
    location: 'May 6, 2025 · Facebook',
    rating: 5,
    text: 'Service is straight to the point. Professional Staff. Brand new aircon with free installation + more freebies. Fast survey and installation at home. I am very satisfied. Salamat Hamel!',
    model: 'Free installation',
    source: 'facebook',
  },
  {
    id: 'fb-rai-borgonia',
    name: 'Rai Borgonia',
    location: 'October 30, 2025 · Facebook',
    rating: 5,
    text: 'From inquiry, survey and installation the service was great. Technicians are good people, they answered all my questions. The owner is very accommodating and answers your query on a reasonable timeframe. I just had it installed a couple of days ago, so hopefully the aftersale service is the same.',
    model: 'Recommends Hamel',
    source: 'facebook',
  },
  {
    id: 'fb-ma-ya-ng',
    name: 'MA YA NG',
    location: 'October 26, 2024 · Facebook',
    rating: 5,
    text: 'Big thanks to HAMEL TRADING for their fantastic aircon service! They were so helpful and efficient, and now my home is a cool. Highly recommended',
    model: 'Recommends Hamel',
    source: 'facebook',
  },
  {
    id: 'fb-mike-cinco',
    name: 'Mike Cinco',
    location: 'October 18, 2024 · Facebook',
    rating: 5,
    text: 'Thank you Sir Ivan and Team Hamel Trading for the easy and swift transaction plus installation. Super sulit ang price and the team of installer and surveyor are very professional and kind. WILL DEFINITELY RECOMMEND YOU GUYS TO MY FAMILY AND FRIENDS! ONE SATISFIED CUSTOMER HERE!! MORE POWER TO YOUR BUSINESS!!',
    model: 'Recommends Hamel',
    source: 'facebook',
  },
  {
    id: 'fb-jayson-sarsalejo',
    name: 'Jayson Sarsalejo',
    location: 'April 26, 2024 · Facebook',
    rating: 5,
    text: '5/5 — This is our second purchase here in Hamel and service is still top notch. Very knowledgeable staff and would purchase for the 3rd time soon cause the heat is killing me. I love Hamel. #StanHamel',
    model: 'Repeat customer',
    source: 'facebook',
  },
];

/** Homepage shows a curated subset; full list stays available for “read more”. */
export const homepageTestimonials = testimonials.slice(0, 4);

export const FACEBOOK_REVIEWS_URL =
  'https://www.facebook.com/hameltrading/reviews/?id=100064107279848&sk=reviews';

export const FACEBOOK_RECOMMEND_SUMMARY = '100% recommend · 21 reviews on Facebook';
