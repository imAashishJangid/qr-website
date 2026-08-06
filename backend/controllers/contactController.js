import { sendContactEnquiryEmail } from '../config/mailer.js';

// POST /api/contact
export const submitEnquiry = async (req, res) => {
  try {
    const { name, email, phone, message } = req.body;

    if (!name || !email || !phone || !message) {
      return res.status(400).json({ message: 'name, email, phone and message are required' });
    }

    await sendContactEnquiryEmail({ name, email, phone, message });

    res.status(200).json({ message: 'Enquiry sent successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to send enquiry', error: error.message });
  }
};
