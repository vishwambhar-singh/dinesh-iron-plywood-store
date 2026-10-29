import { useGetSettingsQuery } from "@/store/apiSlice";

export const useSystemSettings = () => {
  const { data: allSettings } = useGetSettingsQuery();

  return {
    allSettings,
    exportFormat: allSettings?.preferred_format || "xlsx",
    referralPercent: Number(allSettings?.referral_percent) || 5,
    minThreshold: Number(allSettings?.min_threshold || 5),
    invoiceTerms: allSettings?.invoice_terms || "",
    notificationEnabled: allSettings?.notification_enabled === "true",
    supplierCreditDays: Number(allSettings?.supplier_credit_days) || 0,
    customerCreditDays: Number(allSettings?.customer_credit_days) || 0,
    bankList: allSettings?.bank_list ? JSON.parse(allSettings.bank_list) : [],
    rawBankList: allSettings?.bank_list || "[]",
    priceInflationPercent: Number(allSettings?.inflation_percent) || 10,
  };
};
