import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { handleChatRequest } from './api/chat';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
app.post('/api/chat', (req: Request, res: Response) => handleChatRequest(req, res));

// Error handling
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Server error:', err);
  res.status(500).json({
    error: 'Internal server error',
    details: err.message
  });
});

// Start server
const port = process.env.PORT || 3001;
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});

export { app }; 