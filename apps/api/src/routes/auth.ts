import bcrypt from 'bcryptjs';
import { Request, Response, Router } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';
import { requireAuth, AuthRequest } from '../middleware/auth';

const router = Router();

router.post('/register', async (req: Request, res: Response) => {
    try {
        const { email, password, name } = req.body as {
            email: string;
            password: string;
            name?: string;
        };

        if (!email || !password) {
            res.status(400).json({ error: 'Email and password are required' });
            return;
        }

        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) {
            res.status(409).json({ error: 'Email already in use' });
            return;
        }

        const passwordHash = await bcrypt.hash(password, 12);
        const user = await prisma.user.create({
            data: { email, passwordHash, name: name || 'User' },
            select: { id: true, email: true, name: true, createdAt: true },
        });

        const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET!, { expiresIn: '7d' });
        res.status(201).json({ token, user });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.post('/login', async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body as { email: string; password: string };

        if (!email || !password) {
            res.status(400).json({ error: 'Email and password are required' });
            return;
        }

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            res.status(401).json({ error: 'Invalid credentials' });
            return;
        }

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) {
            res.status(401).json({ error: 'Invalid credentials' });
            return;
        }

        const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET!, { expiresIn: '7d' });
        res.json({
            token,
            user: { id: user.id, email: user.email, name: user.name, createdAt: user.createdAt },
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.patch('/profile', requireAuth, async (req: AuthRequest, res: Response) => {
    try {
        const { name } = req.body as { name?: string };

        if (!req.userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const existing = await prisma.user.findUnique({ where: { id: req.userId } });
        if (!existing) {
            res.status(404).json({ error: 'User not found' });
            return;
        }

        const user = await prisma.user.update({
            where: { id: req.userId },
            data: { ...(name && { name }) },
            select: { id: true, email: true, name: true, createdAt: true },
        });

        res.json({ user });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.patch('/password', requireAuth, async (req: AuthRequest, res: Response) => {
    try {
        const { oldPassword, newPassword } = req.body as {
            oldPassword: string;
            newPassword: string;
        };

        if (!oldPassword || !newPassword) {
            res.status(400).json({ error: 'Old password and new password are required' });
            return;
        }

        if (!req.userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const user = await prisma.user.findUnique({ where: { id: req.userId } });
        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }

        const valid = await bcrypt.compare(oldPassword, user.passwordHash);
        if (!valid) {
            res.status(401).json({ error: 'Invalid old password' });
            return;
        }

        const passwordHash = await bcrypt.hash(newPassword, 12);
        await prisma.user.update({
            where: { id: req.userId },
            data: { passwordHash },
        });

        res.json({ message: 'Password updated successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
