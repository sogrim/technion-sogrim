import { Loader2, Info } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useComputeDegreeStatus } from "@/hooks/use-mutations";

export function ModifiedToast() {
  const { mutate, isPending } = useComputeDegreeStatus();
  const [showInfo, setShowInfo] = useState(false);

  return (
    <div
      className="flex flex-wrap items-center justify-center gap-2 px-3 py-2.5 text-sm rounded-lg mb-2 md:rounded-none md:-mx-6 md:-mt-6 md:px-6 md:mb-0 bg-[#e8dff5] text-[#3b2069] dark:bg-[#2d1f4e] dark:text-[#d4c4f0]"
    >
      <span className="text-center font-medium text-xs md:text-sm">
        {"סטטוס התואר שלך אינו מעודכן - עלייך להריץ שוב את חישוב סגירת התואר."}
      </span>

      <Button
        size="sm"
        onClick={() => mutate()}
        disabled={isPending}
        className="bg-[#7c5cbf] hover:bg-[#6a4da6] text-white text-xs h-7"
      >
        {isPending ? (
          <>
            <Loader2 className="h-3 w-3 animate-spin" />
            {"מחשב..."}
          </>
        ) : (
          "סגור את התואר!"
        )}
      </Button>

      <div className="relative">
        <button
          onClick={() => setShowInfo(!showInfo)}
          className="flex items-center gap-1 text-[10px] md:text-xs text-[#7c5cbf] hover:text-[#6a4da6] dark:text-[#b69df0] dark:hover:text-[#c9b4f5] underline"
          type="button"
        >
          <Info className="h-3 w-3" />
          {"למידע נוסף"}
        </button>
        {showInfo && (
          <div className="absolute top-full start-0 z-10 mt-1 w-56 rounded-md border bg-card p-3 text-xs text-foreground shadow-lg">
            {"כאשר מבוצע שינוי בקורסים (הוספה, עריכה או מחיקה), יש להריץ מחדש את חישוב סגירת התואר כדי לעדכן את הסטטוס."}
            <button
              onClick={() => setShowInfo(false)}
              className="mt-1 block text-[#7c5cbf] hover:underline"
            >
              {"סגור"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
