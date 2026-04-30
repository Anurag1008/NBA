export type Program = {
  id: number;
  name: string;
  code: string;
  isActive: boolean;
};

export type Department = {
  id: number;
  name: string;
  code: string;
  isActive: boolean;
  programsList: Program[];
};

export type Institute = {
  id: number;
  name: string;
  code: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
  createdAt: string;
  isActive: boolean;
  departmentList: Department[];
};
