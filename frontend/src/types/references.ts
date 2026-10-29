export interface Reference {
  id?: string;
  name: string;
  email: string;
  mobile: string;
  address: string;
  points?: number;
  referenceNumber?: string;
  redeemedPoints?: number;
  status?: string;
  remarks?: string;
}

export interface ReferenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Reference) => void;
  reference?: Reference;
  mode?: "add" | "edit" | "view";
}

export interface ReferenceTableProps {
  references: Reference[];
  onView: (ref: Reference) => void;
  onEdit: (ref: Reference) => void;
  onDelete: (ref: Reference) => void;
  isLoading: boolean;
}
