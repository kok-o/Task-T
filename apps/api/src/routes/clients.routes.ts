import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma';
import { authenticateJWT } from '../middleware/auth.middleware';
import { AppError } from '../middleware/error.middleware';

export const clientsRouter = Router();
clientsRouter.use(authenticateJWT);

const clientSchema = z.object({
  name: z.string().min(1),
  phone: z.string().min(7),
  email: z.string().email().optional().nullable(),
  telegramChatId: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

// GET /clients?search=query
clientsRouter.get('/', async (req, res, next) => {
  try {
    const { search } = z
      .object({ search: z.string().optional() })
      .parse(req.query);

    const clients = await prisma.client.findMany({
      where: search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { phone: { contains: search } },
            ],
          }
        : undefined,
      orderBy: { name: 'asc' },
      take: 50,
    });
    res.json(clients);
  } catch (err) {
    next(err);
  }
});

// GET /clients/:id (includes appointment history)
clientsRouter.get('/:id', async (req, res, next) => {
  try {
    const client = await prisma.client.findUnique({
      where: { id: req.params.id as string },
      include: {
        appointments: {
          include: { master: true, service: true },
          orderBy: { startsAt: 'desc' },
          take: 20,
        },
      },
    });
    if (!client) throw new AppError(404, 'Client not found');
    res.json(client);
  } catch (err) {
    next(err);
  }
});

// POST /clients
clientsRouter.post(
  '/',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = clientSchema.parse(req.body);

      // Check for name duplicate (exact set of words, e.g. "Ivan Ivanov" == "Ivanov Ivan")
      const nameParts = data.name.trim().toLowerCase().split(/\s+/);
      if (nameParts.length >= 2) {
        const possibleDuplicates = await prisma.client.findMany({
          where: {
            AND: nameParts.map((p) => ({
              name: { contains: p, mode: 'insensitive' },
            })),
          },
        });

        const dataWords = new Set(nameParts);
        const isDuplicate = possibleDuplicates.some((c) => {
          const cWords = new Set(c.name.trim().toLowerCase().split(/\s+/));
          if (cWords.size !== dataWords.size) return false;
          for (const w of dataWords) {
            if (!cWords.has(w)) return false;
          }
          return true;
        });

        if (isDuplicate) {
          throw new AppError(400, 'Клиент с таким именем и фамилией уже существует');
        }
      }

      try {
        const client = await prisma.client.create({ data });
        res.status(201).json(client);
      } catch (err: any) {
        if (err.code === 'P2002') {
          throw new AppError(400, 'Этот номер телефона уже зарегистрирован');
        }
        throw err;
      }
    } catch (err) {
      next(err);
    }
  }
);

// PATCH /clients/:id
clientsRouter.patch(
  '/:id',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = clientSchema.partial().parse(req.body);
      try {
        const client = await prisma.client.update({
          where: { id: req.params.id as string },
          data,
        });
        res.json(client);
      } catch (err: any) {
        if (err.code === 'P2002') {
          throw new AppError(400, 'Этот номер телефона уже зарегистрирован');
        }
        throw err;
      }
    } catch (err) {
      next(err);
    }
  }
);
