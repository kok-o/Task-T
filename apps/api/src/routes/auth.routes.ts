import { Router, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { prisma } from '../utils/prisma';
import { authenticateJWT } from '../middleware/auth.middleware';
import { AppError } from '../middleware/error.middleware';

export const authRouter = Router();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

// POST /api/v1/auth/login
authRouter.post(
  '/login',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password } = loginSchema.parse(req.body);

      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) throw new AppError(401, 'Invalid credentials');

      const isValid = await bcrypt.compare(password, user.passwordHash);
      if (!isValid) throw new AppError(401, 'Invalid credentials');

      const accessToken = jwt.sign(
        { userId: user.id, role: user.role },
        process.env.JWT_ACCESS_SECRET || 'secret',
        { expiresIn: (process.env.JWT_ACCESS_EXPIRES_IN || '15m') as any }
      );

      const refreshToken = jwt.sign(
        { userId: user.id, role: user.role },
        process.env.JWT_REFRESH_SECRET || 'secret',
        { expiresIn: (process.env.JWT_REFRESH_EXPIRES_IN || '7d') as any }
      );

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      await prisma.refreshToken.create({
        data: { token: refreshToken, userId: user.id, expiresAt },
      });

      res.json({
        accessToken,
        refreshToken,
        user: { id: user.id, email: user.email, role: user.role },
      });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/v1/auth/refresh
authRouter.post(
  '/refresh',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { refreshToken } = z
        .object({ refreshToken: z.string() })
        .parse(req.body);

      const stored = await prisma.refreshToken.findUnique({
        where: { token: refreshToken },
        include: { user: true },
      });

      if (!stored || stored.expiresAt < new Date()) {
        throw new AppError(401, 'Invalid or expired refresh token');
      }

      const payload = jwt.verify(
        refreshToken,
        process.env.JWT_REFRESH_SECRET!
      ) as { userId: string; role: string };

      const accessToken = jwt.sign(
        { userId: payload.userId, role: payload.role },
        process.env.JWT_ACCESS_SECRET || 'secret',
        { expiresIn: (process.env.JWT_ACCESS_EXPIRES_IN || '15m') as any }
      );

      res.json({ accessToken });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/v1/auth/logout
authRouter.post(
  '/logout',
  authenticateJWT,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { refreshToken } = z
        .object({ refreshToken: z.string() })
        .parse(req.body);

      await prisma.refreshToken.deleteMany({ where: { token: refreshToken } });
      res.json({ message: 'Logged out successfully' });
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/v1/auth/me
authRouter.get(
  '/me',
  authenticateJWT,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.user!.userId },
        select: {
          id: true,
          email: true,
          role: true,
          createdAt: true,
          master: { select: { id: true, name: true, color: true } },
        },
      });
      if (!user) throw new AppError(404, 'User not found');
      res.json(user);
    } catch (err) {
      next(err);
    }
  }
);
