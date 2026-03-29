import { useState } from "react";
import { FacultyStep } from "@/components/onboarding/faculty-step";
import { CatalogStep } from "@/components/onboarding/catalog-step";
import type { Faculty } from "@/types/api";

interface CatalogWizardProps {
  compact?: boolean;
  onCatalogSelected?: (catalogId: string) => void;
  onError?: (message: string) => void;
}

export function CatalogWizard({ compact = false, onCatalogSelected, onError }: CatalogWizardProps) {
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
      onSuccess={onCatalogSelected}
      compact={compact}
    />
  );
}
