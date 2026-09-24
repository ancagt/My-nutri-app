import { Injectable } from '@angular/core';
import {
  ActivityLevel,
  Goal,
  HealthCondition,
  NutritionTargets,
  Profile,
  WorkoutType,
} from '../models/models';
import { ACTIVITY_FACTORS, BURN_PER_MIN_PER_KG, STEP_CALORIE_FACTOR } from '../constants';

@Injectable({ providedIn: 'root' })
export class NutritionService {
  // Activity multipliers (Mifflin-St Jeor baseline)
  private readonly activityFactors: Record<ActivityLevel, number> = ACTIVITY_FACTORS;

  // Calories burned per minute per kg of body weight (METs-derived approximations)
  private readonly burnPerMinPerKg: Record<WorkoutType, number> = BURN_PER_MIN_PER_KG;

  /** Mifflin-St Jeor BMR */
  calcBMR(profile: Profile): number {
    const { weightKg, heightCm, age, gender } = profile;
    const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
    return Math.round(gender === 'male' ? base + 5 : base - 161);
  }

  /** Total daily energy expenditure based on lifestyle activity level */
  calcTDEE(profile: Profile): number {
    return Math.round(this.calcBMR(profile) * this.activityFactors[profile.activityLevel]);
  }

  /** Calories burned for a single workout */
  calcWorkoutCalories(type: WorkoutType, durationMin: number, weightKg: number): number {
    return Math.round(this.burnPerMinPerKg[type] * weightKg * durationMin);
  }

  /** Calories burned from a step count (scales with body weight). */
  calcStepCalories(steps: number, weightKg: number): number {
    if (steps <= 0) return 0;
    return Math.round(steps * weightKg * STEP_CALORIE_FACTOR);
  }

  /**
   * Build full nutrition targets.
   * extraBurn = calories burned today via logged workouts (eat-back portion considered).
   */
  calcTargets(
    profile: Profile,
    extraBurn = 0,
    conditions: HealthCondition[] = [],
  ): NutritionTargets {
    const bmr = this.calcBMR(profile);
    const tdee = this.calcTDEE(profile);

    // Goal adjustment relative to maintenance
    let goalCalories = tdee;
    switch (profile.goal) {
      case 'deficit': {
        const deficit = profile.deficitCalories > 0 ? profile.deficitCalories : 500;
        goalCalories = tdee - deficit;
        break;
      }
      case 'weight-gain':
        goalCalories = tdee + 400;
        break;
      case 'muscle-gain':
        goalCalories = tdee + 250; // lean surplus
        break;
      case 'maintain':
        goalCalories = tdee;
        break;
    }

    // Eat back ~70% of workout calories so the goal stays consistent
    goalCalories += Math.round(extraBurn * 0.7);
    goalCalories = Math.max(goalCalories, Math.round(bmr * 1.1));

    // Protein (g per kg of bodyweight) varies by goal
    let proteinPerKg: number;
    switch (profile.goal) {
      case 'muscle-gain':
        proteinPerKg = 2.0;
        break;
      case 'deficit':
        proteinPerKg = 1.8; // protein-sparing during a cut
        break;
      case 'weight-gain':
        proteinPerKg = 1.6;
        break;
      default:
        proteinPerKg = 1.4;
    }
    let proteinG = Math.round(profile.weightKg * proteinPerKg);

    // Fat ~25% of calories
    let fatG = Math.round((goalCalories * 0.25) / 9);

    // Fiber: base 14 g per 1000 kcal, more for blood-sugar related conditions
    let fiberPerThousand = 14;
    if (
      conditions.includes('diabetes-type-1') ||
      conditions.includes('diabetes-type-2') ||
      conditions.includes('pcos') ||
      conditions.includes('high-cholesterol')
    ) {
      fiberPerThousand = 18;
    }
    let fiberG = Math.round((goalCalories / 1000) * fiberPerThousand);

    // Condition-based protein cap (kidney-friendly is out of scope; keep simple)
    // Remaining calories -> carbs
    const proteinCals = proteinG * 4;
    const fatCals = fatG * 9;
    let carbsG = Math.round((goalCalories - proteinCals - fatCals) / 4);
    if (carbsG < 0) carbsG = 0;

    // Water: 35 ml/kg -> 250 ml glasses, +1 glass per 20 min cardio burn proxy
    const waterMl = profile.weightKg * 35 + extraBurn * 1.5;
    const waterGlasses = Math.max(6, Math.round(waterMl / 250));

    return {
      bmr,
      tdee,
      goalCalories: Math.round(goalCalories),
      proteinG,
      carbsG,
      fatG,
      fiberG,
      waterGlasses,
    };
  }
}
