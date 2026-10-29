import {
  DrawerBackdrop,
  DrawerBody,
  DrawerCloseTrigger,
  DrawerContent,
  DrawerHeader,
  DrawerRoot,
  DrawerTitle,
  DrawerFooter,
  DrawerActionTrigger,
} from "@/components/ui/drawer";
import { ReactNode } from "react";
import { Button } from "./button";
import { IconButton, Box } from "@chakra-ui/react";
import { MdEdit } from "react-icons/md";

interface CustomModalProps {
  title: string;
  children: ReactNode;
  onConfirm?: () => void;
  onEditClick?: () => void;
  confirmLabel?: string;
  width?: "xs" | "sm" | "md" | "lg" | "xl" | "full" | string;
  open?: boolean;
  onOpenChange?: (e: { open: boolean }) => void;
  loading?: boolean;
  mode?: string;
  disableConfirm?: boolean;
}

export const CustomModal = ({
  title,
  children,
  onConfirm,
  onEditClick,
  confirmLabel = "Save",
  width = "xl",
  open,
  onOpenChange,
  loading,
  mode,
  disableConfirm,
}: CustomModalProps) => {
  return (
    <DrawerRoot
      size={
        width.includes("%") || width.includes("px") ? "full" : (width as any)
      }
      placement="end"
      open={open}
      onOpenChange={onOpenChange}
      closeOnInteractOutside={!loading}
    >
      <DrawerBackdrop />

      <DrawerContent
        maxW={width.includes("%") || width.includes("px") ? width : undefined}
      >
        <Box position="absolute" top="2" right="12" zIndex="skipLink">
          {mode === "view" && onEditClick && (
            <IconButton
              variant="ghost"
              size="sm"
              onClick={onEditClick}
              aria-label="Edit"
              colorPalette="brand"
            >
              <MdEdit />
            </IconButton>
          )}
        </Box>

        <DrawerHeader>
          <DrawerTitle>{title}</DrawerTitle>
        </DrawerHeader>

        <DrawerBody>{children}</DrawerBody>

        <DrawerFooter>
          <DrawerActionTrigger asChild>
            <Button variant="outline" disabled={loading}>
              Cancel
            </Button>
          </DrawerActionTrigger>
          {onConfirm && mode !== "view" && (
            <Button
              colorPalette="brand"
              onClick={onConfirm}
              loading={loading}
              disabled={disableConfirm || loading}
            >
              {confirmLabel}
            </Button>
          )}
        </DrawerFooter>
        <DrawerCloseTrigger disabled={loading} />
      </DrawerContent>
    </DrawerRoot>
  );
};
