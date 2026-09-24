import { Recipe } from '../models/models';
import recipesJson from './recipes.json';

// Recipe data lives in recipes.json. Per-serving nutrition values are approximate.
export const SEED_RECIPES: Recipe[] = recipesJson as Recipe[];
