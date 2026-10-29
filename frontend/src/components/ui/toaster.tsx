"use client";

import {
  Toaster as ChakraToaster,
  Portal,
  Spinner,
  Stack,
  Toast,
  createToaster,
  IconButton,
} from "@chakra-ui/react";
import { HiX } from "react-icons/hi";

export const toaster = createToaster({
  placement: "top-end",
  pauseOnPageIdle: true,
  duration: 2000,
});

export const Toaster = () => {
  return (
    <Portal>
      <ChakraToaster
        toaster={toaster}
        insetInline={{ mdDown: "4" }}
        zIndex={9999}
      >
        {(toast) => (
          <Toast.Root width={{ md: "sm" }} padding="4">
            {toast.type === "loading" ? (
              <Spinner size="sm" />
            ) : (
              <Toast.Indicator />
            )}

            <Stack gap="1" flex="1" maxWidth="100%">
              {toast.title && (
                <Toast.Title fontWeight="bold">{toast.title}</Toast.Title>
              )}
              {toast.description && (
                <Toast.Description fontSize="sm">
                  {toast.description}
                </Toast.Description>
              )}
            </Stack>

            {toast.action && (
              <Toast.ActionTrigger>{toast.action.label}</Toast.ActionTrigger>
            )}

            <Toast.CloseTrigger asChild>
              <IconButton size="xs" variant="ghost" color="inherit">
                <HiX />
              </IconButton>
            </Toast.CloseTrigger>
          </Toast.Root>
        )}
      </ChakraToaster>
    </Portal>
  );
};
