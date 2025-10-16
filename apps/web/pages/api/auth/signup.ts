import { withSessionRoute } from '../../../lib/session';
import { prisma, UserType } from '@premium-banking/db';
import * as bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

export default withSessionRoute(async (req, res) => {
  if (req.method === 'POST') {
    const { email, password, firstName, lastName, userType } = req.body;

    if (!email || !password || !userType) {
      return res.status(400).json({ message: 'Email, password, and user type are required' });
    }

    try {
      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        return res.status(400).json({ message: 'User already exists' });
      }

      const passwordHash = await bcrypt.hash(password, 10);

      const user = await prisma.user.create({
        data: {
          email,
          passwordHash,
          firstName,
          lastName,
          userType: userType as UserType,
        },
      });

      if (userType === 'personal') {
        await prisma.account.createMany({
          data: [
            {
              userId: user.id,
              accountNumber: uuidv4(),
              type: 'checking',
              balance: 0,
            },
            {
              userId: user.id,
              accountNumber: uuidv4(),
              type: 'savings',
              balance: 0,
            },
          ],
        });
      } else if (userType === 'business') {
        await prisma.account.create({
          data: {
            userId: user.id,
            accountNumber: uuidv4(),
            type: 'business',
            balance: 0,
          },
        });
      }

      req.session.user = { id: user.id, email: user.email };
      await req.session.save();

      res.status(201).json({ id: user.id, email: user.email });
    } catch (error) {
      res.status(500).json({ message: 'An error occurred during registration' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
});