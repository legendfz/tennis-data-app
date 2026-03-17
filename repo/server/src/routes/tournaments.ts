import { Router, Request, Response } from 'express';
import { mockTournaments } from '../mock-data';

const router = Router();

router.get('/', (_req: Request, res: Response) => {
  res.json(mockTournaments);
});

router.get('/:id', (req: Request, res: Response) => {
  const tournament = mockTournaments.find((t) => t.id === parseInt(req.params.id));
  if (!tournament) {
    res.status(404).json({ error: 'Tournament not found' });
    return;
  }
  res.json(tournament);
});

export default router;
