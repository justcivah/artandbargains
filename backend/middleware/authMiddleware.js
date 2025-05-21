const jwt = require('jsonwebtoken');
const axios = require('axios');

JWT_SECRET = process.env.JWT_SECRET;

// Verify reCAPTCHA token
async function verifyRecaptcha(token) {
	try {
		const response = await axios.post(
			'https://www.google.com/recaptcha/api/siteverify',
			null,
			{
				params: {
					secret: process.env.RECAPTCHA_SECRET_KEY,
					response: token
				}
			}
		);

		return response.data.success;
	} catch (error) {
		console.error('reCAPTCHA verification error:', error);
		return false;
	}
}

// Check if request is from localhost
function isLocalhost(req) {
	const ip = req.ip || req.connection.remoteAddress;
	return ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1' || ip.includes('localhost');
}

// Authentication middleware
exports.authenticateAdmin = (req, res, next) => {
	// Get the token from the authorization header
	const authHeader = req.headers.authorization;

	if (!authHeader || !authHeader.startsWith('Bearer ')) {
		return res.status(401).json({ error: 'Access denied. No token provided.' });
	}

	const token = authHeader.split(' ')[1];

	try {
		// Verify the token
		const decoded = jwt.verify(token, JWT_SECRET);

		// Check if the user has admin role
		if (!decoded.isAdmin) {
			return res.status(403).json({ error: 'Access denied. Not an admin user.' });
		}

		// Add the user information to the request
		req.user = decoded;

		// Proceed to the next middleware
		next();
	} catch (error) {
		console.error('JWT verification error:', error);
		res.status(401).json({ error: 'Invalid token.' });
	}
};

// Login controller
exports.login = async (req, res) => {
	const { username, password, captchaToken } = req.body;

	// Validate required fields
	if (!username || !password) {
		return res.status(400).json({ error: 'Username and password are required' });
	}

	// Validate reCAPTCHA token if not from localhost
	const fromLocalhost = isLocalhost(req);
	let isValidCaptcha = false;

	if (fromLocalhost) {
		isValidCaptcha = true;
	} else {
		// Require captchaToken for non-localhost environments
		if (!captchaToken) {
			return res.status(400).json({ error: 'reCAPTCHA verification required' });
		}

		// Verify reCAPTCHA token
		isValidCaptcha = await verifyRecaptcha(captchaToken);

		if (!isValidCaptcha) {
			return res.status(400).json({ error: 'Invalid reCAPTCHA. Please try again.' });
		}
	}

	// Check credentials
	if (username === process.env.ADMIN_USERNAME && password === process.env.ADMIN_PASSWORD) {
		// User authenticated, generate JWT token
		const token = jwt.sign(
			{
				id: '1',
				username,
				isAdmin: true
			},
			JWT_SECRET,
			{ expiresIn: '90d' }
		);

		res.json({
			success: true,
			token,
			user: {
				username,
				isAdmin: true
			}
		});
	} else {
		res.status(401).json({ error: 'Invalid username or password' });
	}
};