import { createContext, useContext, useState, type ReactNode } from "react";
import { currentAcademicYear, getAcademicYears, type AcademicYear } from "@/types";
import { useAuth } from "@/contexts/AuthContext";

interface AcademicYearContextType {
  activeYear: AcademicYear;
  setActiveYear: (year: AcademicYear) => void;
  allYears: AcademicYear[];
}

const AcademicYearContext = createContext<AcademicYearContextType | undefined>(undefined);

export function AcademicYearProvider({ children }: { children: ReactNode }) {
  const { schoolId } = useAuth();

  // Persist selected year per school in localStorage
  const storageKey = `activeYear_${schoolId}`;
  const saved = typeof window !== "undefined" ? localStorage.getItem(storageKey) : null;

  const [activeYear, setActiveYearState] = useState<AcademicYear>(
    saved ?? currentAcademicYear()
  );

  const setActiveYear = (year: AcademicYear) => {
    setActiveYearState(year);
    localStorage.setItem(storageKey, year);
  };

  return (
    <AcademicYearContext.Provider
      value={{ activeYear, setActiveYear, allYears: getAcademicYears() }}
    >
      {children}
    </AcademicYearContext.Provider>
  );
}

export function useAcademicYear() {
  const ctx = useContext(AcademicYearContext);
  if (!ctx) throw new Error("useAcademicYear must be inside <AcademicYearProvider>");
  return ctx;
}
