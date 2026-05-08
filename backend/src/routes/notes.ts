import { Router, Request, Response } from 'express';
import { query } from '../db';
import { renderMarkdown } from '../services/fileParser';
import { syncEvents } from '../utils/eventEmitter';
import { logger } from '../utils/logger';

const router = Router();


// SSE Endpoint for live updates
router.get("/events", (req: Request, res: Response) => {
  try {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    const onRefresh = () => {
      try {
        res.write(`data: ${JSON.stringify({ type: "refresh" })}\n\n`);
      } catch (err) {
        logger.error(err, 'Failed to push SSE event');
      }
    };

    syncEvents.on("refresh", onRefresh);

    req.on("close", () => {
      syncEvents.off("refresh", onRefresh);
    });
  } catch (err) {
    logger.error(err, 'SSE initialization failed');
  }
});

// GET /notes - List all notes
router.get('/', async (req: Request, res: Response) => {
  try {
    const result = await query(`
      SELECT n.id, n.title, n.slug, n.updated_at, f.name as folder_name
      FROM notes n
      LEFT JOIN folders f ON n.folder_id = f.id
      ORDER BY n.updated_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    logger.error(err, 'Failed to fetch notes list');
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /notes/:slug - Get single note detail
router.get('/:slug', async (req: Request, res: Response) => {
  const { slug } = req.params;
  try {
    const result = await query(`
      SELECT n.*, f.name as folder_name
      FROM notes n
      LEFT JOIN folders f ON n.folder_id = f.id
      WHERE n.slug = $1
    `, [slug]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Note not found' });
    }

    const note = result.rows[0];

    // Parallel fetch for tags and links
    const [tagsResult, linksResult] = await Promise.all([
      query(`
            SELECT t.name
            FROM tags t
            JOIN note_tags nt ON t.id = nt.tag_id
            WHERE nt.note_id = $1
        `, [note.id]),
      query(`
            SELECT n.title, n.slug
            FROM notes n
            JOIN note_links nl ON n.id = nl.to_note_id
            WHERE nl.from_note_id = $1
        `, [note.id])
    ]);

    res.json({
      ...note,
      content_html: renderMarkdown(note.content),
      tags: tagsResult.rows.map((r: any) => r.name),
      links: linksResult.rows
    });
  } catch (err) {
    logger.error(err, `Failed to fetch note: ${slug}`);
    res.status(500).json({ error: 'Internal server error' });
  }
});


export default router;
