// Core domain models for NutriTrack

export type Gender = 'female' | 'male' | 'non-binary';

/** Subscription plan chosen during setup. 'free' unlocks only the free sections. */
export type PaymentPlan = 'free' | 'monthly' | '3-months' | '6-months' | 'annually';

/** A registered user account. Passwords are stored hashed, never in plain text. */
export interface Account {
  name: string;
  firstname: string;
  email: string;
  passwordHash: string;
}

export type BodyShape = 'pear' | 'apple' | 'hourglass' | 'rectangle' | 'inverted-triangle';

export type Goal = 'deficit' | 'weight-gain' | 'muscle-gain' | 'maintain';

export type ActivityLevel =
  | 'sedentary'
  | 'light'
  | 'moderate'
  | 'active'
  | 'very-active';

export type FoodPreference =
  | 'omnivore'
  | 'vegetarian'
  | 'vegan'
  | 'pescatarian'
  | 'keto'
  | 'carnivore'
  | 'paleo'
  | 'mediterranean';

export interface Profile {
  name: string;
  gender: Gender;
  age: number;
  weightKg: number;
  heightCm: number;
  bodyShape: BodyShape;
  goal: Goal;
  activityLevel: ActivityLevel;
  foodPreference: FoodPreference;
  /** Daily calorie deficit target (kcal below maintenance) when goal is 'deficit'. */
  deficitCalories: number;
  /** User-defined daily step goal. */
  stepGoal: number;
  /** Chosen subscription plan. 'free' (or null) means free tier. */
  paymentPlan: PaymentPlan;
}

export interface HealthData {
  // Menstrual cycle
  tracksCycle: boolean;
  lastPeriodStart: string | null; // ISO date
  cycleLengthDays: number;
  periodLengthDays: number;
  // Conditions
  conditions: HealthCondition[];
  mentalHealth: MentalHealthCondition[];
  reproductiveStatus: ReproductiveStatus;
  notes: string;
}

export type HealthCondition =
  | 'diabetes-type-1'
  | 'diabetes-type-2'
  | 'insulin-resistance'
  | 'pcos'
  | 'endometriosis'
  | 'hypothyroidism'
  | 'hyperthyroidism'
  | 'hypertension'
  | 'high-cholesterol'
  | 'celiac'
  | 'lactose-intolerance'
  | 'ibs'
  | 'anemia';

export type MentalHealthCondition =
  | 'depression'
  | 'anxiety'
  | 'grief'
  | 'stress-burnout'
  | 'adhd'
  | 'eating-disorder'
  | 'insomnia'
  | 'bipolar';

export type ReproductiveStatus =
  | 'not-pregnant'
  | 'trying-to-conceive'
  | 'pregnant'
  | 'breastfeeding'
  | 'miscarried';

export type WorkoutType =
  | 'jogging'
  | 'walking'
  | 'yoga'
  | 'weight-training'
  | 'dance'
  | 'pilates'
  | 'calisthenics'
  | 'cycling'
  | 'swimming'
  | 'stretching'
  | 'hiit';

export interface WorkoutEntry {
  id: string;
  date: string; // ISO date (yyyy-mm-dd)
  type: WorkoutType;
  durationMin: number;
  caloriesBurned: number;
}

export interface WaterEntry {
  date: string; // ISO date
  glasses: number; // 250 ml glasses
}

/** User-configured recurring reminder to drink water. */
export interface WaterReminder {
  enabled: boolean;
  interval: number;
  unit: 'minutes' | 'hours';
}

export interface StepEntry {
  date: string; // ISO date
  steps: number;
}

/** Daily dietary sugar intake in grams. */
export interface SugarEntry {
  date: string; // ISO date
  grams: number;
}

/** Common dietary / fitness supplements that can be logged. */
export type SupplementType =
  | 'protein-powder'
  | 'creatine'
  | 'bcaa'
  | 'pre-workout'
  | 'multivitamin'
  | 'omega-3'
  | 'vitamin-d'
  | 'magnesium'
  | 'zinc'
  | 'iron'
  | 'collagen'
  | 'probiotic'
  | 'other';

/** A single logged supplement dose for a given day. */
export interface SupplementEntry {
  id: string;
  date: string; // ISO date (yyyy-mm-dd)
  time: string; // HH:mm
  type: SupplementType;
  name: string; // display label (custom text when type is 'other')
  dose: string; // free text e.g. "30 g", "5 g", "1 capsule"
}

export interface IntakeEntry {
  id: string;
  date: string; // ISO date
  label: string;
  calories: number;
}

/** When a blood-glucose reading was taken, which affects the target range. */
export type GlucoseContext = 'fasting' | 'post-meal' | 'random';

/** A single blood-glucose reading in mg/dL. */
export interface GlucoseEntry {
  id: string;
  date: string; // ISO date (yyyy-mm-dd)
  time: string; // HH:mm
  mgdl: number;
  context: GlucoseContext;
}

/** Colour-coded status for a glucose reading. */
export type GlucoseLevel = 'low' | 'ok' | 'elevated' | 'high';

export interface GlucoseRange {
  /** Below this is 'low'. */
  min: number;
  /** Upper bound of the healthy 'ok' band. */
  okMax: number;
  /** Upper bound of the 'elevated' band; above it is 'high'. */
  elevatedMax: number;
  /** Top of the gauge scale for rendering. */
  scaleMax: number;
}

/** A blood-lipid panel reading in mg/dL (total cholesterol + triglycerides). */
export interface LipidEntry {
  id: string;
  date: string; // ISO date (yyyy-mm-dd)
  time: string; // HH:mm
  totalCholesterol: number;
  triglycerides: number;
}

/** Colour-coded status for a lipid value (no clinically-low concern). */
export type LipidLevel = 'ok' | 'elevated' | 'high';

export interface LipidRange {
  /** Upper bound of the healthy 'ok' band. */
  okMax: number;
  /** Upper bound of the borderline 'elevated' band; above it is 'high'. */
  elevatedMax: number;
  /** Top of the gauge scale for rendering. */
  scaleMax: number;
}

/** How often the user should repeat bloodwork, driven by result severity. */
export type BloodworkInterval = '3-months' | '6-months' | 'annually';

export interface RecipeIngredient {
  name: string;
  amount: string; // free text e.g. "200 g"
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG: number;
}

export interface Recipe {
  id: string;
  name: string;
  category: RecipeCategory;
  cuisine: string;
  servings: number;
  description: string;
  ingredients: RecipeIngredient[];
  steps: string[];
  custom: boolean;
  tags: string[];
  healthFocus: HealthFocus[];
  diets: FoodPreference[];
}

export type HealthFocus =
  | 'anti-bloating'
  | 'diabetes-friendly'
  | 'thyroid-friendly'
  | 'low-histamine'
  | 'gut-friendly'
  | 'anti-inflammatory'
  | 'iron-rich'
  | 'low-fodmap';

export type RecipeCategory =
  | 'main'
  | 'soup'
  | 'salad'
  | 'vegetables'
  | 'fruit'
  | 'pastry'
  | 'breakfast'
  | 'snack'
  | 'dessert';

export interface NutritionTargets {
  bmr: number;
  tdee: number; // includes activity level baseline
  goalCalories: number; // adjusted for goal
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG: number;
  waterGlasses: number;
}
