import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { WorkoutEntry, WorkoutType } from '../../models/models';
import { NutritionService } from '../../services/nutrition.service';
import { StoreService, todayISO } from '../../services/store.service';

@Component({
  selector: 'app-workouts',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './workouts.component.html',
  styleUrl: './workouts.component.scss',
})
export class WorkoutsComponent {
  private store = inject(StoreService);
  private nutrition = inject(NutritionService);

  workouts = this.store.workouts;
  todayBurn = this.store.todayBurn;
  todaySteps = this.store.todaySteps;
  todayStepBurn = this.store.todayStepBurn;
  profile = this.store.profile;
  isSubscribed = this.store.isSubscribed;

  selectedType = signal<WorkoutType>('jogging');
  duration = signal<number>(30);
  stepsInput = signal<number>(this.store.todaySteps());

  workoutTypes: { value: WorkoutType; label: string; emoji: string }[] = [
    { value: 'jogging', label: 'Jogging', emoji: '🏃' },
    { value: 'walking', label: 'Walking', emoji: '🚶' },
    { value: 'yoga', label: 'Yoga', emoji: '🧘' },
    { value: 'weight-training', label: 'Weight Training', emoji: '🏋️' },
    { value: 'dance', label: 'Dance', emoji: '💃' },
    { value: 'pilates', label: 'Pilates', emoji: '🤸' },
    { value: 'calisthenics', label: 'Calisthenics', emoji: '🤾' },
    { value: 'cycling', label: 'Cycling', emoji: '🚴' },
    { value: 'swimming', label: 'Swimming', emoji: '🏊' },
    { value: 'stretching', label: 'Stretching', emoji: '🙆' },
    { value: 'hiit', label: 'HIIT', emoji: '⚡' },
  ];

  previewCalories = computed(() => {
    const p = this.profile();
    if (!p) return 0;
    return this.nutrition.calcWorkoutCalories(this.selectedType(), this.duration(), p.weightKg);
  });

  stepsPreviewCalories = computed(() => {
    const p = this.profile();
    if (!p) return 0;
    return this.nutrition.calcStepCalories(this.stepsInput(), p.weightKg);
  });

  stepGoal = computed(() => this.profile()?.stepGoal ?? 0);

  stepGoalPct = computed(() => {
    const goal = this.stepGoal();
    if (goal <= 0) return 0;
    return Math.min(100, Math.round((this.todaySteps() / goal) * 100));
  });

  stepGoalReached = computed(() => this.stepGoal() > 0 && this.todaySteps() >= this.stepGoal());

  saveSteps(): void {
    this.store.setSteps(this.stepsInput());
  }

  labelFor(type: WorkoutType): string {
    return this.workoutTypes.find((t) => t.value === type)?.label ?? type;
  }

  emojiFor(type: WorkoutType): string {
    return this.workoutTypes.find((t) => t.value === type)?.emoji ?? '🏅';
  }

  add(): void {
    const p = this.profile();
    if (!p || this.duration() <= 0) return;
    const entry: WorkoutEntry = {
      id: crypto.randomUUID(),
      date: todayISO(),
      type: this.selectedType(),
      durationMin: this.duration(),
      caloriesBurned: this.previewCalories(),
    };
    this.store.addWorkout(entry);
  }

  remove(id: string): void {
    this.store.removeWorkout(id);
  }
}
