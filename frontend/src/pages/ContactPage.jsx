import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import ReCaptcha from 'react-google-recaptcha';
import '../styles/ContactPage.css';

const ContactPage = () => {
	const heroRef = useRef(null);
	const captchaRef = useRef(null);
	const location = useLocation();
	const [isHeroInView, setIsHeroInView] = useState(false);
	const [formData, setFormData] = useState({
		email: '',
		subject: '',
		message: ''
	});
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState('');
	const [success, setSuccess] = useState(false);
	const [captchaValid, setCaptchaValid] = useState(false);

	// Parse URL parameters on mount
	useEffect(() => {
		const params = new URLSearchParams(location.search);
		const subjectParam = params.get('subject');

		if (subjectParam) {
			setFormData(prev => ({
				...prev,
				subject: decodeURIComponent(subjectParam)
			}));
		}
	}, [location.search]);

	// Set up hero section intersection observer
	useEffect(() => {
		// Scroll to top when component mounts
		window.scrollTo(0, 0);

		// Set page title
		document.title = 'Contact Us - Art & Bargains';

		const heroObserverOptions = {
			threshold: 0.1
		};

		const heroObserverCallback = (entries) => {
			entries.forEach(entry => {
				if (entry.isIntersecting) {
					setIsHeroInView(true);
				} else {
					setIsHeroInView(false);
				}
			});
		};

		const heroObserver = new IntersectionObserver(heroObserverCallback, heroObserverOptions);

		if (heroRef.current) {
			heroObserver.observe(heroRef.current);
		}

		return () => {
			if (heroRef.current) {
				heroObserver.unobserve(heroRef.current);
			}
		};
	}, []);

	const handleInputChange = (e) => {
		const { name, value } = e.target;
		setFormData(prev => ({
			...prev,
			[name]: value
		}));
	};

	const handleCaptchaChange = (value) => {
		setCaptchaValid(value ? true : false);
	};

	const handleSubmit = async (e) => {
		e.preventDefault();

		if (!captchaValid) {
			setError('Please complete the reCAPTCHA');
			return;
		}

		if (!formData.email || !formData.subject || !formData.message) {
			setError('Please fill in all fields');
			return;
		}

		try {
			setLoading(true);
			setError('');

			const response = await fetch(`${import.meta.env.VITE_API_URL}/api/contact`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					...formData,
					captchaToken: captchaRef.current.getValue()
				})
			});

			const data = await response.json();

			if (response.ok) {
				setSuccess(true);
				setFormData({
					email: '',
					subject: '',
					message: ''
				});
				setCaptchaValid(false);
				captchaRef.current.reset();
			} else {
				setError(data.error || 'Failed to send message');
			}
		} catch (err) {
			setError('Failed to send message. Please try again later.');
			console.error('Contact form error:', err);
		} finally {
			setLoading(false);
		}
	};

	return (
		<main className="contact-page">
			<div className="navbar-spacer"></div>

			{/* Fixed background - only shown when contact-hero is in viewport */}
			<div className={`contact-hero-background ${isHeroInView ? 'visible' : 'hidden'}`}>
				<div className="contact-hero-overlay"></div>
			</div>

			<section className="contact-hero" ref={heroRef}>
				<div className="contact-hero-content">
					<h1 className="contact-title">Contact Us</h1>
					<div className="title-underline centered-underline"></div>
					<p className="contact-subtitle">Get in touch with Art & Bargains</p>
				</div>
			</section>

			{/* Contact form section */}
			<div className="contact-content-container">
				<section className="contact-form-section">
					<div className="contact-form-wrapper">
						<form onSubmit={handleSubmit} className="contact-form">
							{error && <div className="form-error">{error}</div>}
							{success && (
								<div className="form-success">
									Thank you for your message! We'll get back to you soon.
								</div>
							)}

							<div className="form-group">
								<label htmlFor="email">Your Email</label>
								<input
									type="email"
									id="email"
									name="email"
									value={formData.email}
									onChange={handleInputChange}
									placeholder="your.email@example.com"
									required
								/>
							</div>

							<div className="form-group">
								<label htmlFor="subject">Subject</label>
								<input
									type="text"
									id="subject"
									name="subject"
									value={formData.subject}
									onChange={handleInputChange}
									placeholder="What is this about?"
									required
								/>
							</div>

							<div className="form-group">
								<label htmlFor="message">Message</label>
								<textarea
									id="message"
									name="message"
									value={formData.message}
									onChange={handleInputChange}
									placeholder="Tell us more..."
									rows="8"
									required
								></textarea>
							</div>

							<div className="form-bottom">
								<div className="recaptcha-wrapper">
									<ReCaptcha
										ref={captchaRef}
										sitekey={import.meta.env.VITE_RECAPTCHA_SITE_KEY}
										onChange={handleCaptchaChange}
									/>
								</div>
								<button
									type="submit"
									className="submit-button"
									disabled={loading || !captchaValid}
								>
									{loading ? 'Sending...' : 'Send Message'}
								</button>
							</div>
						</form>
					</div>

					<div className="contact-footer">
						<div className="footer-item">
							<div className="footer-icon">
								<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
									<rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
									<path d="m22 7-10 5L2 7"></path>
								</svg>
							</div>
							<p>We typically respond within 24-48 hours</p>
						</div>
						<div className="footer-item">
							<div className="footer-icon">
								<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
									<path d="M9 11a3 3 0 1 0 6 0a3 3 0 0 0 -6 0"></path>
									<path d="M17.657 16.657l-4.243 4.243a2 2 0 0 1 -2.827 0l-4.244 -4.243a8 8 0 1 1 11.314 0z"></path>
								</svg>
							</div>
							<p>Based in Northern Italy, serving worldwide</p>
						</div>
					</div>
				</section>
			</div>
		</main>
	);
};

export default ContactPage;