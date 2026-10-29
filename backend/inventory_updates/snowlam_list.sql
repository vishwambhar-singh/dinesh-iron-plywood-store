-- Corrected Inventory Update for 1MM SNOWLAM
SET FOREIGN_KEY_CHECKS = 0;

-- 1. Ensure master item exists
INSERT IGNORE INTO items (id, name, hsn_code, base_pakka_selling_rate, tax_bracket_percent) 
VALUES ('84ff478a-0e92-47b6-a9f6-bf7e15386e4a', '1MM SNOWLAM', '4410', 0.00, 18.00);

SET @item_id = (SELECT id FROM items WHERE name = '1MM SNOWLAM' LIMIT 1);

-- 2. Sync Shades (Add if new, Update if exists)
INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '160323c3-29f4-4e2a-bb89-a1a73e445f91', @item_id, 'SNOWLAM', '1MM 5501 ACR', 4 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM 5501 ACR');
UPDATE item_shades SET available_qty = 4 WHERE item_id = @item_id AND shade_id_label = '1MM 5501 ACR';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT 'e26bc203-6ec5-456c-a26f-49794f8f8459', @item_id, 'SNOWLAM', '1MM 5516 ACR', 11 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM 5516 ACR');
UPDATE item_shades SET available_qty = 11 WHERE item_id = @item_id AND shade_id_label = '1MM 5516 ACR';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '5a6cdaef-c4f6-4795-9d2c-7d4393474164', @item_id, 'SNOWLAM', '1MM 5517 ACR', 10 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM 5517 ACR');
UPDATE item_shades SET available_qty = 10 WHERE item_id = @item_id AND shade_id_label = '1MM 5517 ACR';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '57d583e9-0be1-4393-8815-c702ed3cb0b5', @item_id, 'SNOWLAM', '1MM 5518 ACR', 10 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM 5518 ACR');
UPDATE item_shades SET available_qty = 10 WHERE item_id = @item_id AND shade_id_label = '1MM 5518 ACR';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '95229bcc-0f20-4156-9589-a2deb3c31983', @item_id, 'SNOWLAM', '1MM 5519 ACR', 6 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM 5519 ACR');
UPDATE item_shades SET available_qty = 6 WHERE item_id = @item_id AND shade_id_label = '1MM 5519 ACR';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '07207214-3b1c-4bdf-b4fd-866ebf95bd93', @item_id, 'SNOWLAM', '1MM HGL 501', 7 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM HGL 501');
UPDATE item_shades SET available_qty = 7 WHERE item_id = @item_id AND shade_id_label = '1MM HGL 501';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '817c8bd1-15d7-4715-8722-a8ceef7d0176', @item_id, 'SNOWLAM', '1MM HGL 5025', 13 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM HGL 5025');
UPDATE item_shades SET available_qty = 13 WHERE item_id = @item_id AND shade_id_label = '1MM HGL 5025';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '701437bd-b900-4b9a-aafe-747bd379eeef', @item_id, 'SNOWLAM', '1MM HGL 502', 8 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM HGL 502');
UPDATE item_shades SET available_qty = 8 WHERE item_id = @item_id AND shade_id_label = '1MM HGL 502';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT 'abbb0460-dae6-4b96-9082-a2dd62b09d2f', @item_id, 'SNOWLAM', '1MM HGL 5031', 18 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM HGL 5031');
UPDATE item_shades SET available_qty = 18 WHERE item_id = @item_id AND shade_id_label = '1MM HGL 5031';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '712fec6d-c629-4b07-ac95-59ed6a24f8f9', @item_id, 'SNOWLAM', '1MM HGL 5032', 29 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM HGL 5032');
UPDATE item_shades SET available_qty = 29 WHERE item_id = @item_id AND shade_id_label = '1MM HGL 5032';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '3c00642f-417c-4b19-bfe9-4021d1c16b62', @item_id, 'SNOWLAM', '1MM HGL 5037', 9 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM HGL 5037');
UPDATE item_shades SET available_qty = 9 WHERE item_id = @item_id AND shade_id_label = '1MM HGL 5037';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT 'b839bb51-a041-49b2-a2e1-3bd9598c7aba', @item_id, 'SNOWLAM', '1MM HGL 5041', 15 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM HGL 5041');
UPDATE item_shades SET available_qty = 15 WHERE item_id = @item_id AND shade_id_label = '1MM HGL 5041';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '852a9ea6-1ff2-40cd-837a-78d203426a96', @item_id, 'SNOWLAM', '1MM HGL 5043', 55 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM HGL 5043');
UPDATE item_shades SET available_qty = 55 WHERE item_id = @item_id AND shade_id_label = '1MM HGL 5043';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT 'af268cdd-7fb0-4277-b48f-cc11afc95ba3', @item_id, 'SNOWLAM', '1MM HGL 5044', 9 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM HGL 5044');
UPDATE item_shades SET available_qty = 9 WHERE item_id = @item_id AND shade_id_label = '1MM HGL 5044';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '55b2f03f-ac20-4bfb-862e-532bdefaf16b', @item_id, 'SNOWLAM', '1MM HGL 5045', 23 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM HGL 5045');
UPDATE item_shades SET available_qty = 23 WHERE item_id = @item_id AND shade_id_label = '1MM HGL 5045';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '165905f9-9b54-498c-88a9-aa378ee5af8a', @item_id, 'SNOWLAM', '1MM HGL 5046', 22 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM HGL 5046');
UPDATE item_shades SET available_qty = 22 WHERE item_id = @item_id AND shade_id_label = '1MM HGL 5046';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '05f2ec5a-cbac-4595-a69e-ef7a990caa58', @item_id, 'SNOWLAM', '1MM HGL 5047', 16 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM HGL 5047');
UPDATE item_shades SET available_qty = 16 WHERE item_id = @item_id AND shade_id_label = '1MM HGL 5047';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT 'e56e71b4-ce6e-4267-8d9e-06e5a034a688', @item_id, 'SNOWLAM', '1MM HGL 5048', 22 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM HGL 5048');
UPDATE item_shades SET available_qty = 22 WHERE item_id = @item_id AND shade_id_label = '1MM HGL 5048';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT 'a2fc0a83-c5c2-44a6-9068-d3cf46d5bd8e', @item_id, 'SNOWLAM', '1MM HGL 5049', 12 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM HGL 5049');
UPDATE item_shades SET available_qty = 12 WHERE item_id = @item_id AND shade_id_label = '1MM HGL 5049';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT 'e0ff2ae7-99fe-40fd-98b2-71d198f84fe6', @item_id, 'SNOWLAM', '1MM HGL 5050', 36 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM HGL 5050');
UPDATE item_shades SET available_qty = 36 WHERE item_id = @item_id AND shade_id_label = '1MM HGL 5050';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '5e7e75ed-b614-4e97-8f13-cc94e7d5f091', @item_id, 'SNOWLAM', '1MM HGL 5051', 25 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM HGL 5051');
UPDATE item_shades SET available_qty = 25 WHERE item_id = @item_id AND shade_id_label = '1MM HGL 5051';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT 'a28ae842-412a-4ae3-827d-daf553c259bc', @item_id, 'SNOWLAM', '1MM HGL 5052', 26 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM HGL 5052');
UPDATE item_shades SET available_qty = 26 WHERE item_id = @item_id AND shade_id_label = '1MM HGL 5052';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '09891c69-903a-4f57-ad05-41eb24ba9377', @item_id, 'SNOWLAM', '1MM HGL 5057', 24 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM HGL 5057');
UPDATE item_shades SET available_qty = 24 WHERE item_id = @item_id AND shade_id_label = '1MM HGL 5057';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT 'c8b8c869-e918-4a83-a3c0-74c602551ed7', @item_id, 'SNOWLAM', '1MM HGL 5081', 9 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM HGL 5081');
UPDATE item_shades SET available_qty = 9 WHERE item_id = @item_id AND shade_id_label = '1MM HGL 5081';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '35440f8d-11c0-4c1f-a414-9385cfbfbc8f', @item_id, 'SNOWLAM', '1MM HGL 5083', 8 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM HGL 5083');
UPDATE item_shades SET available_qty = 8 WHERE item_id = @item_id AND shade_id_label = '1MM HGL 5083';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '3decce02-5ec2-45bd-8ffd-8b4e74a8b1c7', @item_id, 'SNOWLAM', '1MM HGL 5084', 7 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM HGL 5084');
UPDATE item_shades SET available_qty = 7 WHERE item_id = @item_id AND shade_id_label = '1MM HGL 5084';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '44240157-a4d6-462b-ac98-2e103ac4c0ea', @item_id, 'SNOWLAM', '1MM HGL 5085', 13 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM HGL 5085');
UPDATE item_shades SET available_qty = 13 WHERE item_id = @item_id AND shade_id_label = '1MM HGL 5085';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT 'c2f7671e-3180-4bf4-9382-e044f80cb608', @item_id, 'SNOWLAM', '1MM HGL 5086', 9 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM HGL 5086');
UPDATE item_shades SET available_qty = 9 WHERE item_id = @item_id AND shade_id_label = '1MM HGL 5086';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT 'b2206c74-594b-405e-a9b1-63c8951e292a', @item_id, 'SNOWLAM', '1MM HGL 5088', 19 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM HGL 5088');
UPDATE item_shades SET available_qty = 19 WHERE item_id = @item_id AND shade_id_label = '1MM HGL 5088';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT 'fc430944-dd81-4e89-bba0-ecc3c5a0649d', @item_id, 'SNOWLAM', '1MM HGL 5089', 6 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM HGL 5089');
UPDATE item_shades SET available_qty = 6 WHERE item_id = @item_id AND shade_id_label = '1MM HGL 5089';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT 'ba87b2e3-8cd9-413e-a7c1-388ab11541e2', @item_id, 'SNOWLAM', '1MM HGL 510', 8 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM HGL 510');
UPDATE item_shades SET available_qty = 8 WHERE item_id = @item_id AND shade_id_label = '1MM HGL 510';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT 'aeb6cb14-b891-4d6c-9ca9-9132f1c32318', @item_id, 'SNOWLAM', '1MM HGL 511', 6 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM HGL 511');
UPDATE item_shades SET available_qty = 6 WHERE item_id = @item_id AND shade_id_label = '1MM HGL 511';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '5b56a8d6-2802-4b98-9036-a87c0f151d5e', @item_id, 'SNOWLAM', '1MM HGL 5142', 2 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM HGL 5142');
UPDATE item_shades SET available_qty = 2 WHERE item_id = @item_id AND shade_id_label = '1MM HGL 5142';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '5cd6b208-d8bf-440c-b520-e621ef7fe9a3', @item_id, 'SNOWLAM', '1MM HGL 5143', 8 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM HGL 5143');
UPDATE item_shades SET available_qty = 8 WHERE item_id = @item_id AND shade_id_label = '1MM HGL 5143';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT 'f91482cd-4c9c-41f2-b41b-c0cec8de971e', @item_id, 'SNOWLAM', '1MM HGL 5144', 8 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM HGL 5144');
UPDATE item_shades SET available_qty = 8 WHERE item_id = @item_id AND shade_id_label = '1MM HGL 5144';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT 'b458240d-4532-4c06-9fca-d99561a8cc22', @item_id, 'SNOWLAM', '1MM HGL 5145', 8 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM HGL 5145');
UPDATE item_shades SET available_qty = 8 WHERE item_id = @item_id AND shade_id_label = '1MM HGL 5145';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT 'c258338d-d96b-4ffd-b043-4c3757a99282', @item_id, 'SNOWLAM', '1MM HGL 5146', 12 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM HGL 5146');
UPDATE item_shades SET available_qty = 12 WHERE item_id = @item_id AND shade_id_label = '1MM HGL 5146';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT 'c255eb83-ad21-4010-a687-e156e3a8540b', @item_id, 'SNOWLAM', '1MM HGL 514', 5 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM HGL 514');
UPDATE item_shades SET available_qty = 5 WHERE item_id = @item_id AND shade_id_label = '1MM HGL 514';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT 'd3e7bf44-d9da-45b9-8f89-ca5ca7995c18', @item_id, 'SNOWLAM', '1MM HGL 5150', 8 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM HGL 5150');
UPDATE item_shades SET available_qty = 8 WHERE item_id = @item_id AND shade_id_label = '1MM HGL 5150';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '6e45ee4b-4d68-43cb-9707-86b550f0536a', @item_id, 'SNOWLAM', '1MM HGL 5151', 8 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM HGL 5151');
UPDATE item_shades SET available_qty = 8 WHERE item_id = @item_id AND shade_id_label = '1MM HGL 5151';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '17ff33d0-0d6d-412e-b4ce-3dea7ede92c9', @item_id, 'SNOWLAM', '1MM HGL 5152', 8 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM HGL 5152');
UPDATE item_shades SET available_qty = 8 WHERE item_id = @item_id AND shade_id_label = '1MM HGL 5152';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '35a7c59e-26dd-41c6-8014-97de4604ddeb', @item_id, 'SNOWLAM', '1MM HGL 5153', 7 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM HGL 5153');
UPDATE item_shades SET available_qty = 7 WHERE item_id = @item_id AND shade_id_label = '1MM HGL 5153';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '1f82cd3e-f129-4f0c-aa4d-df27480f059d', @item_id, 'SNOWLAM', '1MM HGL 5154', 13 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM HGL 5154');
UPDATE item_shades SET available_qty = 13 WHERE item_id = @item_id AND shade_id_label = '1MM HGL 5154';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '451ae9fe-7426-4fd3-a376-9eb4dcf9861e', @item_id, 'SNOWLAM', '1MM HGL 516', 7 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM HGL 516');
UPDATE item_shades SET available_qty = 7 WHERE item_id = @item_id AND shade_id_label = '1MM HGL 516';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT 'a75214f9-bbee-4069-9832-daf5e9434f0b', @item_id, 'SNOWLAM', '1MM HGL 518', 7 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM HGL 518');
UPDATE item_shades SET available_qty = 7 WHERE item_id = @item_id AND shade_id_label = '1MM HGL 518';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '54933577-6e07-41b5-93fc-c7be58b77b05', @item_id, 'SNOWLAM', '1MM HGL 5213', 6 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM HGL 5213');
UPDATE item_shades SET available_qty = 6 WHERE item_id = @item_id AND shade_id_label = '1MM HGL 5213';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '3103adae-ab02-4b6f-a085-dcb115e1cf90', @item_id, 'SNOWLAM', '1MM HGL 5216', 32 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM HGL 5216');
UPDATE item_shades SET available_qty = 32 WHERE item_id = @item_id AND shade_id_label = '1MM HGL 5216';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT 'e11cea94-554f-4a20-8b61-4b699f0f6e31', @item_id, 'SNOWLAM', '1MM HGL 5222', 9 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM HGL 5222');
UPDATE item_shades SET available_qty = 9 WHERE item_id = @item_id AND shade_id_label = '1MM HGL 5222';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT 'b0af1e7e-e6e3-4b91-b712-5759734e4128', @item_id, 'SNOWLAM', '1MM HGL 5224', 8 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM HGL 5224');
UPDATE item_shades SET available_qty = 8 WHERE item_id = @item_id AND shade_id_label = '1MM HGL 5224';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '74f44700-45c2-4076-8600-021c9f49bab2', @item_id, 'SNOWLAM', '1MM HGL 5227', 9 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM HGL 5227');
UPDATE item_shades SET available_qty = 9 WHERE item_id = @item_id AND shade_id_label = '1MM HGL 5227';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT 'b5401a72-46d1-430b-a8ec-7f7525c7fe45', @item_id, 'SNOWLAM', '1MM HGL 522', 7 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM HGL 522');
UPDATE item_shades SET available_qty = 7 WHERE item_id = @item_id AND shade_id_label = '1MM HGL 522';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT 'fcfaf96d-ea30-40f0-b63f-746aacea2eb8', @item_id, 'SNOWLAM', '1MM HGL 524', 13 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM HGL 524');
UPDATE item_shades SET available_qty = 13 WHERE item_id = @item_id AND shade_id_label = '1MM HGL 524';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '1756195f-c826-4e81-a032-0552dcf91340', @item_id, 'SNOWLAM', '1MM HGL 525', 8 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM HGL 525');
UPDATE item_shades SET available_qty = 8 WHERE item_id = @item_id AND shade_id_label = '1MM HGL 525';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '161ccd97-3a26-4f00-a0d7-8fb8792ac0fb', @item_id, 'SNOWLAM', '1MM HGL 526', 5 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM HGL 526');
UPDATE item_shades SET available_qty = 5 WHERE item_id = @item_id AND shade_id_label = '1MM HGL 526';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '4a9533bb-20ec-42e1-9a30-e0ce09327750', @item_id, 'SNOWLAM', '1MM HGL 527', 7 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM HGL 527');
UPDATE item_shades SET available_qty = 7 WHERE item_id = @item_id AND shade_id_label = '1MM HGL 527';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '2deee8bc-64b7-4ebd-ae5d-f701780f21a9', @item_id, 'SNOWLAM', '1MM HGL 529', 10 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM HGL 529');
UPDATE item_shades SET available_qty = 10 WHERE item_id = @item_id AND shade_id_label = '1MM HGL 529';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT 'd673be82-10a6-4f2a-af7d-d9f1b5108029', @item_id, 'SNOWLAM', '1MM HGL 576', 6 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM HGL 576');
UPDATE item_shades SET available_qty = 6 WHERE item_id = @item_id AND shade_id_label = '1MM HGL 576';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '67d4dee6-0732-4c3b-883b-a7b03823f0fd', @item_id, 'SNOWLAM', '1MM HGL 578', 6 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM HGL 578');
UPDATE item_shades SET available_qty = 6 WHERE item_id = @item_id AND shade_id_label = '1MM HGL 578';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '654dabfb-15ea-401c-a67f-c43861157ccf', @item_id, 'SNOWLAM', '1MM HGL 579', 18 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM HGL 579');
UPDATE item_shades SET available_qty = 18 WHERE item_id = @item_id AND shade_id_label = '1MM HGL 579';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '99e6ab0f-e545-4cf0-94b3-ba6e4f98c7af', @item_id, 'SNOWLAM', '1MM HGL 580', 12 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM HGL 580');
UPDATE item_shades SET available_qty = 12 WHERE item_id = @item_id AND shade_id_label = '1MM HGL 580';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '4b275d2c-d774-4b93-91ed-038c4836efd7', @item_id, 'SNOWLAM', '1MM HGL 581', 10 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM HGL 581');
UPDATE item_shades SET available_qty = 10 WHERE item_id = @item_id AND shade_id_label = '1MM HGL 581';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '9032ccdd-809c-4a69-b441-615341c1e6a2', @item_id, 'SNOWLAM', '1MM HGL 582', 9 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM HGL 582');
UPDATE item_shades SET available_qty = 9 WHERE item_id = @item_id AND shade_id_label = '1MM HGL 582';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '80bfbf19-5621-4483-b5e2-390da13a536f', @item_id, 'SNOWLAM', '1MM HGL 583', 18 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM HGL 583');
UPDATE item_shades SET available_qty = 18 WHERE item_id = @item_id AND shade_id_label = '1MM HGL 583';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT 'eabbdaed-3eaf-49ea-9d4b-12fbb86f55a1', @item_id, 'SNOWLAM', '1MM HGL 584', 11 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM HGL 584');
UPDATE item_shades SET available_qty = 11 WHERE item_id = @item_id AND shade_id_label = '1MM HGL 584';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '6e681ea1-1c14-4497-887f-b71e361bc88d', @item_id, 'SNOWLAM', '1MM HGL 585', 8 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM HGL 585');
UPDATE item_shades SET available_qty = 8 WHERE item_id = @item_id AND shade_id_label = '1MM HGL 585';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '0ee93f08-784c-446e-a4d3-10bc1bbf8af8', @item_id, 'SNOWLAM', '1MM HGL 586', 4 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM HGL 586');
UPDATE item_shades SET available_qty = 4 WHERE item_id = @item_id AND shade_id_label = '1MM HGL 586';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT 'e82555b3-1d7c-4fc5-b0ca-6eb2780c5775', @item_id, 'SNOWLAM', '1MM HGL 587', 6 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM HGL 587');
UPDATE item_shades SET available_qty = 6 WHERE item_id = @item_id AND shade_id_label = '1MM HGL 587';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT 'a7647f1c-9c74-42d6-b1fc-c1d7cc9ef4c9', @item_id, 'SNOWLAM', '1MM HGL 588', 16 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM HGL 588');
UPDATE item_shades SET available_qty = 16 WHERE item_id = @item_id AND shade_id_label = '1MM HGL 588';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '8df94be8-7e59-4864-bcfc-23797c1a608b', @item_id, 'SNOWLAM', '1MM HGL 589', 13 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM HGL 589');
UPDATE item_shades SET available_qty = 13 WHERE item_id = @item_id AND shade_id_label = '1MM HGL 589';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '7da4ecd0-a036-4572-834a-1dcfc7ed0191', @item_id, 'SNOWLAM', '1MM HGL 590', 13 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM HGL 590');
UPDATE item_shades SET available_qty = 13 WHERE item_id = @item_id AND shade_id_label = '1MM HGL 590';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT 'cc419856-7780-453c-a2e5-b99cbb876981', @item_id, 'SNOWLAM', '1MM HGL 591', 11 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM HGL 591');
UPDATE item_shades SET available_qty = 11 WHERE item_id = @item_id AND shade_id_label = '1MM HGL 591';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '2fb1946c-fa46-4cb6-8eb9-6018f87dbc3a', @item_id, 'SNOWLAM', '1MM HGL 593', 6 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM HGL 593');
UPDATE item_shades SET available_qty = 6 WHERE item_id = @item_id AND shade_id_label = '1MM HGL 593';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT 'e7d81436-31c9-47c9-9497-0080de4eb150', @item_id, 'SNOWLAM', '1MM HGL 594', 8 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM HGL 594');
UPDATE item_shades SET available_qty = 8 WHERE item_id = @item_id AND shade_id_label = '1MM HGL 594';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '38862700-5a5a-4938-b560-2e54fa19d4ba', @item_id, 'SNOWLAM', '1MM HGL 595', 8 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM HGL 595');
UPDATE item_shades SET available_qty = 8 WHERE item_id = @item_id AND shade_id_label = '1MM HGL 595';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT 'a804ee71-ff4a-4ff5-b21b-586613638f25', @item_id, 'SNOWLAM', '1MM HGL 596', 6 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM HGL 596');
UPDATE item_shades SET available_qty = 6 WHERE item_id = @item_id AND shade_id_label = '1MM HGL 596';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '5a81bdd5-2599-4b49-b0ea-52f6b1fa4989', @item_id, 'SNOWLAM', '1MM HGL 597', 2 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM HGL 597');
UPDATE item_shades SET available_qty = 2 WHERE item_id = @item_id AND shade_id_label = '1MM HGL 597';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '5ae2da39-c33e-4850-9d18-f70793438874', @item_id, 'SNOWLAM', '1MM HGL 598', 8 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM HGL 598');
UPDATE item_shades SET available_qty = 8 WHERE item_id = @item_id AND shade_id_label = '1MM HGL 598';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT 'dbb5ee5d-48ee-40a7-b980-c011bfb7ea40', @item_id, 'SNOWLAM', '1MM SF 5025', 12 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM SF 5025');
UPDATE item_shades SET available_qty = 12 WHERE item_id = @item_id AND shade_id_label = '1MM SF 5025';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '8bcb6817-55e7-4ffa-9091-2980cb6986fb', @item_id, 'SNOWLAM', '1MM SF 502', 2 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM SF 502');
UPDATE item_shades SET available_qty = 2 WHERE item_id = @item_id AND shade_id_label = '1MM SF 502';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT 'cd3ff6d6-b81f-45a6-b3c0-0b04673bf6c3', @item_id, 'SNOWLAM', '1MM SF 5041', 16 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM SF 5041');
UPDATE item_shades SET available_qty = 16 WHERE item_id = @item_id AND shade_id_label = '1MM SF 5041';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '9389c033-7ca9-4986-b612-5754b65c1e88', @item_id, 'SNOWLAM', '1MM SF 5042', 10 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM SF 5042');
UPDATE item_shades SET available_qty = 10 WHERE item_id = @item_id AND shade_id_label = '1MM SF 5042';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '663fa232-b89d-4a91-881a-a5a2a2180bc9', @item_id, 'SNOWLAM', '1MM SF 5049', 17 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM SF 5049');
UPDATE item_shades SET available_qty = 17 WHERE item_id = @item_id AND shade_id_label = '1MM SF 5049';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '74cfe95f-85ae-4807-8c66-80f74472d694', @item_id, 'SNOWLAM', '1MM SF 5083', 7 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM SF 5083');
UPDATE item_shades SET available_qty = 7 WHERE item_id = @item_id AND shade_id_label = '1MM SF 5083';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT 'c21bc63a-426f-4b56-b9f5-da8f2822be5b', @item_id, 'SNOWLAM', '1MM SF 5084', 16 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM SF 5084');
UPDATE item_shades SET available_qty = 16 WHERE item_id = @item_id AND shade_id_label = '1MM SF 5084';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '26ad4b46-b531-4d43-8100-d660596ad63c', @item_id, 'SNOWLAM', '1MM SF 5085', 15 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM SF 5085');
UPDATE item_shades SET available_qty = 15 WHERE item_id = @item_id AND shade_id_label = '1MM SF 5085';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '8c331a68-3d09-4c94-a36a-5d90ace4e2bc', @item_id, 'SNOWLAM', '1MM SF 5086', 12 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM SF 5086');
UPDATE item_shades SET available_qty = 12 WHERE item_id = @item_id AND shade_id_label = '1MM SF 5086';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '92e971d4-1c55-4d09-9e4e-b2867d15fe31', @item_id, 'SNOWLAM', '1MM SF 510', 24 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM SF 510');
UPDATE item_shades SET available_qty = 24 WHERE item_id = @item_id AND shade_id_label = '1MM SF 510';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT 'ad53dd4d-a8e1-4ac0-84fb-7af7a2272311', @item_id, 'SNOWLAM', '1MM SF 5147', 8 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM SF 5147');
UPDATE item_shades SET available_qty = 8 WHERE item_id = @item_id AND shade_id_label = '1MM SF 5147';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT 'b471518f-4dbd-464f-bd22-744343d753b7', @item_id, 'SNOWLAM', '1MM SF 5149', 6 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM SF 5149');
UPDATE item_shades SET available_qty = 6 WHERE item_id = @item_id AND shade_id_label = '1MM SF 5149';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '66df7b4e-77d3-4c5a-bd78-0f32396178df', @item_id, 'SNOWLAM', '1MM SF 514', 8 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM SF 514');
UPDATE item_shades SET available_qty = 8 WHERE item_id = @item_id AND shade_id_label = '1MM SF 514';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT 'f7024e59-9feb-409e-9bb0-710f82b3e767', @item_id, 'SNOWLAM', '1MM SF 5150', 8 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM SF 5150');
UPDATE item_shades SET available_qty = 8 WHERE item_id = @item_id AND shade_id_label = '1MM SF 5150';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '90c90f4a-8ce1-4a06-aa47-5a5891ac4b20', @item_id, 'SNOWLAM', '1MM SF 5151', 4 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM SF 5151');
UPDATE item_shades SET available_qty = 4 WHERE item_id = @item_id AND shade_id_label = '1MM SF 5151';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT 'f56e8ebf-42af-4567-b3ba-e9ddb03f29c3', @item_id, 'SNOWLAM', '1MM SF 5152', 8 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM SF 5152');
UPDATE item_shades SET available_qty = 8 WHERE item_id = @item_id AND shade_id_label = '1MM SF 5152';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '96223acc-f51b-4fb3-a8c5-e5454353f11c', @item_id, 'SNOWLAM', '1MM SF 5153', 6 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM SF 5153');
UPDATE item_shades SET available_qty = 6 WHERE item_id = @item_id AND shade_id_label = '1MM SF 5153';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '302cec77-6650-456c-948b-f0cf88546bfc', @item_id, 'SNOWLAM', '1MM SF 515', 14 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM SF 515');
UPDATE item_shades SET available_qty = 14 WHERE item_id = @item_id AND shade_id_label = '1MM SF 515';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT 'e34017b6-941b-48ec-902f-66ca1987de85', @item_id, 'SNOWLAM', '1MM SF 518', 6 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM SF 518');
UPDATE item_shades SET available_qty = 6 WHERE item_id = @item_id AND shade_id_label = '1MM SF 518';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT 'c77969cd-0b19-419b-9471-485690ef664d', @item_id, 'SNOWLAM', '1MM SF 5213', 10 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM SF 5213');
UPDATE item_shades SET available_qty = 10 WHERE item_id = @item_id AND shade_id_label = '1MM SF 5213';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '11442fa7-5fe2-4fde-9d54-02cf97a4ce66', @item_id, 'SNOWLAM', '1MM SF 5216', 13 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM SF 5216');
UPDATE item_shades SET available_qty = 13 WHERE item_id = @item_id AND shade_id_label = '1MM SF 5216';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '1de53660-3c34-4156-b83e-423f3000ff32', @item_id, 'SNOWLAM', '1MM SF 5222', 14 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM SF 5222');
UPDATE item_shades SET available_qty = 14 WHERE item_id = @item_id AND shade_id_label = '1MM SF 5222';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '0b198125-afdf-4f0a-975e-db3b89b4b016', @item_id, 'SNOWLAM', '1MM SF 5224', 15 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM SF 5224');
UPDATE item_shades SET available_qty = 15 WHERE item_id = @item_id AND shade_id_label = '1MM SF 5224';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT 'ba74f7b3-6f05-402e-8339-9ab5500757b9', @item_id, 'SNOWLAM', '1MM SF 5227', 11 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM SF 5227');
UPDATE item_shades SET available_qty = 11 WHERE item_id = @item_id AND shade_id_label = '1MM SF 5227';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '337a5a47-f370-4cdf-835c-9cab7eb5c0d4', @item_id, 'SNOWLAM', '1MM SF 522', 10 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM SF 522');
UPDATE item_shades SET available_qty = 10 WHERE item_id = @item_id AND shade_id_label = '1MM SF 522';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '5073412a-f475-4d59-aaed-8f2cf5cfcc49', @item_id, 'SNOWLAM', '1MM SF 5237', 5 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM SF 5237');
UPDATE item_shades SET available_qty = 5 WHERE item_id = @item_id AND shade_id_label = '1MM SF 5237';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT 'e6ab5363-d0ec-405f-9f85-76a58172be29', @item_id, 'SNOWLAM', '1MM SF 525', 4 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM SF 525');
UPDATE item_shades SET available_qty = 4 WHERE item_id = @item_id AND shade_id_label = '1MM SF 525';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '4938b742-9148-4c57-9019-d4328ff569fb', @item_id, 'SNOWLAM', '1MM SF 526', 6 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM SF 526');
UPDATE item_shades SET available_qty = 6 WHERE item_id = @item_id AND shade_id_label = '1MM SF 526';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '9c336251-c343-4419-bc92-e4ed5ea517fe', @item_id, 'SNOWLAM', '1MM SF 527', 8 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM SF 527');
UPDATE item_shades SET available_qty = 8 WHERE item_id = @item_id AND shade_id_label = '1MM SF 527';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT 'a28743c8-2381-43a6-be9d-657e51fff781', @item_id, 'SNOWLAM', '1MM SF 529', 6 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM SF 529');
UPDATE item_shades SET available_qty = 6 WHERE item_id = @item_id AND shade_id_label = '1MM SF 529';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '36f1ef49-a30b-4c18-86eb-67a04ed74183', @item_id, 'SNOWLAM', '1MM SL04 5045', 33 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM SL04 5045');
UPDATE item_shades SET available_qty = 33 WHERE item_id = @item_id AND shade_id_label = '1MM SL04 5045';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '4ec01dd4-c295-4f4c-9af0-b6473cdf4b10', @item_id, 'SNOWLAM', '1MM SL04 5046', 20 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM SL04 5046');
UPDATE item_shades SET available_qty = 20 WHERE item_id = @item_id AND shade_id_label = '1MM SL04 5046';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '955571da-9d3d-407f-9149-cb52a118cbcd', @item_id, 'SNOWLAM', '1MM SL06 5025', 21 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM SL06 5025');
UPDATE item_shades SET available_qty = 21 WHERE item_id = @item_id AND shade_id_label = '1MM SL06 5025';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT 'e1d792fb-7d7e-46d0-92ae-2208d352621a', @item_id, 'SNOWLAM', '1MM SL06 5042', 20 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM SL06 5042');
UPDATE item_shades SET available_qty = 20 WHERE item_id = @item_id AND shade_id_label = '1MM SL06 5042';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT 'e68f7180-5814-4021-915f-a94dd2db2f25', @item_id, 'SNOWLAM', '1MM SL06 5227', 22 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM SL06 5227');
UPDATE item_shades SET available_qty = 22 WHERE item_id = @item_id AND shade_id_label = '1MM SL06 5227';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT 'b3ac275f-4374-4721-84ea-b75ae46fb31a', @item_id, 'SNOWLAM', '1MM SL08 5031', 23 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM SL08 5031');
UPDATE item_shades SET available_qty = 23 WHERE item_id = @item_id AND shade_id_label = '1MM SL08 5031';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '39f8996f-cf64-4637-835b-94ffd08d481f', @item_id, 'SNOWLAM', '1MM SL08 5032', 19 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM SL08 5032');
UPDATE item_shades SET available_qty = 19 WHERE item_id = @item_id AND shade_id_label = '1MM SL08 5032';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '7023fd56-f4fd-45f9-8b73-03f27bdfdc84', @item_id, 'SNOWLAM', '1MM SL08 5043', 33 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM SL08 5043');
UPDATE item_shades SET available_qty = 33 WHERE item_id = @item_id AND shade_id_label = '1MM SL08 5043';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '8aa936d4-b5ae-4edc-963d-4094b37e35e6', @item_id, 'SNOWLAM', '1MM SL08 5044', 7 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM SL08 5044');
UPDATE item_shades SET available_qty = 7 WHERE item_id = @item_id AND shade_id_label = '1MM SL08 5044';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT 'd7b8d004-45ed-40c7-ac70-87248c0f5ba3', @item_id, 'SNOWLAM', '1MM SL09 5025', 12 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM SL09 5025');
UPDATE item_shades SET available_qty = 12 WHERE item_id = @item_id AND shade_id_label = '1MM SL09 5025';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT 'ba9514c6-9bda-4981-b401-7e903400b26a', @item_id, 'SNOWLAM', '1MM SL09 5057', 12 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM SL09 5057');
UPDATE item_shades SET available_qty = 12 WHERE item_id = @item_id AND shade_id_label = '1MM SL09 5057';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT 'e2888ac5-0bff-4af1-ae77-6fe292373626', @item_id, 'SNOWLAM', '1MM SL09 5084', 23 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM SL09 5084');
UPDATE item_shades SET available_qty = 23 WHERE item_id = @item_id AND shade_id_label = '1MM SL09 5084';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '95ba37cf-15a2-4b43-abdd-75067ed1580c', @item_id, 'SNOWLAM', '1MM SL09 5151', 12 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM SL09 5151');
UPDATE item_shades SET available_qty = 12 WHERE item_id = @item_id AND shade_id_label = '1MM SL09 5151';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '1558428d-f646-42c5-8a27-0ed4fdf47ded', @item_id, 'SNOWLAM', '1MM SL09 5216', 27 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM SL09 5216');
UPDATE item_shades SET available_qty = 27 WHERE item_id = @item_id AND shade_id_label = '1MM SL09 5216';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT 'ed9fe013-5f62-4e93-9670-c5e7b2540d1d', @item_id, 'SNOWLAM', '1MM SL09 5227', 7 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM SL09 5227');
UPDATE item_shades SET available_qty = 7 WHERE item_id = @item_id AND shade_id_label = '1MM SL09 5227';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '91747202-ce45-4b95-979d-6a7e230f6173', @item_id, 'SNOWLAM', '1MM SL103 5153', 12 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM SL103 5153');
UPDATE item_shades SET available_qty = 12 WHERE item_id = @item_id AND shade_id_label = '1MM SL103 5153';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT 'c52c761b-b91b-497f-add8-4a802041a747', @item_id, 'SNOWLAM', '1MM SL103 586', 11 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM SL103 586');
UPDATE item_shades SET available_qty = 11 WHERE item_id = @item_id AND shade_id_label = '1MM SL103 586';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '1472b836-e96f-4e21-b817-ca31188396cc', @item_id, 'SNOWLAM', '1MM SL104 5149', 16 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM SL104 5149');
UPDATE item_shades SET available_qty = 16 WHERE item_id = @item_id AND shade_id_label = '1MM SL104 5149';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT 'a8bcd171-7252-4dbc-b4f3-af272d37c6a0', @item_id, 'SNOWLAM', '1MM SL104 5153', 11 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM SL104 5153');
UPDATE item_shades SET available_qty = 11 WHERE item_id = @item_id AND shade_id_label = '1MM SL104 5153';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '6164eaa8-046a-44d2-9fb1-e07b29ff3766', @item_id, 'SNOWLAM', '1MM SL105 5142', 11 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM SL105 5142');
UPDATE item_shades SET available_qty = 11 WHERE item_id = @item_id AND shade_id_label = '1MM SL105 5142';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '758d77b1-4144-448e-8af7-884c3a5c7b52', @item_id, 'SNOWLAM', '1MM SL106 5147', 16 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM SL106 5147');
UPDATE item_shades SET available_qty = 16 WHERE item_id = @item_id AND shade_id_label = '1MM SL106 5147';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT 'e1799bb8-4b01-4ca0-8f87-84b5107b7056', @item_id, 'SNOWLAM', '1MM SL106 5148', 13 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM SL106 5148');
UPDATE item_shades SET available_qty = 13 WHERE item_id = @item_id AND shade_id_label = '1MM SL106 5148';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '0323d480-05a1-4def-a208-401561460452', @item_id, 'SNOWLAM', '1MM SL106 5150', 6 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM SL106 5150');
UPDATE item_shades SET available_qty = 6 WHERE item_id = @item_id AND shade_id_label = '1MM SL106 5150';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '35d15f14-533f-4636-bc90-66840966eafc', @item_id, 'SNOWLAM', '1MM SL12 5041', 20 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM SL12 5041');
UPDATE item_shades SET available_qty = 20 WHERE item_id = @item_id AND shade_id_label = '1MM SL12 5041';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '99388801-3265-4d8a-a2c7-eb7f82e20150', @item_id, 'SNOWLAM', '1MM SL12 5224', 20 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM SL12 5224');
UPDATE item_shades SET available_qty = 20 WHERE item_id = @item_id AND shade_id_label = '1MM SL12 5224';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT 'd06e3369-d185-4526-a310-32788c9da766', @item_id, 'SNOWLAM', '1MM SL17 5049', 2 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM SL17 5049');
UPDATE item_shades SET available_qty = 2 WHERE item_id = @item_id AND shade_id_label = '1MM SL17 5049';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '799e2d91-7a83-4b34-af01-a8e971df063f', @item_id, 'SNOWLAM', '1MM SL17 5050', 8 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM SL17 5050');
UPDATE item_shades SET available_qty = 8 WHERE item_id = @item_id AND shade_id_label = '1MM SL17 5050';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '1f542941-bfeb-4dff-b299-c55aebcd2790', @item_id, 'SNOWLAM', '1MM SL17 5149', 9 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM SL17 5149');
UPDATE item_shades SET available_qty = 9 WHERE item_id = @item_id AND shade_id_label = '1MM SL17 5149';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '8c258d77-2cd4-4a38-aefe-8167fb5e70d6', @item_id, 'SNOWLAM', '1MM SL23 5041', 18 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM SL23 5041');
UPDATE item_shades SET available_qty = 18 WHERE item_id = @item_id AND shade_id_label = '1MM SL23 5041';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT 'ca103185-931e-4ad6-813e-9e74685950bd', @item_id, 'SNOWLAM', '1MM SL23 5049', 62 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM SL23 5049');
UPDATE item_shades SET available_qty = 62 WHERE item_id = @item_id AND shade_id_label = '1MM SL23 5049';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '35ab6ec0-1f59-479a-9755-360ad086f2b2', @item_id, 'SNOWLAM', '1MM SL23 5227', 19 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM SL23 5227');
UPDATE item_shades SET available_qty = 19 WHERE item_id = @item_id AND shade_id_label = '1MM SL23 5227';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT 'ba008e03-b5d6-48f4-926a-a9bae653e096', @item_id, 'SNOWLAM', '1MM SL25 5216', 32 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM SL25 5216');
UPDATE item_shades SET available_qty = 32 WHERE item_id = @item_id AND shade_id_label = '1MM SL25 5216';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '38255249-97d5-4406-83ec-0f11ef116fe1', @item_id, 'SNOWLAM', '1MM SL25 5222', 2 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM SL25 5222');
UPDATE item_shades SET available_qty = 2 WHERE item_id = @item_id AND shade_id_label = '1MM SL25 5222';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '29ed8e16-8c53-4d1a-bf62-529fca27003e', @item_id, 'SNOWLAM', '1MM SL27 5019', 1 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM SL27 5019');
UPDATE item_shades SET available_qty = 1 WHERE item_id = @item_id AND shade_id_label = '1MM SL27 5019';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '0db8f06d-fbf2-4db8-aebb-c00ddb8b7935', @item_id, 'SNOWLAM', '1MM SL27 5042', 11 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM SL27 5042');
UPDATE item_shades SET available_qty = 11 WHERE item_id = @item_id AND shade_id_label = '1MM SL27 5042';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '5fd57b8c-0a66-49e9-8e15-9afa9bb7902e', @item_id, 'SNOWLAM', '1MM SL28 5037', 24 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM SL28 5037');
UPDATE item_shades SET available_qty = 24 WHERE item_id = @item_id AND shade_id_label = '1MM SL28 5037';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '9cb614d6-2e23-4e12-84c9-822c6c4967b2', @item_id, 'SNOWLAM', '1MM SL28 5041', 22 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM SL28 5041');
UPDATE item_shades SET available_qty = 22 WHERE item_id = @item_id AND shade_id_label = '1MM SL28 5041';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '83a3e2b1-cc1c-41e5-a308-7e5c8e2272e5', @item_id, 'SNOWLAM', '1MM SL30 5085', 8 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM SL30 5085');
UPDATE item_shades SET available_qty = 8 WHERE item_id = @item_id AND shade_id_label = '1MM SL30 5085';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '2ee65a76-6386-4586-acbc-71512be6fbf9', @item_id, 'SNOWLAM', '1MM SL30 5213', 14 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM SL30 5213');
UPDATE item_shades SET available_qty = 14 WHERE item_id = @item_id AND shade_id_label = '1MM SL30 5213';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '76f84ab7-ceee-42d4-8646-48f70ebda57e', @item_id, 'SNOWLAM', '1MM SL30 5224', 55 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM SL30 5224');
UPDATE item_shades SET available_qty = 55 WHERE item_id = @item_id AND shade_id_label = '1MM SL30 5224';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '948c1cae-4f18-4547-98ad-719c8e83693a', @item_id, 'SNOWLAM', '1MM SL31 5010', 10 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM SL31 5010');
UPDATE item_shades SET available_qty = 10 WHERE item_id = @item_id AND shade_id_label = '1MM SL31 5010';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '8e0d0cf9-680d-446d-8173-f2bd5bb057e5', @item_id, 'SNOWLAM', '1MM SL31 5049', 11 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM SL31 5049');
UPDATE item_shades SET available_qty = 11 WHERE item_id = @item_id AND shade_id_label = '1MM SL31 5049';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '8d3d1d4b-9132-4ce7-8fd2-4f09609ae555', @item_id, 'SNOWLAM', '1MM SL31 5050', 8 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM SL31 5050');
UPDATE item_shades SET available_qty = 8 WHERE item_id = @item_id AND shade_id_label = '1MM SL31 5050';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '61b113aa-b607-4347-8b88-163ec08069ae', @item_id, 'SNOWLAM', '1MM SL31 5224', 1 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM SL31 5224');
UPDATE item_shades SET available_qty = 1 WHERE item_id = @item_id AND shade_id_label = '1MM SL31 5224';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '8099b7bf-d776-4be2-b085-61000c525c45', @item_id, 'SNOWLAM', '1MM SL32 5041', 66 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM SL32 5041');
UPDATE item_shades SET available_qty = 66 WHERE item_id = @item_id AND shade_id_label = '1MM SL32 5041';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '6d77dfd8-6927-4b92-8e24-e5f2bc867dae', @item_id, 'SNOWLAM', '1MM SL32 5151', 9 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM SL32 5151');
UPDATE item_shades SET available_qty = 9 WHERE item_id = @item_id AND shade_id_label = '1MM SL32 5151';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '537e49cf-0718-4d08-a807-bd40e55483dd', @item_id, 'SNOWLAM', '1MM SL32 5152', 34 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM SL32 5152');
UPDATE item_shades SET available_qty = 34 WHERE item_id = @item_id AND shade_id_label = '1MM SL32 5152';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT 'f5cbd21c-ba7f-4368-9c7b-992a7a3c2b6c', @item_id, 'SNOWLAM', '1MM SL32 5237', 11 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM SL32 5237');
UPDATE item_shades SET available_qty = 11 WHERE item_id = @item_id AND shade_id_label = '1MM SL32 5237';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '0903f1f6-2c05-4cc2-ac74-c86a5cf08a50', @item_id, 'SNOWLAM', '1MM SL34 5043', 25 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM SL34 5043');
UPDATE item_shades SET available_qty = 25 WHERE item_id = @item_id AND shade_id_label = '1MM SL34 5043';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT 'ed8fd6b5-920a-4f7f-a0ae-ca2662211b72', @item_id, 'SNOWLAM', '1MM SL34 5044', 22 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM SL34 5044');
UPDATE item_shades SET available_qty = 22 WHERE item_id = @item_id AND shade_id_label = '1MM SL34 5044';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '6ae37105-aa0d-4797-8199-26fe94fc3c57', @item_id, 'SNOWLAM', '1MM SL34 5045', 20 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM SL34 5045');
UPDATE item_shades SET available_qty = 20 WHERE item_id = @item_id AND shade_id_label = '1MM SL34 5045';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '95f31ea5-de30-4b2b-bfa3-6411a50f3f03', @item_id, 'SNOWLAM', '1MM SL34 5047', 19 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM SL34 5047');
UPDATE item_shades SET available_qty = 19 WHERE item_id = @item_id AND shade_id_label = '1MM SL34 5047';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '709ecd4e-1aac-49a6-8aba-ff7e2ea735a4', @item_id, 'SNOWLAM', '1MM SL34 5048', 30 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM SL34 5048');
UPDATE item_shades SET available_qty = 30 WHERE item_id = @item_id AND shade_id_label = '1MM SL34 5048';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '3bd0d69a-60b9-4355-bee6-d7e79960c435', @item_id, 'SNOWLAM', '1MM SL34 5057', 21 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM SL34 5057');
UPDATE item_shades SET available_qty = 21 WHERE item_id = @item_id AND shade_id_label = '1MM SL34 5057';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '61c90e8b-3b79-4159-afef-4b90ad9b55f7', @item_id, 'SNOWLAM', '1MM SL34 5088', 11 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM SL34 5088');
UPDATE item_shades SET available_qty = 11 WHERE item_id = @item_id AND shade_id_label = '1MM SL34 5088';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '9f49b6c5-5cde-410e-84a3-06d05e8b25a3', @item_id, 'SNOWLAM', '1MM SL34 5150', 16 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM SL34 5150');
UPDATE item_shades SET available_qty = 16 WHERE item_id = @item_id AND shade_id_label = '1MM SL34 5150';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT 'c2f3f70b-1462-4317-b71b-1df1d55a45c6', @item_id, 'SNOWLAM', '1MM SL34 5151', 18 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM SL34 5151');
UPDATE item_shades SET available_qty = 18 WHERE item_id = @item_id AND shade_id_label = '1MM SL34 5151';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT 'd54415c4-97d2-418b-a8f5-d1d29c94d730', @item_id, 'SNOWLAM', '1MM SL34 5154', 8 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM SL34 5154');
UPDATE item_shades SET available_qty = 8 WHERE item_id = @item_id AND shade_id_label = '1MM SL34 5154';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT 'e4beb2e2-6d9a-4142-abfb-33a4cb44fe69', @item_id, 'SNOWLAM', '1MM SL34 5216', 12 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM SL34 5216');
UPDATE item_shades SET available_qty = 12 WHERE item_id = @item_id AND shade_id_label = '1MM SL34 5216';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT 'dd2086a3-f2f5-4007-aa11-ffeb0a4333c9', @item_id, 'SNOWLAM', '1MM SL35 5050', 13 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM SL35 5050');
UPDATE item_shades SET available_qty = 13 WHERE item_id = @item_id AND shade_id_label = '1MM SL35 5050';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT 'fc8abdd6-3524-480e-89f7-81fa949c7ef6', @item_id, 'SNOWLAM', '1MM SL35 5224', 8 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM SL35 5224');
UPDATE item_shades SET available_qty = 8 WHERE item_id = @item_id AND shade_id_label = '1MM SL35 5224';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '123bc20f-f8d3-4308-9d05-8b0ce8f01107', @item_id, 'SNOWLAM', '1MM SL36 5019', 5 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM SL36 5019');
UPDATE item_shades SET available_qty = 5 WHERE item_id = @item_id AND shade_id_label = '1MM SL36 5019';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '653a4303-2412-40b5-8e1f-4c326fc618e3', @item_id, 'SNOWLAM', '1MM SL36 501', 10 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM SL36 501');
UPDATE item_shades SET available_qty = 10 WHERE item_id = @item_id AND shade_id_label = '1MM SL36 501';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT 'd8888e09-d970-4180-ac8e-64bd9b3c46c6', @item_id, 'SNOWLAM', '1MM SL36 502', 15 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM SL36 502');
UPDATE item_shades SET available_qty = 15 WHERE item_id = @item_id AND shade_id_label = '1MM SL36 502';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT 'e3e37883-285c-4558-a2cd-23acc2755ac7', @item_id, 'SNOWLAM', '1MM SL36 5046', 6 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM SL36 5046');
UPDATE item_shades SET available_qty = 6 WHERE item_id = @item_id AND shade_id_label = '1MM SL36 5046';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '781ecfe5-0b91-4d77-bf52-be6b84692f5f', @item_id, 'SNOWLAM', '1MM SL36 5047', 25 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM SL36 5047');
UPDATE item_shades SET available_qty = 25 WHERE item_id = @item_id AND shade_id_label = '1MM SL36 5047';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '8ce3c2f9-56bc-4e43-9b6e-2de85c61b774', @item_id, 'SNOWLAM', '1MM SL36 5048', 25 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM SL36 5048');
UPDATE item_shades SET available_qty = 25 WHERE item_id = @item_id AND shade_id_label = '1MM SL36 5048';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '5bfd8e1f-ae19-4eda-b705-4bf5254e831d', @item_id, 'SNOWLAM', '1MM SL36 5049', 16 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM SL36 5049');
UPDATE item_shades SET available_qty = 16 WHERE item_id = @item_id AND shade_id_label = '1MM SL36 5049';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT 'edce2cc3-ee43-457b-a130-fe6a74a7ee47', @item_id, 'SNOWLAM', '1MM SL36 5051', 12 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM SL36 5051');
UPDATE item_shades SET available_qty = 12 WHERE item_id = @item_id AND shade_id_label = '1MM SL36 5051';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT 'dbace1a5-3d73-4e27-9fec-0666d61f8b4e', @item_id, 'SNOWLAM', '1MM SL36 5052', 12 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM SL36 5052');
UPDATE item_shades SET available_qty = 12 WHERE item_id = @item_id AND shade_id_label = '1MM SL36 5052';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '577bcc05-28f2-4f13-ac7a-a84625e50860', @item_id, 'SNOWLAM', '1MM SL36 5081', 18 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM SL36 5081');
UPDATE item_shades SET available_qty = 18 WHERE item_id = @item_id AND shade_id_label = '1MM SL36 5081';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '8463508e-63ee-480f-871d-c70d31d58809', @item_id, 'SNOWLAM', '1MM SL36 5085', 24 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM SL36 5085');
UPDATE item_shades SET available_qty = 24 WHERE item_id = @item_id AND shade_id_label = '1MM SL36 5085';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '7070b31a-ad3a-4d81-a70a-8e4a0cd772e5', @item_id, 'SNOWLAM', '1MM SL36 5086', 6 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM SL36 5086');
UPDATE item_shades SET available_qty = 6 WHERE item_id = @item_id AND shade_id_label = '1MM SL36 5086';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT 'df1e5e7a-6fc2-4a23-ab98-35077a5522b6', @item_id, 'SNOWLAM', '1MM SL36 5088', 18 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM SL36 5088');
UPDATE item_shades SET available_qty = 18 WHERE item_id = @item_id AND shade_id_label = '1MM SL36 5088';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '030b6b89-da84-411b-82c8-d1c9ff31f838', @item_id, 'SNOWLAM', '1MM SL36 5089', 16 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM SL36 5089');
UPDATE item_shades SET available_qty = 16 WHERE item_id = @item_id AND shade_id_label = '1MM SL36 5089';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '417f0c47-2d70-48e9-a9a2-147026690765', @item_id, 'SNOWLAM', '1MM SL36 5145', 12 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM SL36 5145');
UPDATE item_shades SET available_qty = 12 WHERE item_id = @item_id AND shade_id_label = '1MM SL36 5145';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '53282aa6-a831-4e19-9ebf-ec41e5136f1c', @item_id, 'SNOWLAM', '1MM SL36 5146', 12 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM SL36 5146');
UPDATE item_shades SET available_qty = 12 WHERE item_id = @item_id AND shade_id_label = '1MM SL36 5146';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT 'cc52d5d3-330c-4376-9327-1879edc1990c', @item_id, 'SNOWLAM', '1MM SL36 5150', 17 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM SL36 5150');
UPDATE item_shades SET available_qty = 17 WHERE item_id = @item_id AND shade_id_label = '1MM SL36 5150';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '7daa4230-d24e-4b30-8661-97c3bf939f0e', @item_id, 'SNOWLAM', '1MM SL36 5152', 14 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM SL36 5152');
UPDATE item_shades SET available_qty = 14 WHERE item_id = @item_id AND shade_id_label = '1MM SL36 5152';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT 'c3ead5dc-652e-4c19-8a5f-758e3d620383', @item_id, 'SNOWLAM', '1MM SL36 5154', 13 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM SL36 5154');
UPDATE item_shades SET available_qty = 13 WHERE item_id = @item_id AND shade_id_label = '1MM SL36 5154';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '46841804-fe2e-4ca8-919b-39edd547827a', @item_id, 'SNOWLAM', '1MM SL36 515', 14 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM SL36 515');
UPDATE item_shades SET available_qty = 14 WHERE item_id = @item_id AND shade_id_label = '1MM SL36 515';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT 'e39fae02-bc1f-4852-8a82-71c81db2c5ff', @item_id, 'SNOWLAM', '1MM SL36 516', 11 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM SL36 516');
UPDATE item_shades SET available_qty = 11 WHERE item_id = @item_id AND shade_id_label = '1MM SL36 516';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '354ac5b0-9f1f-46cf-a7f6-e29c4ccd53d8', @item_id, 'SNOWLAM', '1MM SL36 5227', 15 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM SL36 5227');
UPDATE item_shades SET available_qty = 15 WHERE item_id = @item_id AND shade_id_label = '1MM SL36 5227';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '64172731-27bc-4c3a-b126-44584f3c8283', @item_id, 'SNOWLAM', '1MM SL36 522', 10 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM SL36 522');
UPDATE item_shades SET available_qty = 10 WHERE item_id = @item_id AND shade_id_label = '1MM SL36 522';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT 'fd9976e6-0ebf-4543-89e5-4cb851c50c6e', @item_id, 'SNOWLAM', '1MM SL36 576', 19 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM SL36 576');
UPDATE item_shades SET available_qty = 19 WHERE item_id = @item_id AND shade_id_label = '1MM SL36 576';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '1b924be3-c3be-4976-a0f3-36fac7c936ff', @item_id, 'SNOWLAM', '1MM SL36 577', 4 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM SL36 577');
UPDATE item_shades SET available_qty = 4 WHERE item_id = @item_id AND shade_id_label = '1MM SL36 577';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '30a29101-00e8-49de-a392-115e18341d61', @item_id, 'SNOWLAM', '1MM SL36 578', 13 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM SL36 578');
UPDATE item_shades SET available_qty = 13 WHERE item_id = @item_id AND shade_id_label = '1MM SL36 578';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '474c3882-9682-48be-9b33-cb1633dbd986', @item_id, 'SNOWLAM', '1MM SL36 579', 7 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM SL36 579');
UPDATE item_shades SET available_qty = 7 WHERE item_id = @item_id AND shade_id_label = '1MM SL36 579';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '90f75a8f-f93b-4be3-8534-3296e2523a56', @item_id, 'SNOWLAM', '1MM SL36 580', 29 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM SL36 580');
UPDATE item_shades SET available_qty = 29 WHERE item_id = @item_id AND shade_id_label = '1MM SL36 580';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT 'eae33951-796e-4cbd-ba72-69e71e60228e', @item_id, 'SNOWLAM', '1MM SL36 581', 7 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM SL36 581');
UPDATE item_shades SET available_qty = 7 WHERE item_id = @item_id AND shade_id_label = '1MM SL36 581';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '2c97e04a-4b5f-4cfe-b270-ebc2ddc80f15', @item_id, 'SNOWLAM', '1MM SL36 582', 12 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM SL36 582');
UPDATE item_shades SET available_qty = 12 WHERE item_id = @item_id AND shade_id_label = '1MM SL36 582';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT 'bf82a21b-acb8-4d91-9077-879733744bb5', @item_id, 'SNOWLAM', '1MM SL36 583', 17 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM SL36 583');
UPDATE item_shades SET available_qty = 17 WHERE item_id = @item_id AND shade_id_label = '1MM SL36 583';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '9d684517-f8d2-4e87-8403-2a234cc73a74', @item_id, 'SNOWLAM', '1MM SL36 584', 14 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM SL36 584');
UPDATE item_shades SET available_qty = 14 WHERE item_id = @item_id AND shade_id_label = '1MM SL36 584';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '76e9ceeb-b397-4a53-b7b7-41b43b91b369', @item_id, 'SNOWLAM', '1MM SL36 585', 8 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM SL36 585');
UPDATE item_shades SET available_qty = 8 WHERE item_id = @item_id AND shade_id_label = '1MM SL36 585';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '808f1706-9d6c-4d51-9a8f-0ea0c687a58a', @item_id, 'SNOWLAM', '1MM SL36 587', 6 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM SL36 587');
UPDATE item_shades SET available_qty = 6 WHERE item_id = @item_id AND shade_id_label = '1MM SL36 587';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '7860aa10-1caf-4725-a418-16c4ceac8750', @item_id, 'SNOWLAM', '1MM SL36 588', 21 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM SL36 588');
UPDATE item_shades SET available_qty = 21 WHERE item_id = @item_id AND shade_id_label = '1MM SL36 588';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '16aed25d-c6e6-433a-9b71-d36f65b8ef10', @item_id, 'SNOWLAM', '1MM SL36 589', 8 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM SL36 589');
UPDATE item_shades SET available_qty = 8 WHERE item_id = @item_id AND shade_id_label = '1MM SL36 589';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT 'bd505cbd-e4b9-4bc6-8754-626926c6b241', @item_id, 'SNOWLAM', '1MM SL36 590', 2 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM SL36 590');
UPDATE item_shades SET available_qty = 2 WHERE item_id = @item_id AND shade_id_label = '1MM SL36 590';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '2149c748-716f-4f5a-a467-16c4414d52d3', @item_id, 'SNOWLAM', '1MM SL36 591', 19 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM SL36 591');
UPDATE item_shades SET available_qty = 19 WHERE item_id = @item_id AND shade_id_label = '1MM SL36 591';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT 'b2331a82-a887-44fb-9cd8-d07709a99a35', @item_id, 'SNOWLAM', '1MM SL36 593', 8 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM SL36 593');
UPDATE item_shades SET available_qty = 8 WHERE item_id = @item_id AND shade_id_label = '1MM SL36 593';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '6d5f2b18-197f-4925-b1c6-cf18eaddae65', @item_id, 'SNOWLAM', '1MM SL36 594', 7 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM SL36 594');
UPDATE item_shades SET available_qty = 7 WHERE item_id = @item_id AND shade_id_label = '1MM SL36 594';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT 'c988c42a-d464-4220-a169-f79a46095f4e', @item_id, 'SNOWLAM', '1MM SL36 595', 6 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM SL36 595');
UPDATE item_shades SET available_qty = 6 WHERE item_id = @item_id AND shade_id_label = '1MM SL36 595';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '7565ea9d-acf5-4a51-885a-0ab312589ef9', @item_id, 'SNOWLAM', '1MM SL36 597', 6 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM SL36 597');
UPDATE item_shades SET available_qty = 6 WHERE item_id = @item_id AND shade_id_label = '1MM SL36 597';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT 'c6d30c1d-02ae-408e-8a9a-0ea68df238cb', @item_id, 'SNOWLAM', '1MM SL36 598', 5 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM SL36 598');
UPDATE item_shades SET available_qty = 5 WHERE item_id = @item_id AND shade_id_label = '1MM SL36 598';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT 'c197b76a-421f-45a2-a065-c85fd63913de', @item_id, 'SNOWLAM', '1MM SL38 5010', 7 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM SL38 5010');
UPDATE item_shades SET available_qty = 7 WHERE item_id = @item_id AND shade_id_label = '1MM SL38 5010';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '8e4a91d2-8285-4ec4-b903-fe2b724d6980', @item_id, 'SNOWLAM', '1MM SL38 5216', 8 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM SL38 5216');
UPDATE item_shades SET available_qty = 8 WHERE item_id = @item_id AND shade_id_label = '1MM SL38 5216';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '27604424-13ed-49d7-ae6a-7286b1d4443a', @item_id, 'SNOWLAM', '1MM SL53 5147', 8 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM SL53 5147');
UPDATE item_shades SET available_qty = 8 WHERE item_id = @item_id AND shade_id_label = '1MM SL53 5147';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '3c478287-c9cd-4480-a352-af4be7bbb96c', @item_id, 'SNOWLAM', '1MM SL53 5148', 7 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM SL53 5148');
UPDATE item_shades SET available_qty = 7 WHERE item_id = @item_id AND shade_id_label = '1MM SL53 5148';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '3082dd71-e292-43b5-8bd6-8d30dae00f50', @item_id, 'SNOWLAM', '1MM SL57 5043', 15 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM SL57 5043');
UPDATE item_shades SET available_qty = 15 WHERE item_id = @item_id AND shade_id_label = '1MM SL57 5043';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT 'bf801093-8235-4267-8cda-36f723d3699f', @item_id, 'SNOWLAM', '1MM SL57 5044', 12 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM SL57 5044');
UPDATE item_shades SET available_qty = 12 WHERE item_id = @item_id AND shade_id_label = '1MM SL57 5044';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT 'e8b4b2f6-1e4d-4785-8c37-4253a629fd77', @item_id, 'SNOWLAM', '1MM SL57 5047', 10 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM SL57 5047');
UPDATE item_shades SET available_qty = 10 WHERE item_id = @item_id AND shade_id_label = '1MM SL57 5047';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '91dae634-bdf5-4ff4-83ec-c96b4a7e5b52', @item_id, 'SNOWLAM', '1MM SL57 5048', 8 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM SL57 5048');
UPDATE item_shades SET available_qty = 8 WHERE item_id = @item_id AND shade_id_label = '1MM SL57 5048';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '3e789350-192a-41e4-b8e3-e1b4c437766b', @item_id, 'SNOWLAM', '1MM SL58 5031', 14 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM SL58 5031');
UPDATE item_shades SET available_qty = 14 WHERE item_id = @item_id AND shade_id_label = '1MM SL58 5031';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT 'dd7efa69-99bb-4337-b892-f42dfe1356a2', @item_id, 'SNOWLAM', '1MM SL58 5032', 10 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM SL58 5032');
UPDATE item_shades SET available_qty = 10 WHERE item_id = @item_id AND shade_id_label = '1MM SL58 5032';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '6500136b-aa9f-436b-97f6-256de66385ea', @item_id, 'SNOWLAM', '1MM SL58 5041', 21 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM SL58 5041');
UPDATE item_shades SET available_qty = 21 WHERE item_id = @item_id AND shade_id_label = '1MM SL58 5041';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT 'fe911233-23a4-43cc-bfe4-6780fe6b21ca', @item_id, 'SNOWLAM', '1MM SL58 5237', 10 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM SL58 5237');
UPDATE item_shades SET available_qty = 10 WHERE item_id = @item_id AND shade_id_label = '1MM SL58 5237';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '55d68dd8-08d6-438e-9064-6521562e7412', @item_id, 'SNOWLAM', '1MM SL60 5088', 26 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM SL60 5088');
UPDATE item_shades SET available_qty = 26 WHERE item_id = @item_id AND shade_id_label = '1MM SL60 5088';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '3c51820c-d0fa-4f43-8ed9-fff2d7dbf884', @item_id, 'SNOWLAM', '1MM SL63 5085', 14 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM SL63 5085');
UPDATE item_shades SET available_qty = 14 WHERE item_id = @item_id AND shade_id_label = '1MM SL63 5085';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '9bebd976-595d-4c12-966e-6cb070425a85', @item_id, 'SNOWLAM', '1MM SL63 5086', 19 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM SL63 5086');
UPDATE item_shades SET available_qty = 19 WHERE item_id = @item_id AND shade_id_label = '1MM SL63 5086';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '6ffcf7c7-0278-4326-b4d0-cb637f350a9f', @item_id, 'SNOWLAM', '1MM SL69 5083', 16 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM SL69 5083');
UPDATE item_shades SET available_qty = 16 WHERE item_id = @item_id AND shade_id_label = '1MM SL69 5083';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT 'c748f64f-9488-4cce-b36a-3b019bfe4bb1', @item_id, 'SNOWLAM', '1MM SL69 5085', 24 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM SL69 5085');
UPDATE item_shades SET available_qty = 24 WHERE item_id = @item_id AND shade_id_label = '1MM SL69 5085';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '9b8eff78-c080-4d7c-8c96-794edd6ad6e1', @item_id, 'SNOWLAM', '1MM SL73 5041', 10 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM SL73 5041');
UPDATE item_shades SET available_qty = 10 WHERE item_id = @item_id AND shade_id_label = '1MM SL73 5041';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '81b96982-6d19-411b-bcf6-48dd71eed5b6', @item_id, 'SNOWLAM', '1MM SL73 5043', 20 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM SL73 5043');
UPDATE item_shades SET available_qty = 20 WHERE item_id = @item_id AND shade_id_label = '1MM SL73 5043';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT 'a55ee392-c449-482a-a6a8-2410a387999b', @item_id, 'SNOWLAM', '1MM SL73 5057', 9 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM SL73 5057');
UPDATE item_shades SET available_qty = 9 WHERE item_id = @item_id AND shade_id_label = '1MM SL73 5057';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT 'b7064abe-6cb0-4ca6-be11-1370f5bbf918', @item_id, 'SNOWLAM', '1MM SL79 5041', 9 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM SL79 5041');
UPDATE item_shades SET available_qty = 9 WHERE item_id = @item_id AND shade_id_label = '1MM SL79 5041';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '1870ec69-ec00-4b69-8084-71e5bb5ecc33', @item_id, 'SNOWLAM', '1MM SL79 5043', 24 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM SL79 5043');
UPDATE item_shades SET available_qty = 24 WHERE item_id = @item_id AND shade_id_label = '1MM SL79 5043';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '15919618-8fff-4db1-9875-92dd7b43900a', @item_id, 'SNOWLAM', '1MM SL79 5045', 19 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM SL79 5045');
UPDATE item_shades SET available_qty = 19 WHERE item_id = @item_id AND shade_id_label = '1MM SL79 5045';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '7311fde8-4b38-473a-9d62-516f93704a29', @item_id, 'SNOWLAM', '1MM SL79 5083', 20 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM SL79 5083');
UPDATE item_shades SET available_qty = 20 WHERE item_id = @item_id AND shade_id_label = '1MM SL79 5083';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '191fc2b5-58dc-43d1-a1f2-3c628697f234', @item_id, 'SNOWLAM', '1MM SL79 5084', 9 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM SL79 5084');
UPDATE item_shades SET available_qty = 9 WHERE item_id = @item_id AND shade_id_label = '1MM SL79 5084';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT 'bae05d6b-a9cd-4010-9c46-3bbf7d512423', @item_id, 'SNOWLAM', '1MM SL80 5042', 30 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM SL80 5042');
UPDATE item_shades SET available_qty = 30 WHERE item_id = @item_id AND shade_id_label = '1MM SL80 5042';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '93f2da92-1767-4d3d-acc9-d81a21f1021a', @item_id, 'SNOWLAM', '1MM SL80 5049', 15 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM SL80 5049');
UPDATE item_shades SET available_qty = 15 WHERE item_id = @item_id AND shade_id_label = '1MM SL80 5049';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT 'ad324334-314a-48df-8662-42115c906f2a', @item_id, 'SNOWLAM', '1MM SL80 5084', 5 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM SL80 5084');
UPDATE item_shades SET available_qty = 5 WHERE item_id = @item_id AND shade_id_label = '1MM SL80 5084';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '1c3d6f65-1e75-4d98-a614-1daefc842e81', @item_id, 'SNOWLAM', '1MM SL80 5086', 5 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM SL80 5086');
UPDATE item_shades SET available_qty = 5 WHERE item_id = @item_id AND shade_id_label = '1MM SL80 5086';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT 'e04909b5-c3e3-4f7a-87cf-b1435a888988', @item_id, 'SNOWLAM', '1MM SL81 5081', 18 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM SL81 5081');
UPDATE item_shades SET available_qty = 18 WHERE item_id = @item_id AND shade_id_label = '1MM SL81 5081';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT 'e380187a-a4d5-43d2-886f-399cd7ed4ba7', @item_id, 'SNOWLAM', '1MM SL81 5089', 12 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM SL81 5089');
UPDATE item_shades SET available_qty = 12 WHERE item_id = @item_id AND shade_id_label = '1MM SL81 5089';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '1179247c-f182-44ee-ac1e-66370a972f62', @item_id, 'SNOWLAM', '1MM SL82 5084', 8 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM SL82 5084');
UPDATE item_shades SET available_qty = 8 WHERE item_id = @item_id AND shade_id_label = '1MM SL82 5084';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT 'ea6f58a1-b7bd-4ef6-ad6b-9582a0fa8385', @item_id, 'SNOWLAM', '1MM SL82 5089', 8 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM SL82 5089');
UPDATE item_shades SET available_qty = 8 WHERE item_id = @item_id AND shade_id_label = '1MM SL82 5089';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '92028d00-5090-425a-930d-49e9f063ba18', @item_id, 'SNOWLAM', '1MM SL88 5146', 5 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM SL88 5146');
UPDATE item_shades SET available_qty = 5 WHERE item_id = @item_id AND shade_id_label = '1MM SL88 5146';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '5194565d-ed77-4671-bfb7-bfb5aa055d82', @item_id, 'SNOWLAM', '1MM SL91 5154', 10 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM SL91 5154');
UPDATE item_shades SET available_qty = 10 WHERE item_id = @item_id AND shade_id_label = '1MM SL91 5154';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT 'f3652571-2740-4b8d-b943-5b91d06baeb4', @item_id, 'SNOWLAM', '1MM SL92 5145', 10 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM SL92 5145');
UPDATE item_shades SET available_qty = 10 WHERE item_id = @item_id AND shade_id_label = '1MM SL92 5145';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '61e62238-2f3d-44f2-84d5-c5810c239478', @item_id, 'SNOWLAM', '1MM SL93 5151', 8 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM SL93 5151');
UPDATE item_shades SET available_qty = 8 WHERE item_id = @item_id AND shade_id_label = '1MM SL93 5151';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '4b21de14-de85-4fb6-a814-f2968534ae0c', @item_id, 'SNOWLAM', '1MM SL93 5153', 13 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM SL93 5153');
UPDATE item_shades SET available_qty = 13 WHERE item_id = @item_id AND shade_id_label = '1MM SL93 5153';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT 'a0e23edd-4024-4e28-868a-028b98925ee2', @item_id, 'SNOWLAM', '1MM SL94 5143', 10 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM SL94 5143');
UPDATE item_shades SET available_qty = 10 WHERE item_id = @item_id AND shade_id_label = '1MM SL94 5143';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '0c182ac7-f014-4c34-96f8-c550dd638c3f', @item_id, 'SNOWLAM', '1MM SL94 5144', 10 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM SL94 5144');
UPDATE item_shades SET available_qty = 10 WHERE item_id = @item_id AND shade_id_label = '1MM SL94 5144';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '740a7296-03af-4b2d-959c-3742cf036038', @item_id, 'SNOWLAM', '1MM SM 5537', 21 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM SM 5537');
UPDATE item_shades SET available_qty = 21 WHERE item_id = @item_id AND shade_id_label = '1MM SM 5537';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '75c633ad-f8f6-4530-99b2-41f2f883b911', @item_id, 'SNOWLAM', '1MM SM 5538', 17 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM SM 5538');
UPDATE item_shades SET available_qty = 17 WHERE item_id = @item_id AND shade_id_label = '1MM SM 5538';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '0f5e0df2-f775-4408-925d-18b21d03afea', @item_id, 'SNOWLAM', '1MM SM 5539', 10 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM SM 5539');
UPDATE item_shades SET available_qty = 10 WHERE item_id = @item_id AND shade_id_label = '1MM SM 5539';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '7401e573-4305-42fd-b371-fbe237939d6a', @item_id, 'SNOWLAM', '1MM SM 5540', 19 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM SM 5540');
UPDATE item_shades SET available_qty = 19 WHERE item_id = @item_id AND shade_id_label = '1MM SM 5540';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT 'd4964fd2-d7ae-4add-9bfc-6d0b08e44f47', @item_id, 'SNOWLAM', '1MM SM 5541', 45 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '1MM SM 5541');
UPDATE item_shades SET available_qty = 45 WHERE item_id = @item_id AND shade_id_label = '1MM SM 5541';

SET FOREIGN_KEY_CHECKS = 1;
