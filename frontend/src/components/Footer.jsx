import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/Footer.css';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-top">
          <div className="footer-column">
            <h3 className="footer-title">Art & Bargains</h3>
            <p className="footer-description">
              Curating exceptional art, porcelain, and vintage furnishings for discerning collectors and interior enthusiasts.
            </p>
            <div className="social-icons">
              <a href="https://instagram.com" className="social-icon" target="_blank" rel="noopener noreferrer">
                <i className="icon-instagram"></i>
              </a>
              <a href="https://pinterest.com" className="social-icon" target="_blank" rel="noopener noreferrer">
                <i className="icon-pinterest"></i>
              </a>
              <a href="https://facebook.com" className="social-icon" target="_blank" rel="noopener noreferrer">
                <i className="icon-facebook"></i>
              </a>
            </div>
          </div>
          
          <div className="footer-column">
            <h4 className="footer-heading">Shop</h4>
            <ul className="footer-links">
              <li><Link to="/shop/prints">Prints</Link></li>
              <li><Link to="/shop/porcelain">Porcelain</Link></li>
              <li><Link to="/shop/furnishings">Vintage Furnishings</Link></li>
              <li><Link to="/shop/new-arrivals">New Arrivals</Link></li>
            </ul>
          </div>
          
          <div className="footer-column">
            <h4 className="footer-heading">Information</h4>
            <ul className="footer-links">
              <li><Link to="/about">About Us</Link></li>
              <li><Link to="/contact">Contact</Link></li>
              <li><Link to="/shipping">Shipping & Returns</Link></li>
              <li><Link to="/faq">FAQ</Link></li>
            </ul>
          </div>
          
          <div className="footer-column">
            <h4 className="footer-heading">Newsletter</h4>
            <p className="newsletter-text">Subscribe to receive updates on new arrivals and exclusive offers.</p>
            <form className="newsletter-form">
              <input type="email" placeholder="Your email address" className="newsletter-input" />
              <button type="submit" className="newsletter-button">Subscribe</button>
            </form>
          </div>
        </div>
        
        <div className="footer-bottom">
          <div className="copyright">
            &copy; {currentYear} Art & Bargains. All rights reserved.
          </div>
          <div className="footer-legal">
            <Link to="/privacy">Privacy Policy</Link>
            <Link to="/terms">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;