import express from 'express';
import User from '../models/User.ts';
import { authenticate } from '../middlewares/auth.ts';

const router = express.Router();

router.get('/profile', authenticate, async (req: any, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['passwordHash'] }
    });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/profile', authenticate, async (req: any, res) => {
  const { fullName, phoneNumber, photoURL, about, status } = req.body;
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    user.fullName = fullName || user.fullName;
    user.phoneNumber = phoneNumber || user.phoneNumber;
    user.photoURL = photoURL || user.photoURL;
    user.about = about || user.about;
    user.status = status || user.status;

    await user.save();
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
