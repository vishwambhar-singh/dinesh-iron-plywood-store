-- Corrected Inventory Update for .72mm Kofflam
SET FOREIGN_KEY_CHECKS = 0;

-- 1. Ensure master item exists
INSERT IGNORE INTO items (id, name, hsn_code, base_pakka_selling_rate, tax_bracket_percent) 
VALUES ('d4fc9882-5a6f-498c-ac9f-5e2901d65153', '.72mm Kofflam', '4410', 0.00, 18.00);

SET @item_id = (SELECT id FROM items WHERE name = '.72mm Kofflam' LIMIT 1);

-- 2. Sync Shades (Add if new, Update if exists)
INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '2a34d161-8a9f-4db6-9ed5-93a5bdd69483', @item_id, 'KOFFLAM', '.72MM 102 GL', 24 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '.72MM 102 GL');
UPDATE item_shades SET available_qty = 24 WHERE item_id = @item_id AND shade_id_label = '.72MM 102 GL';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '7897499e-ffd8-417c-b81c-5908231fb6be', @item_id, 'KOFFLAM', '.72MM 102 MT Off White', 8 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '.72MM 102 MT Off White');
UPDATE item_shades SET available_qty = 8 WHERE item_id = @item_id AND shade_id_label = '.72MM 102 MT Off White';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT 'a744ff99-456c-4f3f-b543-13c23164e19f', @item_id, 'KOFFLAM', '.72MM 103 GL', 18 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '.72MM 103 GL');
UPDATE item_shades SET available_qty = 18 WHERE item_id = @item_id AND shade_id_label = '.72MM 103 GL';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '20e529f3-9698-4928-b712-314ff31596ff', @item_id, 'KOFFLAM', '.72MM 103 MT', 21 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '.72MM 103 MT');
UPDATE item_shades SET available_qty = 21 WHERE item_id = @item_id AND shade_id_label = '.72MM 103 MT';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '57921108-b97e-4682-9689-60290efe246e', @item_id, 'KOFFLAM', '.72MM 104 GL', 1 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '.72MM 104 GL');
UPDATE item_shades SET available_qty = 1 WHERE item_id = @item_id AND shade_id_label = '.72MM 104 GL';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '90d19d7d-7d59-43cb-a75f-930bb53b86ab', @item_id, 'KOFFLAM', '.72MM 106 GL', 88 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '.72MM 106 GL');
UPDATE item_shades SET available_qty = 88 WHERE item_id = @item_id AND shade_id_label = '.72MM 106 GL';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '69baab2b-2287-475e-91e1-08cb5b7404ad', @item_id, 'KOFFLAM', '.72MM 106 MT', 78 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '.72MM 106 MT');
UPDATE item_shades SET available_qty = 78 WHERE item_id = @item_id AND shade_id_label = '.72MM 106 MT';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '0082b1eb-c2e5-441e-8190-ce4d17299215', @item_id, 'KOFFLAM', '.72MM 107 GL', 9 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '.72MM 107 GL');
UPDATE item_shades SET available_qty = 9 WHERE item_id = @item_id AND shade_id_label = '.72MM 107 GL';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '3b849b46-6e1a-4b6f-8e5b-35c8495b878a', @item_id, 'KOFFLAM', '.72MM 107 MT', 7 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '.72MM 107 MT');
UPDATE item_shades SET available_qty = 7 WHERE item_id = @item_id AND shade_id_label = '.72MM 107 MT';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT 'fc1a4820-6310-4d27-9ed1-28c1f6d131c1', @item_id, 'KOFFLAM', '.72MM 108 GL', 110 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '.72MM 108 GL');
UPDATE item_shades SET available_qty = 110 WHERE item_id = @item_id AND shade_id_label = '.72MM 108 GL';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT 'b29c4ba5-1a9c-40f3-a4f6-0e27cb1eb406', @item_id, 'KOFFLAM', '.72MM 108 MT', 98 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '.72MM 108 MT');
UPDATE item_shades SET available_qty = 98 WHERE item_id = @item_id AND shade_id_label = '.72MM 108 MT';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT 'a38596dd-18b6-48b6-a7bf-833d2a3d0546', @item_id, 'KOFFLAM', '.72MM 151 MT', 16 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '.72MM 151 MT');
UPDATE item_shades SET available_qty = 16 WHERE item_id = @item_id AND shade_id_label = '.72MM 151 MT';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '67a563d9-ec4c-44f2-817f-3ee3954eb241', @item_id, 'KOFFLAM', '.72MM 152 MT', 5 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '.72MM 152 MT');
UPDATE item_shades SET available_qty = 5 WHERE item_id = @item_id AND shade_id_label = '.72MM 152 MT';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT 'b16d3fab-cb57-4fef-984c-d503dbe22990', @item_id, 'KOFFLAM', '.72MM 153 MT', 14 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '.72MM 153 MT');
UPDATE item_shades SET available_qty = 14 WHERE item_id = @item_id AND shade_id_label = '.72MM 153 MT';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT 'a04f02b5-8fc7-46d9-b3c0-e7ce72e43f7c', @item_id, 'KOFFLAM', '.72MM 154 MT', 1 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '.72MM 154 MT');
UPDATE item_shades SET available_qty = 1 WHERE item_id = @item_id AND shade_id_label = '.72MM 154 MT';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT 'ade6cd83-3ef6-481d-8858-f56628e2f063', @item_id, 'KOFFLAM', '.72MM 155 HG', 35 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '.72MM 155 HG');
UPDATE item_shades SET available_qty = 35 WHERE item_id = @item_id AND shade_id_label = '.72MM 155 HG';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '9bd7119a-05e4-4bed-8c6c-26271676473a', @item_id, 'KOFFLAM', '.72MM 156 HG', 1 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '.72MM 156 HG');
UPDATE item_shades SET available_qty = 1 WHERE item_id = @item_id AND shade_id_label = '.72MM 156 HG';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '0ad688a8-59f2-479e-b06c-3c3ac5445779', @item_id, 'KOFFLAM', '.72MM 156 HO', 115 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '.72MM 156 HO');
UPDATE item_shades SET available_qty = 115 WHERE item_id = @item_id AND shade_id_label = '.72MM 156 HO';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '832faa27-c047-491c-90fd-3d442abd8231', @item_id, 'KOFFLAM', '.72MM 156 SF', 6 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '.72MM 156 SF');
UPDATE item_shades SET available_qty = 6 WHERE item_id = @item_id AND shade_id_label = '.72MM 156 SF';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '24b74459-fb56-47f7-83b9-c18c4469f863', @item_id, 'KOFFLAM', '.72MM 157 HG', 50 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '.72MM 157 HG');
UPDATE item_shades SET available_qty = 50 WHERE item_id = @item_id AND shade_id_label = '.72MM 157 HG';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '587017fc-ac1d-4ddf-87cd-f0fe5955b67e', @item_id, 'KOFFLAM', '.72MM 157 SF', 2 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '.72MM 157 SF');
UPDATE item_shades SET available_qty = 2 WHERE item_id = @item_id AND shade_id_label = '.72MM 157 SF';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '0f17ff38-b9df-4104-9ae4-7e3fb7b994fb', @item_id, 'KOFFLAM', '.72MM 160 GF', 54 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '.72MM 160 GF');
UPDATE item_shades SET available_qty = 54 WHERE item_id = @item_id AND shade_id_label = '.72MM 160 GF';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '9d289870-9805-4c46-b280-7b7b8cbc3201', @item_id, 'KOFFLAM', '.72MM 160 HG', 36 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '.72MM 160 HG');
UPDATE item_shades SET available_qty = 36 WHERE item_id = @item_id AND shade_id_label = '.72MM 160 HG';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '7324a316-d085-4a19-94b3-163bdf37a52f', @item_id, 'KOFFLAM', '.72MM 160 HO', 143 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '.72MM 160 HO');
UPDATE item_shades SET available_qty = 143 WHERE item_id = @item_id AND shade_id_label = '.72MM 160 HO';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '8cfd4380-e876-4d51-8676-d30ed9da1959', @item_id, 'KOFFLAM', '.72MM 160 MT', 6 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '.72MM 160 MT');
UPDATE item_shades SET available_qty = 6 WHERE item_id = @item_id AND shade_id_label = '.72MM 160 MT';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT 'b06b2cc0-ed4c-46bd-b6b9-664a4e834dd2', @item_id, 'KOFFLAM', '.72MM 161 HG', 56 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '.72MM 161 HG');
UPDATE item_shades SET available_qty = 56 WHERE item_id = @item_id AND shade_id_label = '.72MM 161 HG';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '52952d37-20f5-4ed6-8b67-64b913feed02', @item_id, 'KOFFLAM', '.72MM 161 MT', 101 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '.72MM 161 MT');
UPDATE item_shades SET available_qty = 101 WHERE item_id = @item_id AND shade_id_label = '.72MM 161 MT';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '20cb5f92-bf18-4386-a6c7-7e8f77ca5363', @item_id, 'KOFFLAM', '.72MM 162 MT', 56 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '.72MM 162 MT');
UPDATE item_shades SET available_qty = 56 WHERE item_id = @item_id AND shade_id_label = '.72MM 162 MT';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '2200ad5c-6154-4af4-8371-0a7cc4f12f99', @item_id, 'KOFFLAM', '.72MM 163 MT', 12 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '.72MM 163 MT');
UPDATE item_shades SET available_qty = 12 WHERE item_id = @item_id AND shade_id_label = '.72MM 163 MT';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '803b3976-c044-4628-9e4f-e5c321a1efed', @item_id, 'KOFFLAM', '.72MM 164 MT', 1 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '.72MM 164 MT');
UPDATE item_shades SET available_qty = 1 WHERE item_id = @item_id AND shade_id_label = '.72MM 164 MT';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '1277519a-3a86-4288-b535-1eaca9d5f7d8', @item_id, 'KOFFLAM', '.72MM 168 HO', 123 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '.72MM 168 HO');
UPDATE item_shades SET available_qty = 123 WHERE item_id = @item_id AND shade_id_label = '.72MM 168 HO';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '0db1da99-21ba-45b7-8c02-04d97081975f', @item_id, 'KOFFLAM', '.72MM 177 HG', 64 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '.72MM 177 HG');
UPDATE item_shades SET available_qty = 64 WHERE item_id = @item_id AND shade_id_label = '.72MM 177 HG';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '93264b68-f11c-47fb-87a5-2814df514fb3', @item_id, 'KOFFLAM', '.72MM 203 GF', 87 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '.72MM 203 GF');
UPDATE item_shades SET available_qty = 87 WHERE item_id = @item_id AND shade_id_label = '.72MM 203 GF';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '799570e8-381e-4dfb-bbb2-ff8c52de7ec7', @item_id, 'KOFFLAM', '.72MM 258 MT', 2 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '.72MM 258 MT');
UPDATE item_shades SET available_qty = 2 WHERE item_id = @item_id AND shade_id_label = '.72MM 258 MT';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT 'a08a7702-5103-475d-aaa9-0cdaaece0cf5', @item_id, 'KOFFLAM', '.72MM 271 HG', 57 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '.72MM 271 HG');
UPDATE item_shades SET available_qty = 57 WHERE item_id = @item_id AND shade_id_label = '.72MM 271 HG';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT 'c96b95b7-36b7-4277-95e7-c5c864456555', @item_id, 'KOFFLAM', '.72MM 271 MT', 3 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '.72MM 271 MT');
UPDATE item_shades SET available_qty = 3 WHERE item_id = @item_id AND shade_id_label = '.72MM 271 MT';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT 'de83f51a-9947-492f-89ca-ea663522273d', @item_id, 'KOFFLAM', '.72MM 272 GF', 106 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '.72MM 272 GF');
UPDATE item_shades SET available_qty = 106 WHERE item_id = @item_id AND shade_id_label = '.72MM 272 GF';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '65c07724-f9df-40b0-9513-e8a9210cf40d', @item_id, 'KOFFLAM', '.72MM 272 HO', 185 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '.72MM 272 HO');
UPDATE item_shades SET available_qty = 185 WHERE item_id = @item_id AND shade_id_label = '.72MM 272 HO';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '5c7f4e4a-4013-4b13-90e8-c19a0cfcb51e', @item_id, 'KOFFLAM', '.72MM 273 GF', 32 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '.72MM 273 GF');
UPDATE item_shades SET available_qty = 32 WHERE item_id = @item_id AND shade_id_label = '.72MM 273 GF';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT 'aa30a1ef-ef75-4e4d-8d1a-531803c3a615', @item_id, 'KOFFLAM', '.72MM 274 HG', 41 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '.72MM 274 HG');
UPDATE item_shades SET available_qty = 41 WHERE item_id = @item_id AND shade_id_label = '.72MM 274 HG';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT 'f080e250-b031-449f-b768-6e1d09431473', @item_id, 'KOFFLAM', '.72MM 275 HG', 8 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '.72MM 275 HG');
UPDATE item_shades SET available_qty = 8 WHERE item_id = @item_id AND shade_id_label = '.72MM 275 HG';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '4213f620-b808-4f9e-b2e9-bc3979e0aecb', @item_id, 'KOFFLAM', '.72MM 275 MT Walnut', 17 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '.72MM 275 MT Walnut');
UPDATE item_shades SET available_qty = 17 WHERE item_id = @item_id AND shade_id_label = '.72MM 275 MT Walnut';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '246643ab-967f-4a7d-ac19-e539f3825496', @item_id, 'KOFFLAM', '.72MM 278 HG', 59 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '.72MM 278 HG');
UPDATE item_shades SET available_qty = 59 WHERE item_id = @item_id AND shade_id_label = '.72MM 278 HG';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT 'b2ff48ac-0d21-446e-bdb0-bd1f39584910', @item_id, 'KOFFLAM', '.72MM 279 HG', 41 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '.72MM 279 HG');
UPDATE item_shades SET available_qty = 41 WHERE item_id = @item_id AND shade_id_label = '.72MM 279 HG';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT 'fe97caaf-7b36-477b-94e1-55a15d9bdbf7', @item_id, 'KOFFLAM', '.72MM 301 MT', 6 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '.72MM 301 MT');
UPDATE item_shades SET available_qty = 6 WHERE item_id = @item_id AND shade_id_label = '.72MM 301 MT';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '9d3131b9-c6d6-4793-a2c2-41883329277b', @item_id, 'KOFFLAM', '.72MM 302 MT', 1 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '.72MM 302 MT');
UPDATE item_shades SET available_qty = 1 WHERE item_id = @item_id AND shade_id_label = '.72MM 302 MT';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '5489d761-3b6c-48ee-98f4-e422e7274106', @item_id, 'KOFFLAM', '.72MM 401 HG', 38 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '.72MM 401 HG');
UPDATE item_shades SET available_qty = 38 WHERE item_id = @item_id AND shade_id_label = '.72MM 401 HG';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT 'cbe89fde-1a96-4454-99a8-59de26619b46', @item_id, 'KOFFLAM', '.72MM 401 SF', 2 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '.72MM 401 SF');
UPDATE item_shades SET available_qty = 2 WHERE item_id = @item_id AND shade_id_label = '.72MM 401 SF';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '5643960f-8d80-4f30-9702-d80924084bde', @item_id, 'KOFFLAM', '.72MM 402 HG', 45 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '.72MM 402 HG');
UPDATE item_shades SET available_qty = 45 WHERE item_id = @item_id AND shade_id_label = '.72MM 402 HG';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT 'd940cf72-5cc9-47c2-a7df-ddbb7b833729', @item_id, 'KOFFLAM', '.72MM 402 SF', 12 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '.72MM 402 SF');
UPDATE item_shades SET available_qty = 12 WHERE item_id = @item_id AND shade_id_label = '.72MM 402 SF';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '45f4f7e3-b326-435f-82f3-5d8cbc925e23', @item_id, 'KOFFLAM', '.72MM 403 MT', 46 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '.72MM 403 MT');
UPDATE item_shades SET available_qty = 46 WHERE item_id = @item_id AND shade_id_label = '.72MM 403 MT';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT 'd5631cbb-e170-4466-8933-0ea9599c42b3', @item_id, 'KOFFLAM', '.72MM 404 MT', 41 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '.72MM 404 MT');
UPDATE item_shades SET available_qty = 41 WHERE item_id = @item_id AND shade_id_label = '.72MM 404 MT';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '2994bb5e-d6f0-4eca-b543-c3fd03eee58c', @item_id, 'KOFFLAM', '.72MM 406 MT', 2 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '.72MM 406 MT');
UPDATE item_shades SET available_qty = 2 WHERE item_id = @item_id AND shade_id_label = '.72MM 406 MT';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '95347760-7a2b-4671-9ded-29a5bd855cab', @item_id, 'KOFFLAM', '.72MM 407 MT', 15 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '.72MM 407 MT');
UPDATE item_shades SET available_qty = 15 WHERE item_id = @item_id AND shade_id_label = '.72MM 407 MT';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '1d4a848d-1c58-46cf-b248-974cdcceb069', @item_id, 'KOFFLAM', '.72MM GL 101', 1 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '.72MM GL 101');
UPDATE item_shades SET available_qty = 1 WHERE item_id = @item_id AND shade_id_label = '.72MM GL 101';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT 'db1fbce5-2360-438f-827a-9ed53651b862', @item_id, 'KOFFLAM', '.72MM HG PR 408', 76 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '.72MM HG PR 408');
UPDATE item_shades SET available_qty = 76 WHERE item_id = @item_id AND shade_id_label = '.72MM HG PR 408';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT '5aa7e491-1d81-449c-8162-0fa845c04b7a', @item_id, 'KOFFLAM', '.72MM HG PR 409', 50 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '.72MM HG PR 409');
UPDATE item_shades SET available_qty = 50 WHERE item_id = @item_id AND shade_id_label = '.72MM HG PR 409';

INSERT INTO item_shades (id, item_id, shade_category, shade_id_label, available_qty) 
SELECT 'f285ebb1-e8a6-47f5-8056-a7a74bb0a329', @item_id, 'KOFFLAM', '.72MM HG PR 410', 81 FROM DUAL 
WHERE NOT EXISTS (SELECT 1 FROM item_shades WHERE item_id = @item_id AND shade_id_label = '.72MM HG PR 410');
UPDATE item_shades SET available_qty = 81 WHERE item_id = @item_id AND shade_id_label = '.72MM HG PR 410';

SET FOREIGN_KEY_CHECKS = 1;
