import { useState } from "react";
import { FacultyStep } from "@/components/onboarding/faculty-step";
import { CatalogStep } from "@/components/onboarding/catalog-step";
import type { Faculty } from "@/types/api";

interface CatalogWizardProps {
  compact?: boolean;
  onError?: (message: string) => void;
}

export function CatalogWizard({ compact = false, onError }: CatalogWizardProps) {
  const [selectedFaculty, setSelectedFaculty] = useState<Faculty | null>(null);

  if (!selectedFaculty) {
    return (
      <FacultyStep
        onSelect={setSelectedFaculty}
        compact={compact}
      />
    );
  }

  return (
    <CatalogStep
      faculty={selectedFaculty}
      onBack={() => setSelectedFaculty(null)}
      onError={onError}
      compact={compact}
    />
  );
}
