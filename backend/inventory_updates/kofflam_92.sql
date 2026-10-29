-- Corrected Inventory Update for .92mm Kofflam
SET FOREIGN_KEY_CHECKS = 0;

-- 1. Ensure master item exists
INSERT IGNORE INTO items (id, name, hsn_code, base_pakka_selling_rate, tax_bracket_percent) 
VALUES ('af209679-43e0-49d3-a931-6d5e3c95eda9', '.92mm Kofflam', '4410', 0.00, 18.00);

SET @item_id = (SELECT id FROM items WHERE name = '.92mm Kofflam' LIMIT 1);

-- 2. Sync Shades (Add if new, Update if exists)
INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '95224e63-5e8c-4a58-9c2f-bfd8e22aaa8d', @item_id, 'KOFFLAM', '.92MM 156 SF', 67 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '.92MM 156 SF');
UPDATE item_shades SET available_qty = 67 WHERE item_id = @item_id AND shade_id_label = '.92MM 156 SF';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '5287ec86-3711-48ee-a4c9-aab2589ad08b', @item_id, 'KOFFLAM', '.92MM 157 SF', 57 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '.92MM 157 SF');
UPDATE item_shades SET available_qty = 57 WHERE item_id = @item_id AND shade_id_label = '.92MM 157 SF';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '978b83b3-8d60-4fb5-a5b7-55461ff149dd', @item_id, 'KOFFLAM', '.92MM 160 SF', 74 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '.92MM 160 SF');
UPDATE item_shades SET available_qty = 74 WHERE item_id = @item_id AND shade_id_label = '.92MM 160 SF';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '436027ae-0ac9-49cd-afc7-933e00a57aa5', @item_id, 'KOFFLAM', '.92MM 161 SF', 107 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '.92MM 161 SF');
UPDATE item_shades SET available_qty = 107 WHERE item_id = @item_id AND shade_id_label = '.92MM 161 SF';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT 'f4d7c7bf-ea06-4eb7-95cb-42fef0fb20b3', @item_id, 'KOFFLAM', '.92MM 163 MT', 4 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '.92MM 163 MT');
UPDATE item_shades SET available_qty = 4 WHERE item_id = @item_id AND shade_id_label = '.92MM 163 MT';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT 'c173d7de-7122-4791-b765-93ef81fe2f96', @item_id, 'KOFFLAM', '.92MM 164 MT', 12 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '.92MM 164 MT');
UPDATE item_shades SET available_qty = 12 WHERE item_id = @item_id AND shade_id_label = '.92MM 164 MT';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '3cac6f7b-5ae0-4241-a321-d3ec1cf4aa0d', @item_id, 'KOFFLAM', '.92MM 205 MT', 43 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '.92MM 205 MT');
UPDATE item_shades SET available_qty = 43 WHERE item_id = @item_id AND shade_id_label = '.92MM 205 MT';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT 'e5ed280e-7bcd-4cdb-9452-722f77e3da24', @item_id, 'KOFFLAM', '.92MM 255 MT', 17 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '.92MM 255 MT');
UPDATE item_shades SET available_qty = 17 WHERE item_id = @item_id AND shade_id_label = '.92MM 255 MT';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT 'c37fa60e-2800-4551-a386-62c78a0a2d89', @item_id, 'KOFFLAM', '.92MM 258 MT', 9 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '.92MM 258 MT');
UPDATE item_shades SET available_qty = 9 WHERE item_id = @item_id AND shade_id_label = '.92MM 258 MT';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '588ee278-82a6-4a5b-8cc8-849b82f4e13c', @item_id, 'KOFFLAM', '.92MM 271 MT', 47 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '.92MM 271 MT');
UPDATE item_shades SET available_qty = 47 WHERE item_id = @item_id AND shade_id_label = '.92MM 271 MT';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT 'e0b4ab00-830b-4de1-96f3-d458db8d2202', @item_id, 'KOFFLAM', '.92MM 274 MT', 19 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '.92MM 274 MT');
UPDATE item_shades SET available_qty = 19 WHERE item_id = @item_id AND shade_id_label = '.92MM 274 MT';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT 'b527bdd8-acfc-4e4c-a416-10f8847b8f05', @item_id, 'KOFFLAM', '.92MM 275 MT Walnut', 22 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '.92MM 275 MT Walnut');
UPDATE item_shades SET available_qty = 22 WHERE item_id = @item_id AND shade_id_label = '.92MM 275 MT Walnut';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '3c42ac0c-b13c-44d7-a74c-d9f5a06e98cc', @item_id, 'KOFFLAM', '.92MM 301 MT', 5 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '.92MM 301 MT');
UPDATE item_shades SET available_qty = 5 WHERE item_id = @item_id AND shade_id_label = '.92MM 301 MT';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '0bbcb7d0-ad96-4481-8be7-c16ca17a8719', @item_id, 'KOFFLAM', '.92MM 302 MT', 12 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '.92MM 302 MT');
UPDATE item_shades SET available_qty = 12 WHERE item_id = @item_id AND shade_id_label = '.92MM 302 MT';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT 'd8d5563b-e9ec-41cc-9ef7-6882eff58e6e', @item_id, 'KOFFLAM', '.92MM 401 SF', 9 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '.92MM 401 SF');
UPDATE item_shades SET available_qty = 9 WHERE item_id = @item_id AND shade_id_label = '.92MM 401 SF';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '976f53c5-624e-4f27-8af2-7ec1b736a56b', @item_id, 'KOFFLAM', '.92MM 402 MT', 51 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '.92MM 402 MT');
UPDATE item_shades SET available_qty = 51 WHERE item_id = @item_id AND shade_id_label = '.92MM 402 MT';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '5faa7c8d-2bfa-436b-9cba-61437de7edb3', @item_id, 'KOFFLAM', '.92MM 403 MT', 47 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '.92MM 403 MT');
UPDATE item_shades SET available_qty = 47 WHERE item_id = @item_id AND shade_id_label = '.92MM 403 MT';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '3502bfae-baf1-48d1-8b73-06041de42886', @item_id, 'KOFFLAM', '.92MM 404 MT', 19 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '.92MM 404 MT');
UPDATE item_shades SET available_qty = 19 WHERE item_id = @item_id AND shade_id_label = '.92MM 404 MT';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '0859f846-e3b5-4a71-9a42-69e9eb8a52c5', @item_id, 'KOFFLAM', '.92MM 405 MT', 4 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '.92MM 405 MT');
UPDATE item_shades SET available_qty = 4 WHERE item_id = @item_id AND shade_id_label = '.92MM 405 MT';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT 'e2125e0f-aa5d-47cf-9ba7-00ceca347867', @item_id, 'KOFFLAM', '.92MM 406 MT', 6 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '.92MM 406 MT');
UPDATE item_shades SET available_qty = 6 WHERE item_id = @item_id AND shade_id_label = '.92MM 406 MT';

SET FOREIGN_KEY_CHECKS = 1;
