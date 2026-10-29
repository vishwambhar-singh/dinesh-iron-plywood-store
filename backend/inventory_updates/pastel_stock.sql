-- Corrected Inventory Update for 1MM PASTEL
SET FOREIGN_KEY_CHECKS = 0;

-- 1. Ensure master item exists
INSERT IGNORE INTO items (id, name, hsn_code, base_pakka_selling_rate, tax_bracket_percent) 
VALUES ('7c49f818-4c0a-4061-a93a-8fa96aacf7a6', '1MM PASTEL', '4410', 0.00, 18.00);

SET @item_id = (SELECT id FROM items WHERE name = '1MM PASTEL' LIMIT 1);

-- 2. Sync Shades (Add if new, Update if exists)
INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '74bc4be7-8b4b-41b3-9d15-62baf715c274', @item_id, 'PASTEL', '1MM HGL 801', 2 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM HGL 801');
UPDATE item_shades SET available_qty = 2 WHERE item_id = @item_id AND shade_id_label = '1MM HGL 801';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '3c79e046-a940-45f2-80d1-d621f27d4a87', @item_id, 'PASTEL', '1MM HGL 802', 7 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM HGL 802');
UPDATE item_shades SET available_qty = 7 WHERE item_id = @item_id AND shade_id_label = '1MM HGL 802';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '2410bdfc-f4e0-4091-98da-774c8ba5df92', @item_id, 'PASTEL', '1MM HGL 8078', 6 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM HGL 8078');
UPDATE item_shades SET available_qty = 6 WHERE item_id = @item_id AND shade_id_label = '1MM HGL 8078';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '0c89d2d7-228f-4d8f-88d5-0387630988ed', @item_id, 'PASTEL', '1MM HGL 8079', 29 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM HGL 8079');
UPDATE item_shades SET available_qty = 29 WHERE item_id = @item_id AND shade_id_label = '1MM HGL 8079';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT 'e1419988-008b-4dda-bb89-c2f1329ec8b3', @item_id, 'PASTEL', '1MM HGL 815', 15 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM HGL 815');
UPDATE item_shades SET available_qty = 15 WHERE item_id = @item_id AND shade_id_label = '1MM HGL 815';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '4c13f2f0-1c78-43ae-a29e-f6aa98277335', @item_id, 'PASTEL', '1MM HGL 845', 12 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM HGL 845');
UPDATE item_shades SET available_qty = 12 WHERE item_id = @item_id AND shade_id_label = '1MM HGL 845';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '95a6ae14-ad52-4cce-8a46-da6e83c4ef46', @item_id, 'PASTEL', '1MM HGL 846', 13 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM HGL 846');
UPDATE item_shades SET available_qty = 13 WHERE item_id = @item_id AND shade_id_label = '1MM HGL 846';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '21c9c760-988d-422f-9b02-96311e68f9e6', @item_id, 'PASTEL', '1MM HGL 847', 9 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM HGL 847');
UPDATE item_shades SET available_qty = 9 WHERE item_id = @item_id AND shade_id_label = '1MM HGL 847';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '3e2d75bd-3375-416a-8032-cccde76cd7ad', @item_id, 'PASTEL', '1MM HGL 848', 1 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM HGL 848');
UPDATE item_shades SET available_qty = 1 WHERE item_id = @item_id AND shade_id_label = '1MM HGL 848';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '239839d4-d51b-4dc3-88f0-29f9ba489c2f', @item_id, 'PASTEL', '1MM HGL 849', 11 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM HGL 849');
UPDATE item_shades SET available_qty = 11 WHERE item_id = @item_id AND shade_id_label = '1MM HGL 849';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '431a7321-fd04-461e-af20-20c127f88e0c', @item_id, 'PASTEL', '1MM HGL 850', 5 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM HGL 850');
UPDATE item_shades SET available_qty = 5 WHERE item_id = @item_id AND shade_id_label = '1MM HGL 850';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '3edc2e15-061b-47d2-8cba-ecc32c9e0475', @item_id, 'PASTEL', '1MM HGL 851', 11 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM HGL 851');
UPDATE item_shades SET available_qty = 11 WHERE item_id = @item_id AND shade_id_label = '1MM HGL 851';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '9f7c2149-52ae-44d0-be56-9f9260aa0ea0', @item_id, 'PASTEL', '1MM HGL 852', 16 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM HGL 852');
UPDATE item_shades SET available_qty = 16 WHERE item_id = @item_id AND shade_id_label = '1MM HGL 852';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '88da7020-a720-4aad-a84d-30d0a386ab7c', @item_id, 'PASTEL', '1MM HGL 853', 8 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM HGL 853');
UPDATE item_shades SET available_qty = 8 WHERE item_id = @item_id AND shade_id_label = '1MM HGL 853';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '5b6141cb-74d7-4115-a012-80fb37550f72', @item_id, 'PASTEL', '1MM HGL 854', 5 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM HGL 854');
UPDATE item_shades SET available_qty = 5 WHERE item_id = @item_id AND shade_id_label = '1MM HGL 854';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '29d60637-36b3-43b6-9222-32e1ddaa9750', @item_id, 'PASTEL', '1MM HGL 855', 6 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM HGL 855');
UPDATE item_shades SET available_qty = 6 WHERE item_id = @item_id AND shade_id_label = '1MM HGL 855';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '703b2ec4-419b-44e2-8a91-a0c02b84f729', @item_id, 'PASTEL', '1MM HGL 856', 14 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM HGL 856');
UPDATE item_shades SET available_qty = 14 WHERE item_id = @item_id AND shade_id_label = '1MM HGL 856';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '332bdbae-db66-4839-a852-8c7621087ba0', @item_id, 'PASTEL', '1MM HGL 857', 6 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM HGL 857');
UPDATE item_shades SET available_qty = 6 WHERE item_id = @item_id AND shade_id_label = '1MM HGL 857';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '8171b7da-f487-4af1-85d2-01141a2be48b', @item_id, 'PASTEL', '1MM HGL 858', 6 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM HGL 858');
UPDATE item_shades SET available_qty = 6 WHERE item_id = @item_id AND shade_id_label = '1MM HGL 858';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT 'd7fddc8b-869d-4de3-8c67-5d2fcaa58c4f', @item_id, 'PASTEL', '1MM HGL 859', 7 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM HGL 859');
UPDATE item_shades SET available_qty = 7 WHERE item_id = @item_id AND shade_id_label = '1MM HGL 859';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '2ce73273-b86a-40c3-b524-e4c5d857d447', @item_id, 'PASTEL', '1MM HGL 860', 8 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM HGL 860');
UPDATE item_shades SET available_qty = 8 WHERE item_id = @item_id AND shade_id_label = '1MM HGL 860';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '074ea14b-ab92-44a3-8ba1-bd1578a7d38b', @item_id, 'PASTEL', '1MM HGL 861', 9 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM HGL 861');
UPDATE item_shades SET available_qty = 9 WHERE item_id = @item_id AND shade_id_label = '1MM HGL 861';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '274e4ba1-3153-4bc2-aba3-10a8cb2919c9', @item_id, 'PASTEL', '1MM HGL 862', 7 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM HGL 862');
UPDATE item_shades SET available_qty = 7 WHERE item_id = @item_id AND shade_id_label = '1MM HGL 862';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT 'dce3de00-8152-44f7-a715-f4d5818f20ac', @item_id, 'PASTEL', '1MM HGL 863', 8 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM HGL 863');
UPDATE item_shades SET available_qty = 8 WHERE item_id = @item_id AND shade_id_label = '1MM HGL 863';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '969c2b2d-cc1a-4683-92cc-6c21c095d8ac', @item_id, 'PASTEL', '1MM HGL 864', 9 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM HGL 864');
UPDATE item_shades SET available_qty = 9 WHERE item_id = @item_id AND shade_id_label = '1MM HGL 864';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '877aed0d-2801-4c49-86f1-cab2986c8087', @item_id, 'PASTEL', '1MM HGL 876', 12 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM HGL 876');
UPDATE item_shades SET available_qty = 12 WHERE item_id = @item_id AND shade_id_label = '1MM HGL 876';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '56eca37f-cb85-4df7-9952-221e9847e5d8', @item_id, 'PASTEL', '1MM HGL 882', 3 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM HGL 882');
UPDATE item_shades SET available_qty = 3 WHERE item_id = @item_id AND shade_id_label = '1MM HGL 882';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '122babd4-692c-46ae-a05b-ca4322890143', @item_id, 'PASTEL', '1MM HGL 885', 6 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM HGL 885');
UPDATE item_shades SET available_qty = 6 WHERE item_id = @item_id AND shade_id_label = '1MM HGL 885';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '48a7dbe8-5325-4359-b1d3-8e5227a3915b', @item_id, 'PASTEL', '1MM HGL 891', 5 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM HGL 891');
UPDATE item_shades SET available_qty = 5 WHERE item_id = @item_id AND shade_id_label = '1MM HGL 891';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT 'c2fd7521-1f18-48ed-b1ca-2e6926dc0f5c', @item_id, 'PASTEL', '1MM HGL 895', 5 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM HGL 895');
UPDATE item_shades SET available_qty = 5 WHERE item_id = @item_id AND shade_id_label = '1MM HGL 895';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT 'b6d48a8d-3135-4464-8a02-2cc22b85e146', @item_id, 'PASTEL', '1MM HGL 896', 6 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM HGL 896');
UPDATE item_shades SET available_qty = 6 WHERE item_id = @item_id AND shade_id_label = '1MM HGL 896';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT 'cf8ce9af-d8b7-41ea-ab15-1c9e2433b46e', @item_id, 'PASTEL', '1MM PA 802  Acr', 17 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM PA 802  Acr');
UPDATE item_shades SET available_qty = 17 WHERE item_id = @item_id AND shade_id_label = '1MM PA 802  Acr';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT 'bda83e2b-c133-47be-9739-8d971b0d0eb0', @item_id, 'PASTEL', '1MM PA 8600  Acr', 9 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM PA 8600  Acr');
UPDATE item_shades SET available_qty = 9 WHERE item_id = @item_id AND shade_id_label = '1MM PA 8600  Acr';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '2348dd4e-ad3d-4906-bdcd-593c03033626', @item_id, 'PASTEL', '1MM PA 873  Acr', 11 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM PA 873  Acr');
UPDATE item_shades SET available_qty = 11 WHERE item_id = @item_id AND shade_id_label = '1MM PA 873  Acr';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '99b7d20a-93f9-49c2-a518-69e8c56aadad', @item_id, 'PASTEL', '1MM PA 874  Acr', 11 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM PA 874  Acr');
UPDATE item_shades SET available_qty = 11 WHERE item_id = @item_id AND shade_id_label = '1MM PA 874  Acr';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '434def92-2bf6-48f0-b705-4fd39c67450b', @item_id, 'PASTEL', '1MM PA 875  Acr', 10 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM PA 875  Acr');
UPDATE item_shades SET available_qty = 10 WHERE item_id = @item_id AND shade_id_label = '1MM PA 875  Acr';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '13e44b47-3873-43a2-8300-4be33998f364', @item_id, 'PASTEL', '1MM PA 899  Acr', 13 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM PA 899  Acr');
UPDATE item_shades SET available_qty = 13 WHERE item_id = @item_id AND shade_id_label = '1MM PA 899  Acr';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '968f59fa-6460-4bb9-b137-ef6f438d73e3', @item_id, 'PASTEL', '1MM PM 865  MTL', 11 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM PM 865  MTL');
UPDATE item_shades SET available_qty = 11 WHERE item_id = @item_id AND shade_id_label = '1MM PM 865  MTL';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT 'cd8b6dd0-1da5-4d60-b5ea-d1929304b196', @item_id, 'PASTEL', '1MM PM 866  MTL', 2 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM PM 866  MTL');
UPDATE item_shades SET available_qty = 2 WHERE item_id = @item_id AND shade_id_label = '1MM PM 866  MTL';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '711330b6-75ac-40e0-8a85-6caafc97e061', @item_id, 'PASTEL', '1MM PM 867  MTL', 9 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM PM 867  MTL');
UPDATE item_shades SET available_qty = 9 WHERE item_id = @item_id AND shade_id_label = '1MM PM 867  MTL';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT 'df820bd6-5a89-4caa-b4df-b8901d8bcbaa', @item_id, 'PASTEL', '1MM PM 868  MTL', 13 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM PM 868  MTL');
UPDATE item_shades SET available_qty = 13 WHERE item_id = @item_id AND shade_id_label = '1MM PM 868  MTL';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '72f88277-1660-4033-86cc-97410f2bf70c', @item_id, 'PASTEL', '1MM PM 869  MTL', 14 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM PM 869  MTL');
UPDATE item_shades SET available_qty = 14 WHERE item_id = @item_id AND shade_id_label = '1MM PM 869  MTL';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT 'fe92e7f7-2000-4120-9afc-9ed848c51ba3', @item_id, 'PASTEL', '1MM PM 870  MTL', 17 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM PM 870  MTL');
UPDATE item_shades SET available_qty = 17 WHERE item_id = @item_id AND shade_id_label = '1MM PM 870  MTL';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT 'd86f5997-a3a0-4e47-939a-f6d07266b883', @item_id, 'PASTEL', '1MM PM 871  MTL', 15 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM PM 871  MTL');
UPDATE item_shades SET available_qty = 15 WHERE item_id = @item_id AND shade_id_label = '1MM PM 871  MTL';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT 'a64e934e-52e4-49eb-8c18-2e1e16b8c118', @item_id, 'PASTEL', '1MM PM 872  MTL', 12 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM PM 872  MTL');
UPDATE item_shades SET available_qty = 12 WHERE item_id = @item_id AND shade_id_label = '1MM PM 872  MTL';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT 'faa1d64b-05b1-4e5d-a6ab-438dffaec9c1', @item_id, 'PASTEL', '1MM PS100 802', 9 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM PS100 802');
UPDATE item_shades SET available_qty = 9 WHERE item_id = @item_id AND shade_id_label = '1MM PS100 802';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '0bbd013d-8498-40fc-b560-3f6f069f5367', @item_id, 'PASTEL', '1MM PS100 8137', 8 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM PS100 8137');
UPDATE item_shades SET available_qty = 8 WHERE item_id = @item_id AND shade_id_label = '1MM PS100 8137';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT 'b43a889e-ee7f-4401-b8cd-6467c05b3954', @item_id, 'PASTEL', '1MM PS100 859', 10 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM PS100 859');
UPDATE item_shades SET available_qty = 10 WHERE item_id = @item_id AND shade_id_label = '1MM PS100 859';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '04bac891-aa49-4d1d-8db4-9b30ef3574b6', @item_id, 'PASTEL', '1MM PS100 860', 8 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM PS100 860');
UPDATE item_shades SET available_qty = 8 WHERE item_id = @item_id AND shade_id_label = '1MM PS100 860';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '263dfaac-1965-4733-8dcd-39114eee3ac2', @item_id, 'PASTEL', '1MM PS101 815', 15 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM PS101 815');
UPDATE item_shades SET available_qty = 15 WHERE item_id = @item_id AND shade_id_label = '1MM PS101 815';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '56a95b96-0953-4dd8-97f3-ca8617f651fd', @item_id, 'PASTEL', '1MM PS101 891', 10 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM PS101 891');
UPDATE item_shades SET available_qty = 10 WHERE item_id = @item_id AND shade_id_label = '1MM PS101 891';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '4565b44f-a2de-4da8-afb2-ee772801ea18', @item_id, 'PASTEL', '1MM PS101 896', 9 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM PS101 896');
UPDATE item_shades SET available_qty = 9 WHERE item_id = @item_id AND shade_id_label = '1MM PS101 896';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT 'e8ee396a-3520-46e7-9c48-041b8fa61292', @item_id, 'PASTEL', '1MM PS34 801', 16 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM PS34 801');
UPDATE item_shades SET available_qty = 16 WHERE item_id = @item_id AND shade_id_label = '1MM PS34 801';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '585aec44-da54-44ea-8903-162ce9a9162f', @item_id, 'PASTEL', '1MM PS34 802', 12 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM PS34 802');
UPDATE item_shades SET available_qty = 12 WHERE item_id = @item_id AND shade_id_label = '1MM PS34 802';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT 'bdcca233-326c-4163-8a28-f24e3ced26cb', @item_id, 'PASTEL', '1MM PS34 8078', 7 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM PS34 8078');
UPDATE item_shades SET available_qty = 7 WHERE item_id = @item_id AND shade_id_label = '1MM PS34 8078';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT 'ead1d8dc-f48d-4000-b60b-3a0ab50f1705', @item_id, 'PASTEL', '1MM PS34 847', 10 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM PS34 847');
UPDATE item_shades SET available_qty = 10 WHERE item_id = @item_id AND shade_id_label = '1MM PS34 847';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '9ea74093-6dbb-44b9-9ff1-e9d34f66b44c', @item_id, 'PASTEL', '1MM PS34 855', 15 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM PS34 855');
UPDATE item_shades SET available_qty = 15 WHERE item_id = @item_id AND shade_id_label = '1MM PS34 855';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '68b1afae-5a7c-4833-a360-5e517cadbede', @item_id, 'PASTEL', '1MM PS34 856', 4 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM PS34 856');
UPDATE item_shades SET available_qty = 4 WHERE item_id = @item_id AND shade_id_label = '1MM PS34 856';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '402c4407-1b30-49d4-b3cf-90f55daac660', @item_id, 'PASTEL', '1MM PS34 862', 15 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM PS34 862');
UPDATE item_shades SET available_qty = 15 WHERE item_id = @item_id AND shade_id_label = '1MM PS34 862';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '2a4ce259-dc31-4877-95c7-ef93149d8b63', @item_id, 'PASTEL', '1MM PS36 801', 12 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM PS36 801');
UPDATE item_shades SET available_qty = 12 WHERE item_id = @item_id AND shade_id_label = '1MM PS36 801';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT 'fc04958d-f1bf-4eb8-8274-6b7aae729c22', @item_id, 'PASTEL', '1MM PS36 802', 7 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM PS36 802');
UPDATE item_shades SET available_qty = 7 WHERE item_id = @item_id AND shade_id_label = '1MM PS36 802';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT 'd7261cb4-0d5e-4d0b-9813-9946b32d7280', @item_id, 'PASTEL', '1MM PS36 8075', 11 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM PS36 8075');
UPDATE item_shades SET available_qty = 11 WHERE item_id = @item_id AND shade_id_label = '1MM PS36 8075';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '31763d5c-f881-40b9-b895-8a3542a1f43c', @item_id, 'PASTEL', '1MM PS36 8076', 20 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM PS36 8076');
UPDATE item_shades SET available_qty = 20 WHERE item_id = @item_id AND shade_id_label = '1MM PS36 8076';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT 'eae587ce-bb3b-407f-99c2-f6b13db36b18', @item_id, 'PASTEL', '1MM PS36 8077', 15 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM PS36 8077');
UPDATE item_shades SET available_qty = 15 WHERE item_id = @item_id AND shade_id_label = '1MM PS36 8077';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '734bbcfe-cb9c-4fa9-a3db-0fa7f6e05aa8', @item_id, 'PASTEL', '1MM PS36 815', 16 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM PS36 815');
UPDATE item_shades SET available_qty = 16 WHERE item_id = @item_id AND shade_id_label = '1MM PS36 815';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT 'e188491c-92bb-436e-8199-65de0b0c5584', @item_id, 'PASTEL', '1MM PS36 845', 8 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM PS36 845');
UPDATE item_shades SET available_qty = 8 WHERE item_id = @item_id AND shade_id_label = '1MM PS36 845';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '35d7d670-ca75-4e04-9665-709d2835d59e', @item_id, 'PASTEL', '1MM PS36 846', 17 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM PS36 846');
UPDATE item_shades SET available_qty = 17 WHERE item_id = @item_id AND shade_id_label = '1MM PS36 846';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT 'b29482c2-5ee8-45c4-84d0-5959a7f06649', @item_id, 'PASTEL', '1MM PS36 847', 13 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM PS36 847');
UPDATE item_shades SET available_qty = 13 WHERE item_id = @item_id AND shade_id_label = '1MM PS36 847';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT 'd631358a-1bb3-406c-87eb-9c37202cb48a', @item_id, 'PASTEL', '1MM PS36 849', 6 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM PS36 849');
UPDATE item_shades SET available_qty = 6 WHERE item_id = @item_id AND shade_id_label = '1MM PS36 849';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '764c04e2-ef3f-490a-9472-0aa2625d0035', @item_id, 'PASTEL', '1MM PS36 850', 10 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM PS36 850');
UPDATE item_shades SET available_qty = 10 WHERE item_id = @item_id AND shade_id_label = '1MM PS36 850';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '6a922a97-d38f-42b3-80c3-f6950cd190dc', @item_id, 'PASTEL', '1MM PS36 851', 12 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM PS36 851');
UPDATE item_shades SET available_qty = 12 WHERE item_id = @item_id AND shade_id_label = '1MM PS36 851';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '0aa328e1-6f60-47fc-a957-d4ebf0017e35', @item_id, 'PASTEL', '1MM PS36 852', 11 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM PS36 852');
UPDATE item_shades SET available_qty = 11 WHERE item_id = @item_id AND shade_id_label = '1MM PS36 852';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT 'eccd4e6f-4949-46c0-91d8-13954a5a74c5', @item_id, 'PASTEL', '1MM PS36 853', 11 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM PS36 853');
UPDATE item_shades SET available_qty = 11 WHERE item_id = @item_id AND shade_id_label = '1MM PS36 853';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT 'd8235f0b-2b47-4f9c-bc8e-a608a1a9deae', @item_id, 'PASTEL', '1MM PS36 854', 10 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM PS36 854');
UPDATE item_shades SET available_qty = 10 WHERE item_id = @item_id AND shade_id_label = '1MM PS36 854';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '6cf60c11-ceb7-428a-9a99-87554d461fa2', @item_id, 'PASTEL', '1MM PS36 855', 5 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM PS36 855');
UPDATE item_shades SET available_qty = 5 WHERE item_id = @item_id AND shade_id_label = '1MM PS36 855';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '4befe201-ef13-4734-b678-088d6969cc36', @item_id, 'PASTEL', '1MM PS36 856', 19 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM PS36 856');
UPDATE item_shades SET available_qty = 19 WHERE item_id = @item_id AND shade_id_label = '1MM PS36 856';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT 'cdfb4b4e-a383-4a5e-a04f-e2226249dbfb', @item_id, 'PASTEL', '1MM PS36 857', 9 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM PS36 857');
UPDATE item_shades SET available_qty = 9 WHERE item_id = @item_id AND shade_id_label = '1MM PS36 857';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '9d34e7ae-b5d8-444c-aaea-65ef8c054da1', @item_id, 'PASTEL', '1MM PS36 858', 7 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM PS36 858');
UPDATE item_shades SET available_qty = 7 WHERE item_id = @item_id AND shade_id_label = '1MM PS36 858';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '1937c092-b2a7-4dc4-a049-22c6860192bb', @item_id, 'PASTEL', '1MM PS36 859', 9 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM PS36 859');
UPDATE item_shades SET available_qty = 9 WHERE item_id = @item_id AND shade_id_label = '1MM PS36 859';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT 'ca16eaf6-d317-4246-a42d-3848e16309b1', @item_id, 'PASTEL', '1MM PS36 860', 14 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM PS36 860');
UPDATE item_shades SET available_qty = 14 WHERE item_id = @item_id AND shade_id_label = '1MM PS36 860';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT 'c023759f-282e-4ee8-9563-564fa766e499', @item_id, 'PASTEL', '1MM PS36 861', 16 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM PS36 861');
UPDATE item_shades SET available_qty = 16 WHERE item_id = @item_id AND shade_id_label = '1MM PS36 861';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '6ecffae9-12b8-40d6-9e77-9caa75eacc30', @item_id, 'PASTEL', '1MM PS36 862', 18 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM PS36 862');
UPDATE item_shades SET available_qty = 18 WHERE item_id = @item_id AND shade_id_label = '1MM PS36 862';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '854be243-db89-4e9f-a083-b5e35bdb4b70', @item_id, 'PASTEL', '1MM PS36 863', 10 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM PS36 863');
UPDATE item_shades SET available_qty = 10 WHERE item_id = @item_id AND shade_id_label = '1MM PS36 863';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '46e54f92-2152-4579-bc93-6f5be5391463', @item_id, 'PASTEL', '1MM PS36 864', 11 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM PS36 864');
UPDATE item_shades SET available_qty = 11 WHERE item_id = @item_id AND shade_id_label = '1MM PS36 864';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '2cd5ff5b-eed1-40fe-8388-aa769833a12c', @item_id, 'PASTEL', '1MM PS36 882', 5 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM PS36 882');
UPDATE item_shades SET available_qty = 5 WHERE item_id = @item_id AND shade_id_label = '1MM PS36 882';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '303ec73d-f189-4824-bba2-58a7381816b9', @item_id, 'PASTEL', '1MM PS36 885', 1 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM PS36 885');
UPDATE item_shades SET available_qty = 1 WHERE item_id = @item_id AND shade_id_label = '1MM PS36 885';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '6293c8ac-e0a4-4d23-b6a0-9a742ce78e4c', @item_id, 'PASTEL', '1MM PS36 891', 7 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM PS36 891');
UPDATE item_shades SET available_qty = 7 WHERE item_id = @item_id AND shade_id_label = '1MM PS36 891';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT 'd3ded2e2-f3d7-4b66-82d8-99f96bc3c006', @item_id, 'PASTEL', '1MM PS36 896', 4 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM PS36 896');
UPDATE item_shades SET available_qty = 4 WHERE item_id = @item_id AND shade_id_label = '1MM PS36 896';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT 'abeda719-c28a-4241-8a4f-ce54dd1f63f2', @item_id, 'PASTEL', '1MM PS40 8075', 17 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM PS40 8075');
UPDATE item_shades SET available_qty = 17 WHERE item_id = @item_id AND shade_id_label = '1MM PS40 8075';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '24cc6782-99fc-4f22-8076-87dc0c519d84', @item_id, 'PASTEL', '1MM PS40 8076', 16 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM PS40 8076');
UPDATE item_shades SET available_qty = 16 WHERE item_id = @item_id AND shade_id_label = '1MM PS40 8076';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT 'c4d3b41c-0fdd-4132-804f-00c732594390', @item_id, 'PASTEL', '1MM PS46 8077', 11 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM PS46 8077');
UPDATE item_shades SET available_qty = 11 WHERE item_id = @item_id AND shade_id_label = '1MM PS46 8077';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '5dc9cccc-e897-4dd6-8d60-91de4b7aed7f', @item_id, 'PASTEL', '1MM PS73 802', 9 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM PS73 802');
UPDATE item_shades SET available_qty = 9 WHERE item_id = @item_id AND shade_id_label = '1MM PS73 802';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '5b6c31cb-3ccc-41de-9048-c31ca11970e5', @item_id, 'PASTEL', '1MM PS73 8078', 8 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM PS73 8078');
UPDATE item_shades SET available_qty = 8 WHERE item_id = @item_id AND shade_id_label = '1MM PS73 8078';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT 'f67bea4a-c73e-438a-a452-d404bec62a34', @item_id, 'PASTEL', '1MM PS73 847', 7 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM PS73 847');
UPDATE item_shades SET available_qty = 7 WHERE item_id = @item_id AND shade_id_label = '1MM PS73 847';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT 'a860affc-439b-4861-92fa-dcdd67a0f812', @item_id, 'PASTEL', '1MM PS73 849', 5 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM PS73 849');
UPDATE item_shades SET available_qty = 5 WHERE item_id = @item_id AND shade_id_label = '1MM PS73 849';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '7a05ed50-791a-4cd0-b46e-64ae129769e4', @item_id, 'PASTEL', '1MM PS73 860', 1 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM PS73 860');
UPDATE item_shades SET available_qty = 1 WHERE item_id = @item_id AND shade_id_label = '1MM PS73 860';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '637356d7-aacb-4b75-b587-f6c1242d5a32', @item_id, 'PASTEL', '1MM PS74 801', 10 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM PS74 801');
UPDATE item_shades SET available_qty = 10 WHERE item_id = @item_id AND shade_id_label = '1MM PS74 801';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT 'cffc656f-202a-45fc-b60a-74ec88aa4d53', @item_id, 'PASTEL', '1MM PS74 815', 11 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM PS74 815');
UPDATE item_shades SET available_qty = 11 WHERE item_id = @item_id AND shade_id_label = '1MM PS74 815';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT 'f57ce70f-a674-474e-9950-33a91d18b54c', @item_id, 'PASTEL', '1MM PS74 848', 11 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM PS74 848');
UPDATE item_shades SET available_qty = 11 WHERE item_id = @item_id AND shade_id_label = '1MM PS74 848';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT 'd2781da3-d30d-4944-8107-59f4d22c81ad', @item_id, 'PASTEL', '1MM PS75 845', 11 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM PS75 845');
UPDATE item_shades SET available_qty = 11 WHERE item_id = @item_id AND shade_id_label = '1MM PS75 845';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT 'a36047ec-853b-4a3c-81a8-241e92a08f46', @item_id, 'PASTEL', '1MM PS75 859', 14 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM PS75 859');
UPDATE item_shades SET available_qty = 14 WHERE item_id = @item_id AND shade_id_label = '1MM PS75 859';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '5199d080-cdb5-417d-b036-8044ac640f10', @item_id, 'PASTEL', '1MM PS75 864', 7 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM PS75 864');
UPDATE item_shades SET available_qty = 7 WHERE item_id = @item_id AND shade_id_label = '1MM PS75 864';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT 'a4d14486-6169-4137-9f50-95a308453565', @item_id, 'PASTEL', '1MM PS76 801', 10 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM PS76 801');
UPDATE item_shades SET available_qty = 10 WHERE item_id = @item_id AND shade_id_label = '1MM PS76 801';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT 'e2753b43-c331-4f6e-9111-05ee4f1a2e2d', @item_id, 'PASTEL', '1MM PS76 848', 14 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM PS76 848');
UPDATE item_shades SET available_qty = 14 WHERE item_id = @item_id AND shade_id_label = '1MM PS76 848';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '6a0199aa-c33d-4632-a3c3-aeac490a3765', @item_id, 'PASTEL', '1MM PS76 861', 16 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM PS76 861');
UPDATE item_shades SET available_qty = 16 WHERE item_id = @item_id AND shade_id_label = '1MM PS76 861';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '840f1fcd-c85f-4d73-a799-e441600737b7', @item_id, 'PASTEL', '1MM PS76 862', 18 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM PS76 862');
UPDATE item_shades SET available_qty = 18 WHERE item_id = @item_id AND shade_id_label = '1MM PS76 862';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '42e5ea32-82da-4ebc-bf62-3ea69a0b4929', @item_id, 'PASTEL', '1MM PS77 815', 10 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM PS77 815');
UPDATE item_shades SET available_qty = 10 WHERE item_id = @item_id AND shade_id_label = '1MM PS77 815';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '78581c27-80fa-4fda-a9b0-af4b7de7b64d', @item_id, 'PASTEL', '1MM PS77 845', 9 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM PS77 845');
UPDATE item_shades SET available_qty = 9 WHERE item_id = @item_id AND shade_id_label = '1MM PS77 845';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT 'c6be9240-28cb-419a-8bc1-07bf88a433f4', @item_id, 'PASTEL', '1MM PS78 849', 6 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM PS78 849');
UPDATE item_shades SET available_qty = 6 WHERE item_id = @item_id AND shade_id_label = '1MM PS78 849';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '9f4074af-3799-429b-a89e-4987764baea4', @item_id, 'PASTEL', '1MM PS78 857', 5 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM PS78 857');
UPDATE item_shades SET available_qty = 5 WHERE item_id = @item_id AND shade_id_label = '1MM PS78 857';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '9024ee12-76d4-4239-9671-5ebcc69020b2', @item_id, 'PASTEL', '1MM PS79 8079', 5 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM PS79 8079');
UPDATE item_shades SET available_qty = 5 WHERE item_id = @item_id AND shade_id_label = '1MM PS79 8079';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '35569c22-e5b4-43a6-85c7-f7790ba4e86b', @item_id, 'PASTEL', '1MM PS79 815', 9 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM PS79 815');
UPDATE item_shades SET available_qty = 9 WHERE item_id = @item_id AND shade_id_label = '1MM PS79 815';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '75de3b92-d578-4888-bd3a-333c4d995997', @item_id, 'PASTEL', '1MM PS79 848', 7 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM PS79 848');
UPDATE item_shades SET available_qty = 7 WHERE item_id = @item_id AND shade_id_label = '1MM PS79 848';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT 'c6cb27d1-a232-4bdf-8cbd-942143d97020', @item_id, 'PASTEL', '1MM PS79 860', 9 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM PS79 860');
UPDATE item_shades SET available_qty = 9 WHERE item_id = @item_id AND shade_id_label = '1MM PS79 860';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '470ceadc-ff37-4769-8399-d45475d6d58b', @item_id, 'PASTEL', '1MM PS88 896', 6 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM PS88 896');
UPDATE item_shades SET available_qty = 6 WHERE item_id = @item_id AND shade_id_label = '1MM PS88 896';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '182a12cb-85e1-414c-a187-a06731b95ffc', @item_id, 'PASTEL', '1MM PS97 815', 16 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM PS97 815');
UPDATE item_shades SET available_qty = 16 WHERE item_id = @item_id AND shade_id_label = '1MM PS97 815';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT 'f4a921a4-3de2-418f-9f65-4998505939c1', @item_id, 'PASTEL', '1MM PS97 876', 10 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM PS97 876');
UPDATE item_shades SET available_qty = 10 WHERE item_id = @item_id AND shade_id_label = '1MM PS97 876';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '2253a103-a620-4666-8a1f-a4f122e3fe6f', @item_id, 'PASTEL', '1MM PS97 891', 9 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM PS97 891');
UPDATE item_shades SET available_qty = 9 WHERE item_id = @item_id AND shade_id_label = '1MM PS97 891';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT 'e73eb4b6-262f-4f7f-a26b-72460ff20441', @item_id, 'PASTEL', '1MM PS97 895', 8 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM PS97 895');
UPDATE item_shades SET available_qty = 8 WHERE item_id = @item_id AND shade_id_label = '1MM PS97 895';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '62ca353f-8bec-4ea5-9fa2-e868f644d744', @item_id, 'PASTEL', '1MM PS98 8136', 9 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM PS98 8136');
UPDATE item_shades SET available_qty = 9 WHERE item_id = @item_id AND shade_id_label = '1MM PS98 8136';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '5cf401ce-89bc-4bc9-9340-6ea0ed5489a8', @item_id, 'PASTEL', '1MM PS98 8141', 8 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM PS98 8141');
UPDATE item_shades SET available_qty = 8 WHERE item_id = @item_id AND shade_id_label = '1MM PS98 8141';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT 'df8a0824-2019-4cc7-9b5c-10adb2701a19', @item_id, 'PASTEL', '1MM PS98 850', 1 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM PS98 850');
UPDATE item_shades SET available_qty = 1 WHERE item_id = @item_id AND shade_id_label = '1MM PS98 850';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT 'e9c483ab-2c6c-4966-be26-a5488468ae0e', @item_id, 'PASTEL', '1MM PS 98 854', 6 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM PS 98 854');
UPDATE item_shades SET available_qty = 6 WHERE item_id = @item_id AND shade_id_label = '1MM PS 98 854';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT 'bca0d7f5-e0b1-464a-9af2-fbe3326d4508', @item_id, 'PASTEL', '1MM PS98 861', 4 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM PS98 861');
UPDATE item_shades SET available_qty = 4 WHERE item_id = @item_id AND shade_id_label = '1MM PS98 861';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT 'b4484995-c2d7-4a4d-8c9c-497311e37a86', @item_id, 'PASTEL', '1MM PS99 8127', 12 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM PS99 8127');
UPDATE item_shades SET available_qty = 12 WHERE item_id = @item_id AND shade_id_label = '1MM PS99 8127';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '4bd4bd78-d2ef-4726-8b8c-db39046ff3e0', @item_id, 'PASTEL', '1MM PS99 8128', 5 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM PS99 8128');
UPDATE item_shades SET available_qty = 5 WHERE item_id = @item_id AND shade_id_label = '1MM PS99 8128';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT 'af1cd6f9-4746-4d33-b999-85d7af7d4c29', @item_id, 'PASTEL', '1MM PS99 854', 10 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM PS99 854');
UPDATE item_shades SET available_qty = 10 WHERE item_id = @item_id AND shade_id_label = '1MM PS99 854';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT 'a075c09a-8b0a-4b15-9555-a774f820fcc6', @item_id, 'PASTEL', '1MM PS99 863', 4 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM PS99 863');
UPDATE item_shades SET available_qty = 4 WHERE item_id = @item_id AND shade_id_label = '1MM PS99 863';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '0f232851-25a9-46f4-a0c8-dfd69fa320e3', @item_id, 'PASTEL', '1MM PS99 895', 10 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM PS99 895');
UPDATE item_shades SET available_qty = 10 WHERE item_id = @item_id AND shade_id_label = '1MM PS99 895';

SET FOREIGN_KEY_CHECKS = 1;
