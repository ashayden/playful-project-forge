import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { handleChatRequest } from './api/chat';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
const chatHandler = (req: Request, res: Response) => handleChatRequest(req, res);
app.post('/api/chat', chatHandler);

app.options('/api/chat', (req: Request, res: Response) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.status(200).end();
});

// Error handling
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
const port = process.env.PORT || 3001;
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});

export { app }; 