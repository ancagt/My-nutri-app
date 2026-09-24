import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  GlucoseContext,
  HealthCondition,
  HealthData,
  LipidLevel,
  MentalHealthCondition,
  ReproductiveStatus,
} from '../../models/models';
import { StoreService } from '../../services/store.service';
import { BLOODWORK_INTERVAL_LABELS } from '../../constants';

@Component({
  selector: 'app-health',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './health.component.html',
  styleUrl: './health.component.scss',
})
export class HealthComponent {
  private store = inject(StoreService);

  cycleInfo = this.store.cycleInfo;
  saved = signal(false);

  model: HealthData = structuredClone(this.store.health());

  // Subscription + glucose tracking
  isSubscribed = this.store.isSubscribed;
  glucose = this.store.glucose;
  glucoseRange = this.store.glucoseRange;
  latestGlucose = this.store.latestGlucose;
  glucoseStatus = this.store.glucoseStatus;
  hasGlucoseCondition = this.store.hasGlucoseCondition;

  glucoseInput = signal<number>(100);
  glucoseContext = signal<GlucoseContext>('fasting');

  // Blood lipids (cholesterol + triglycerides)
  lipids = this.store.lipids;
  cholesterolRange = this.store.cholesterolRange;
  triglycerideRange = this.store.triglycerideRange;
  latestLipid = this.store.latestLipid;
  cholesterolStatus = this.store.cholesterolStatus;
  triglycerideStatus = this.store.triglycerideStatus;
  metabolicWarnings = this.store.metabolicWarnings;

  cholesterolInput = signal<number>(180);
  triglyceridesInput = signal<number>(120);

  // Bloodwork follow-up
  bloodworkDate = this.store.bloodworkDate;
  nextBloodworkDate = this.store.nextBloodworkDate;
  bloodworkDue = this.store.bloodworkDue;
  bloodworkInterval = this.store.bloodworkInterval;
  bloodworkDateInput = signal<string>(this.store.bloodworkDate() ?? '');

  glucoseContexts: { value: GlucoseContext; label: string }[] = [
    { value: 'fasting', label: 'Fasting' },
    { value: 'post-meal', label: 'Post-meal' },
    { value: 'random', label: 'Random' },
  ];

  /** Position (0-100%) of a glucose value on the gauge scale. */
  gaugePct(mgdl: number): number {
    const max = this.glucoseRange().scaleMax;
    return Math.max(0, Math.min(100, Math.round((mgdl / max) * 100)));
  }

  /** Width (0-100%) of the healthy 'ok' band on the gauge. */
  okBandPct(): number {
    const r = this.glucoseRange();
    const start = (r.min / r.scaleMax) * 100;
    const end = (r.okMax / r.scaleMax) * 100;
    return Math.max(0, end - start);
  }

  okBandStartPct(): number {
    const r = this.glucoseRange();
    return (r.min / r.scaleMax) * 100;
  }

  statusLabel(): string {
    switch (this.glucoseStatus()) {
      case 'low':
        return 'Low';
      case 'ok':
        return 'In range';
      case 'elevated':
        return 'Elevated';
      case 'high':
        return 'Too high';
      default:
        return '';
    }
  }

  addGlucose(): void {
    this.store.addGlucose(this.glucoseInput(), this.glucoseContext());
  }

  removeGlucose(id: string): void {
    this.store.removeGlucose(id);
  }

  levelOf(mgdl: number) {
    return this.store.classifyGlucose(mgdl);
  }

  // ---- Lipids ----
  /** Position (0-100%) of a lipid value on its gauge scale. */
  lipidPct(mgdl: number, scaleMax: number): number {
    return Math.max(0, Math.min(100, Math.round((mgdl / scaleMax) * 100)));
  }

  lipidLabel(level: LipidLevel | null): string {
    switch (level) {
      case 'ok':
        return 'In range';
      case 'elevated':
        return 'Borderline';
      case 'high':
        return 'Too high';
      default:
        return '';
    }
  }

  cholesterolLevelOf(mgdl: number) {
    return this.store.classifyLipid(mgdl, this.cholesterolRange);
  }

  triglycerideLevelOf(mgdl: number) {
    return this.store.classifyLipid(mgdl, this.triglycerideRange);
  }

  addLipid(): void {
    this.store.addLipid(this.cholesterolInput(), this.triglyceridesInput());
  }

  removeLipid(id: string): void {
    this.store.removeLipid(id);
  }

  // ---- Bloodwork ----
  saveBloodworkDate(): void {
    this.store.setBloodworkDate(this.bloodworkDateInput());
  }

  get bloodworkIntervalLabel(): string {
    return BLOODWORK_INTERVAL_LABELS[this.bloodworkInterval()];
  }

  /** Cycle, PCOS, endometriosis and full reproductive options only apply to female / non-binary users. */
  get isMale(): boolean {
    return this.store.profile()?.gender === 'male';
  }

  /** Health conditions that only apply to female / non-binary users. */
  private femaleOnlyConditions: HealthCondition[] = ['pcos', 'endometriosis'];

  conditionsList: { value: HealthCondition; label: string }[] = [
    { value: 'diabetes-type-1', label: 'Diabetes Type 1' },
    { value: 'diabetes-type-2', label: 'Diabetes Type 2' },
    { value: 'insulin-resistance', label: 'Insulin Resistance' },
    { value: 'pcos', label: 'PCOS' },
    { value: 'endometriosis', label: 'Endometriosis' },
    { value: 'hypothyroidism', label: 'Hypothyroidism' },
    { value: 'hyperthyroidism', label: 'Hyperthyroidism' },
    { value: 'hypertension', label: 'Hypertension' },
    { value: 'high-cholesterol', label: 'High Cholesterol' },
    { value: 'celiac', label: 'Celiac Disease' },
    { value: 'lactose-intolerance', label: 'Lactose Intolerance' },
    { value: 'ibs', label: 'IBS' },
    { value: 'anemia', label: 'Anemia' },
  ];

