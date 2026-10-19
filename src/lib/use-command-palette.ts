"use client";

import { create } from "zustand";

/** حالة لوحة الأوامر السريعة (Ctrl+K) — مشتركة بين المكونات */
interface PaletteState {
  open: boolean;
  setOpen: (v: boolean) => void;
}

export const useCommandPalette = create<PaletteState>((set) => ({
  open: false,
  setOpen: (v) => set({ open: v }),
}));
