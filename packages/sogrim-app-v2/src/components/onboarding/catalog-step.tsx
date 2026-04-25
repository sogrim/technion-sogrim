import { BookOpen, Loader2, ArrowRight } from "lucide-react";
import { useCatalogs } from "@/hooks/use-catalogs";
import { useUpdateCatalog } from "@/hooks/use-mutations";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Faculty } from "@/types/api";
import type { Catalog } from "@/types/api";

const FACULTY_LABELS: Record<string, string> = {
  ComputerScience: "מדעי המחשב",
  DataAndDecisionScience: "מדעי הנתונים וקבלת החלטות",
  Medicine: "רפואה",
  Unknown: "כללי",
};

interface CatalogStepProps {
  faculty: Faculty;
  onBack?: () => void;
  onError?: (message: string) => void;
}

export function CatalogStep({
  faculty,
  onBack,
  onError,
}: CatalogStepProps) {
  const { data: catalogs, isLoading } = useCatalogs(faculty);
  const updateCatalog = useUpdateCatalog();

  function handleSelect(catalogId: string) {
    updateCatalog.mutate(catalogId, {
      onError: () => {
        onError?.("שגיאה בבחירת הקטלוג");
      },
    });
  }

  const filteredCatalogs: Catalog[] = catalogs ?? [];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <Skeleton className="h-8 w-48 mx-auto" />
          <Skeleton className="h-4 w-64 mx-auto" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="text-center space-y-3">
        <div className="flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <BookOpen className="h-8 w-8 text-primary" />
          </div>
        </div>
        <h2 className="text-2xl font-bold">בחר מסלול לימודים</h2>
        <p className="text-muted-foreground max-w-md mx-auto">
          בחר את הקטלוג המתאים למסלול הלימודים שלך ב
          {FACULTY_LABELS[faculty] ?? faculty}.
          הקטלוג מגדיר את דרישות התואר.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {filteredCatalogs.map((catalog) => (
          <button
            key={catalog._id.$oid}
            onClick={() => handleSelect(catalog._id.$oid)}
            disabled={updateCatalog.isPending}
            className="text-start w-full"
          >
            <Card className="h-full transition-all hover:border-primary hover:bg-accent/50 cursor-pointer hover:shadow-md">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-base">
                    {catalog.name}
                  </CardTitle>
                  {updateCatalog.isPending &&
                  updateCatalog.variables === catalog._id.$oid ? (
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  ) : (
                    <BookOpen className="h-4 w-4 text-muted-foreground shrink-0" />
                  )}
                </div>
                {catalog.description && (
                  <CardDescription className="text-xs">
                    {catalog.description}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <Badge variant="secondary">
                  {catalog.total_credit} נקודות זכות
                </Badge>
              </CardContent>
            </Card>
          </button>
        ))}
      </div>

      {filteredCatalogs.length === 0 && (
        <div className="text-center py-8">
          <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">
            לא נמצאו קטלוגים זמינים עבור פקולטה זו
          </p>
        </div>
      )}

      {onBack && (
        <div className="flex justify-center">
          <Button variant="ghost" onClick={onBack}>
            <ArrowRight className="h-4 w-4" />
            חזרה לבחירת פקולטה
          </Button>
        </div>
      )}
    </div>
  );
}
