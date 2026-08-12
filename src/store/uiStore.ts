import { create } from "zustand";
import type { ApplicationRow } from "@/types/database";

interface UIState {
  selectedApplicationId: string | null;
  isFormOpen: boolean;
  editingApplication: ApplicationRow | null;
  prefillDuplicateCheck: boolean;

  openDetail: (id: string) => void;
  closeDetail: () => void;

  openCreateForm: () => void;
  openEditForm: (application: ApplicationRow) => void;
  closeForm: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  selectedApplicationId: null,
  isFormOpen: false,
  editingApplication: null,
  prefillDuplicateCheck: true,

  openDetail: (id) => set({ selectedApplicationId: id }),
  closeDetail: () => set({ selectedApplicationId: null }),

  openCreateForm: () => set({ isFormOpen: true, editingApplication: null }),
  openEditForm: (application) => set({ isFormOpen: true, editingApplication: application }),
  closeForm: () => set({ isFormOpen: false, editingApplication: null }),
}));
