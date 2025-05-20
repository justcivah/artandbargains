import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import Navbar from './components/Navbar.jsx';
import Footer from './components/Footer.jsx';
import HomePage from './pages/HomePage.jsx';
import ShopPage from './pages/ShopPage.jsx';
import AboutPage from './pages/AboutPage.jsx';
import ItemDetailPage from './pages/ItemDetailPage.jsx';
import AdminPage from './pages/AdminPage.jsx';
import AddItemPage from './pages/AddItemPage.jsx';
import EditItemPage from './pages/EditItemPage.jsx';
import EditContributorPage from './pages/EditContributorPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import ContactPage from './pages/ContactPage.jsx';
import './App.css';

// Wrapper component to conditionally render Navbar and Footer
const PageLayout = ({ children }) => {
	const location = useLocation();
	const isAdminRoute = location.pathname.startsWith('/admin') || location.pathname === '/login';
	return (
		<>
			{!isAdminRoute && <Navbar />}
			{children}
			{!isAdminRoute && <Footer />}
		</>
	);
};

// Protected route component
const ProtectedRoute = ({ children }) => {
	const [isAuthenticated, setIsAuthenticated] = useState(null);

	useEffect(() => {
		const token = localStorage.getItem('admin_token');
		if (!token) {
			setIsAuthenticated(false);
			return;
		}

		try {
			const decoded = jwtDecode(token);
			const currentTime = Date.now() / 1000;
			if (decoded.exp < currentTime) {
				// Token is expired
				console.log("Token expired, redirecting to login");
				localStorage.removeItem('admin_token');
				setIsAuthenticated(false);
			} else {
				// Token is valid and not expired
				setIsAuthenticated(true);
			}
		} catch (error) {
			console.error("Invalid token", error);
			localStorage.removeItem('admin_token');
			setIsAuthenticated(false);
		}
	}, []);

	// Still loading
	if (isAuthenticated === null) {
		return <div className="loading">Loading...</div>;
	}

	// Check if authenticated
	if (!isAuthenticated) {
		return <Navigate to="/login" replace />;
	}

	// Render children if authenticated
	return children;
};

function App() {
	return (
		<Router>
			<div className="app">
				<Routes>
					{/* Public routes with Navbar and Footer */}
					<Route path="/" element={
						<PageLayout>
							<HomePage />
						</PageLayout>
					} />
					<Route path="/shop" element={
						<PageLayout>
							<ShopPage />
						</PageLayout>
					} />
					<Route path="/about" element={
						<PageLayout>
							<AboutPage />
						</PageLayout>
					} />
					<Route path="/contact" element={
						<PageLayout>
							<ContactPage />
						</PageLayout>
					} />
					{/* Item detail page */}
					<Route path="/shop/item/:itemId" element={
						<PageLayout>
							<ItemDetailPage />
						</PageLayout>
					} />
					{/* Login page - no Navbar or Footer */}
					<Route path="/login" element={
						<PageLayout>
							<LoginPage />
						</PageLayout>
					} />
					{/* Admin routes - protected and no Navbar or Footer */}
					<Route path="/admin" element={
						<PageLayout>
							<ProtectedRoute>
								<AdminPage />
							</ProtectedRoute>
						</PageLayout>
					} />
					<Route path="/admin/items/new" element={
						<PageLayout>
							<ProtectedRoute>
								<AddItemPage />
							</ProtectedRoute>
						</PageLayout>
					} />
					<Route path="/admin/items/:itemId/edit" element={
						<PageLayout>
							<ProtectedRoute>
								<EditItemPage />
							</ProtectedRoute>
						</PageLayout>
					} />
					{/* New contributor routes */}
					<Route path="/admin/contributors/new" element={
						<PageLayout>
							<ProtectedRoute>
								<EditContributorPage />
							</ProtectedRoute>
						</PageLayout>
					} />
					<Route path="/admin/contributors/:contributorId/edit" element={
						<PageLayout>
							<ProtectedRoute>
								<EditContributorPage />
							</ProtectedRoute>
						</PageLayout>
					} />
					{/* 404 fallback */}
					<Route path="*" element={
						<PageLayout>
							<div className="not-found">Page not found</div>
						</PageLayout>
					} />
				</Routes>
			</div>
		</Router>
	);
}

export default App;