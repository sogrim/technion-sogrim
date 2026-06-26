import {
  Facebook,
  FileText,
  ExternalLink,
  type LucideIcon,
} from "lucide-react";

interface ContactLink {
  href: string;
  title: string;
  description: string;
  icon: LucideIcon;
}

const CONTACT_LINKS: ContactLink[] = [
  {
    href: "https://www.facebook.com/groups/952189699522180",
    title: "קבוצת הפייסבוק",
    description: "הצטרפו לקהילת סוגרים בפייסבוק",
    icon: Facebook,
  },
  {
    href: "https://docs.google.com/forms/d/e/1FAIpQLSe7GbkAkIdTgJ3QkGmJMHhkIpjWz_I0ZX608FlxVLeT0cyJJQ/viewform?usp=sf_link",
    title: "בעיות והצעות - פנו אלינו",
    description: "מצאתם באג או יש לכם רעיון? ספרו לנו בטופס",
    icon: FileText,
  },
];

export function ContactPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">צרו קשר</h1>
        <p className="text-sm text-muted-foreground mt-1">
          נשמח לשמוע מכם - הצטרפו לקהילה או שלחו לנו פנייה
        </p>
      </div>

      <div className="space-y-3">
        {CONTACT_LINKS.map(({ href, title, description, icon: Icon }) => (
          <a
            key={href}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-4 rounded-lg border bg-card p-4 transition-colors hover:bg-accent/50"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted text-foreground">
              <Icon className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-foreground">{title}</div>
              <div className="text-xs text-muted-foreground">{description}</div>
            </div>
            <ExternalLink className="h-4 w-4 shrink-0 text-muted-foreground" />
          </a>
        ))}
      </div>
    </div>
  );
}
