import fs from 'fs';
import path from 'path';
import { query } from '../db';
import { parseMarkdownFile, slugify } from './fileParser';
import { logger } from '../utils/logger';
import { asyncPool } from '../utils/asyncPool';

const NOTES_DIR = process.env.NOTES_DIR || '';

const getOrCreateFolder = async (folderPath: string): Promise<number | null> => {
  if (!folderPath || folderPath === '') return null;

  const parts = folderPath.split(path.sep);
  let parentId: number | null = null;

  for (const part of parts) {
    const res = await query(
      'INSERT INTO folders (name, parent_id) VALUES ($1, $2) ON CONFLICT DO NOTHING RETURNING id',
      [part, parentId]
    );

    if (res.rows.length > 0) {
      parentId = res.rows[0].id;
    } else {
      const existing = await query(
        'SELECT id FROM folders WHERE name = $1 AND (parent_id = $2 OR (parent_id IS NULL AND $2 IS NULL))',
        [part, parentId]
      );
      if (existing.rows.length > 0) {
        parentId = existing.rows[0].id;
      }
    }
  }

  return parentId;
};

export const syncSingleNote = async (filePath: string) => {
  try {
    const relativePath = path.relative(NOTES_DIR, filePath);
    const parsed = parseMarkdownFile(filePath, NOTES_DIR);
    const folderId = await getOrCreateFolder(parsed.folderPath);

    let uniqueSlug = parsed.slug;
    const existingSlug = await query('SELECT file_path FROM notes WHERE slug = $1 AND file_path != $2', [uniqueSlug, relativePath]);
    if (existingSlug.rows.length > 0) {
        const prefix = slugify(parsed.folderPath.replace(path.sep, '-'));
        uniqueSlug = prefix ? `${prefix}-${parsed.slug}` : `copy-${parsed.slug}`;
        logger.warn(`Slug collision detected for ${relativePath}. Renamed slug to: ${uniqueSlug}`);
    }

    const noteRes = await query(
      `INSERT INTO notes (folder_id, title, slug, content, frontmatter, file_path, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())
       ON CONFLICT (file_path) DO UPDATE
       SET folder_id = EXCLUDED.folder_id,
           title = EXCLUDED.title,
           slug = EXCLUDED.slug,
           content = EXCLUDED.content,
           frontmatter = EXCLUDED.frontmatter,
           updated_at = NOW()
       RETURNING id`,
      [folderId, parsed.title, uniqueSlug, parsed.content, JSON.stringify(parsed.frontmatter), relativePath]
    );

    const noteId = noteRes.rows[0].id;

    await query('DELETE FROM note_tags WHERE note_id = $1', [noteId]);
    await Promise.all(parsed.tags.map(async (tagName) => {
      let tagRes = await query('INSERT INTO tags (name) VALUES ($1) ON CONFLICT (name) DO NOTHING RETURNING id', [tagName]);
      let tagId = tagRes.rows[0]?.id;
      if (!tagId) {
        const existing = await query('SELECT id FROM tags WHERE name = $1', [tagName]);
        tagId = existing.rows[0]?.id;
      }
      if (tagId) await query('INSERT INTO note_tags (note_id, tag_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [noteId, tagId]);
    }));

    await query('DELETE FROM note_links WHERE from_note_id = $1', [noteId]);
    await Promise.all(parsed.links.map(async (targetSlug) => {
        const targetNote = await query('SELECT id FROM notes WHERE slug = $1', [targetSlug]);
        if (targetNote.rows.length > 0) {
            await query('INSERT INTO note_links (from_note_id, to_note_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [noteId, targetNote.rows[0].id]);
        }
    }));

    return noteId;
  } catch (err) {
    logger.error(err, `Error syncing ${filePath}`);
    return null;
  }
};

export const deleteNoteByPath = async (filePath: string) => {
  try {
    const relativePath = path.relative(NOTES_DIR, filePath);
    logger.info(`Deleting note: ${relativePath}`);
    await query('DELETE FROM notes WHERE file_path = $1', [relativePath]);
  } catch (err) {
    logger.error(err, `Error deleting note ${filePath}`);
  }
};

export const cleanupOrphanedNotes = async (currentFiles: string[]) => {
  try {
    const relativePaths = currentFiles.map(f => path.relative(NOTES_DIR, f));
    const dbRes = await query('SELECT file_path FROM notes WHERE file_path IS NOT NULL');
    const dbPaths: string[] = dbRes.rows.map((r: any) => r.file_path);
    const orphans = dbPaths.filter((p: string) => !relativePaths.includes(p));
    
    if (orphans.length > 0) {
      logger.warn(`Cleaning up ${orphans.length} orphaned notes...`);
      await query('DELETE FROM notes WHERE file_path = ANY($1)', [orphans]);
    }
  } catch (err) {
    logger.error(err, 'Error during cleanup');
  }
};

export const syncNotes = async () => {
  if (!fs.existsSync(NOTES_DIR)) return;
  const files = getAllFiles(NOTES_DIR).filter(f => f.endsWith('.md'));
  logger.info(`Starting initial sync: ${files.length} notes...`);
  
  await asyncPool(10, files, syncSingleNote);
  await asyncPool(10, files, syncSingleNote);

  await cleanupOrphanedNotes(files);
  logger.info('Initial sync complete!');
};

const getAllFiles = (dirPath: string, arrayOfFiles: string[] = []): string[] => {
  const files = fs.readdirSync(dirPath);
  files.forEach((file) => {
    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) arrayOfFiles = getAllFiles(fullPath, arrayOfFiles);
    else arrayOfFiles.push(fullPath);
  });
  return arrayOfFiles;
};
