const jwt = require('jsonwebtoken');

JWT_SECRET = process.env.JWT_SECRET;

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
	const { username, password } = req.body;

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