  /** Conditions visible for the current user (hides PCOS/endometriosis for men). */
  get visibleConditions(): { value: HealthCondition; label: string }[] {
    if (this.isMale) {
      return this.conditionsList.filter((c) => !this.femaleOnlyConditions.includes(c.value));
    }
    return this.conditionsList;
  }

  mentalHealthList: { value: MentalHealthCondition; label: string; emoji: string }[] = [
    { value: 'depression', label: 'Depression', emoji: '🌧️' },
    { value: 'anxiety', label: 'Anxiety', emoji: '😰' },
    { value: 'grief', label: 'Grief', emoji: '🕊️' },
    { value: 'stress-burnout', label: 'Stress / Burnout', emoji: '🔥' },
    { value: 'adhd', label: 'ADHD', emoji: '🧩' },
    { value: 'eating-disorder', label: 'Eating Disorder', emoji: '🍽️' },
    { value: 'insomnia', label: 'Insomnia', emoji: '🌙' },
    { value: 'bipolar', label: 'Bipolar', emoji: '🔄' },
  ];

  reproductiveStatusList: { value: ReproductiveStatus; label: string; emoji: string }[] = [
    { value: 'not-pregnant', label: 'Not pregnant', emoji: '➖' },
    { value: 'trying-to-conceive', label: 'Trying to conceive', emoji: '🌷' },
    { value: 'pregnant', label: 'Pregnant', emoji: '🤰' },
    { value: 'breastfeeding', label: 'Breastfeeding', emoji: '🍼' },
    { value: 'miscarried', label: 'Miscarried', emoji: '🤍' },
  ];

  /** Reproductive options visible for the current user (men only see "trying to conceive"). */
  get visibleReproductiveStatus(): { value: ReproductiveStatus; label: string; emoji: string }[] {
    if (this.isMale) {
      return this.reproductiveStatusList.filter((r) => r.value === 'trying-to-conceive');
    }
    return this.reproductiveStatusList;
  }

  /** Exercise ideas + debloating advice tailored to each cycle phase. */
  private phaseGuides: Record<
    string,
    { emoji: string; energy: string; exercises: string[]; debloat: string[] }
  > = {
    Menstrual: {
      emoji: '🩸',
      energy: 'Energy is lowest — rest and move gently.',
      exercises: ['Gentle yoga', 'Walking', 'Light stretching', 'Pilates'],
      debloat: [
        'Sip warm water with ginger or peppermint tea',
        'Choose iron-rich foods (spinach, lentils, red meat)',
        'Cut back on salt and processed snacks to ease water retention',
      ],
    },
    Follicular: {
      emoji: '🌱',
      energy: 'Energy is rising — a great time to build and try new things.',
      exercises: ['Strength / weight training', 'HIIT', 'Jogging', 'Dance', 'Calisthenics'],
      debloat: [
        'Bloating is usually low here — keep hydration steady',
        'Load up on fresh veggies and fermented foods for gut health',
      ],
    },
    Ovulation: {
      emoji: '🥚',
      energy: 'Peak energy and strength — push your hardest sessions now.',
      exercises: ['Heavy strength training', 'HIIT / sprints', 'Spin or cycling', 'Group fitness'],
      debloat: [
        'Mild bloating can appear mid-cycle — drink plenty of water',
        'Favour potassium-rich foods (banana, avocado, cucumber) to balance sodium',
        'Add anti-inflammatory foods like berries, leafy greens and oily fish',
        'Limit carbonated drinks and chewing gum to swallow less air',
      ],
    },
    Luteal: {
      emoji: '🌙',
      energy: 'Energy tapers and PMS may set in — train smart, not maximal.',
      exercises: ['Moderate strength training', 'Pilates', 'Yoga', 'Brisk walking', 'Swimming'],
      debloat: [
        'Reduce salt, refined sugar and alcohol to fight PMS water retention',
        'Magnesium-rich foods (dark chocolate, nuts, leafy greens) ease cramps & bloating',
        'Peppermint or fennel tea calms a bloated, sluggish gut',
        'Smaller, more frequent meals are easier to digest',
        'Stay hydrated and add gentle daily movement to keep things moving',
      ],
    },
  };

  get phaseGuide() {
    const phase = this.cycleInfo()?.phase;
    return phase ? this.phaseGuides[phase] ?? null : null;
  }

  hasCondition(c: HealthCondition): boolean {
    return this.model.conditions.includes(c);
  }

  toggleCondition(c: HealthCondition): void {
    if (this.hasCondition(c)) {
      this.model.conditions = this.model.conditions.filter((x) => x !== c);
    } else {
      this.model.conditions = [...this.model.conditions, c];
    }
  }

  hasMental(c: MentalHealthCondition): boolean {
    return this.model.mentalHealth.includes(c);
  }

  toggleMental(c: MentalHealthCondition): void {
    if (this.hasMental(c)) {
      this.model.mentalHealth = this.model.mentalHealth.filter((x) => x !== c);
    } else {
      this.model.mentalHealth = [...this.model.mentalHealth, c];
    }
  }

  save(): void {
    this.store.setHealth(structuredClone(this.model));
    this.saved.set(true);
    setTimeout(() => this.saved.set(false), 1500);
  }
}
