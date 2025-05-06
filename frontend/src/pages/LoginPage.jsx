import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/LoginPage.css';

const API_URL = import.meta.env.VITE_API_URL;

const LoginPage = () => {
	const [username, setUsername] = useState('');
	const [password, setPassword] = useState('');
	const [error, setError] = useState('');
	const [loading, setLoading] = useState(false);
	const navigate = useNavigate();

	// Check if already logged in
	useEffect(() => {
		const token = localStorage.getItem('admin_token');
		if (token) {
			navigate('/admin');
		}
	}, [navigate]);

	const handleLogin = async (e) => {
		e.preventDefault();

		if (!username || !password) {
			setError('Please enter both username and password');
			return;
		}

		try {
			setLoading(true);
			setError('');

			const response = await axios.post(`${API_URL}/api/auth/login`, {
				username: username,
				password: password
			});

			// Store the token in localStorage
			localStorage.setItem('admin_token', response.data.token);

			// Redirect to admin page
			navigate('/admin');
		} catch (err) {
			setError(err.response?.data?.error || 'Login failed. Please check your credentials.');
			console.error('Login error:', err);
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="login-container">
			<div className="login-card">
				<h1>Admin Login</h1>
				<p className="login-subtitle">Enter your credentials to access the admin panel</p>

				{error && <div className="login-error">{error}</div>}

				<form onSubmit={handleLogin} className="login-form">
					<div className="form-group">
						<label htmlFor="username">Username</label>
						<input
							type="text"
							id="username"
							value={username}
							onChange={(e) => setUsername(e.target.value)}
							disabled={loading}
						/>
					</div>

					<div className="form-group">
						<label htmlFor="password">Password</label>
						<input
							type="password"
							id="password"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							disabled={loading}
						/>
					</div>

					<button
						type="submit"
						className="login-button"
						disabled={loading}
					>
						{loading ? 'Logging in...' : 'Login'}
					</button>
				</form>
			</div>
		</div>
	);
};

export default LoginPage;