import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import '../styles/Categories.css';

const Categories = () => {
	const sectionRef = useRef(null);
	const categoriesRef = useRef([]);

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

		categoriesRef.current.forEach((el) => {
			if (el) {
				observer.observe(el);
			}
		});

		return () => {
			if (sectionRef.current) {
				observer.unobserve(sectionRef.current);
			}
			categoriesRef.current.forEach((el) => {
				if (el) {
					observer.unobserve(el);
				}
			});
		};
	}, []);

	const categories = [
		{
			id: 1,
			title: 'Prints',
			description: 'Unique artistic prints from renowned and emerging artists',
			image: '/images/prints.jpg',
			link: '/shop?sort=date_desc&page=1&limit=24&types=print',
		},
		{
			id: 2,
			title: 'Porcelain',
			description: 'Exquisite porcelain pieces with timeless craftsmanship',
			image: '/images/porcelain.png',
			link: '/shop?sort=date_desc&page=1&limit=24&types=porcelain',
		},
		{
			id: 3,
			title: 'Vintage Furnishings',
			description: 'Classic furniture pieces with character and history',
			image: '/images/vintage-furnishing.png',
			link: '/shop?sort=date_desc&page=1&limit=24&types=vintage_furnishing',
		},
		{
			id: 4,
			title: 'Japanese Woodblock Prints',
			description: 'Authentic and elegant ukiyo-e–inspired woodblock prints',
			image: '/images/japanese-woodblock-print.webp',
			link: '/shop?sort=date_desc&page=1&limit=24&types=sculpture',
		},
		{
			id: 5,
			title: 'Ornaments',
			description: 'Decorative ornaments curated for craftsmanship and charm',
			image: '/images/ornaments.jpeg',
			link: '/shop?sort=date_desc&page=1&limit=24&types=photography',
		},
		{
			id: 6,
			title: 'Lighting',
			description: 'Statement lamps and lighting with refined details',
			image: '/images/lighting.jpeg',
			link: '/shop?sort=date_desc&page=1&limit=24&types=lighting',
		},
	];

	return (
		<section className="categories-section" ref={sectionRef}>
			<div className="section-header">
				<h2 className="section-title">Our Collections</h2>
				<div className="title-underline"></div>
			</div>
			<div className="categories-container">
				{categories.map((category, index) => (
					<div
						key={category.id}
						className="category-card"
						style={{ "--index": index }}
						ref={(el) => (categoriesRef.current[index] = el)}
					>
						<Link to={category.link} className="category-image-link">
							<div className="category-image-container">
								<div className="category-image-overlay"></div>
								<img
									src={category.image}
									alt={category.title}
									className="category-image"
								/>
							</div>
						</Link>
						<div className="category-content">
							<Link to={category.link} className="category-title-link">
								<h3 className="category-title">{category.title}</h3>
							</Link>
							<p className="category-description">{category.description}</p>
						</div>
					</div>
				))}
			</div>
		</section>
	);
};

export default Categories;