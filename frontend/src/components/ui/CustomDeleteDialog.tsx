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
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Text, Icon, VStack, Portal } from "@chakra-ui/react";
import { MdErrorOutline } from "react-icons/md";

interface CustomDeleteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  loading?: boolean;
  title?: string;
  description?: string;
  confirmText?: string;
  confirmColor?: string;
}

export const CustomDeleteDialog = ({
  isOpen,
  onClose,
  onConfirm,
  loading = false,
  title = "Are you sure?",
  description = "This action cannot be undone. This will permanently delete the record from our servers.",
  confirmText = "Delete",
  confirmColor = "red",
}: CustomDeleteDialogProps) => {
  return (
    <DialogRoot
      open={isOpen}
      onOpenChange={(e) => !e.open && onClose()}
      placement="center"
      role="alertdialog"
    >
      <DialogBackdrop />
      <Portal>
        <DialogContent borderRadius="xl" p={2}>
          <DialogHeader>
            <VStack align="center" justify="center" width="full" gap={3} pt={4}>
              <Icon color={`${confirmColor}.500`} fontSize="4xl">
                <MdErrorOutline />
              </Icon>
              <DialogTitle fontSize="xl" fontWeight="bold" textAlign="center">
                {title}
              </DialogTitle>
            </VStack>
          </DialogHeader>

          <DialogBody textAlign="center">
            <Text color="fg.muted">{description}</Text>
          </DialogBody>

          <DialogFooter justifyContent="center" gap={3} pb={6}>
            <DialogActionTrigger asChild>
              <Button variant="outline" onClick={onClose} disabled={loading}>
                Cancel
              </Button>
            </DialogActionTrigger>
            <Button
              colorPalette={confirmColor}
              variant="solid"
              loading={loading}
              onClick={onConfirm}
            >
              {confirmText}
            </Button>
          </DialogFooter>
          <DialogCloseTrigger />
        </DialogContent>
      </Portal>
    </DialogRoot>
  );
};
