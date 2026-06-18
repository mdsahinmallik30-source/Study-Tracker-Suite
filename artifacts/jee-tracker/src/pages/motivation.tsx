import { useGetDailyQuote } from "@workspace/api-client-react";
import { format } from "date-fns";
import { Sparkles, RefreshCw } from "lucide-react";

export default function Motivation() {
  const { data: quote, isLoading, isError, refetch, isFetching } = useGetDailyQuote();

  const today = format(new Date(), "EEEE, MMMM do, yyyy");

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col animate-in fade-in duration-500">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Motivation</h1>
        <p className="text-muted-foreground mt-1">Your daily dose of inspiration. New quote every day.</p>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center gap-8 pb-12">
        <div className="w-full max-w-2xl">
          {isLoading ? (
            <QuoteSkeleton />
          ) : isError ? (
            <ErrorCard onRetry={refetch} />
          ) : quote ? (
            <QuoteCard quote={quote} today={today} isFetching={isFetching} onRefetch={refetch} />
          ) : null}
        </div>

        <div className="w-full max-w-2xl">
          <TodayIntention />
        </div>

        <div className="w-full max-w-2xl">
          <StudyReminders />
        </div>
      </div>
    </div>
  );
}

function QuoteCard({
  quote,
  today,
  isFetching,
  onRefetch,
}: {
  quote: { text: string; author: string; date: string };
  today: string;
  isFetching: boolean;
  onRefetch: () => void;
}) {
  return (
    <div className="relative rounded-2xl border border-primary/20 bg-gradient-to-br from-card via-card to-primary/5 p-8 md:p-12 shadow-lg shadow-primary/5">
      <div className="absolute top-6 left-8 text-7xl font-serif text-primary/15 leading-none select-none">"</div>

      <div className="relative space-y-6">
        <p className="text-xl md:text-2xl font-medium leading-relaxed text-foreground pt-6">
          {quote.text}
        </p>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <p className="text-primary font-semibold">— {quote.author}</p>
            <p className="text-xs text-muted-foreground">{today}</p>
          </div>
          <button
            onClick={onRefetch}
            disabled={isFetching}
            title="Refresh quote"
            className="p-2 rounded-full text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all disabled:opacity-40"
          >
            <RefreshCw className={`w-4 h-4 ${isFetching ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      <div className="absolute bottom-6 right-8 text-7xl font-serif text-primary/15 leading-none select-none rotate-180">"</div>
    </div>
  );
}

function QuoteSkeleton() {
  return (
    <div className="rounded-2xl border border-border/50 bg-card p-8 md:p-12 space-y-4">
      <div className="h-6 bg-secondary animate-pulse rounded w-3/4" />
      <div className="h-6 bg-secondary animate-pulse rounded w-full" />
      <div className="h-6 bg-secondary animate-pulse rounded w-2/3" />
      <div className="h-4 bg-secondary animate-pulse rounded w-1/4 mt-4" />
    </div>
  );
}

function ErrorCard({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="rounded-2xl border border-border/50 bg-card p-8 text-center space-y-4">
      <Sparkles className="w-10 h-10 mx-auto text-muted-foreground/30" />
      <p className="text-muted-foreground">Could not load today's quote.</p>
      <button
        onClick={onRetry}
        className="text-primary text-sm hover:underline"
      >
        Try again
      </button>
    </div>
  );
}

function TodayIntention() {
  const storageKey = `intention-${format(new Date(), "yyyy-MM-dd")}`;
  const saved = typeof window !== "undefined" ? localStorage.getItem(storageKey) ?? "" : "";

  return (
    <div className="rounded-xl border border-border/50 bg-card p-6 space-y-3">
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-primary" /> Today's Intention
      </h3>
      <textarea
        className="w-full bg-secondary/30 border border-border/50 rounded-lg p-3 text-sm resize-none h-20 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 placeholder:text-muted-foreground/50 transition-colors"
        placeholder="What is your main focus for today? Write it down to make it real..."
        defaultValue={saved}
        onBlur={e => {
          if (typeof window !== "undefined") {
            localStorage.setItem(storageKey, e.target.value);
          }
        }}
      />
    </div>
  );
}

const REMINDERS = [
  "Every question you solve today is one less gap in your preparation.",
  "Confusion is the sign of learning — sit with it, don't run from it.",
  "Revision isn't repetition, it's cementing.",
  "The rank you want is won in the hours no one sees.",
  "One strong chapter is worth more than three weak ones.",
  "Sleep and rest are part of the study plan, not breaks from it.",
  "If you do not understand something, it is an invitation — not a wall.",
];

function StudyReminders() {
  const idx = new Date().getDate() % REMINDERS.length;
  const reminder = REMINDERS[idx];

  return (
    <div className="rounded-xl border border-border/30 bg-secondary/20 p-5 flex items-start gap-3">
      <div className="w-1 h-full min-h-[2rem] rounded-full bg-primary/50 shrink-0 mt-0.5" />
      <div>
        <p className="text-xs font-medium text-primary uppercase tracking-wide mb-1">Study Reminder</p>
        <p className="text-sm text-muted-foreground leading-relaxed">{reminder}</p>
      </div>
    </div>
  );
}
