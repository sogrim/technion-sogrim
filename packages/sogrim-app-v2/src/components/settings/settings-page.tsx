import { useState } from "react";
import {
  User,
  Palette,
  BookOpen,
  Info,
  Moon,
  Sun,
  FileText,
  Upload,
  ClipboardPaste,
  Loader2,
  AlertTriangle,
  Trash2,
} from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { useAuthStore } from "@/stores/auth-store";
import { useUiStore } from "@/stores/ui-store";
import { useUserState } from "@/hooks/use-user-state";
import { useCatalogs } from "@/hooks/use-catalogs";
import {
  useUpdateCatalog,
  useUpdateSettings,
  useImportUgData,
  useComputeDegreeStatus,
} from "@/hooks/use-mutations";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Combobox } from "@/components/ui/combobox";
import type { ComboboxOption } from "@/components/ui/combobox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Toast } from "@/components/ui/toast";
import { ResetUserDialog } from "./reset-user-dialog";
import type { Catalog } from "@/types/api";

const FACULTY_LABELS: Record<string, string> = {
  ComputerScience: "מדעי המחשב",
  DataAndDecisionScience: "מדעי הנתונים וקבלת החלטות",
  Medicine: "רפואה",
  Unknown: "כללי",
};

function groupByFaculty(
  catalogs: Catalog[]
): Record<string, Catalog[]> {
  const grouped: Record<string, Catalog[]> = {};
  for (const catalog of catalogs) {
    const faculty = catalog.faculty || "Unknown";
    if (!grouped[faculty]) grouped[faculty] = [];
    grouped[faculty].push(catalog);
  }
  return grouped;
}

