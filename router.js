import express from 'express';
import nengAiRouter from "./modules/genAI/API.js";

// Buat instance router baru
const router = express.Router();

// "Pasang" router dari modul nengAI pada path /nengAI
// Ini berarti endpoint yang ada di dalam nengAiRouter akan diawali dengan /nengAI
router.use('/nengAI', nengAiRouter);

export default router;