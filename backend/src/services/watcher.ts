import chokidar from 'chokidar';
import { syncSingleNote, deleteNoteByPath } from './syncEngine';
import { logger } from '../utils/logger';
import { syncEvents } from '../utils/eventEmitter';
import { asyncPool } from '../utils/asyncPool';

const NOTES_DIR = process.env.NOTES_DIR || '/home/krish/notes';

export const initializeWatcher = () => {
  if (!NOTES_DIR) {
    logger.error('NOTES_DIR not defined. Watcher not started.');
    return;
  }
  
  logger.info('Initializing file watcher...');
  const watcher = chokidar.watch(NOTES_DIR, { ignoreInitial: true });
  const pendingChanges = new Map<string, 'sync' | 'delete'>();
  let syncTimeout: NodeJS.Timeout;

  watcher.on('all', (event, filePath) => {
    if (!filePath.endsWith('.md')) return;

    logger.debug(`Watcher event [${event}] on ${filePath}`);

    if (event === 'add' || event === 'change') {
      pendingChanges.set(filePath, 'sync');
    } else if (event === 'unlink') {
      pendingChanges.set(filePath, 'delete');
    }

    clearTimeout(syncTimeout);
    syncTimeout = setTimeout(async () => {
      const tasks = Array.from(pendingChanges.entries());
      pendingChanges.clear();
      
      if (tasks.length === 0) return;

      logger.info(`Batch processing ${tasks.length} file changes...`);
      
      // Safety Cap: Use asyncPool (max 10 parallel) to avoid crashing on bulk moves/deletes
      await asyncPool(10, tasks, async ([path, action]) => {
        try {
          if (action === 'sync') await syncSingleNote(path);
          else if (action === 'delete') await deleteNoteByPath(path);
        } catch (err) {
          logger.error(err, `Failed to process ${path}`);
        }
      });
      
      logger.info('Batch sync complete.');
      syncEvents.emit('refresh');
    }, 500);
  });

  return watcher;
};
