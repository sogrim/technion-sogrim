import { useState } from "react";
import { ChevronDown, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface FAQ {
  title: string;
  content: string;
}

const faqs: FAQ[] = [
  {
    title: "מה קורה פה?",
    content:
      '"סוגרים" הוא פרוייקט קוד פתוח של סטודנטים למדעי המחשב בטכניון, שמטרתו לענות על השאלה המטורללת: האם סיימתי את התואר? כאן תוכלו לראות את מצב הדרישות השונות בהתאם לקטלוג שבחרתם, לתכנן את הסמסטרים הבאים ולקבל תמונת מצב טובה על המצב האקדמאי שלכם.',
  },
  {
    title: "איך זה עובד?",
    content:
      "די פשוט. בוחרים קטלוג לימודים, מייבאים את הקורסים שלכם משירות student ומקליקים על סגור את התואר. אנחנו נעשה את שאר העבודה :)",
  },
  {
    title: "אני חייב להתחבר דרך גוגל?",
    content:
      "נכון לעכשיו, כן. זו הדרך הבטוחה כדי לאמת אתכם ולשמור את המידע שלכם.",
  },
  {
    title: "נשמע מגניב! זה רשמי מטעם הפקולטה?",
    content:
      "לא. דיסקליימר חביב - שום דבר לא יחליף שיחה עם רכזות ההסמכה מטעם הפקולטה. אבל אנחנו בשיתוף פעולה מלא איתן, כדי לשפר את החוויה שלכם.",
  },
  {
    title: "הקטלוג שלי לא מופיע, מה אני עושה?",
    content:
      "אנחנו עדיין בשלבי הרצה, והזנו למערכת מעט קטלוגים. עם הזמן, בשיתוף עם רכזות ההסמכה בפקולטה, נזין את כל הקטלוגים.",
  },
  {
    title: "איך מייבאים קורסים?",
    content: "ניתן לייבא קורסים רק דרך מערכת student.",
  },
  {
    title: "איך מחליפים קטלוג?",
    content:
      "עדכון: אין צורך יותר לאפס משתמש כדי להחליף קטלוג! לחצו על שם הקטלוג המופיע מתחת לסטטוס התואר כדי להחליף קטלוג.",
  },
  {
    title: 'יש לי קורס שתוייג כ"בחירה חופשית" למרות שהוא לא, מה לעשות?',
    content:
      "יתכן כי קורס זה לא נמצא במסד הנתונים שלנו. האלגוריתם מתייג קורסים כאלה כבחירה חופשית. אם אתם יודעים לאיזה דרישה שייך הקורס, תוכלו לערוך את נתוני הקורס ידנית בלשונית הסמסטרים.",
  },
  {
    title:
      "יש לי קורס שתוייג בדרישה לא נכונה (לאו דווקא בחירה חופשית), מה לעשות?",
    content:
      'מסד הנתונים שלנו די גדול, אך יתכנו שינויים וכמובן אישורים פרטניים. למשל, סטודנט שעשה את הקורסים הישנים "מערכות ספרתיות" ו-"תכן לוגי" שהוחלפו ב-"מערכות ספרתיות ומבנה המחשב" החדש, יוכל לסמן זאת בצורה ידנית דרך הממשק שלנו ולהריץ פעם נוספת. אם לדעתכם מדובר על בעיה גורפת לכלל הסטודנטים אנחנו יותר מנשמח אם תוכלו לדווח על כך בטופס שבתחתית העמוד.',
  },
  {
    title: "יש שדות בטבלת הסמסטרים שאיני מצליח לערוך, מה עושים?",
    content:
      "השדות מס׳ קורס וסטטוס אינם ניתן לעריכה במכוון. אם תרצו מס׳ קורס אחר, עליכם להוסיף קורס חדש. באשר לסטטוס, הוא מתעדכן בהתאם לציון.",
  },
  {
    title: "מופיע לי קורס תחת הדרישה חובה שלא רלוונטי לגביי, מה לעשות?",
    content:
      'במיוחד לשם כך הוספנו את כפתור היד שמטרתו לסמן קורס כ"לא רלוונטי". לחצו עליו והריצו פעם נוספת.',
  },
  {
    title: "לא הבנתי כ״כ מה קורה בלשונית דרישות...",
    content:
      "כל קטלוג מורכב מרשימה של דרישות. לכל קבוצה כזו יש מאפיינים היחודיים לה - קורסי חובה, קורסי בחירה או שרשראות מסויימות. פישטנו את הנושא, שבחלק מהקטלוגים מורכב למדי, כדי שלכם תהיה תמונת מצב מאוד ברורה איך השרשרת המדעית נסגרת, לאן זלגו נקודות מקורסי הבחירה ואיפה מתחבאות הדרישות המוזרות ביותר.",
  },
  {
    title: "מה אתם עושים עם המידע שלנו?",
    content:
      "פרט לחישובים של המערכת, שום דבר, נשבעים לכם! המידע מאובטח וכמובן שלא עובר לשום גורם צד שלישי שצמא לדעת את הציון שלכם במבני נתונים.",
  },
  {
    title: "יש לי רעיון של מיליון דולר למערכת, אפשר לעזור לכם?",
    content: "כמובן! זהו קוד פתוח, נשמח לכל issue ו-PR.",
  },
];

interface FaqDialogProps {
  open: boolean;
  onClose: () => void;
}

function FaqItem({ faq }: { faq: FAQ }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border-b border-gray-100 last:border-b-0">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between px-4 py-3 text-right hover:bg-gray-50 transition-colors"
      >
        <span className="font-semibold text-sm text-[#24333c]">
          {faq.title}
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-gray-400 transition-transform duration-200",
            expanded && "rotate-180"
          )}
        />
      </button>
      {expanded && (
        <div className="px-4 pb-3 text-sm text-gray-600 leading-relaxed">
          {faq.content}
        </div>
      )}
    </div>
  );
}

export function FaqDialog({ open, onClose }: FaqDialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="relative z-10 bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col mx-4">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-lg font-bold text-[#24333c]">
            שאלות ותשובות
          </h2>
          <button
            onClick={onClose}
            className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {faqs.map((faq, index) => (
            <FaqItem key={index} faq={faq} />
          ))}
        </div>
      </div>
    </div>
  );
}