export function SettingsPage() {
  const userInfo = useAuthStore((s) => s.userInfo);
  const theme = useUiStore((s) => s.theme);
  const toggleTheme = useUiStore((s) => s.toggleTheme);
  const { data: userState, isLoading: userLoading } = useUserState();
  const { data: catalogs, isLoading: catalogsLoading } = useCatalogs();
  const updateCatalog = useUpdateCatalog();
  const updateSettings = useUpdateSettings();
  const importMutation = useImportUgData();
  const computeMutation = useComputeDegreeStatus();
  const navigate = useNavigate();

  const [ugData, setUgData] = useState("");
  const [showCatalogWarning, setShowCatalogWarning] = useState(false);
  const [pendingCatalogId, setPendingCatalogId] = useState<string | null>(null);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: "error" | "success";
  } | null>(null);

  const currentCatalogId = userState?.details?.catalog?._id?.$oid;

  function handleCatalogChange(catalogId: string) {
    if (!catalogId || catalogId === currentCatalogId) return;
    setPendingCatalogId(catalogId);
    setShowCatalogWarning(true);
  }

  function confirmCatalogChange() {
    if (!pendingCatalogId) return;

    updateCatalog.mutate(pendingCatalogId, {
      onSuccess: () => {
        setToast({
          message: "הקטלוג עודכן בהצלחה. סטטוס התואר יחושב מחדש.",
          type: "success",
        });
        setShowCatalogWarning(false);
        setPendingCatalogId(null);
        navigate({ to: "/planner" });
      },
      onError: () => {
        setToast({ message: "שגיאה בעדכון הקטלוג", type: "error" });
        setShowCatalogWarning(false);
        setPendingCatalogId(null);
      },
    });
  }

  function cancelCatalogChange() {
    setShowCatalogWarning(false);
    setPendingCatalogId(null);
  }

  function handleThemeToggle() {
    toggleTheme();
    const newDarkMode = theme === "light";
    updateSettings.mutate(
      { dark_mode: newDarkMode },
      {
        onError: () => {
          setToast({
            message: "שגיאה בשמירת הגדרות ערכת נושא",
            type: "error",
          });
        },
      }
    );
  }

  async function handlePasteFromClipboard() {
    try {
      const text = await navigator.clipboard.readText();
      setUgData(text);
    } catch {
      setToast({
        message: "לא ניתן לגשת ללוח ההעתקה. אנא הדבק ידנית.",
        type: "error",
      });
    }
  }

  function handleImportSubmit() {
    if (!ugData.trim()) {
      setToast({
        message: "אנא הדבק את גיליון הציונים",
        type: "error",
      });
      return;
    }

    importMutation.mutate(ugData.trim(), {
      onSuccess: () => {
        setUgData("");
        setToast({
          message: "גיליון הציונים יובא בהצלחה. מחשב סטטוס תואר...",
          type: "success",
        });
        computeMutation.mutate(undefined, {
          onSuccess: () => {
            setToast({
              message: "סטטוס התואר חושב מחדש בהצלחה",
              type: "success",
            });
          },
          onError: () => {
            setToast({
              message:
                "גיליון הציונים יובא, אך חישוב הסטטוס נכשל. נסה לרענן את הדף.",
              type: "error",
            });
          },
        });
      },
      onError: () => {
        setToast({
          message:
            "שגיאה בייבוא הנתונים. אנא ודא שהמידע הודבק כראוי.",
          type: "error",
        });
      },
    });
  }

  const grouped = catalogs ? groupByFaculty(catalogs) : {};

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">הגדרות</h1>

      {/* 1. Profile Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <User className="h-5 w-5 text-muted-foreground" />
            <CardTitle>פרופיל</CardTitle>
          </div>
          <CardDescription>פרטי המשתמש המחובר</CardDescription>
        </CardHeader>
        <CardContent>
          {userLoading ? (
            <div className="flex items-center gap-4">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-48" />
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              {userInfo?.picture ? (
                <img
                  src={userInfo.picture}
                  alt="תמונת פרופיל"
                  className="h-12 w-12 rounded-full border"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold">
                  {userInfo?.name?.charAt(0) || "?"}
                </div>
              )}
              <div className="space-y-1">
                <p className="font-medium">
                  {userInfo?.name || "משתמש"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {userInfo?.email || ""}
                </p>
              </div>
              {userState?.permissions && (
                <Badge variant="secondary" className="mr-auto">
                  {userState.permissions}
                </Badge>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 2. Catalog Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-muted-foreground" />
            <CardTitle>קטלוג לימודים</CardTitle>
          </div>
          <CardDescription>
            בחר את מסלול הלימודים שלך. הקטלוג מגדיר את דרישות התואר.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {catalogsLoading ? (
            <Skeleton className="h-9 w-full" />
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="catalog-select">מסלול לימודים</Label>
                <Combobox
                  id="catalog-select"
                  value={currentCatalogId || ""}
                  onChange={handleCatalogChange}
                  disabled={updateCatalog.isPending}
                  placeholder="בחר קטלוג..."
                  searchPlaceholder="חיפוש מסלול או שנה..."
                  emptyMessage="לא נמצאו מסלולים"
                  options={Object.entries(grouped).flatMap(
                    ([faculty, facultyCatalogs]): ComboboxOption[] =>
                      facultyCatalogs.map((catalog) => ({
                        value: catalog._id.$oid,
                        label: `${catalog.name} (${catalog.total_credit} נ״ז)`,
                        group: FACULTY_LABELS[faculty] || faculty,
                      }))
                  )}
                />
              </div>

              {/* Catalog change warning */}
              {showCatalogWarning && (
                <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 space-y-3 dark:bg-amber-950/20 dark:border-amber-700">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                        החלפת קטלוג תגרום לחישוב מחדש של סטטוס התואר
                      </p>
                      <p className="text-xs text-amber-700 dark:text-amber-300">
                        הקורסים שלך יישמרו, אך דרישות התואר יחושבו מחדש
                        לפי הקטלוג החדש.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={cancelCatalogChange}
                      disabled={updateCatalog.isPending}
                    >
                      ביטול
                    </Button>
                    <Button
                      size="sm"
                      onClick={confirmCatalogChange}
                      disabled={updateCatalog.isPending}
                    >
                      {updateCatalog.isPending ? (
                        <>
                          <Loader2 className="h-3 w-3 animate-spin" />
                          מעדכן...
                        </>
                      ) : (
                        "אישור החלפה"
                      )}
                    </Button>
                  </div>
                </div>
              )}

              {userState?.details?.catalog && !showCatalogWarning && (
                <>
                  <Separator />
                  <div className="space-y-1">
                    <p className="text-sm font-medium">
                      קטלוג נוכחי: {userState.details.catalog.name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      סה״כ נקודות זכות:{" "}
                      {userState.details.catalog.total_credit}
                    </p>
                    {userState.details.catalog.description &&
                      userState.details.catalog.description !== "יהיה פה הסבר" && (
                      <p className="text-sm text-muted-foreground">
                        {userState.details.catalog.description}
                      </p>
                    )}
                  </div>
                </>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* 3. Grade Sheet Import Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-muted-foreground" />
            <CardTitle>ייבוא גיליון ציונים מחדש</CardTitle>
          </div>
          <CardDescription>
            ייבא מחדש את גיליון הציונים שלך ממערכת UG.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Warning about overwriting */}
          <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 dark:bg-amber-950/20 dark:border-amber-700">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700 dark:text-amber-300">
                ייבוא חדש ידרוס את כל הנתונים הקיימים. הקורסים שנוספו ידנית
                יוחלפו בנתונים מגיליון הציונים.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="settings-ug-data">
                גיליון ציונים
              </Label>
              <Button
                variant="ghost"
                size="sm"
                onClick={handlePasteFromClipboard}
                type="button"
              >
                <ClipboardPaste className="h-4 w-4" />
                הדבק מהלוח
              </Button>
            </div>
            <textarea
              id="settings-ug-data"
              value={ugData}
              onChange={(e) => setUgData(e.target.value)}
              placeholder="הדבק כאן את גיליון הציונים מ-UG..."
              className="flex min-h-[160px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 resize-y font-mono"
              dir="ltr"
              disabled={importMutation.isPending}
            />
          </div>

          <div className="rounded-lg bg-muted/50 p-3 space-y-1">
            <p className="text-xs text-muted-foreground">
              היכנס ל-
              <a
                href="https://ug3.technion.ac.il"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                מערכת UG
              </a>
              , סמן את כל הטקסט בגיליון הציונים (Ctrl+A), העתק
              (Ctrl+C) והדבק כאן.
            </p>
          </div>

          <Button
            onClick={handleImportSubmit}
            disabled={
              importMutation.isPending ||
              computeMutation.isPending ||
              !ugData.trim()
            }
            className="w-full"
          >
            {importMutation.isPending || computeMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {computeMutation.isPending
                  ? "מחשב סטטוס..."
                  : "מייבא נתונים..."}
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                ייבא גיליון ציונים מחדש
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* 4. Appearance Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Palette className="h-5 w-5 text-muted-foreground" />
            <CardTitle>מראה</CardTitle>
          </div>
          <CardDescription>
            התאם את תצוגת האפליקציה
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium">ערכת נושא</p>
              <p className="text-sm text-muted-foreground">
                {theme === "dark" ? "מצב כהה" : "מצב בהיר"}
              </p>
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={handleThemeToggle}
              aria-label={
                theme === "dark"
                  ? "עבור למצב בהיר"
                  : "עבור למצב כהה"
              }
            >
              {theme === "dark" ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 5. Danger Zone - Reset User */}
      <Card className="border-destructive/50">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <CardTitle className="text-destructive">
              אזור מסוכן
            </CardTitle>
          </div>
          <CardDescription>
            פעולות בלתי הפיכות. אנא פעל בזהירות.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-destructive/30 p-4">
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-1">
                <p className="text-sm font-medium">
                  איפוס נתוני משתמש
                </p>
                <p className="text-xs text-muted-foreground">
                  מחיקת כל הקורסים, הסמסטרים והסטטוס. תועבר לתהליך ההרשמה
                  מחדש.
                </p>
              </div>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setShowResetDialog(true)}
              >
                <Trash2 className="h-4 w-4" />
                אפס משתמש
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 6. About Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Info className="h-5 w-5 text-muted-foreground" />
            <CardTitle>אודות</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              גרסה
            </span>
            <Badge variant="outline">2.0.0</Badge>
          </div>
          <Separator />
          <p className="text-xs text-muted-foreground">
            סוגרים - מערכת לבדיקת סטטוס השלמת תואר בטכניון. פרויקט
            קוד פתוח.
          </p>
        </CardContent>
      </Card>

      {/* Reset User Dialog */}
      <ResetUserDialog
        open={showResetDialog}
        onClose={() => setShowResetDialog(false)}
        onError={(message) => setToast({ message, type: "error" })}
        onSuccess={() =>
          setToast({ message: "הנתונים אופסו בהצלחה", type: "success" })
        }
      />

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
