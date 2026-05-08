import express, { Application, Request, Response } from "express";
import dotenv from "dotenv";
import notesRouter from "./routes/notes";
import { syncNotes } from "./services/syncEngine";
import { initializeWatcher } from "./services/watcher";
import { logger } from "./utils/logger";

dotenv.config();

const app: Application = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/notes', notesRouter);

// Health check
app.get('/health', (req: Request, res: Response) => {
    res.json({ status: 'ok', "deployment": "github-actions-working" });
});

app.get('/', (req: Request, res: Response) => {
    res.send('Notes App Backend is running!');
});

// Start the server
app.listen(port, async () => {
    logger.info(`--- Server starting on http://localhost:${port} ---`);
    logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);

    try {
        await syncNotes();
        const watcher = initializeWatcher();

        const shutdown = async () => {
            logger.warn('Shutting down gracefully...');
            if (watcher) await watcher.close();
            process.exit(0);
        };

        process.on('SIGTERM', shutdown);
        process.on('SIGINT', shutdown);
    } catch (err) {
        logger.error(err, 'Critical failure during initialization');
    }
}); 