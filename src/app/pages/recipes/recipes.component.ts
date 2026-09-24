import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  FoodPreference,
  HealthFocus,
  Recipe,
  RecipeCategory,
  RecipeIngredient,
} from '../../models/models';
import { StoreService } from '../../services/store.service';

@Component({
  selector: 'app-recipes',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './recipes.component.html',
  styleUrl: './recipes.component.scss',
})
export class RecipesComponent {
  private store = inject(StoreService);

  allRecipes = this.store.allRecipes;
  profile = this.store.profile;
  metabolicWarnings = this.store.metabolicWarnings;
  recommendedHealthFocus = this.store.recommendedHealthFocus;
  activeFilter = signal<RecipeCategory | 'all'>('all');
  activeHealth = signal<HealthFocus | 'all'>('all');
  // Default the recipe book to the user's food preference
  activeDiet = signal<FoodPreference | 'all'>(
    this.store.profile()?.foodPreference ?? 'all',
  );
  search = signal('');
  expandedId = signal<string | null>(null);
  showCreator = signal(false);

  dietLabels: Record<FoodPreference, { label: string; emoji: string }> = {
    omnivore: { label: 'Omnivore', emoji: '🍽️' },
    vegetarian: { label: 'Vegetarian', emoji: '🥦' },
    vegan: { label: 'Vegan', emoji: '🌱' },
    pescatarian: { label: 'Pescatarian', emoji: '🐟' },
    keto: { label: 'Keto', emoji: '🥑' },
    carnivore: { label: 'Carnivore', emoji: '🥩' },
    paleo: { label: 'Paleo', emoji: '🍖' },
    mediterranean: { label: 'Mediterranean', emoji: '🫒' },
  };

  dietFilters: { value: FoodPreference | 'all'; label: string; emoji: string }[] = [
    { value: 'all', label: 'All diets', emoji: '🍴' },
    { value: 'omnivore', label: 'Omnivore', emoji: '🍽️' },
    { value: 'vegetarian', label: 'Vegetarian', emoji: '🥦' },
    { value: 'vegan', label: 'Vegan', emoji: '🌱' },
    { value: 'pescatarian', label: 'Pescatarian', emoji: '🐟' },
    { value: 'keto', label: 'Keto', emoji: '🥑' },
    { value: 'carnivore', label: 'Carnivore', emoji: '🥩' },
    { value: 'paleo', label: 'Paleo', emoji: '🍖' },
    { value: 'mediterranean', label: 'Mediterranean', emoji: '🫒' },
  ];

  dietLabel(value: FoodPreference): string {
    return this.dietLabels[value]?.label ?? value;
  }

  dietEmoji(value: FoodPreference): string {
    return this.dietLabels[value]?.emoji ?? '🍴';
  }

