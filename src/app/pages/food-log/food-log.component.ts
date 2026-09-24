import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { StoreService } from '../../services/store.service';

@Component({
  selector: 'app-food-log',
  standalone: true,
  imports: [RouterLink, FormsModule],
  templateUrl: './food-log.component.html',
  styleUrl: './food-log.component.scss',
})
export class FoodLogComponent {
  store = inject(StoreService);

  profile = this.store.profile;
  targets = this.store.targets;
  todayCalories = this.store.todayCalories;
  todayIntake = this.store.todayIntake;

  // Log entry form
  foodLabel = signal('');
  foodCalories = signal<number | null>(null);

  // Goal theme matches the dashboard bar colours.
  calorieState = computed<'deficit' | 'gain' | 'maintain' | 'too-low' | 'too-high'>(() => {
    const t = this.targets();
    const p = this.profile();
    if (!t || !p) return 'maintain';
    const safeMin = p.gender === 'male' ? 1500 : 1200;
    if (t.goalCalories < safeMin) return 'too-low';
    if (t.goalCalories > t.tdee * 1.35) return 'too-high';
    if (p.goal === 'deficit') return 'deficit';
    if (p.goal === 'weight-gain' || p.goal === 'muscle-gain') return 'gain';
    return 'maintain';
  });

  // Calories still available before hitting the target.
  remaining = computed(() => {
    const t = this.targets();
    if (!t) return 0;
    return t.goalCalories - this.todayCalories();
  });

  // True when eaten calories exceed the daily target.
  isOver = computed(() => this.remaining() < 0);

  // Bar colour state: red when over target, otherwise the goal theme.
  barState = computed(() => (this.isOver() ? 'over' : this.calorieState()));

  // Fill width: consumed calories as a share of the daily target (caps at 100%).
  consumedPct = computed(() => {
    const t = this.targets();
    if (!t || t.goalCalories === 0) return 0;
    return Math.min(100, Math.round((this.todayCalories() / t.goalCalories) * 100));
  });

  calorieNote = computed(() => {
    const remaining = this.remaining();
    if (this.isOver()) {
      return `${Math.abs(remaining)} kcal over target`;
    }
    return `${remaining} kcal left today`;
  });

  addFood(): void {
    const cals = this.foodCalories();
    if (!cals || cals <= 0) return;
    this.store.addIntake(this.foodLabel(), cals);
    this.foodLabel.set('');
    this.foodCalories.set(null);
  }

  removeFood(id: string): void {
    this.store.removeIntake(id);
  }
}
