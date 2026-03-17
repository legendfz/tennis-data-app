import { Router, Request, Response } from 'express';
import { mockMatches } from '../mock-data';

const router = Router();

router.get('/', (_req: Request, res: Response) => {
  res.json(mockMatches);
});

router.get('/:id', (req: Request, res: Response) => {
  const match = mockMatches.find((m) => m.id === parseInt(req.params.id));
  if (!match) {
    res.status(404).json({ error: 'Match not found' });
    return;
  }
  res.json(match);
});

export default router;
