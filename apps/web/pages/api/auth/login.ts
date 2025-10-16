import { withSessionRoute } from '../../../lib/session';
import { prisma } from '@premium-banking/db';
import * as bcrypt from 'bcryptjs';

export default withSessionRoute(async (req, res) => {
  if (req.method === 'POST') {
    const { email, password, otp } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    try {
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
      if (!isPasswordValid) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      // 2FA/OTP check would go here if implemented

      req.session.user = { id: user.id, email: user.email };
      await req.session.save();

      res.status(200).json({ id: user.id, email: user.email });
    } catch (error) {
      res.status(500).json({ message: 'An error occurred during login' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
});