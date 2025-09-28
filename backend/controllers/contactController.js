const Mailgun = require('mailgun.js');
const axios = require('axios');

// Initialize Mailgun client
const mailgun = new Mailgun(FormData);
const mg = mailgun.client({
	username: 'api',
	key: process.env.MAILGUN_API_KEY
});

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

// Handle contact form submission
exports.sendContactEmail = async (req, res) => {
	try {
		const { name, email, subject, message, captchaToken } = req.body;

		// Validate required fields
		if (!name || !email || !subject || !message) {
			return res.status(400).json({ error: 'Name, email, subject, and message are required' });
		}

		// Skip captcha validation for localhost
		let isValidCaptcha = false;
		if (isLocalhost(req)) {
			isValidCaptcha = true;
		} else {
			if (!captchaToken) {
				return res.status(400).json({ error: 'reCAPTCHA token is required' });
			}
			isValidCaptcha = await verifyRecaptcha(captchaToken);
			if (!isValidCaptcha) {
				return res.status(400).json({ error: 'Invalid reCAPTCHA. Please try again.' });
			}
		}

		// Validate email format
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(email)) {
			return res.status(400).json({ error: 'Invalid email address' });
		}

		// Prepare email content for main message
		const mainEmailData = {
			from: process.env.MAILGUN_FROM_EMAIL,
			to: process.env.CONTACT_EMAIL_TO,
			subject: `Got a new message!`,
			text: `Just got a new message from the form\n\nName: ${name}\nFrom: ${email}\nSubject: ${subject}\n\nMessage:\n${message}\n\nSent from Art & Bargains website contact form`,
			html: `
			<h3>Just got a new message from the form</h3>
			<p><strong>Name:</strong> ${name}</p>
			<p><strong>From:</strong> ${email}</p>
			<p><strong>Subject:</strong> ${subject}</p>
			<hr />
			<p><strong>Message:</strong></p>
			<p>${message.replace(/\n/g, '<br>')}</p>
			<hr />
			<p><small>Sent from Art & Bargains website contact form</small></p>
			`
		};

		console.log('Environment check:', {
			from: process.env.MAILGUN_FROM_EMAIL,
			domain: process.env.MAILGUN_DOMAIN,
			apiKey: process.env.MAILGUN_API_KEY ? 'Set' : 'Missing'
		});

		console.log('Email data being sent:', {
			from: mainEmailData.from,
			to: mainEmailData.to,
			domain: process.env.MAILGUN_DOMAIN
		});

		// Send the main message email
		await mg.messages.create(process.env.MAILGUN_DOMAIN, mainEmailData);

		// Prepare auto-reply email content for user
		const autoReplyData = {
			from: process.env.MAILGUN_FROM_EMAIL,
			to: email,
			subject: 'Got your message!',
			text: `
			Hi ${name},
			Thanks for reaching out! We have received your message and will get back to you as soon as possible.

			Your message:
			Subject: ${subject}
			${message}

			Best regards,
			Art & Bargains Team
			`,
			html: `
			<h3>Hi ${name},</h3>
			<p>Thanks for reaching out! We have received your message and will get back to you as soon as possible.</p>
			<hr/>
			<p><strong>Your message:</strong></p>
			<p><strong>Subject:</strong> ${subject}</p>
			<p>${message.replace(/\n/g, '<br>')}</p>
			<hr/>
			<p>Best regards,<br/>Art & Bargains Team</p>
			`
		};

		// Send auto-reply email
		await mg.messages.create(process.env.MAILGUN_DOMAIN, autoReplyData);

		res.json({ success: true, message: 'Email sent successfully' });
	} catch (error) {
		console.error('Error sending email:', error);
		res.status(500).json({ error: 'Failed to send email. Please try again later.' });
	}
};
