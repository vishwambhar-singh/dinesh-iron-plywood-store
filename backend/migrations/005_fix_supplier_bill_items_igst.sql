-- Migration 005: Populate IGST for interstate supplier bills where IGST was stored as 0 or in CGST/SGST
UPDATE supplier_bill_items sbi
JOIN supplier_bills sb ON sbi.bill_id = sb.id
SET 
  sbi.igst = CASE 
    WHEN (sbi.cgst > 0 OR sbi.sgst > 0) THEN (COALESCE(sbi.cgst, 0) + COALESCE(sbi.sgst, 0))
    WHEN (sbi.price_after_gst > (sbi.received_qty * sbi.price)) THEN ROUND(sbi.price_after_gst - (sbi.received_qty * sbi.price), 2)
    ELSE sbi.igst
  END,
  sbi.cgst = 0.00,
  sbi.sgst = 0.00
WHERE sb.gst_type = 'INTERSTATE' AND (sbi.igst = 0 OR sbi.igst IS NULL);
