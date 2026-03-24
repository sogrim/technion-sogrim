import { useState } from "react";
import {
  Upload,
  FileText,
  Loader2,
  ClipboardPaste,
  SkipForward,
} from "lucide-react";
import { useImportUgData } from "@/hooks/use-mutations";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

interface CoursesStepProps {
  onError?: (message: string) => void;
  onSuccess?: () => void;
  /** When true, hides the header section (useful when embedded in settings). */
  compact?: boolean;
  /** When true, shows a skip button to bypass import. */
  showSkip?: boolean;
  onSkip?: () => void;
}

const EXAMPLE_TEXT = `גיליון ציונים
אנונימי אנונימי ת.ז. 123456789 נכון לתאריך: 2024-01-01
פקולטה: מדעי המחשב לתואר: בוגר למדעים במדעי המחשב
ממוצע מצטבר: 85.00 שיעור הצלחות מצטבר: 95.0 נקודות מצטברות: 120.0
...`;

export function CoursesStep({
  onError,
  onSuccess,
  compact = false,
  showSkip = false,
  onSkip,
}: CoursesStepProps) {
  const [ugData, setUgData] = useState("");
  const importMutation = useImportUgData();

  async function handlePaste() {
    try {
      const text = await navigator.clipboard.readText();
      setUgData(text);
    } catch {
      onError?.("לא ניתן לגשת ללוח ההעתקה. אנא הדבק ידנית.");
    }
  }

  function handleSubmit() {
    if (!ugData.trim()) {
      onError?.("אנא הדבק את גיליון הציונים");
      return;
    }

    importMutation.mutate(ugData.trim(), {
      onSuccess: () => {
        onSuccess?.();
      },
      onError: () => {
        onError?.(
          "שגיאה בייבוא הנתונים. אנא ודא שהמידע הודבק כראוי."
        );
      },
    });
  }

  return (
    <div className="space-y-8">
      {!compact && (
        <div className="text-center space-y-3">
          <div className="flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <FileText className="h-8 w-8 text-primary" />
            </div>
          </div>
          <h2 className="text-2xl font-bold">ייבוא גיליון ציונים</h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            היכנס למערכת UG, העתק את גיליון הציונים המלא והדבק כאן.
            המערכת תנתח את הנתונים ותייבא את הקורסים שלך.
          </p>
        </div>
      )}

      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="ug-data">גיליון ציונים</Label>
              <Button
                variant="ghost"
                size="sm"
                onClick={handlePaste}
                type="button"
              >
                <ClipboardPaste className="h-4 w-4" />
                הדבק מהלוח
              </Button>
            </div>
            <textarea
              id="ug-data"
              value={ugData}
              onChange={(e) => setUgData(e.target.value)}
              placeholder={EXAMPLE_TEXT}
              className="flex min-h-[200px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 resize-y font-mono"
              dir="ltr"
              disabled={importMutation.isPending}
            />
          </div>

          <div className="rounded-lg bg-muted/50 p-4 space-y-2">
            <h4 className="text-sm font-medium">הוראות:</h4>
            <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
              <li>
                היכנס ל-
                <a
                  href="https://ug3.technion.ac.il"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  מערכת UG
                </a>
              </li>
              <li>עבור לעמוד גיליון הציונים</li>
              <li>
                סמן את כל הטקסט בעמוד (Ctrl+A / Cmd+A)
              </li>
              <li>העתק (Ctrl+C / Cmd+C)</li>
              <li>חזור לכאן והדבק (Ctrl+V / Cmd+V) או לחץ על &quot;הדבק מהלוח&quot;</li>
            </ol>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={handleSubmit}
              disabled={importMutation.isPending || !ugData.trim()}
              className="flex-1"
              size="lg"
            >
              {importMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  מייבא נתונים...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  ייבא גיליון ציונים
                </>
              )}
            </Button>

            {showSkip && onSkip && (
              <Button
                variant="outline"
                size="lg"
                onClick={onSkip}
                disabled={importMutation.isPending}
              >
                <SkipForward className="h-4 w-4" />
                דלג
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
