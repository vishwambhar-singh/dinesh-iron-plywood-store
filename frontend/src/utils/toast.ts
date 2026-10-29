import { toaster } from "../components/ui/toaster";

export const toast = {
  success: (message: string, description?: string) => {
    toaster.create({
      title: message,
      description: description,
      type: "success",
      meta: { closable: true },
    });
  },
  error: (message: string, description?: string) => {
    toaster.create({
      title: message,
      description: description,
      type: "error",
      meta: { closable: true },
    });
  },
  warning: (message: string, description?: string) => {
    toaster.create({
      title: message,
      description: description,
      type: "warning",
      meta: { closable: true },
    });
  },
  info: (message: string, description?: string) => {
    toaster.create({
      title: message,
      description: description,
      type: "info",
      meta: { closable: true },
    });
  },
};
