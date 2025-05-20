const nodemailer = require('nodemailer');
const axios = require('axios');

// Create nodemailer transporter - lazy initialization
let transporter = null;

const getTransporter = () => {
	if (!transporter) {
		transporter = nodemailer.createTransport({
			host: process.env.SMTP_HOST,
			port: process.env.SMTP_PORT,
			secure: process.env.SMTP_SECURE === 'true',
			auth: {
				user: process.env.SMTP_USER,
				pass: process.env.SMTP_PASS
			}
		});
	}
	return transporter;
};

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
			// Require captchaToken for non-localhost environments
			if (!captchaToken) {
				return res.status(400).json({ error: 'reCAPTCHA token is required' });
			}

			// Verify reCAPTCHA for non-localhost environments
			isValidCaptcha = await verifyRecaptcha(captchaToken);

			if (!isValidCaptcha) {
				return res.status(400).json({ error: 'Invalid reCAPTCHA. Please try again.' });
			}
		}

		// Email validation regex
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(email)) {
			return res.status(400).json({ error: 'Invalid email address' });
		}

		// Prepare email content
		const mailOptions = {
			from: process.env.SMTP_FROM_EMAIL,
			to: process.env.CONTACT_EMAIL_TO,
			subject: `Got a new message!`,
			html: `
				<h2>Just got a new message from the form</h2>
				<p><strong>Name:</strong> ${name}</p>
				<p><strong>From:</strong> ${email}</p>
				<p><strong>Subject:</strong> ${subject}</p>
				<hr>
				<p><strong>Message:</strong></p>
				<p>${message.replace(/\n/g, '<br>')}</p>
				<hr>
				<p><small>Sent from Art & Bargains website contact form</small></p>
			`,
			text: `
				Just got a new message from the form
				
				Name: ${name}
				From: ${email}
				Subject: ${subject}
				
				Message:
				${message}
				
				Sent from Art & Bargains website contact form
			`
		};

		// Get transporter and send email
		const mailer = getTransporter();
		await mailer.sendMail(mailOptions);

		// Send auto-reply to user
		const autoReplyOptions = {
			from: process.env.SMTP_FROM_EMAIL,
			to: email,
			subject: 'Got your message!',
			html: `
				<h2>Hi ${name},</h2>
				<p>Thanks for reaching out! We have received your message and will get back to you as soon as possible.</p>
				<hr>
				<p><strong>Your message:</strong></p>
				<p><strong>Subject:</strong> ${subject}</p>
				<p>${message.replace(/\n/g, '<br>')}</p>
				<hr>
				<p>Best regards,<br>Art & Bargains Team</p>
			`,
			text: `
				Hi ${name},
				
				Thanks for reaching out! We have received your message and will get back to you as soon as possible.
				
				Your message:
				Subject: ${subject}
				${message}
				
				Best regards,
				Art & Bargains Team
			`
		};

		await mailer.sendMail(autoReplyOptions);

		res.json({ success: true, message: 'Email sent successfully' });
	} catch (error) {
		console.error('Error sending email:', error);
		res.status(500).json({ error: 'Failed to send email. Please try again later.' });
	}
};