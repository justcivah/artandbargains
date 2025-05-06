import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import Navbar from './components/Navbar.jsx';
import Footer from './components/Footer.jsx';
import HomePage from './pages/HomePage.jsx';
import AboutPage from './pages/AboutPage.jsx';
import AdminPage from './pages/AdminPage.jsx';
import AddItemPage from './pages/AddItemPage.jsx';
import EditItemPage from './pages/EditItemPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
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
					<Route path="/about" element={
						<PageLayout>
							<AboutPage />
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