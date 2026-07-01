import cron from 'node-cron';
import { processPendingNotifications } from '../services/notifications.service';

export function startCronJobs(): void {
  // Process pending notifications every 15 minutes
  cron.schedule('*/15 * * * *', async () => {
    console.log('[Cron] Running notification job at', new Date().toISOString());
    try {
      await processPendingNotifications();
    } catch (err) {
      console.error('[Cron] Notification job error:', err);
    }
  });

  console.log('[Cron] Notification job scheduled (every 15 min)');
}
