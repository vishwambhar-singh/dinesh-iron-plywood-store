import {
  Input,
  Stack,
  Grid,
  Field,
  createListCollection,
  Textarea,
} from "@chakra-ui/react";
import {
  SelectRoot,
  SelectTrigger,
  SelectValueText,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { CustomModal } from "@/components/ui/CustomModal";
import { useState, useEffect } from "react";
import { toast } from "@/utils/toast";
import { getISTDateString } from "@/utils/dateUtils";

export const OfficeExpenseModal = ({
  isOpen,
  onClose,
  onSubmit,
  expense,
  mode: initialMode = "add",
}: any) => {
  const [formData, setFormData] = useState({
    category: "",
    customCategory: "",
    amount: "",
    method: "CASH",
    remarks: "",
    date: getISTDateString(new Date()) || "",
  });
  const [currentMode, setCurrentMode] = useState(initialMode);
  const isView = currentMode === "view";

  useEffect(() => {
    setCurrentMode(initialMode);
  }, [initialMode, isOpen]);

  useEffect(() => {
    if (expense && (currentMode === "view" || currentMode === "edit")) {
      const standardCategories = [
        "RENT",
        "ELECTRICITY",
        "INTERNET",
        "WATER",
        "STATIONERY",
        "CLEANING",
        "MAINTENANCE",
        "MARKETING",
      ];
      const isCustom =
        expense.category && !standardCategories.includes(expense.category);

      setFormData({
        category: isCustom ? "OTHERS" : expense.category || "",
        customCategory: isCustom ? expense.category : "",
        amount: expense.amount.toString(),
        method: expense.method || "CASH",
        remarks: expense.remarks || "",
        date: getISTDateString(expense.date) || "",
      });
    } else {
      setFormData({
        category: "",
        customCategory: "",
        amount: "",
        method: "CASH",
        remarks: "",
        date: getISTDateString(new Date()) || "",
      });
    }
  }, [expense, currentMode, isOpen]);

  const categoryCollection = createListCollection({
    items: [
      { label: "Office Rent", value: "RENT" },
      { label: "Electricity Bill", value: "ELECTRICITY" },
      { label: "Internet / Wi-Fi", value: "INTERNET" },
      { label: "Water Bill", value: "WATER" },
      { label: "Stationery & Supplies", value: "STATIONERY" },
      { label: "Cleaning & Housekeeping", value: "CLEANING" },
      { label: "Repair & Maintenance", value: "MAINTENANCE" },
      { label: "Marketing & Ads", value: "MARKETING" },
      { label: "Others", value: "OTHERS" },
    ],
  });

  const methodCollection = createListCollection({
    items: [
      { label: "Cash", value: "CASH" },
      { label: "Online / UPI", value: "ONLINE" },
      { label: "Bank Transfer", value: "BANK" },
      { label: "Card", value: "CARD" },
    ],
  });

  const handleConfirm = () => {
    if (isView) {
      onClose();
      return;
    }

    const finalCategory =
      formData.category === "OTHERS"
        ? formData.customCategory
        : formData.category;

    if (!finalCategory) {
      toast.error("Please specify a category");
      return;
    }

    const amountNum = Number(formData.amount);
    if (!formData.amount || isNaN(amountNum) || amountNum <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    const payload = {
      ...formData,
      category: finalCategory,
      expenseType: "OFFICE",
    };

    onSubmit(currentMode === "edit" ? { ...payload, id: expense.id } : payload);
    onClose();
  };

  return (
    <CustomModal
      title={
        currentMode === "add"
          ? "New Office Expense"
          : isView
            ? "Expense Details"
            : "Edit Office Expense"
      }
      open={isOpen}
      onOpenChange={onClose}
      onConfirm={handleConfirm}
      confirmLabel={currentMode === "edit" ? "Update Expense" : "Save Expense"}
      onEditClick={() => {
        if (expense.status.toUpperCase() === "PENDING") {
          setCurrentMode("edit");
        } else {
          toast.error("Only pending expenses can be edited");
        }
      }}
      mode={currentMode}
    >
      <Stack gap={5}>
        <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap={4}>
          <Field.Root disabled={isView}>
            <Field.Label fontWeight="bold">Category *</Field.Label>
            <SelectRoot
              collection={categoryCollection}
              value={[formData.category]}
              disabled={isView}
              onValueChange={(e) =>
                e.value[0] && setFormData({ ...formData, category: e.value[0] })
              }
            >
              <SelectTrigger>
                <SelectValueText placeholder="Select Category" />
              </SelectTrigger>
              <SelectContent>
                {categoryCollection.items.map((c) => (
                  <SelectItem key={c.value} item={c}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </SelectRoot>
          </Field.Root>

          {formData.category === "OTHERS" && (
            <Field.Root disabled={isView}>
              <Field.Label fontWeight="bold">Specify Category *</Field.Label>
              <Input
                placeholder="Enter category name"
                readOnly={isView}
                value={formData.customCategory}
                onChange={(e) =>
                  setFormData({ ...formData, customCategory: e.target.value })
                }
              />
            </Field.Root>
          )}

          <Field.Root disabled={isView}>
            <Field.Label fontWeight="bold">Amount (₹) *</Field.Label>
            <Input
              type="number"
              placeholder="0.00"
              readOnly={isView}
              value={formData.amount}
              onChange={(e) =>
                setFormData({ ...formData, amount: e.target.value })
              }
            />
          </Field.Root>

          <Field.Root disabled={isView}>
            <Field.Label fontWeight="bold">Expense Date *</Field.Label>
            <Input
              type="date"
              value={formData.date}
              readOnly={isView}
              onChange={(e) =>
                setFormData({ ...formData, date: e.target.value })
              }
            />
          </Field.Root>

          <Field.Root disabled={isView}>
            <Field.Label fontWeight="bold">Payment Method *</Field.Label>
            <SelectRoot
              collection={methodCollection}
              value={[formData.method]}
              disabled={isView}
              onValueChange={(e) =>
                e.value[0] && setFormData({ ...formData, method: e.value[0] })
              }
            >
              <SelectTrigger>
                <SelectValueText placeholder="Select method" />
              </SelectTrigger>
              <SelectContent>
                {methodCollection.items.map((m) => (
                  <SelectItem key={m.value} item={m}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </SelectRoot>
          </Field.Root>
        </Grid>

        <Field.Root disabled={isView}>
          <Field.Label fontWeight="bold">Remarks</Field.Label>
          <Textarea
            placeholder="Description of the office expense..."
            readOnly={isView}
            value={formData.remarks}
            onChange={(e) =>
              setFormData({ ...formData, remarks: e.target.value })
            }
            rows={3}
          />
        </Field.Root>
      </Stack>
    </CustomModal>
  );
};
