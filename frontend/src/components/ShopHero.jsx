import React, { useEffect, useRef, useState } from 'react';
import '../styles/ShopHero.css';

const ShopHero = () => {
	const heroRef = useRef(null);
	const [isInView, setIsInView] = useState(false);

	useEffect(() => {
		const observer = new IntersectionObserver(
			([entry]) => {
				if (entry.isIntersecting) {
					setIsInView(true);
				} else {
					setIsInView(false);
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
		<>
			{/* Fixed background - only shown when hero is in viewport */}
			<div className={`shop-hero-background ${isInView ? 'visible' : 'hidden'}`}>
				<div className="shop-hero-overlay"></div>
			</div>

			{/* Scrollable content */}
			<section className="shop-hero" ref={heroRef}>
				<div className="shop-hero-content">
					<h1 className="shop-title">Our Collection</h1>
					<div className="title-underline"></div>
					<p className="shop-subtitle">
						Explore our carefully curated selection of prints, porcelain, and vintage furnishings
					</p>
				</div>
			</section>
		</>
	);
};

export default ShopHero;