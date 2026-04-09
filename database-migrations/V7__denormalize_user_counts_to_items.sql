ALTER TABLE items
  ADD COLUMN user_count INT DEFAULT 0;

WITH item_user_counts AS (
  SELECT item_id, COUNT(*) AS user_count
  FROM users_to_items
  GROUP BY item_id
)
UPDATE items
  SET user_count = item_user_counts.user_count
  FROM item_user_counts
  WHERE items.id = item_user_counts.item_id;