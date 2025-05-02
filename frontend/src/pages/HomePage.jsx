import React, { useEffect } from 'react';
import Hero from '../components/Hero';
import Categories from '../components/Categories';
import RecentAdditions from '../components/RecentAdditions';
import ContactSection from '../components/ContactSection';

const HomePage = () => {
  useEffect(() => {
    // Scroll to top when component mounts
    window.scrollTo(0, 0);
    
    // Set page title
    document.title = 'Art & Bargains - Timeless Art & Vintage Treasures';
  }, []);

  return (
    <main className="home-page">
      <Hero />
      <Categories />
      <RecentAdditions />
      <ContactSection />
    </main>
  );
};

export default HomePage;