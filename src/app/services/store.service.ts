import { Injectable, computed, effect, signal } from '@angular/core';
import {
  Account,
  BloodworkInterval,
  GlucoseEntry,
  GlucoseContext,
  GlucoseLevel,
  GlucoseRange,
  HealthData,
  HealthFocus,
  IntakeEntry,
  LipidEntry,
  LipidLevel,
  LipidRange,
  Profile,
  Recipe,
  StepEntry,
  SugarEntry,
  SupplementEntry,
  SupplementType,
  WaterEntry,
  WaterReminder,
  WorkoutEntry,
} from '../models/models';
import { NutritionService } from './nutrition.service';
import { SEED_RECIPES } from '../data/recipes.data';
import {
  BLOODWORK_INTERVAL_DAYS,
  CHOLESTEROL_RANGE,
  DEFAULT_WATER_REMINDER,
  GLUCOSE_RANGE_DIABETIC,
  GLUCOSE_RANGE_STANDARD,
  STORAGE_KEYS,
  SUGAR_DAILY_LIMIT_DIABETIC_G,
  SUGAR_DAILY_LIMIT_G,
  TRIGLYCERIDE_RANGE,
} from '../constants';

const KEYS = STORAGE_KEYS;

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Hashes a password with SHA-256 before it is persisted. This is a client-only
 * demo without a backend; never store plain-text passwords.
 */
