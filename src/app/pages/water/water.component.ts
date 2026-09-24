import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { StoreService } from '../../services/store.service';
import { ReminderService } from '../../services/reminder.service';
import { ML_PER_GLASS } from '../../constants';

@Component({
  selector: 'app-water',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './water.component.html',
  styleUrl: './water.component.scss',
})
export class WaterComponent {
  private store = inject(StoreService);
  private reminders = inject(ReminderService);

  todayWater = this.store.todayWater;
  targets = this.store.targets;

  // ---- Reminder settings (local draft synced to the store) ----
  reminder = this.store.waterReminder;
  reminderEnabled = signal(this.store.waterReminder().enabled);
  reminderInterval = signal(this.store.waterReminder().interval);
  reminderUnit = signal<'minutes' | 'hours'>(this.store.waterReminder().unit);
  permissionDenied = signal(false);

  goalGlasses = computed(() => this.targets()?.waterGlasses ?? 8);

  pct = computed(() => {
    const goal = this.goalGlasses();
    if (goal === 0) return 0;
    return Math.min(100, Math.round((this.todayWater() / goal) * 100));
  });

  ml = computed(() => this.todayWater() * ML_PER_GLASS);

  glassesArray = computed(() =>
    Array.from({ length: Math.max(this.goalGlasses(), this.todayWater()) }, (_, i) => i),
  );

  add(): void {
    this.store.setWaterGlasses(this.todayWater() + 1);
  }

  remove(): void {
    this.store.setWaterGlasses(this.todayWater() - 1);
  }

  setTo(n: number): void {
    this.store.setWaterGlasses(n + 1);
  }

  async saveReminder(): Promise<void> {
    if (this.reminderEnabled()) {
      const permission = await this.reminders.requestPermission();
      this.permissionDenied.set(permission === 'denied');
    } else {
      this.permissionDenied.set(false);
    }
    this.store.setWaterReminder({
      enabled: this.reminderEnabled(),
      interval: this.reminderInterval(),
      unit: this.reminderUnit(),
    });
  }
}
