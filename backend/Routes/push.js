const router = require('express').Router();
const auth = require('../middleware/auth'); // your existing JWT middleware
const User = require('../Models/user');

router.post('/register', auth, async (req, res) => {
  const { token } = req.body;
  if (!token) return res.status(400).json({ message: 'token required' });

  await User.updateOne(
    { _id: req.user.id },
    { $addToSet: { pushTokens: token } }
  );
  res.json({ ok: true });
});

module.exports = router;