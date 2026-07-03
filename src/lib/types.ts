export type Bean = {
  id: string;
  name: string;
  roaster: string | null;
  origin: string | null;
  process: string | null;
  roastLevel: string | null;
  purchaseDate: string | null;
  price: number | null;
  totalGrams: number;
  remainingGrams: number;
  tastingNotes: string | null;
  personalNotes: string | null;
  imageUrl: string | null;
  altitude: string | null;
  variety: string | null;
  producer: string | null;
  roastDate: string | null;
  createdAt: string;
  updatedAt: string;
};

export type Brew = {
  id: string;
  beanId: string;
  brewedAt: string;
  method: string;
  dose: number;
  water: number;
  grinder: string | null;
  grindSize: string | null;
  grindAdjustment: number | null;
  pours: number | null;
  waterTemp: number | null;
  brewTimeSec: number | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type BeanWithBrews = Bean & {
  brews: (Brew & { tasting: Tasting | null })[];
};

export type Tasting = {
  id: string;
  brewId: string;
  bitterness: number;
  acidity: number;
  sweetness: number;
  body: number;
  aroma: number;
  aftertaste: number;
  enjoyment: number;
  flavorNotes: string | null;
  comments: string | null;
  createdAt: string;
  updatedAt: string;
};
