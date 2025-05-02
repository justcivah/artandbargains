import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import '../styles/Hero.css';

const Hero = () => {
  const heroRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      },
      { threshold: 0.1 }
    );

    if (heroRef.current) {
      observer.observe(heroRef.current);
    }

    return () => {
      if (heroRef.current) {
        observer.unobserve(heroRef.current);
      }
    };
  }, []);

  return (
    <section className="hero" ref={heroRef}>
      <div className="hero-overlay"></div>
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
  );
};

export default Hero;