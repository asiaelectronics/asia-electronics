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

-- Verify results
SELECT slug, name, short FROM categories ORDER BY slug;

