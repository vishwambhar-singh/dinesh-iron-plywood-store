import {
  DialogActionTrigger,
  DialogBackdrop,
  DialogBody,
  DialogCloseTrigger,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogRoot,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ReactNode, useEffect } from "react";
import { Button } from "./button";

interface GlobalDialogProps {
  triggerLabel?: string;
  trigger?: ReactNode;
  title: string;
  children: ReactNode;
  onConfirm?: () => void;
  confirmLabel?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "cover" | string;
  open?: boolean;
  onOpenChange?: (e: { open: boolean }) => void;
  loading?: boolean;
  showFooter?: boolean;
}

export const CustomDialog = ({
  triggerLabel,
  trigger,
  title,
  children,
  onConfirm,
  confirmLabel = "Confirm",
  size = "md",
  open,
  onOpenChange,
  loading,
  showFooter = true,
}: GlobalDialogProps) => {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const getMaxW = () => {
    if (size === "xs") return "320px";
    if (size === "sm") return "400px";
    if (size === "md") return "500px";
    if (size === "lg") return "700px";
    if (size === "xl") return "900px";
    if (size === "cover") return "100vw";
    return size;
  };

  return (
    <DialogRoot
      open={open}
      onOpenChange={onOpenChange}
      placement="center"
      motionPreset="slide-in-bottom"
    >
      <DialogBackdrop />
      <DialogTrigger asChild>
        {trigger
          ? trigger
          : triggerLabel && (
              <Button variant="outline" size="sm">
                {triggerLabel}
              </Button>
            )}
      </DialogTrigger>

      <DialogContent
        w="100%"
        maxW={getMaxW()}
        maxH="90vh"
        display="flex"
        flexDirection="column"
        mx="auto"
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <DialogBody flex="1" overflowY="auto">
          {children}
        </DialogBody>

        {showFooter && (
          <DialogFooter>
            <DialogActionTrigger asChild>
              <Button variant="outline" disabled={loading}>
                Cancel
              </Button>
            </DialogActionTrigger>
            {onConfirm && (
              <Button
                bg="brand.solid"
                color="white"
                onClick={onConfirm}
                loading={loading}
              >
                {confirmLabel}
              </Button>
            )}
          </DialogFooter>
        )}
        <DialogCloseTrigger disabled={loading} />
      </DialogContent>
    </DialogRoot>
  );
};
