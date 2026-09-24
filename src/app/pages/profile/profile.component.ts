import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  ActivityLevel,
  BodyShape,
  FoodPreference,
  Gender,
  Goal,
  Profile,
} from '../../models/models';
import { StoreService } from '../../services/store.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss',
})
export class ProfileComponent {
  private store = inject(StoreService);
  private router = inject(Router);

  saved = signal(false);

  model: Profile = {
    name: '',
    gender: 'female',
    age: 28,
    weightKg: 65,
    heightCm: 165,
    bodyShape: 'pear',
    goal: 'deficit',
    activityLevel: 'moderate',
    foodPreference: 'omnivore',
    deficitCalories: 500,
    stepGoal: 8000,
    paymentPlan: 'free',
    ...(this.store.profile() ?? {}),
  };

  genders: { value: Gender; label: string }[] = [
    { value: 'female', label: 'Female' },
    { value: 'male', label: 'Male' },
    { value: 'non-binary', label: 'Non-binary' },
  ];

  bodyShapes: { value: BodyShape; label: string; emoji: string }[] = [
    { value: 'pear', label: 'Pear', emoji: '🍐' },
    { value: 'apple', label: 'Apple', emoji: '🍎' },
    { value: 'hourglass', label: 'Hourglass', emoji: '⏳' },
    { value: 'rectangle', label: 'Rectangle', emoji: '▭' },
    { value: 'inverted-triangle', label: 'Inverted Triangle', emoji: '🔺' },
  ];

  goals: { value: Goal; label: string; desc: string }[] = [
    { value: 'deficit', label: 'Calorie Deficit', desc: 'Lose fat (~0.5 kg/week)' },
    { value: 'weight-gain', label: 'Weight Gain', desc: 'Gain weight overall' },
    { value: 'muscle-gain', label: 'Muscular Mass', desc: 'Lean muscle, light surplus' },
    { value: 'maintain', label: 'Maintain', desc: 'Stay where you are' },
  ];

  activityLevels: { value: ActivityLevel; label: string; desc: string }[] = [
    { value: 'sedentary', label: 'Sedentary', desc: 'Little / no exercise' },
    { value: 'light', label: 'Light', desc: '1-3 days/week' },
    { value: 'moderate', label: 'Moderate', desc: '3-5 days/week' },
    { value: 'active', label: 'Active', desc: '6-7 days/week' },
    { value: 'very-active', label: 'Very Active', desc: 'Hard daily / physical job' },
  ];

  foodPreferences: { value: FoodPreference; label: string; emoji: string }[] = [
    { value: 'omnivore', label: 'Omnivore', emoji: '🍽️' },
    { value: 'vegetarian', label: 'Vegetarian', emoji: '🥦' },
    { value: 'vegan', label: 'Vegan', emoji: '🌱' },
    { value: 'pescatarian', label: 'Pescatarian', emoji: '🐟' },
    { value: 'keto', label: 'Keto', emoji: '🥑' },
    { value: 'carnivore', label: 'Carnivore', emoji: '🥩' },
    { value: 'paleo', label: 'Paleo', emoji: '🍖' },
    { value: 'mediterranean', label: 'Mediterranean', emoji: '🫒' },
  ];

  deficitOptions: { value: number; label: string; desc: string }[] = [
    { value: 250, label: '250 kcal', desc: 'Gentle · ~0.25 kg/week' },
    { value: 500, label: '500 kcal', desc: 'Standard · ~0.5 kg/week' },
    { value: 750, label: '750 kcal', desc: 'Faster · ~0.7 kg/week' },
    { value: 1000, label: '1000 kcal', desc: 'Aggressive · ~1 kg/week' },
  ];

  get bmi(): number {
    const h = this.model.heightCm / 100;
    if (!h) return 0;
    return Math.round((this.model.weightKg / (h * h)) * 10) / 10;
  }

  get bmiCategory(): string {
    const b = this.bmi;
    if (b < 18.5) return 'Underweight';
    if (b < 25) return 'Normal';
    if (b < 30) return 'Overweight';
    return 'Obese';
  }

  get bmiColor(): string {
    const b = this.bmi;
    if (b < 18.5) return '#3b82f6';
    if (b < 25) return '#10b981';
    if (b < 30) return '#f59e0b';
    return '#ef4444';
  }

  /** Position (0-100%) on a 15-40 BMI scale for the marker */
  get bmiMarkerPct(): number {
    const min = 15;
    const max = 40;
    const clamped = Math.min(max, Math.max(min, this.bmi));
    return ((clamped - min) / (max - min)) * 100;
  }

  save(): void {
    this.store.setProfile({ ...this.model });
    this.saved.set(true);
    setTimeout(() => this.router.navigate(['/dashboard']), 600);
  }
}
