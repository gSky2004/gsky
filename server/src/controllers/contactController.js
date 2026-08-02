const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const emailService = require('../services/emailService');
const env = require('../config/env');

const submit = asyncHandler(async (req, res) => {
  const { name, email, subject, message } = req.body;
  if (!name || !email || !subject || !message) {
    throw new ApiError(422, 'Please fill in all fields');
  }
  await emailService.sendContact({ name, email, subject, message });
  res.json({ message: 'Message sent! We will get back to you soon.', to: env.contactToEmail });
});

module.exports = { submit };
