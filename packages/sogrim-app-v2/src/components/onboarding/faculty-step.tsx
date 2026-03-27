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
}

export function FacultyStep({ onSelect }: FacultyStepProps) {
  return (
    <div className="space-y-8">
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

      <div className="grid gap-4">
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
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <div className="space-y-1">
                      <CardTitle className="text-lg">
                        {faculty.label}
                      </CardTitle>
                      <CardDescription>
                        {faculty.description}
                      </CardDescription>
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
