import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import '../styles/AboutUs.css';

const AboutUs = () => {
	const storyRef = useRef(null);
	const missionRef = useRef(null);
	const [isVisible, setIsVisible] = useState({
		story: false,
		mission: false
	});

	useEffect(() => {
		// Scroll to top when component mounts
		window.scrollTo(0, 0);

		// Set page title
		document.title = 'About Us - Art & Bargains';

		const observerOptions = {
			threshold: 0.1
		};

		const observerCallback = (entries, observer) => {
			entries.forEach(entry => {
				if (entry.isIntersecting) {
					const section = entry.target.getAttribute('data-section');
					if (section) {
						setIsVisible(prev => ({
							...prev,
							[section]: true
						}));
					}
				}
			});
		};

		const observer = new IntersectionObserver(observerCallback, observerOptions);

		if (storyRef.current) {
			observer.observe(storyRef.current);
		}

		if (missionRef.current) {
			observer.observe(missionRef.current);
		}

		return () => {
			if (storyRef.current) {
				observer.unobserve(storyRef.current);
			}

			if (missionRef.current) {
				observer.unobserve(missionRef.current);
			}
		};
	}, []);

	return (
		<main className="about-page">
			<div className="navbar-spacer"></div>
			<section className="about-hero">
				<div className="about-hero-overlay"></div>
				<div className="about-hero-content">
					<h1 className="about-title">About Us</h1>
					<div className="title-underline"></div>
					<p className="about-subtitle">Discover the passion behind Art & Bargains</p>
				</div>
			</section>

			<section
				className={`about-story ${isVisible.story ? 'visible' : ''}`}
				ref={storyRef}
				data-section="story">
				<div className="about-container">
					<div className="about-content text-left">
						<h2 className="section-title">Who We Are</h2>
						<div className="title-underline"></div>
						<div className="about-text">
							<p>
								We are a recent enterprise, born with the aim of promoting and making ancient and modern graphic art
								accessible to an increasingly broad and curious audience.
							</p>
							<p>
								In our catalog, engravings, lithographs, and works on paper signed by great masters of the past
								coexist alongside contemporary graphic works.
							</p>
							<p>
								Each work is carefully selected and accompanied by a narrative that tells its historical, cultural,
								and aesthetic value. We believe that collecting art means not only decorating a space but living a
								profound experience made of beauty, memory, and research.
							</p>
						</div>
					</div>
					<div className="about-image">
						<img src="/src/assets/craftman.jpeg" alt="Italian craftman" />
					</div>
				</div>
			</section>

			<section
				className={`about-mission ${isVisible.mission ? 'visible' : ''}`}
				ref={missionRef}
				data-section="mission">
				<div className="about-container">
					<div className="about-image">
						<img src="/src/assets/lake-como.webp" alt="Lake Como" />
					</div>
					<div className="about-content text-right">
						<h2 className="section-title">Our Location</h2>
						<div className="title-underline ml-auto"></div>
						<div className="about-text">
							<p>
								Our headquarters is located north of Milan, just minutes from Lake Como, in an area rich in
								tradition and innovation. It's a context where art, architecture, and industrial design have
								always met, giving us the opportunity to also offer furnishing accessories with an unmistakable
								Italian style: unique, authentic objects that carry with them stories and suggestions from the past.
							</p>
							<p>
								Our desire is to create a dialogue between art on paper with design and interiors, offering
								every collector, enthusiast, or curious person a world made of beauty to rediscover every day.
							</p>
						</div>
					</div>
				</div>
			</section>

			<section className="about-cta">
				<div className="cta-content">
					<h2>Explore Our Collections</h2>
					<p>Discover our carefully curated selection of prints, porcelain, and vintage furnishings.</p>
					<div className="cta-buttons">
						<Link to="/shop" className="cta-button primary">
							Browse Shop
						</Link>
						<Link to="/contact" className="cta-button secondary">
							Contact Us
						</Link>
					</div>
				</div>
			</section>
		</main>
	);
};

export default AboutUs;