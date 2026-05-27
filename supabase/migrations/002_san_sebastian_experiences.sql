-- San Sebastián / Basque Country experiences
-- Run this in your Supabase SQL editor to add the experiences.
-- Safe to re-run: any row whose title already exists is skipped.

insert into experiences (title, description, category, price_cents, emoji, allow_splitting, display_order)
select v.title, v.description, v.category, v.price_cents, v.emoji, v.allow_splitting, v.display_order
from (values
  ('Pintxos Crawl in the Old Town', 'Hop bar to bar through Parte Vieja, sampling the Basque Country''s legendary pintxos with a glass of txakoli in hand.', 'dining', 13000, '🍢', true, 13),
  ('Michelin-Starred Tasting Menu', 'San Sebastián has more Michelin stars per square metre than almost anywhere — treat us to one unforgettable tasting menu.', 'dining', 20000, '⭐', true, 14),
  ('Basque Cider House Feast', 'A joyful sagardotegi night: cider poured straight from the barrel between courses of txuleta steak and salt cod.', 'dining', 12000, '🍏', true, 15),
  ('Txakoli & Vineyard Tasting', 'Tour a hillside vineyard above the coast and taste the crisp, slightly fizzy white that defines the Basque table.', 'dining', 11000, '🍷', true, 16),
  ('Basque Cooking Class', 'Learn to make pintxos and classic Basque dishes with a local chef — then feast on what we cook.', 'dining', 15000, '🍳', true, 17),
  ('Surf Lesson at Zurriola Beach', 'Catch our first waves together on the city''s lively surf beach, with a patient instructor and plenty of laughs.', 'activities', 12000, '🏄', true, 18),
  ('Monte Igueldo Funicular & Views', 'Ride the century-old funicular to the top for the postcard view over La Concha bay.', 'activities', 10000, '🎡', true, 19),
  ('La Concha Bay Kayak Tour', 'Paddle the calm golden waters out to Santa Clara Island on a guided kayak tour.', 'activities', 14000, '🛶', true, 20),
  ('Rioja Wine Country Day Trip', 'A day among the vineyards of Rioja Alavesa — cellar tours, tastings, and a long Basque lunch.', 'activities', 19000, '🍇', true, 21),
  ('Guggenheim Bilbao Day Trip', 'Travel to Bilbao to stand beneath Gehry''s titanium curves and explore the iconic museum.', 'activities', 17000, '🏛️', true, 22),
  ('Thalasso Spa Day at La Perla', 'Unwind in the seawater pools of La Perla, perched right on La Concha beach.', 'extras', 16000, '💆', true, 23),
  ('A Night Overlooking La Concha', 'Help us toward a night at a grand seafront hotel with the bay glittering outside our window.', 'hotels', 20000, '🏨', true, 24),
  ('Bilbao Airport Transfer', 'A smooth private transfer from Bilbao airport to San Sebastián, so the trip starts the moment we land.', 'transport', 10000, '🚗', false, 25),
  ('Gilda & Vermouth Tasting', 'Toast to the Gilda — the briny skewer that started it all — with a round of house vermouth.', 'dining', 10000, '🍸', true, 26),
  ('French Basque Coast Day Trip', 'Cross the border to Biarritz and St-Jean-de-Luz for a day on the elegant French Basque coast.', 'activities', 18000, '🌊', true, 27)
) as v(title, description, category, price_cents, emoji, allow_splitting, display_order)
where v.title not in (select title from experiences);
