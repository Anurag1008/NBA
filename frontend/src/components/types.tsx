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

export type DepartmentSummary = {
  id: number;
  name: string;
  code: string;
  isActive: boolean;
  programCount: number;
  userCount: number;
};

export type InstituteDetail = {
  id: number;
  name: string;
  code: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
  isActive: boolean;
  createdAt: string;
  departments: DepartmentSummary[];
  departmentCount: number;
  programCount: number;
  userCount: number;
};

export type ProgramSummary = {
  id: number;
  name: string;
  level: string;
  isActive: boolean;
  userCount: number;
};

export type DepartmentDetail = {
  id: number;
  name: string;
  code: string;
  isActive: boolean;
  instituteId: number | null;
  instituteName: string | null;
  programs: ProgramSummary[];
  programCount: number;
  userCount: number;
};

export type ProgramUser = {
  id: number;
  username: string;
  email: string;
  roles: string[];
};

export type ProgramFile = {
  id: number;
  code: string;
  title: string;
  description: string | null;
  isActive: boolean;
  fileLink: string;
};

export type BulkUploadRow = {
  row: number;
  email: string;
  username: string;
  role?: string;
  status: "created" | "skipped";
  reason?: string;
};

export type BulkUploadResponse = {
  instituteId: number;
  instituteName: string;
  createdCount: number;
  skippedCount: number;
  rows: BulkUploadRow[];
};

export type ProgramDetail = {
  id: number;
  name: string;
  level: string;
  isActive: boolean;
  departmentId: number | null;
  departmentName: string | null;
  instituteId: number | null;
  instituteName: string | null;
  users: ProgramUser[];
  userCount: number;
  files: ProgramFile[];
  finalFileLink: string | null;
  finalFileTitle: string | null;
};