  categories: { value: RecipeCategory | 'all'; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'main', label: 'Mains' },
    { value: 'soup', label: 'Soups' },
    { value: 'salad', label: 'Salads' },
    { value: 'vegetables', label: 'Vegetables' },
    { value: 'fruit', label: 'Fruit' },
    { value: 'pastry', label: 'Pastries' },
    { value: 'breakfast', label: 'Breakfast' },
    { value: 'snack', label: 'Snacks' },
    { value: 'dessert', label: 'Dessert' },
  ];

  healthFilters: { value: HealthFocus | 'all'; label: string; emoji: string }[] = [
    { value: 'all', label: 'Any', emoji: '✨' },
    { value: 'anti-bloating', label: 'Anti-Bloating', emoji: '🎈' },
    { value: 'diabetes-friendly', label: 'Diabetes', emoji: '🩸' },
    { value: 'thyroid-friendly', label: 'Thyroid', emoji: '🦋' },
    { value: 'low-histamine', label: 'Low Histamine', emoji: '🌿' },
    { value: 'gut-friendly', label: 'Gut Health', emoji: '🦠' },
    { value: 'anti-inflammatory', label: 'Anti-Inflammatory', emoji: '🔥' },
    { value: 'iron-rich', label: 'Iron Rich', emoji: '⚙️' },
    { value: 'low-fodmap', label: 'Low FODMAP', emoji: '🥗' },
  ];

  healthLabel(value: HealthFocus): string {
    return this.healthFilters.find((h) => h.value === value)?.label ?? value;
  }

  healthEmoji(value: HealthFocus): string {
    return this.healthFilters.find((h) => h.value === value)?.emoji ?? '💚';
  }

  creatorCategories: RecipeCategory[] = [
    'main', 'soup', 'salad', 'vegetables', 'fruit',
    'pastry', 'breakfast', 'snack', 'dessert',
  ];

  creatorHealthFocus: HealthFocus[] = [
    'anti-bloating', 'diabetes-friendly', 'thyroid-friendly', 'low-histamine',
    'gut-friendly', 'anti-inflammatory', 'iron-rich', 'low-fodmap',
  ];

  filtered = computed(() => {
    const f = this.activeFilter();
    const h = this.activeHealth();
    const d = this.activeDiet();
    const q = this.search().toLowerCase().trim();
    return this.allRecipes().filter((r) => {
      const matchCat = f === 'all' || r.category === f;
      const matchHealth = h === 'all' || r.healthFocus.includes(h);
      // Custom recipes with no diet tags always show; otherwise match the diet
      const matchDiet = d === 'all' || r.diets.length === 0 || r.diets.includes(d);
      const matchQ =
        !q ||
        r.name.toLowerCase().includes(q) ||
        r.tags.some((t) => t.includes(q)) ||
        r.cuisine.toLowerCase().includes(q);
      return matchCat && matchHealth && matchDiet && matchQ;
    });
  });

  totals(r: Recipe) {
    const sum = r.ingredients.reduce(
      (acc, i) => ({
        calories: acc.calories + i.calories,
        proteinG: acc.proteinG + i.proteinG,
        carbsG: acc.carbsG + i.carbsG,
        fatG: acc.fatG + i.fatG,
        fiberG: acc.fiberG + i.fiberG,
      }),
      { calories: 0, proteinG: 0, carbsG: 0, fatG: 0, fiberG: 0 },
    );
    const s = r.servings || 1;
    return {
      calories: Math.round(sum.calories / s),
      proteinG: Math.round(sum.proteinG / s),
      carbsG: Math.round(sum.carbsG / s),
      fatG: Math.round(sum.fatG / s),
      fiberG: Math.round(sum.fiberG / s),
    };
  }

  toggle(id: string): void {
    this.expandedId.set(this.expandedId() === id ? null : id);
  }

  /** Filters the recipe book to the first health focus recommended from the user's markers. */
  applyRecommended(): void {
    const focus = this.recommendedHealthFocus();
    if (focus.length > 0) {
      this.activeHealth.set(focus[0]);
      this.activeDiet.set('all');
    }
  }

  delete(id: string): void {
    this.store.removeCustomRecipe(id);
  }

  // ---------- Custom recipe creator ----------
  draft: Recipe = this.emptyDraft();

  private emptyDraft(): Recipe {
    return {
      id: '',
      name: '',
      category: 'main',
      cuisine: 'My Kitchen',
      servings: 1,
      description: '',
      ingredients: [this.emptyIngredient()],
      steps: [''],
      custom: true,
      tags: [],
      healthFocus: [],
      diets: [],
    };
  }

  private emptyIngredient(): RecipeIngredient {
    return { name: '', amount: '', calories: 0, proteinG: 0, carbsG: 0, fatG: 0, fiberG: 0 };
  }

  creatorDiets: FoodPreference[] = [
    'omnivore', 'vegetarian', 'vegan', 'pescatarian',
    'keto', 'carnivore', 'paleo', 'mediterranean',
  ];

  toggleDraftDiet(value: FoodPreference): void {
    if (this.draft.diets.includes(value)) {
      this.draft.diets = this.draft.diets.filter((x) => x !== value);
    } else {
      this.draft.diets = [...this.draft.diets, value];
    }
  }

  toggleDraftHealth(value: HealthFocus): void {
    if (this.draft.healthFocus.includes(value)) {
      this.draft.healthFocus = this.draft.healthFocus.filter((x) => x !== value);
    } else {
      this.draft.healthFocus = [...this.draft.healthFocus, value];
    }
  }

  addIngredient(): void {
    this.draft.ingredients.push(this.emptyIngredient());
  }

  removeIngredient(i: number): void {
    this.draft.ingredients.splice(i, 1);
  }

  addStep(): void {
    this.draft.steps.push('');
  }

  removeStep(i: number): void {
    this.draft.steps.splice(i, 1);
  }

  trackByIndex(i: number): number {
    return i;
  }

  draftTotals = computed(() => this.totals(this.draft));

  canSave(): boolean {
    return this.draft.name.trim().length > 0 &&
      this.draft.ingredients.some((i) => i.name.trim().length > 0);
  }

  saveDraft(): void {
    if (!this.canSave()) return;
    const recipe: Recipe = {
      ...structuredClone(this.draft),
      id: crypto.randomUUID(),
      custom: true,
      ingredients: this.draft.ingredients.filter((i) => i.name.trim()),
      steps: this.draft.steps.filter((s) => s.trim()),
    };
    this.store.addCustomRecipe(recipe);
    this.draft = this.emptyDraft();
    this.showCreator.set(false);
    this.activeFilter.set('all');
  }

  cancelDraft(): void {
    this.draft = this.emptyDraft();
    this.showCreator.set(false);
  }
}
