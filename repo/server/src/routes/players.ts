import { Router, Request, Response } from 'express';
import { mockPlayers } from '../mock-data';

const router = Router();

router.get('/', (_req: Request, res: Response) => {
  res.json(mockPlayers);
});

router.get('/:id', (req: Request, res: Response) => {
  const player = mockPlayers.find((p) => p.id === parseInt(req.params.id));
  if (!player) {
    res.status(404).json({ error: 'Player not found' });
    return;
  }
  res.json(player);
});

export default router;
