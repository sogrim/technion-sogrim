import { GraduationCap, Monitor, BarChart3, Stethoscope } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Faculty } from "@/types/api";
import { cn } from "@/lib/utils";

const FACULTIES: {
  key: Faculty;
  label: string;
  description: string;
  icon: typeof Monitor;
}[] = [
  {
    key: Faculty.ComputerScience,
    label: "מדעי המחשב",
    description: "הפקולטה למדעי המחשב ע\"ש טאוב",
    icon: Monitor,
  },
  {
    key: Faculty.DataAndDecisionScience,
    label: "מדעי הנתונים וקבלת החלטות",
    description: "הפקולטה להנדסת תעשייה וניהול - מסלול מדעי הנתונים",
    icon: BarChart3,
  },
  {
    key: Faculty.Medicine,
    label: "רפואה",
    description: "הפקולטה לרפואה ע\"ש רפפורט",
    icon: Stethoscope,
  },
];

interface FacultyStepProps {
  onSelect: (faculty: Faculty) => void;
  compact?: boolean;
}

export function FacultyStep({ onSelect, compact = false }: FacultyStepProps) {
  return (
    <div className={compact ? "space-y-3" : "space-y-8"}>
      {!compact && (
        <div className="text-center space-y-3">
          <div className="flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <GraduationCap className="h-8 w-8 text-primary" />
            </div>
          </div>
          <h2 className="text-2xl font-bold">בחר פקולטה</h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            בחר את הפקולטה שאליה אתה משתייך כדי להציג את מסלולי הלימודים
            הרלוונטיים.
          </p>
        </div>
      )}

      <div className={compact ? "grid gap-2 grid-cols-1 sm:grid-cols-3" : "grid gap-4"}>
        {FACULTIES.map((faculty) => {
          const Icon = faculty.icon;
          return (
            <button
              key={faculty.key}
              onClick={() => onSelect(faculty.key)}
              className="text-start w-full"
            >
              <Card
                className={cn(
                  "h-full transition-all hover:border-primary hover:bg-accent/50 cursor-pointer",
                  "hover:shadow-md"
                )}
              >
                <CardHeader className={compact ? "p-3" : undefined}>
                  <div className={cn("flex items-center gap-4", compact && "gap-2")}>
                    <div className={cn(
                      "flex shrink-0 items-center justify-center rounded-lg bg-primary/10",
                      compact ? "h-8 w-8" : "h-12 w-12"
                    )}>
                      <Icon className={cn("text-primary", compact ? "h-4 w-4" : "h-6 w-6")} />
                    </div>
                    <div className={compact ? "space-y-0" : "space-y-1"}>
                      <CardTitle className={compact ? "text-sm" : "text-lg"}>
                        {faculty.label}
                      </CardTitle>
                      {!compact && (
                        <CardDescription>
                          {faculty.description}
                        </CardDescription>
                      )}
                    </div>
                  </div>
                </CardHeader>
              </Card>
            </button>
          );
        })}
      </div>
    </div>
  );
}
