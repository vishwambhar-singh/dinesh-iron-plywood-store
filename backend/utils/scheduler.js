import cron from "node-cron";
import { runDailyPaymentChecks } from "../services/automationServices.js";

export const initCronJobs = () => {
  cron.schedule("0 9 * * *", async () => {
    try {
      await runDailyPaymentChecks();
    } catch (error) {
      console.error("[CRON ERROR]:", error.message);
    }
  });
};
