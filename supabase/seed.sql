-- OPTIONAL DEMO DATA. These are invented prototype examples, not traveler submissions.
-- Apply manually only to a demo Supabase project after the migration. Stable IDs make re-running safe.
insert into public.food_experience_reviews
  (id, food_id, culture, reminded_of, cultural_description, familiarity_score, liking_score, matmi_accuracy_score, is_demo)
values
  ('10000000-0000-4000-8000-000000000001', 'langos', 'korean', 'It reminds me of a savory hotteok.', 'The crispy edge and soft middle feel familiar, but the sour cream makes it distinct.', 7, 8, 8, true),
  ('10000000-0000-4000-8000-000000000002', 'langos', 'korean', 'Like warm fried bread from a street stall.', 'The cheese and garlic make it richer than the Korean snacks I know.', 6, 8, 7, true),
  ('10000000-0000-4000-8000-000000000003', 'langos', 'korean', 'The chewy center feels like a fresh pancake.', 'I would describe it as a generous, savory fried flatbread.', 6, 7, 8, true),
  ('10000000-0000-4000-8000-000000000004', 'langos', 'korean', 'It brings hotteok to mind, without the sweetness.', 'The creamy topping was new to me and balanced the crisp dough.', 7, 9, 9, true),
  ('10000000-0000-4000-8000-000000000005', 'langos', 'korean', 'Like a crisp, open-faced fried bun.', 'I would tell a friend to expect a filling, cheesy street snack.', 5, 8, 7, true)
on conflict (id) do nothing;
