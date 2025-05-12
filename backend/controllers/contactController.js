const nodemailer = require('nodemailer');
const axios = require('axios');

// Create nodemailer transporter
const transporter = nodemailer.createTransporter({
	host: process.env.SMTP_HOST,
	port: process.env.SMTP_PORT,
	secure: process.env.SMTP_SECURE === 'true',
	auth: {
		user: process.env.SMTP_USER,
		pass: process.env.SMTP_PASS
	}
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

// Handle contact form submission
exports.sendContactEmail = async (req, res) => {
	try {
		const { email, subject, message, captchaToken } = req.body;

		// Validate required fields
		if (!email || !subject || !message || !captchaToken) {
			return res.status(400).json({ error: 'All fields are required' });
		}

		// Verify reCAPTCHA
		const isValidCaptcha = await verifyRecaptcha(captchaToken);

		if (!isValidCaptcha) {
			return res.status(400).json({ error: 'Invalid reCAPTCHA. Please try again.' });
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
			subject: `Contact Form: ${subject}`,
			html: `
				<h2>New Contact Form Submission</h2>
				<p><strong>From:</strong> ${email}</p>
				<p><strong>Subject:</strong> ${subject}</p>
				<hr>
				<p><strong>Message:</strong></p>
				<p>${message.replace(/\n/g, '<br>')}</p>
				<hr>
				<p><small>Sent from Art & Bargains website contact form</small></p>
			`,
			text: `
				New Contact Form Submission
				
				From: ${email}
				Subject: ${subject}
				
				Message:
				${message}
				
				Sent from Art & Bargains website contact form
			`
		};

		// Send email
		await transporter.sendMail(mailOptions);

		// Send auto-reply to user (optional)
		const autoReplyOptions = {
			from: process.env.SMTP_FROM_EMAIL,
			to: email,
			subject: 'Thank you for contacting Art & Bargains',
			html: `
				<h2>Thank you for contacting us!</h2>
				<p>We have received your message and will get back to you as soon as possible.</p>
				<hr>
				<p><strong>Your message:</strong></p>
				<p><strong>Subject:</strong> ${subject}</p>
				<p>${message.replace(/\n/g, '<br>')}</p>
				<hr>
				<p>Best regards,<br>Art & Bargains Team</p>
			`,
			text: `
				Thank you for contacting us!
				
				We have received your message and will get back to you as soon as possible.
				
				Your message:
				Subject: ${subject}
				${message}
				
				Best regards,
				Art & Bargains Team
			`
		};

		await transporter.sendMail(autoReplyOptions);

		res.json({ success: true, message: 'Email sent successfully' });
	} catch (error) {
		console.error('Error sending email:', error);
		res.status(500).json({ error: 'Failed to send email. Please try again later.' });
	}
};