import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { FoodPreference, PaymentPlan, Profile } from '../../models/models';
import { StoreService } from '../../services/store.service';
import { PAYMENT_PLAN_OPTIONS } from '../../constants';

@Component({
  selector: 'app-setup',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './setup.component.html',
  styleUrl: './setup.component.scss',
})
export class SetupComponent {
  private store = inject(StoreService);
  private router = inject(Router);

  weightKg = signal<number>(this.store.profile()?.weightKg ?? 65);
  heightCm = signal<number>(this.store.profile()?.heightCm ?? 165);
  foodPreference = signal<FoodPreference>(this.store.profile()?.foodPreference ?? 'omnivore');
  paymentPlan = signal<PaymentPlan>(this.store.profile()?.paymentPlan ?? 'free');

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

  plans = PAYMENT_PLAN_OPTIONS;

  save(): void {
    const existing = this.store.profile();
    const profile: Profile = {
      name: '',
      gender: 'female',
      age: 28,
      bodyShape: 'pear',
      goal: 'deficit',
      activityLevel: 'moderate',
      deficitCalories: 500,
      stepGoal: 8000,
      ...(existing ?? {}),
      weightKg: Number(this.weightKg()) || 65,
      heightCm: Number(this.heightCm()) || 165,
      foodPreference: this.foodPreference(),
      paymentPlan: this.paymentPlan(),
    };
    this.store.setProfile(profile);
    this.router.navigate(['/dashboard']);
  }
}
