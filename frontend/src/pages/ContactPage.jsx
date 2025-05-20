import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import ReCaptcha from 'react-google-recaptcha';
import '../styles/ContactPage.css';

const ContactPage = () => {
	const heroRef = useRef(null);
	const captchaRef = useRef(null);
	const formRef = useRef(null);
	const location = useLocation();
	const [isHeroInView, setIsHeroInView] = useState(false);
	const [formData, setFormData] = useState({
		name: '',
		email: '',
		subject: '',
		message: ''
	});
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState('');
	const [success, setSuccess] = useState(false);
	const [captchaValid, setCaptchaValid] = useState(false);
	const [isLocalhost, setIsLocalhost] = useState(false);

	// Check if running on localhost
	useEffect(() => {
		const hostname = window.location.hostname;
		setIsLocalhost(
			hostname === 'localhost' ||
			hostname === '127.0.0.1' ||
			hostname.includes('192.168.')
		);

		// Auto-validate captcha if on localhost
		if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname.includes('192.168.')) {
			setCaptchaValid(true);
		}
	}, []);

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
		// Check if there's a hash fragment in the URL
		const hash = window.location.hash;

		if (hash === '#contact-form') {
			// If the hash is #contact-form, scroll to the form
			setTimeout(() => {
				if (formRef.current) {
					formRef.current.scrollIntoView({ behavior: 'smooth' });
				}
			}, 100); // Small timeout to ensure component is fully rendered
		} else {
			// Otherwise, scroll to top as before
			window.scrollTo(0, 0);
		}

		// Set page title
		document.title = 'Contact Us - Art & Bargains';

		// Rest of your existing code for the intersection observer...
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

		if (!isLocalhost && !captchaValid) {
			setError('Please complete the reCAPTCHA');
			return;
		}

		if (!formData.name || !formData.email || !formData.subject || !formData.message) {
			setError('Please fill in all fields');
			return;
		}

		try {
			setLoading(true);
			setError('');

			const payload = {
				...formData
			};

			// Only include captchaToken if not on localhost
			if (!isLocalhost && captchaRef.current) {
				payload.captchaToken = captchaRef.current.getValue();
			}

			const response = await fetch(`${import.meta.env.VITE_API_URL}/api/contact`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(payload)
			});

			const data = await response.json();

			if (response.ok) {
				setSuccess(true);
				setFormData({
					name: '',
					email: '',
					subject: '',
					message: ''
				});

				if (!isLocalhost && captchaRef.current) {
					setCaptchaValid(false);
					captchaRef.current.reset();
				}

				// Scroll to form top to show success message
				if (formRef.current) {
					formRef.current.scrollIntoView({ behavior: 'smooth' });
				}
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
					<p className="contact-subtitle">We'd love to hear from you</p>
				</div>
			</section>

			{/* Contact content container */}
			<div className="contact-content-container">
				{/* Contact Info Section (Moved from footer) */}
				<section className="contact-info-section">
					<div className="contact-info-wrapper">
						<div className="contact-info-header">
							<h2>Get in Touch</h2>
							<div className="title-underline"></div>
							<p className="contact-info-subtitle">
								We're here to help with any questions about our collections or services
							</p>
						</div>

						<div className="contact-info-grid">
							<div className="contact-info-card">
								<div className="info-icon">
									<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
										<rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
										<path d="m22 7-10 5L2 7"></path>
									</svg>
								</div>
								<h3>Email Response Time</h3>
								<p>We typically respond within 24-48 hours to all inquiries</p>
							</div>

							<div className="contact-info-card">
								<div className="info-icon">
									<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
										<path d="M9 11a3 3 0 1 0 6 0a3 3 0 0 0 -6 0"></path>
										<path d="M17.657 16.657l-4.243 4.243a2 2 0 0 1 -2.827 0l-4.244 -4.243a8 8 0 1 1 11.314 0z"></path>
									</svg>
								</div>
								<h3>Our Location</h3>
								<p>Based in Northern Italy, near Lake Como, serving clients worldwide</p>
							</div>

							<div className="contact-info-card">
								<div className="info-icon">
									<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
										<rect x="1" y="3" width="15" height="13"></rect>
										<polygon points="16 8 20 8 23 11 23 16 16 16"></polygon>
										<circle cx="5.5" cy="18.5" r="2.5"></circle>
										<circle cx="18.5" cy="18.5" r="2.5"></circle>
									</svg>
								</div>
								<h3>Shipping & Delivery</h3>
								<p>Worldwide white-glove delivery service for all purchases</p>
							</div>
						</div>
					</div>
				</section>

				{/* Contact form section */}
				<section className="contact-form-section" ref={formRef}>
					<div className="contact-form-wrapper">
						<div className="contact-form-header">
							<h2>Send Us a Message</h2>
							<p>Fill out the form below and we'll get back to you as soon as possible</p>
						</div>

						<form onSubmit={handleSubmit} className="contact-form">
							{error && <div className="form-error">
								<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
									<circle cx="12" cy="12" r="10"></circle>
									<line x1="12" y1="8" x2="12" y2="12"></line>
									<line x1="12" y1="16" x2="12.01" y2="16"></line>
								</svg>
								{error}
							</div>}

							{success && (
								<div className="form-success">
									<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
										<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
										<polyline points="22 4 12 14.01 9 11.01"></polyline>
									</svg>
									Thank you for your message! We'll get back to you soon.
								</div>
							)}

							<div className="form-row">
								<div className="form-group">
									<label htmlFor="name">
										<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
											<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
											<circle cx="12" cy="7" r="4"></circle>
										</svg>
										Your Name
									</label>
									<input
										type="text"
										id="name"
										name="name"
										value={formData.name}
										onChange={handleInputChange}
										placeholder="John Doe"
										required
									/>
								</div>

								<div className="form-group">
									<label htmlFor="email">
										<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
											<path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
											<polyline points="22,6 12,13 2,6"></polyline>
										</svg>
										Your Email
									</label>
									<input
										type="email"
										id="email"
										name="email"
										value={formData.email}
										onChange={handleInputChange}
										placeholder="email@example.com"
										required
									/>
								</div>
							</div>

							<div className="form-group">
								<label htmlFor="subject">
									<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
										<line x1="4" y1="9" x2="20" y2="9"></line>
										<line x1="4" y1="15" x2="20" y2="15"></line>
										<line x1="10" y1="3" x2="8" y2="21"></line>
										<line x1="16" y1="3" x2="14" y2="21"></line>
									</svg>
									Subject
								</label>
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
								<label htmlFor="message">
									<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
										<path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
									</svg>
									Message
								</label>
								<textarea
									id="message"
									name="message"
									value={formData.message}
									onChange={handleInputChange}
									placeholder="Tell us more..."
									rows="6"
									required
								></textarea>
							</div>

							<div className="form-bottom">
								{/* Only show reCAPTCHA if not on localhost */}
								{!isLocalhost && (
									<div className="recaptcha-wrapper">
										<ReCaptcha
											ref={captchaRef}
											sitekey={import.meta.env.VITE_RECAPTCHA_SITE_KEY}
											onChange={handleCaptchaChange}
										/>
									</div>
								)}
								<button
									type="submit"
									className="submit-button"
									disabled={loading || (!isLocalhost && !captchaValid)}
								>
									{loading ? (
										<>
											<span className="button-spinner"></span>
											Sending...
										</>
									) : (
										<>
											<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
												<line x1="22" y1="2" x2="11" y2="13"></line>
												<polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
											</svg>
											Send Message
										</>
									)}
								</button>
							</div>
						</form>
					</div>
				</section>
			</div>
		</main>
	);
};

export default ContactPage;