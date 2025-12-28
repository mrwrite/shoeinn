import { create } from "zustand";

import type { Company } from "../types/company";

interface CompanyState {
  selectedCompany: Company | null;
  setSelectedCompany: (company: Company) => void;
  clearSelectedCompany: () => void;
}

export const useCompanyStore = create<CompanyState>((set) => ({
  selectedCompany: null,
  setSelectedCompany: (company) => set({ selectedCompany: company }),
  clearSelectedCompany: () => set({ selectedCompany: null }),
}));
