import express from 'express';
import cors from 'cors';
import apiRouter from './api';

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// API routes
app.use('/api', apiRouter);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
}); 