import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import '../styles/Navbar.css';

const Navbar = () => {
	const [scrolled, setScrolled] = useState(false);
	const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

	useEffect(() => {
		const handleScroll = () => {
			const isScrolled = window.scrollY > 10;
			if (isScrolled !== scrolled) {
				setScrolled(isScrolled);
			}
		};

		document.addEventListener('scroll', handleScroll);
		return () => {
			document.removeEventListener('scroll', handleScroll);
		};
	}, [scrolled]);

	const toggleMobileMenu = () => {
		setMobileMenuOpen(!mobileMenuOpen);
	};

	return (
		<nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
			<div className="navbar-container">
				<Link to="/" className="logo">
					<span className="logo-text">Art <span className="logo-accent-text">&</span> Bargains</span>
				</Link>

				<div className="mobile-menu-button" onClick={toggleMobileMenu}>
					<span></span>
					<span></span>
					<span></span>
				</div>

				<ul className={`nav-menu ${mobileMenuOpen ? 'active' : ''}`}>
					<li className="nav-item">
						<Link to="/" className="nav-link" onClick={() => setMobileMenuOpen(false)}>Home</Link>
					</li>
					<li className="nav-item">
						<Link to="/shop" className="nav-link" onClick={() => setMobileMenuOpen(false)}>Shop</Link>
					</li>
					<li className="nav-item">
						<Link to="/about" className="nav-link" onClick={() => setMobileMenuOpen(false)}>About Us</Link>
					</li>
					<li className="nav-item">
						<Link to="/contact" className="nav-link" onClick={() => setMobileMenuOpen(false)}>Contact</Link>
					</li>
				</ul>
			</div>
		</nav>
	);
};

export default Navbar;