export async function hashPassword(password: string): Promise<string> {
  const data = new TextEncoder().encode(password);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

@Injectable({ providedIn: 'root' })
export class StoreService {
  // ---- State signals ----
  readonly profile = signal<Profile | null>(load<Profile | null>(KEYS.profile, null));

  readonly health = signal<HealthData>(
    {
      tracksCycle: false,
      lastPeriodStart: null,
      cycleLengthDays: 28,
      periodLengthDays: 5,
      conditions: [],
      mentalHealth: [],
      reproductiveStatus: 'not-pregnant',
      notes: '',
      ...load<Partial<HealthData>>(KEYS.health, {}),
    },
  );

  readonly workouts = signal<WorkoutEntry[]>(load<WorkoutEntry[]>(KEYS.workouts, []));
  readonly water = signal<WaterEntry[]>(load<WaterEntry[]>(KEYS.water, []));
  readonly steps = signal<StepEntry[]>(load<StepEntry[]>(KEYS.steps, []));
  readonly intake = signal<IntakeEntry[]>(load<IntakeEntry[]>(KEYS.intake, []));
  readonly sugar = signal<SugarEntry[]>(load<SugarEntry[]>(KEYS.sugar, []));
  readonly supplements = signal<SupplementEntry[]>(
    load<SupplementEntry[]>(KEYS.supplements, []),
  );
  readonly customRecipes = signal<Recipe[]>(load<Recipe[]>(KEYS.recipes, []));
  readonly glucose = signal<GlucoseEntry[]>(load<GlucoseEntry[]>(KEYS.glucose, []));
  readonly lipids = signal<LipidEntry[]>(load<LipidEntry[]>(KEYS.lipids, []));

  /** Date of the user's most recent bloodwork (ISO), used to schedule the next one. */
  readonly bloodworkDate = signal<string | null>(load<string | null>(KEYS.bloodwork, null));

  readonly waterReminder = signal<WaterReminder>(
    load<WaterReminder>(KEYS.waterReminder, DEFAULT_WATER_REMINDER),
  );

  // ---- Auth state ----
  readonly accounts = signal<Account[]>(load<Account[]>(KEYS.accounts, []));
  readonly currentEmail = signal<string | null>(load<string | null>(KEYS.session, null));

  readonly currentUser = computed<Account | null>(
    () => this.accounts().find((a) => a.email === this.currentEmail()) ?? null,
  );

  readonly isAuthenticated = computed(() => !!this.currentUser());

  /** A user is subscribed when they picked any paid plan (anything but 'free'). */
  readonly isSubscribed = computed(() => {
    const plan = this.profile()?.paymentPlan ?? 'free';
    return plan !== 'free';
  });

  // ---- Derived ----
  readonly allRecipes = computed<Recipe[]>(() => [
    ...this.customRecipes(),
    ...SEED_RECIPES,
  ]);

  readonly todayWorkouts = computed(() =>
    this.workouts().filter((w) => w.date === todayISO()),
  );

  readonly todayWorkoutBurn = computed(() =>
    this.todayWorkouts().reduce((sum, w) => sum + w.caloriesBurned, 0),
  );

  readonly todaySteps = computed(() => {
    const entry = this.steps().find((s) => s.date === todayISO());
    return entry ? entry.steps : 0;
  });

  readonly todayStepBurn = computed(() => {
    const p = this.profile();
    if (!p) return 0;
    return this.nutrition.calcStepCalories(this.todaySteps(), p.weightKg);
  });

  readonly todayBurn = computed(() =>
    this.todayWorkoutBurn() + this.todayStepBurn(),
  );

  readonly todayIntake = computed(() =>
    this.intake().filter((i) => i.date === todayISO()),
  );

  readonly todayCalories = computed(() =>
    this.todayIntake().reduce((sum, i) => sum + i.calories, 0),
  );

  readonly todayWater = computed(() => {
    const entry = this.water().find((w) => w.date === todayISO());
    return entry ? entry.glasses : 0;
  });

  /** Grams of sugar logged today. */
  readonly todaySugar = computed(() => {
    const entry = this.sugar().find((s) => s.date === todayISO());
    return entry ? entry.grams : 0;
  });

  /** Recommended daily sugar limit (g), tighter for diabetic / insulin-resistant users. */
  readonly sugarLimit = computed(() =>
    this.hasGlucoseCondition() ? SUGAR_DAILY_LIMIT_DIABETIC_G : SUGAR_DAILY_LIMIT_G,
  );

  /** Supplements logged today, newest first. */
  readonly todaySupplements = computed(() =>
    this.supplements().filter((s) => s.date === todayISO()),
  );

  readonly targets = computed(() => {
    const p = this.profile();
    if (!p) return null;
    return this.nutrition.calcTargets(p, this.todayBurn(), this.health().conditions);
  });

  /** Whether the user has diabetes or insulin resistance, which widens the glucose target range. */
  readonly hasGlucoseCondition = computed(() => {
    const c = this.health().conditions;
    return (
      c.includes('diabetes-type-1') ||
      c.includes('diabetes-type-2') ||
      c.includes('insulin-resistance')
    );
  });

  /** The healthy glucose range for the user, widened for diabetic / insulin-resistant users. */
  readonly glucoseRange = computed<GlucoseRange>(() =>
    this.hasGlucoseCondition() ? GLUCOSE_RANGE_DIABETIC : GLUCOSE_RANGE_STANDARD,
  );

  /** Most recent glucose reading, or null when none logged. */
  readonly latestGlucose = computed<GlucoseEntry | null>(() => {
    const list = [...this.glucose()].sort((a, b) =>
      `${b.date} ${b.time}`.localeCompare(`${a.date} ${a.time}`),
    );
    return list[0] ?? null;
  });

  /** Colour-coded status of the latest reading against the user's range. */
  readonly glucoseStatus = computed<GlucoseLevel | null>(() => {
    const reading = this.latestGlucose();
    if (!reading) return null;
    return this.classifyGlucose(reading.mgdl);
  });

  // ---- Blood lipids ----
  readonly cholesterolRange: LipidRange = CHOLESTEROL_RANGE;
  readonly triglycerideRange: LipidRange = TRIGLYCERIDE_RANGE;

  /** Most recent lipid panel, or null when none logged. */
  readonly latestLipid = computed<LipidEntry | null>(() => {
    const list = [...this.lipids()].sort((a, b) =>
      `${b.date} ${b.time}`.localeCompare(`${a.date} ${a.time}`),
    );
    return list[0] ?? null;
  });

  readonly cholesterolStatus = computed<LipidLevel | null>(() => {
    const l = this.latestLipid();
    return l ? this.classifyLipid(l.totalCholesterol, this.cholesterolRange) : null;
  });

  readonly triglycerideStatus = computed<LipidLevel | null>(() => {
    const l = this.latestLipid();
    return l ? this.classifyLipid(l.triglycerides, this.triglycerideRange) : null;
  });

  /**
   * Plain-language warnings whenever the latest metabolic markers are too high.
   * Surfaced on the Health page and used to tailor recipe suggestions.
   */
  readonly metabolicWarnings = computed<string[]>(() => {
    const warnings: string[] = [];
    if (this.glucoseStatus() === 'high') {
      warnings.push('Your blood sugar is high — favour low-GI, diabetes-friendly meals.');
    }
    if (this.cholesterolStatus() === 'high') {
      warnings.push('Your cholesterol is high — choose heart-healthy, anti-inflammatory recipes.');
    } else if (this.cholesterolStatus() === 'elevated') {
      warnings.push('Your cholesterol is borderline — go easy on saturated fat.');
    }
    if (this.triglycerideStatus() === 'high') {
      warnings.push('Your triglycerides are high — cut back on sugar, refined carbs and alcohol.');
    } else if (this.triglycerideStatus() === 'elevated') {
      warnings.push('Your triglycerides are borderline — limit added sugars.');
    }
    return warnings;
  });

  /** Recipe health-focus tags recommended from current conditions + latest markers. */
  readonly recommendedHealthFocus = computed<HealthFocus[]>(() => {
    const focus = new Set<HealthFocus>();
    if (this.hasGlucoseCondition() || this.glucoseStatus() === 'high') {
      focus.add('diabetes-friendly');
    }
    const chol = this.cholesterolStatus();
    const trig = this.triglycerideStatus();
    if (chol === 'high' || chol === 'elevated' || trig === 'high' || trig === 'elevated') {
      focus.add('anti-inflammatory');
    }
    return [...focus];
  });

  /** How severe the latest markers are — drives the bloodwork follow-up cadence. */
  readonly bloodworkInterval = computed<BloodworkInterval>(() => {
    const high =
      this.glucoseStatus() === 'high' ||
      this.cholesterolStatus() === 'high' ||
      this.triglycerideStatus() === 'high';
    if (high) return '3-months';
    const elevated =
      this.glucoseStatus() === 'elevated' ||
      this.cholesterolStatus() === 'elevated' ||
      this.triglycerideStatus() === 'elevated' ||
      this.hasGlucoseCondition();
    if (elevated) return '6-months';
    return 'annually';
  });

  /** The date the next bloodwork is due, based on the last test + severity cadence. */
  readonly nextBloodworkDate = computed<string | null>(() => {
    const last = this.bloodworkDate();
    if (!last) return null;
    const due = new Date(last);
    due.setDate(due.getDate() + BLOODWORK_INTERVAL_DAYS[this.bloodworkInterval()]);
    return due.toISOString().slice(0, 10);
  });

  /** Whether bloodwork is overdue (or no test has ever been logged). */
  readonly bloodworkDue = computed<boolean>(() => {
    const next = this.nextBloodworkDate();
    if (!next) return true;
    return next <= todayISO();
  });

  /** Next predicted period info if tracking enabled */
  readonly cycleInfo = computed(() => {
    const h = this.health();
    if (!h.tracksCycle || !h.lastPeriodStart) return null;
    const last = new Date(h.lastPeriodStart);
    const next = new Date(last);
    next.setDate(last.getDate() + h.cycleLengthDays);
    const today = new Date(todayISO());
    const msDay = 86400000;
    const dayOfCycle = Math.floor((today.getTime() - last.getTime()) / msDay) % h.cycleLengthDays;
    const daysUntilNext = Math.ceil((next.getTime() - today.getTime()) / msDay);
    const onPeriod = dayOfCycle >= 0 && dayOfCycle < h.periodLengthDays;
    const phase = this.cyclePhase(dayOfCycle, h.cycleLengthDays, h.periodLengthDays);
    return { nextDate: next.toISOString().slice(0, 10), daysUntilNext, dayOfCycle: dayOfCycle + 1, onPeriod, phase };
  });

  constructor(private nutrition: NutritionService) {
    // Persist on change
    effect(() => this.persist(KEYS.profile, this.profile()));
    effect(() => this.persist(KEYS.health, this.health()));
    effect(() => this.persist(KEYS.workouts, this.workouts()));
    effect(() => this.persist(KEYS.water, this.water()));
    effect(() => this.persist(KEYS.steps, this.steps()));
    effect(() => this.persist(KEYS.intake, this.intake()));
    effect(() => this.persist(KEYS.recipes, this.customRecipes()));
    effect(() => this.persist(KEYS.accounts, this.accounts()));
    effect(() => this.persist(KEYS.session, this.currentEmail()));
    effect(() => this.persist(KEYS.glucose, this.glucose()));
    effect(() => this.persist(KEYS.waterReminder, this.waterReminder()));
    effect(() => this.persist(KEYS.lipids, this.lipids()));
    effect(() => this.persist(KEYS.bloodwork, this.bloodworkDate()));
    effect(() => this.persist(KEYS.sugar, this.sugar()));
    effect(() => this.persist(KEYS.supplements, this.supplements()));
  }

  /** Classifies a glucose value (mg/dL) against the user's range. */
  classifyGlucose(mgdl: number): GlucoseLevel {
    const r = this.glucoseRange();
    if (mgdl < r.min) return 'low';
    if (mgdl <= r.okMax) return 'ok';
    if (mgdl <= r.elevatedMax) return 'elevated';
    return 'high';
  }

  /** Classifies a lipid value (mg/dL) against a given range. */
  classifyLipid(mgdl: number, range: LipidRange): LipidLevel {
    if (mgdl <= range.okMax) return 'ok';
    if (mgdl <= range.elevatedMax) return 'elevated';
    return 'high';
  }

  private cyclePhase(day: number, cycleLen: number, periodLen: number): string {
    if (day < periodLen) return 'Menstrual';
    if (day < Math.floor(cycleLen / 2) - 1) return 'Follicular';
    if (day <= Math.floor(cycleLen / 2) + 1) return 'Ovulation';
    return 'Luteal';
  }

  private persist(key: string, value: unknown): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* storage full / unavailable */
    }
  }

  // ---- Mutations ----
  setProfile(p: Profile): void {
    this.profile.set(p);
  }

  setHealth(h: HealthData): void {
    this.health.set(h);
  }

  addWorkout(w: WorkoutEntry): void {
    this.workouts.update((list) => [w, ...list]);
  }

  removeWorkout(id: string): void {
    this.workouts.update((list) => list.filter((w) => w.id !== id));
  }

  setWaterGlasses(glasses: number): void {
    const date = todayISO();
    const clamped = Math.max(0, glasses);
    this.water.update((list) => {
      const existing = list.find((w) => w.date === date);
      if (existing) {
        return list.map((w) => (w.date === date ? { ...w, glasses: clamped } : w));
      }
      return [...list, { date, glasses: clamped }];
    });
  }

  setWaterReminder(reminder: WaterReminder): void {
    this.waterReminder.set({ ...reminder, interval: Math.max(1, Math.round(reminder.interval)) });
  }

  setSteps(steps: number): void {
    const date = todayISO();
    const clamped = Math.max(0, Math.round(steps));
    this.steps.update((list) => {
      const existing = list.find((s) => s.date === date);
      if (existing) {
        return list.map((s) => (s.date === date ? { ...s, steps: clamped } : s));
      }
      return [...list, { date, steps: clamped }];
    });
  }

  addIntake(label: string, calories: number): void {
    const cals = Math.max(0, Math.round(calories));
    if (cals <= 0) return;
    const entry: IntakeEntry = {
      id: crypto.randomUUID(),
      date: todayISO(),
      label: label.trim() || 'Food',
      calories: cals,
    };
    this.intake.update((list) => [entry, ...list]);
  }

  removeIntake(id: string): void {
    this.intake.update((list) => list.filter((i) => i.id !== id));
  }

  /** Sets today's total sugar intake (grams). */
  setSugar(grams: number): void {
    const date = todayISO();
    const clamped = Math.max(0, Math.round(grams));
    this.sugar.update((list) => {
      const existing = list.find((s) => s.date === date);
      if (existing) {
        return list.map((s) => (s.date === date ? { ...s, grams: clamped } : s));
      }
      return [...list, { date, grams: clamped }];
    });
  }

  /** Adds grams to today's sugar intake. */
  addSugar(grams: number): void {
    const add = Math.round(grams);
    if (!Number.isFinite(add) || add === 0) return;
    this.setSugar(this.todaySugar() + add);
  }

  /** Logs a supplement dose for today. */
  addSupplement(type: SupplementType, name: string, dose: string): void {
    const label = name.trim();
    if (!label) return;
    const now = new Date();
    const entry: SupplementEntry = {
      id: crypto.randomUUID(),
      date: todayISO(),
      time: now.toTimeString().slice(0, 5),
      type,
      name: label,
      dose: dose.trim(),
    };
    this.supplements.update((list) => [entry, ...list]);
  }

  removeSupplement(id: string): void {
    this.supplements.update((list) => list.filter((s) => s.id !== id));
  }

  addCustomRecipe(r: Recipe): void {
    this.customRecipes.update((list) => [r, ...list]);
  }

  removeCustomRecipe(id: string): void {
    this.customRecipes.update((list) => list.filter((r) => r.id !== id));
  }

  addGlucose(mgdl: number, context: GlucoseContext): void {
    const value = Math.round(mgdl);
    if (!Number.isFinite(value) || value <= 0) return;
    const now = new Date();
    const entry: GlucoseEntry = {
      id: crypto.randomUUID(),
      date: todayISO(),
      time: now.toTimeString().slice(0, 5),
      mgdl: value,
      context,
    };
    this.glucose.update((list) => [entry, ...list]);
  }

  removeGlucose(id: string): void {
    this.glucose.update((list) => list.filter((g) => g.id !== id));
  }

  addLipid(totalCholesterol: number, triglycerides: number): void {
    const chol = Math.round(totalCholesterol);
    const trig = Math.round(triglycerides);
    if (!Number.isFinite(chol) || !Number.isFinite(trig) || chol <= 0 || trig <= 0) return;
    const now = new Date();
    const entry: LipidEntry = {
      id: crypto.randomUUID(),
      date: todayISO(),
      time: now.toTimeString().slice(0, 5),
      totalCholesterol: chol,
      triglycerides: trig,
    };
    this.lipids.update((list) => [entry, ...list]);
  }

  removeLipid(id: string): void {
    this.lipids.update((list) => list.filter((l) => l.id !== id));
  }

  /** Records the date of the user's most recent bloodwork. */
  setBloodworkDate(date: string | null): void {
    this.bloodworkDate.set(date && date.trim() ? date : null);
  }

  // ---- Auth mutations ----

  /** Creates a new account and signs the user in. Returns an error message if the email is taken. */
  async signUp(input: {
    name: string;
    firstname: string;
    email: string;
    password: string;
  }): Promise<{ ok: boolean; error?: string }> {
    const email = input.email.trim().toLowerCase();
    if (this.accounts().some((a) => a.email === email)) {
      return { ok: false, error: 'An account with this email already exists.' };
    }
    const passwordHash = await hashPassword(input.password);
    const account: Account = {
      name: input.name.trim(),
      firstname: input.firstname.trim(),
      email,
      passwordHash,
    };
    this.accounts.update((list) => [...list, account]);
    this.currentEmail.set(email);
    return { ok: true };
  }

  /** Verifies credentials and signs the user in. The username is the account email. */
  async login(username: string, password: string): Promise<{ ok: boolean; error?: string }> {
    const email = username.trim().toLowerCase();
    const account = this.accounts().find((a) => a.email === email);
    if (!account) {
      return { ok: false, error: 'No account found for that username.' };
    }
    const passwordHash = await hashPassword(password);
    if (account.passwordHash !== passwordHash) {
      return { ok: false, error: 'Incorrect password.' };
    }
    this.currentEmail.set(email);
    return { ok: true };
  }

  logout(): void {
    this.currentEmail.set(null);
  }
}
