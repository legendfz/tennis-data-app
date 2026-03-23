import { Router, Request, Response } from 'express';
import * as realApi from '../lib/real-api';

const router = Router();

// GET /api/images/player/:id
router.get('/player/:id', async (req: Request, res: Response) => {
  const result = await realApi.getPlayerImageBuffer(req.params.id);
  if (!result) {
    return res.status(404).json({ error: 'Image not found' });
  }
  res.set('Content-Type', result.contentType);
  res.set('Cache-Control', 'public, max-age=86400');
  res.send(result.buffer);
});

// GET /api/images/flag/:code
router.get('/flag/:code', async (req: Request, res: Response) => {
  const result = await realApi.getFlagImageBuffer(req.params.code);
  if (!result) {
    return res.status(404).json({ error: 'Flag not found' });
  }
  res.set('Content-Type', result.contentType);
  res.set('Cache-Control', 'public, max-age=604800');
  res.send(result.buffer);
});

export default router;
