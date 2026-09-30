export type DemoDish = {
  id: string; name: string; country: string; subtitle: string; score: number;
  description: string; tasteTags: string[]; textureTags: string[];
  ingredients: string[]; comparison: string; reasons: string[]; cautions: string[];
};
export const demoDishes: DemoDish[] = [
  {
    id: 'langos', name: 'Lángos', country: 'Hungary', subtitle: 'Hungarian fried dough', score: 92,
    description: 'Hungarian deep-fried flatbread commonly served with sour cream and cheese.',
    tasteTags: ['Savory', 'Rich'], textureTags: ['Crispy', 'Chewy'], ingredients: ['Flour', 'Yeast', 'Oil', 'Sour cream', 'Cheese'],
    comparison: 'Think of the chewy fried-dough feeling of hotteok, but savory instead of sweet.',
    reasons: ['You like fried food', 'You enjoy cheese', 'You prefer crispy textures'], cautions: ['Traditional recipes vary by restaurant.'],
  },
  {
    id: 'gulyas', name: 'Gulyás', country: 'Hungary', subtitle: 'Beef · paprika · rich', score: 87,
    description: 'A hearty Hungarian beef soup warmed with paprika.',
    tasteTags: ['Savory', 'Rich'], textureTags: ['Soft', 'Soupy'], ingredients: ['Beef', 'Paprika', 'Vegetables', 'Broth'],
    comparison: 'Imagine a hearty beef soup with the warmth of paprika rather than strong chili heat.',
    reasons: ['You like beef', 'You enjoy rich flavors'], cautions: [],
  },
  {
    id: 'hurka', name: 'Hurka', country: 'Hungary', subtitle: 'Sausage · may contain organ meat', score: 28,
    description: 'A traditional Hungarian sausage; some varieties contain organ meat.',
    tasteTags: ['Savory', 'Rich'], textureTags: ['Soft', 'Dense'], ingredients: ['Pork', 'Rice', 'Organ meat'],
    comparison: 'Its filled-sausage texture may remind a Korean traveler of sundae, though the seasoning differs.',
    reasons: [], cautions: ['This dish may contain organ meat, which you said you prefer to avoid.'],
  },
  {
    id: 'paprikash', name: 'Paprikás Csirke', country: 'Hungary', subtitle: 'Chicken · paprika · creamy', score: 81,
    description: 'Chicken simmered in a creamy paprika sauce.',
    tasteTags: ['Savory', 'Rich'], textureTags: ['Soft', 'Creamy'], ingredients: ['Chicken', 'Paprika', 'Onion', 'Sour cream'],
    comparison: 'Think of tender chicken in a gentle, creamy paprika sauce.',
    reasons: ['You enjoy savory food'], cautions: [],
  },
  {
    id: 'kurtos', name: 'Kürtőskalács', country: 'Hungary', subtitle: 'Sweet chimney cake', score: 78,
    description: 'A spiral pastry with a caramelized sugar crust and soft bread inside.',
    tasteTags: ['Sweet'], textureTags: ['Crispy', 'Soft'], ingredients: ['Flour', 'Yeast', 'Sugar', 'Butter'],
    comparison: 'Imagine sweet pull-apart bread with a crisp sugar shell.',
    reasons: ['You enjoy crispy textures'], cautions: [],
  },
];
export const getDemoDish = (id: string): DemoDish | undefined => demoDishes.find(dish => dish.id === id);
export const sampleVenue = { name: 'Central Market Hall', city: 'Budapest' };
export const sampleMenu = [
  { dishId: 'gulyas', label: 'Gulyás', price: '3 900 Ft' },
  { dishId: 'langos', label: 'Lángos', price: '2 800 Ft' },
  { dishId: 'hurka', label: 'Hurka', price: '3 500 Ft' },
  { dishId: 'paprikash', label: 'Paprikás csirke', price: '4 200 Ft' },
];
export const featuredResult = {
  dishId: 'langos', tags: ['Crispy', 'Cheesy', 'Savory'],
  familiarHint: 'Closest familiar direction: savory hotteok-like dough',
};
export const comparisonFacts = {
  langos: { character: 'Cheesy fried dough with a crisp edge.', familiarity: 'High', texture: 'Crispy · chewy', risk: 'Low' },
  gulyas: { character: 'Rich beef soup/stew with paprika.', familiarity: 'Medium-high', texture: 'Soft · soupy', risk: 'Low' },
};
export const mockProfile = {
  culture: 'Korean', avoidsOrganMeat: true,
  likes: ['Fried food', 'Cheese', 'Beef', 'Crispy', 'Spicy'],
  avoids: ['Organ meat', 'Strong fish smell'],
};
export type SavedScan = { place: string; date: string; dishId: string };
export const initialSavedScans: SavedScan[] = [
  { place: 'Central Market Hall', date: 'Today', dishId: 'langos' },
  { place: 'Budapest Bistro', date: 'Sep 28', dishId: 'gulyas' },
  { place: 'Street Market', date: 'Sep 27', dishId: 'kurtos' },
];
