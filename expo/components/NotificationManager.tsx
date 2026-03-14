import { useNotifications } from '@/hooks/useNotifications';
import { useSmartReminders } from '@/hooks/useSmartReminders';
import { useBehaviorNotifications } from '@/hooks/useBehaviorNotifications';

export default function NotificationManager() {
  useNotifications();
  useSmartReminders();
  useBehaviorNotifications();
  return null;
}
