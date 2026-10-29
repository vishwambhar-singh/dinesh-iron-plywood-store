export interface Payment {
  id?: string;
  paymentDate: string;
  amount: number;
  method: string;
  remarks?: string;
  referenceNumber?: string;
}

export interface Supplier {
  id?: string;
  name: string;
  email: string;
  mobile: string;
  address: string;
  pan: string;
  gstNumber: string;
  openingBalance?: number;
  orders?: any[];
  bills?: any[];
  payments?: any[];
  type?: string;
}
