import React, { useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import '../styles/ContactSection.css';

const ContactSection = () => {
  const sectionRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      },
      { threshold: 0.1 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => {
      if (sectionRef.current) {
        observer.unobserve(sectionRef.current);
      }
    };
  }, []);

  return (
    <section className="contact-section" ref={sectionRef}>
      <div className="contact-background"></div>
      <div className="contact-content">
        <h2 className="contact-title">Get in Touch</h2>
        <div className="title-underline"></div>
        <p className="contact-description">
          Have questions about our collections or interested in a specific piece?
          We'd love to hear from you and help you find the perfect addition to your space.
        </p>
        <div className="contact-features">
          <div className="contact-feature">
            <div className="feature-icon">
              <span className="icon-consultation"></span>
            </div>
            <h3>Personal Consultation</h3>
            <p>Schedule a private appointment with our art consultants</p>
          </div>
          <div className="contact-feature">
            <div className="feature-icon">
              <span className="icon-custom"></span>
            </div>
            <h3>Custom Orders</h3>
            <p>Inquire about custom pieces and special commissions</p>
          </div>
          <div className="contact-feature">
            <div className="feature-icon">
              <span className="icon-delivery"></span>
            </div>
            <h3>White Glove Delivery</h3>
            <p>Learn about our premium delivery and get a price estimate</p>
          </div>
        </div>
        <Link to="/contact" className="contact-button">
          Contact Us
        </Link>
      </div>
    </section>
  );
};

export default ContactSection;