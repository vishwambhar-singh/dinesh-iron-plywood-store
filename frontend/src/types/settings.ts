export interface InventorySettingsProps {
  initialThreshold: number;
  initialNotify: boolean;
  onSave: (data: {
    group: "inventory";
    settings: {
      min_threshold: string;
      notification_enabled: string;
    };
  }) => Promise<void>;
}

export interface TermsSettingsProps {
  initialTerms: string;
  onSave: (data: any) => Promise<void>;
}

export interface Category {
  id: string;
  name: string;
  types?: string[];
  units?: string[];
  sizes?: string[];
  colors?: string[];
}

export interface AddCategoryModalProps {
  existingData?: Category | null;
  isOpen: boolean;
  onClose: () => void;
}

export interface CompanyDetails {
  id: number;
  name: string;
  email: string;
  mobile: string;
  address: string;
  gstNumber?: string;
  panNumber?: string;
  logoUrl: string;
}

export interface DummyCompanyDetails {
  id: number;
  name: string;
  email: string;
  mobile: string;
  address: string;
}
