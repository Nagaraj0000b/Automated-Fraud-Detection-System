const SupportTicket = require('../models/SupportTicket');

// POST /api/support/contact
// Create a support ticket (can be called even if account is suspended)
exports.createTicket = async (req, res) => {
  try {
    const { email, message, type, metadata } = req.body;

    if (!email || !message) {
      return res.status(400).json({
        success: false,
        message: 'Email and message are required',
      });
    }

    const ticket = await SupportTicket.create({
      email: email.trim(),
      message: message.trim(),
      type: type || 'ACCOUNT_SUSPENDED',
      metadata: metadata || {},
    });

    return res.status(201).json({
      success: true,
      ticketId: ticket._id,
      message: 'Your request has been sent to our support team.',
    });
  } catch (error) {
    console.error('createTicket error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to submit support request',
    });
  }
};

// GET /api/support/tickets (admin only)
// List recent support tickets so admins can see unblock requests
exports.listTickets = async (req, res) => {
  try {
    const tickets = await SupportTicket.find().sort({ createdAt: -1 }).limit(200);
    return res.status(200).json({ success: true, tickets });
  } catch (error) {
    console.error('listTickets error:', error);
    return res.status(500).json({ success: false, message: 'Failed to load support tickets' });
  }
};
