-- ============================================================
-- Migration: Remove categories & rename Audio → Media Equipment
-- Run this in your Supabase Dashboard → SQL Editor
-- Date: 2026-11-10
-- ============================================================

-- 1. Delete subcategories that belong to the removed categories
--    (subcategories has ON DELETE CASCADE, but we also handle it explicitly)
DELETE FROM subcategories WHERE category_slug IN (
  'magnet-bars',
  'kitchen-appliances',
  'name-boards',
  'car-bike-holders'
);

-- 2. Delete the categories themselves
DELETE FROM categories WHERE slug IN (
  'magnet-bars',
  'kitchen-appliances',
  'name-boards',
  'car-bike-holders'
);

-- 3. Rename "Audio & Music" → "Media Equipment"
UPDATE categories
SET
  name  = 'Media Equipment',
  short = 'Media Equipment'
WHERE slug = 'audio';

-- 4. Ensure "Other" main category exists
INSERT INTO categories (slug, name, short, image, filter_key)
VALUES ('other', 'Other', 'Other', 'assets\imgs\ics-repair-components-v1.webp', 'Type')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  short = EXCLUDED.short,
  image = EXCLUDED.image,
  filter_key = EXCLUDED.filter_key;

-- 4. Ensure "Other" main category exists
INSERT INTO categories (slug, name, short, image, filter_key)
VALUES ('other', 'Other', 'Other', '/assets/imgs/other-equipment.png', 'Type')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  short = EXCLUDED.short,
  image = EXCLUDED.image,
  filter_key = EXCLUDED.filter_key;

-- Verify results
SELECT slug, name, short FROM categories ORDER BY slug;

