import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import '../styles/RecentAdditions.css';

const RecentAdditions = () => {
  const sectionRef = useRef(null);
  const itemsRef = useRef([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Sample data - in a real app this would come from your API
  const recentItems = [
    {
      id: 1,
      name: 'Abstract Geometric Print',
      category: 'Prints',
      price: 189.99,
      image: '/src/assets/recent-print.jpg',
      link: '/shop/prints/abstract-geometric'
    },
    {
      id: 2,
      name: 'Vintage Blue Porcelain Vase',
      category: 'Porcelain',
      price: 249.99,
      image: '/src/assets/recent-porcelain.jpg',
      link: '/shop/porcelain/blue-vase'
    },
    {
      id: 3,
      name: 'Mid-century Side Table',
      category: 'Furnishings',
      price: 399.99,
      image: '/src/assets/recent-table.jpg',
      link: '/shop/furnishings/mid-century-table'
    },
    {
      id: 4,
      name: 'Botanical Illustration',
      category: 'Prints',
      price: 159.99,
      image: '/src/assets/recent-botanical.jpg',
      link: '/shop/prints/botanical'
    },
    {
      id: 5,
      name: 'Art Deco Tea Set',
      category: 'Porcelain',
      price: 329.99,
      image: '/src/assets/recent-tea-set.jpg',
      link: '/shop/porcelain/art-deco-tea-set'
    }
  ];

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('fade-in');
          }
        });
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

  const nextSlide = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === recentItems.length - 1 ? 0 : prevIndex + 1
    );
  };

  const prevSlide = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === 0 ? recentItems.length - 1 : prevIndex - 1
    );
  };

  const goToSlide = (index) => {
    setCurrentIndex(index);
  };

  // Visible items calculation (show 3 items on desktop, 1 on mobile)
  const getVisibleItems = () => {
    const isMobile = window.innerWidth < 768;
    if (isMobile) {
      return [recentItems[currentIndex]];
    } else {
      const visible = [];
      for (let i = currentIndex; i < currentIndex + 3; i++) {
        const index = i % recentItems.length;
        visible.push(recentItems[index]);
      }
      return visible;
    }
  };

  return (
    <section className="recent-additions-section" ref={sectionRef}>
      <div className="section-header">
        <h2 className="section-title">Recent Additions</h2>
        <div className="title-underline"></div>
        <p className="section-subtitle">
          Discover our newest treasures added to the collection
        </p>
      </div>

      <div className="recent-slider-container">
        <button className="slider-button prev" onClick={prevSlide}>
          &#10094;
        </button>

        <div className="recent-items-container">
          {getVisibleItems().map((item, index) => (
            <div 
              key={item.id}
              className="recent-item"
              ref={(el) => (itemsRef.current[index] = el)}
            >
              <Link to={item.link} className="item-link">
                <div className="item-image-container">
                  <img src={item.image} alt={item.name} className="item-image" />
                  <div className="item-overlay">
                    <span className="view-details">View Details</span>
                  </div>
                </div>
                <div className="item-info">
                  <span className="item-category">{item.category}</span>
                  <h3 className="item-name">{item.name}</h3>
                  <span className="item-price">${item.price.toFixed(2)}</span>
                </div>
              </Link>
            </div>
          ))}
        </div>

        <button className="slider-button next" onClick={nextSlide}>
          &#10095;
        </button>
      </div>

      <div className="slider-indicators">
        {recentItems.map((_, index) => (
          <span 
            key={index} 
            className={`indicator ${index === currentIndex ? 'active' : ''}`}
            onClick={() => goToSlide(index)}
          ></span>
        ))}
      </div>

      <div className="view-all-container">
        <Link to="/shop/new-arrivals" className="view-all-button">
          View All New Arrivals
        </Link>
      </div>
    </section>
  );
};

export default RecentAdditions;