import express from 'express';
import apiRouter from './router.js';

const app = express();

app.use(express.json());

const PORT = process.env.PORT || 6068;

app.use('/api', apiRouter);

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});