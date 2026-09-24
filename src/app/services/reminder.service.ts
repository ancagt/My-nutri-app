import { Injectable, effect, inject, signal } from '@angular/core';
import { StoreService } from './store.service';

/**
 * Schedules recurring "drink water" reminders based on the user's settings.
 * Uses the browser Notification API when permitted, otherwise falls back to an
 * in-app toast surfaced through the `lastReminder` signal.
 */
@Injectable({ providedIn: 'root' })
export class ReminderService {
  private store = inject(StoreService);

  private timerId: ReturnType<typeof setInterval> | null = null;

  /** Most recent reminder message, for an in-app fallback toast. */
  readonly lastReminder = signal<string | null>(null);

  constructor() {
    // Re-schedule whenever the reminder settings change.
    effect(() => {
      const r = this.store.waterReminder();
      this.clear();
      if (!r.enabled) return;
      const ms = this.intervalMs(r.interval, r.unit);
      if (ms <= 0) return;
      this.timerId = setInterval(() => this.fire(), ms);
    });
  }

  /** Asks the browser for notification permission. Returns the resulting state. */
  async requestPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) return 'denied';
    if (Notification.permission === 'granted' || Notification.permission === 'denied') {
      return Notification.permission;
    }
    return Notification.requestPermission();
  }

  dismissToast(): void {
    this.lastReminder.set(null);
  }

  private fire(): void {
    const message = 'Time to drink a glass of water! 💧';
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('NutriTrack', { body: message });
    } else {
      this.lastReminder.set(message);
    }
  }

  private intervalMs(interval: number, unit: 'minutes' | 'hours'): number {
    const value = Math.max(1, Math.round(interval));
    return unit === 'hours' ? value * 60 * 60 * 1000 : value * 60 * 1000;
  }

  private clear(): void {
    if (this.timerId !== null) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  }
}
