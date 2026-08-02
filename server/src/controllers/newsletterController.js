const { query } = require('../db/pool');
const { ApiError } = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const emailService = require('../services/emailService');

const subscribe = asyncHandler(async (req, res) => {
  const { name, email, phone, shoe_size, consent } = req.body;

  if (!consent) {
    throw new ApiError(422, 'You must agree to receive marketing emails');
  }

  const userId = req.user ? req.user.id : null;

  const { rows } = await query(
    `INSERT INTO newsletter_subscribers (user_id, name, email, phone, shoe_size, consent, subscribed)
     VALUES ($1,$2,$3,$4,$5,$6,TRUE)
     ON CONFLICT (email)
     DO UPDATE SET
       name = EXCLUDED.name, phone = EXCLUDED.phone, shoe_size = EXCLUDED.shoe_size,
       consent = EXCLUDED.consent, subscribed = TRUE,
       unsubscribed_at = NULL, subscribed_at = now()
     RETURNING id, email, subscribed, subscribed_at`,
    [userId, name, email, phone || null, shoe_size || null, Boolean(consent)]
  );

  res.status(201).json({
    message: 'Welcome to the Gsky VIP list!',
    subscriber: rows[0],
  });
});

const unsubscribe = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) throw new ApiError(422, 'Email is required');

  const { rows } = await query(
    `UPDATE newsletter_subscribers
     SET subscribed = FALSE, unsubscribed_at = now()
     WHERE email = $1
     RETURNING id, email, subscribed`,
    [email]
  );

  if (!rows[0]) {
    throw new ApiError(404, 'You are not on the subscription list');
  }

  res.json({ message: 'You have been unsubscribed', subscriber: rows[0] });
});

const status = asyncHandler(async (req, res) => {
  const { email } = req.params;
  const { rows } = await query(
    'SELECT email, subscribed FROM newsletter_subscribers WHERE email = $1',
    [email]
  );
  res.json({ subscribed: rows[0] ? rows[0].subscribed : false });
});

const sendCampaign = asyncHandler(async (req, res) => {
  const { subject, body } = req.body;
  if (!subject || !body) throw new ApiError(422, 'Subject and body are required');

  const { rows: subscribers } = await query(
    'SELECT name, email FROM newsletter_subscribers WHERE subscribed = TRUE'
  );

  if (subscribers.length === 0) {
    throw new ApiError(400, 'No active subscribers to send to');
  }

  let sent = 0;
  for (const sub of subscribers) {
    try {
      await emailService.sendMarketing({
        to: sub.email,
        name: sub.name,
        subject,
        body,
      });
      sent += 1;
    } catch (err) {
      console.error('[newsletter] failed for', sub.email, err.message);
    }
  }

  await query(
    'INSERT INTO email_campaigns (subject, body, recipient_count, sent_by) VALUES ($1,$2,$3,$4)',
    [subject, body, sent, req.user.id]
  );

  res.json({ message: `Campaign sent to ${sent} subscriber(s)` });
});

module.exports = { subscribe, unsubscribe, status, sendCampaign };
