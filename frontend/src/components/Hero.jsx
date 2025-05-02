import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import '../styles/Hero.css';

const Hero = () => {
  const contentRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      },
      { threshold: 0.1 }
    );

    if (contentRef.current) {
      observer.observe(contentRef.current);
    }

    return () => {
      if (contentRef.current) {
        observer.unobserve(contentRef.current);
      }
    };
  }, []);

  return (
    <>
      {/* Fixed background */}
      <div className="hero-background">
        <div className="hero-overlay"></div>
      </div>
      
      {/* Scrollable content */}
      <section className="hero-content-wrapper" ref={contentRef}>
        <div className="hero-content">
          <h1 className="hero-title">
            Timeless Art <span className="ampersand">&</span> Vintage Treasures
          </h1>
          <p className="hero-subtitle">
            Curated collections of prints, porcelain, and vintage furnishings
          </p>
          <div className="hero-buttons">
            <Link to="/shop" className="hero-button primary">
              Explore Collections
            </Link>
            <Link to="/about" className="hero-button secondary">
              Our Story
            </Link>
          </div>
        </div>
        <div className="hero-scroll-indicator">
          <div className="arrow-container">
            <div className="arrow"></div>
          </div>
        </div>
      </section>
    </>
  );
};

export default Hero;