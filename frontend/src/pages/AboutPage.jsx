import React, { useEffect } from 'react';
import AboutUs from '../components/AboutUs';

const HomePage = () => {
	useEffect(() => {
		// Scroll to top when component mounts
		window.scrollTo(0, 0);

		// Set page title
		document.title = 'About Us - Art & Bargains';
	}, []);

	return (
		<main className="about-page">
			<AboutUs />
		</main>
	);
};

export default HomePage;