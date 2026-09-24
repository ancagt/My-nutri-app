import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { StoreService } from '../../services/store.service';
import { SUPPLEMENT_OPTIONS } from '../../constants';
import { SupplementType } from '../../models/models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink, FormsModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent {
  store = inject(StoreService);

  profile = this.store.profile;
  targets = this.store.targets;
  cycleInfo = this.store.cycleInfo;
  isSubscribed = this.store.isSubscribed;
  todayBurn = this.store.todayBurn;
  todayWater = this.store.todayWater;
  todayCalories = this.store.todayCalories;
  todayIntake = this.store.todayIntake;
  todaySugar = this.store.todaySugar;
  sugarLimit = this.store.sugarLimit;
  todaySupplements = this.store.todaySupplements;

  // Quick-add intake form
  intakeLabel = signal('');
  intakeCalories = signal<number | null>(null);

  // Quick-add sugar form
  sugarInput = signal<number | null>(null);

  // Supplement logging form
  supplementOptions = SUPPLEMENT_OPTIONS;
  suppType = signal<SupplementType>('protein-powder');
  suppName = signal('');
  suppDose = signal('');

  goalLabel = computed(() => {
    const map: Record<string, string> = {
      deficit: 'Calorie Deficit',
      'weight-gain': 'Weight Gain',
      'muscle-gain': 'Muscular Mass Gain',
      maintain: 'Maintain',
    };
    return map[this.profile()?.goal ?? 'maintain'];
  });

  // Goal theme: 'too-low'/'too-high' => red, 'deficit' => green, 'gain' => blue, 'maintain' => amber.
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

  addIntake(): void {
    const cals = this.intakeCalories();
    if (!cals || cals <= 0) return;
    this.store.addIntake(this.intakeLabel(), cals);
    this.intakeLabel.set('');
    this.intakeCalories.set(null);
  }

  removeIntake(id: string): void {
    this.store.removeIntake(id);
  }

  waterPct = computed(() => {
    const t = this.targets();
    if (!t || t.waterGlasses === 0) return 0;
    return Math.min(100, Math.round((this.todayWater() / t.waterGlasses) * 100));
  });

  // Sugar intake vs daily limit.
  sugarPct = computed(() => {
    const limit = this.sugarLimit();
    if (limit <= 0) return 0;
    return Math.min(100, Math.round((this.todaySugar() / limit) * 100));
  });

  sugarOver = computed(() => this.todaySugar() > this.sugarLimit());

  addSugar(): void {
    const g = this.sugarInput();
    if (!g || g <= 0) return;
    this.store.addSugar(g);
    this.sugarInput.set(null);
  }

  resetSugar(): void {
    this.store.setSugar(0);
  }

  // Placeholder dose shown for the selected supplement.
  suppDosePlaceholder = computed(() => {
    const opt = this.supplementOptions.find((o) => o.value === this.suppType());
    return opt?.defaultDose || 'dose (optional)';
  });

  // 'Other' supplements need a custom name from the user.
  isOtherSupplement = computed(() => this.suppType() === 'other');

  emojiFor(type: SupplementType): string {
    return this.supplementOptions.find((o) => o.value === type)?.emoji ?? '💊';
  }

  addSupplement(): void {
    const type = this.suppType();
    const opt = this.supplementOptions.find((o) => o.value === type);
    const name = type === 'other' ? this.suppName().trim() : opt?.label ?? '';
    if (!name) return;
    const dose = this.suppDose().trim() || (type === 'other' ? '' : opt?.defaultDose ?? '');
    this.store.addSupplement(type, name, dose);
    this.suppName.set('');
    this.suppDose.set('');
  }

  removeSupplement(id: string): void {
    this.store.removeSupplement(id);
  }
}
