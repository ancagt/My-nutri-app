// Central place for app-wide constant values.

import {
  ActivityLevel,
  GlucoseRange,
  LipidRange,
  PaymentPlan,
  SupplementType,
  WorkoutType,
} from './models/models';

/** localStorage keys used by the StoreService. */
export const STORAGE_KEYS = {
  profile: 'nt_profile',
  health: 'nt_health',
  workouts: 'nt_workouts',
  water: 'nt_water',
  steps: 'nt_steps',
  intake: 'nt_intake',
  recipes: 'nt_custom_recipes',
  accounts: 'nt_accounts',
  session: 'nt_session',
  glucose: 'nt_glucose',
  waterReminder: 'nt_water_reminder',
  lipids: 'nt_lipids',
  bloodwork: 'nt_bloodwork',
  sugar: 'nt_sugar',
  supplements: 'nt_supplements',
} as const;

// ---- Hydration ----
/** Millilitres in a single glass of water. */
export const ML_PER_GLASS = 250;

// ---- Sugar intake (grams/day) ----
/** General added-sugar daily limit (AHA-style guidance). */
export const SUGAR_DAILY_LIMIT_G = 36;

/** Tighter daily sugar limit for diabetic / insulin-resistant users. */
export const SUGAR_DAILY_LIMIT_DIABETIC_G = 25;/** Default water-reminder settings (disabled until the user turns it on). */
export const DEFAULT_WATER_REMINDER = {
  enabled: false,
  interval: 2,
  unit: 'hours' as 'minutes' | 'hours',
};

// ---- Validation ----
/** Basic but practical email format check. */
export const EMAIL_REGEX = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

/** Password rules: only letters, digits and the allowed specials { ! @ . - _ }. */
export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_ALLOWED_REGEX = /^[A-Za-z0-9!@._-]+$/;

// ---- Glucose (mg/dL) ----
/** Healthy band for users without diabetes / insulin resistance. */
export const GLUCOSE_RANGE_STANDARD: GlucoseRange = {
  min: 70,
  okMax: 140,
  elevatedMax: 180,
  scaleMax: 250,
};

/** Wider band applied for diabetic / insulin-resistant users. */
export const GLUCOSE_RANGE_DIABETIC: GlucoseRange = {
  min: 70,
  okMax: 180,
  elevatedMax: 250,
  scaleMax: 300,
};

// ---- Blood lipids (mg/dL) ----
/** Total cholesterol: desirable < 200, borderline 200–239, high ≥ 240. */
export const CHOLESTEROL_RANGE: LipidRange = {
  okMax: 200,
  elevatedMax: 240,
  scaleMax: 320,
};

/** Triglycerides: normal < 150, borderline 150–199, high ≥ 200. */
export const TRIGLYCERIDE_RANGE: LipidRange = {
  okMax: 150,
  elevatedMax: 200,
  scaleMax: 500,
};

// ---- Supplements ----
/** Selectable supplements with an icon and a sensible default dose. */
export const SUPPLEMENT_OPTIONS: {
  value: SupplementType;
  label: string;
  emoji: string;
  defaultDose: string;
}[] = [
  { value: 'protein-powder', label: 'Protein Powder', emoji: '🥤', defaultDose: '30 g' },
  { value: 'creatine', label: 'Creatine', emoji: '💪', defaultDose: '5 g' },
  { value: 'bcaa', label: 'BCAA', emoji: '🔋', defaultDose: '5 g' },
  { value: 'pre-workout', label: 'Pre-Workout', emoji: '⚡', defaultDose: '1 scoop' },
  { value: 'multivitamin', label: 'Multivitamin', emoji: '🌈', defaultDose: '1 tablet' },
  { value: 'omega-3', label: 'Omega-3', emoji: '🐟', defaultDose: '1 capsule' },
  { value: 'vitamin-d', label: 'Vitamin D', emoji: '☀️', defaultDose: '1000 IU' },
  { value: 'magnesium', label: 'Magnesium', emoji: '🌙', defaultDose: '300 mg' },
  { value: 'zinc', label: 'Zinc', emoji: '🛡️', defaultDose: '15 mg' },
  { value: 'iron', label: 'Iron', emoji: '⚙️', defaultDose: '18 mg' },
  { value: 'collagen', label: 'Collagen', emoji: '✨', defaultDose: '10 g' },
  { value: 'probiotic', label: 'Probiotic', emoji: '🦠', defaultDose: '1 capsule' },
  { value: 'other', label: 'Other', emoji: '💊', defaultDose: '' },
];

// ---- Subscription ----
/** Plans offered on the setup page. 'free' unlocks only the free sections. */
export const PAYMENT_PLAN_OPTIONS: {
  value: PaymentPlan;
  label: string;
  desc: string;
  price: string;
}[] = [
  { value: 'free', label: 'Free', desc: 'Food log, steps, water & profile', price: '€0' },
  { value: 'monthly', label: 'Monthly', desc: 'Billed every month', price: '€9 / mo' },
  { value: '3-months', label: '3 Months', desc: 'Billed quarterly', price: '€24' },
  { value: '6-months', label: '6 Months', desc: 'Billed twice a year', price: '€42' },
  { value: 'annually', label: 'Annually', desc: 'Best value, billed yearly', price: '€72' },
];

// ---- Nutrition tuning ----
/** Activity multipliers (Mifflin-St Jeor baseline). */
export const ACTIVITY_FACTORS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  'very-active': 1.9,
};

/** Calories burned per minute per kg of body weight (METs-derived approximations). */
export const BURN_PER_MIN_PER_KG: Record<WorkoutType, number> = {
  walking: 0.0623,
  jogging: 0.1175,
  yoga: 0.0417,
  'weight-training': 0.0833,
  dance: 0.0833,
  pilates: 0.0501,
  calisthenics: 0.0958,
  cycling: 0.1108,
  swimming: 0.1108,
  stretching: 0.0417,
  hiit: 0.15,
};

/** Calories per step per kg of body weight. */
export const STEP_CALORIE_FACTOR = 0.0005;

// ---- Bloodwork follow-up ----
/** How many days each bloodwork follow-up interval represents. */
export const BLOODWORK_INTERVAL_DAYS: Record<'3-months' | '6-months' | 'annually', number> = {
  '3-months': 90,
  '6-months': 182,
  annually: 365,
};

/** Human-readable labels for each bloodwork interval. */
export const BLOODWORK_INTERVAL_LABELS: Record<'3-months' | '6-months' | 'annually', string> = {
  '3-months': 'every 3 months',
  '6-months': 'every 6 months',
  annually: 'once a year',
};
