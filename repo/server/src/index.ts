import express from 'express';
import cors from 'cors';
import playersRouter from './routes/players';
import matchesRouter from './routes/matches';
import tournamentsRouter from './routes/tournaments';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/players', playersRouter);
app.use('/api/matches', matchesRouter);
app.use('/api/tournaments', tournamentsRouter);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`🎾 TennisHQ Server running on http://localhost:${PORT}`);
});

export default app;
