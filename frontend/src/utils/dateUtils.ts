import { format, parseISO, isValid } from "date-fns";

export const getSafeDate = (dateInput: string | Date | undefined): Date => {
  if (!dateInput) return new Date();

  let date: Date;

  if (typeof dateInput === "string") {
    if (dateInput.includes("T")) {
      const parsed = parseISO(dateInput);
      if (!isValid(parsed)) return new Date();
      date = new Date(parsed.getTime() + 5.5 * 60 * 60 * 1000);
    } else {
      const parts = dateInput.split("-").map(Number);
      const year = parts[0] || new Date().getFullYear();
      const month = (parts[1] || 1) - 1;
      const day = parts[2] || 1;
      date = new Date(year, month, day);
    }
  } else {
    date = dateInput instanceof Date ? dateInput : new Date(dateInput);
  }

  return isValid(date) ? date : new Date();
};

export const formatDate = (
  dateInput: string | Date | undefined,
  formatStr: string = "dd MMM yyyy",
): string => {
  const dateObj = getSafeDate(dateInput);
  return isValid(dateObj) ? format(dateObj, formatStr) : "N/A";
};

export const getISTDateString = (
  dateInput: string | Date | undefined,
): string => {
  const dateObj = getSafeDate(dateInput);
  return format(dateObj, "yyyy-MM-dd");
};
