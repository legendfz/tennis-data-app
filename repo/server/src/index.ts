import express from 'express';
import cors from 'cors';
import playersRouter from './routes/players';
import matchesRouter from './routes/matches';
import tournamentsRouter from './routes/tournaments';
import h2hRouter from './routes/h2h';
import brandsRouter from './routes/brands';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/players', playersRouter);
app.use('/api/matches', matchesRouter);
app.use('/api/tournaments', tournamentsRouter);
app.use('/api/h2h', h2hRouter);
app.use('/api/brands', brandsRouter);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🎾 TennisHQ Server running on http://0.0.0.0:${PORT}`);
});

export default app;
