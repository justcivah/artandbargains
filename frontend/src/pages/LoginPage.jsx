import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import ReCaptcha from 'react-google-recaptcha';
import axios from 'axios';
import '../styles/LoginPage.css';

const API_URL = import.meta.env.VITE_API_URL;

const LoginPage = () => {
	const [username, setUsername] = useState('');
	const [password, setPassword] = useState('');
	const [error, setError] = useState('');
	const [loading, setLoading] = useState(false);
	const [captchaValid, setCaptchaValid] = useState(false);
	const [isLocalhost, setIsLocalhost] = useState(false);
	const captchaRef = useRef(null);
	const navigate = useNavigate();

	// Check if already logged in and detect localhost
	useEffect(() => {
		const token = localStorage.getItem('admin_token');
		if (token) {
			navigate('/admin');
		}

		// Check if running on localhost
		const hostname = window.location.hostname;
		const isLocal = hostname === 'localhost' ||
			hostname === '127.0.0.1' ||
			hostname.includes('192.168.');

		setIsLocalhost(isLocal);

		// Auto-validate captcha if on localhost
		if (isLocal) {
			setCaptchaValid(true);
		}
	}, [navigate]);

	const handleCaptchaChange = (value) => {
		setCaptchaValid(value ? true : false);
	};

	const handleLogin = async (e) => {
		e.preventDefault();

		if (!username || !password) {
			setError('Please enter both username and password');
			return;
		}

		// Check captcha validation if not on localhost
		if (!isLocalhost && !captchaValid) {
			setError('Please complete the reCAPTCHA verification');
			return;
		}

		try {
			setLoading(true);
			setError('');

			const payload = {
				username: username,
				password: password
			};

			// Only include captchaToken if not on localhost
			if (!isLocalhost && captchaRef.current) {
				payload.captchaToken = captchaRef.current.getValue();
			}

			const response = await axios.post(`${API_URL}/api/auth/login`, payload);

			// Store the token in localStorage
			localStorage.setItem('admin_token', response.data.token);

			// Redirect to admin page
			navigate('/admin');
		} catch (err) {
			setError(err.response?.data?.error || 'Login failed. Please check your credentials.');
			console.error('Login error:', err);

			// Reset captcha on error
			if (!isLocalhost && captchaRef.current) {
				captchaRef.current.reset();
				setCaptchaValid(false);
			}
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
						className="login-button"
						disabled={loading || (!isLocalhost && !captchaValid)}
					>
						{loading ? 'Logging in...' : 'Login'}
					</button>
				</form>
			</div>
		</div>
	);
};

export default LoginPage;