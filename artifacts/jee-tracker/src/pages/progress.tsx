import { useState, useEffect } from "react";
import {
  useListProgress,
  useCreateProgress,
  useUpdateProgress,
  useDeleteProgress,
  getListProgressQueryKey,
  getGetProgressSummaryQueryKey,
} from "@workspace/api-client-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, ChevronDown, ChevronUp, BookMarked } from "lucide-react";
import { Progress } from "@/components/ui/progress";

const CATEGORIES = [
  { id: "dpp", label: "DPP" },
  { id: "jee_replica", label: "JEE Replica" },
  { id: "practice_sheet", label: "Practice Sheet" },
  { id: "chapterwise_test", label: "Chapterwise Test" },
  { id: "cengage", label: "Cengage" },
  { id: "exercise_book", label: "Exercise Book" },
];

export default function ProgressPage() {
  const [subject, setSubject] = useState("physics");

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Subject Progress</h1>
        <p className="text-muted-foreground mt-1">Deep dive into your chapter-wise completion.</p>
      </div>

      <Tabs value={subject} onValueChange={setSubject}>
        <TabsList className="grid w-full grid-cols-3 mb-8 h-12 bg-secondary border border-border">
          <TabsTrigger value="physics" className="text-base data-[state=active]:bg-background">Physics</TabsTrigger>
          <TabsTrigger value="chemistry" className="text-base data-[state=active]:bg-background">Chemistry</TabsTrigger>
          <TabsTrigger value="maths" className="text-base data-[state=active]:bg-background">Maths</TabsTrigger>
        </TabsList>

        {["physics", "chemistry", "maths"].map(s => (
          <TabsContent key={s} value={s} className="space-y-4">
            {CATEGORIES.map(cat => (
              <CategorySection key={cat.id} subject={s} category={cat.id} label={cat.label} />
            ))}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

function CategorySection({ subject, category, label }: { subject: string; category: string; label: string }) {
  const [expanded, setExpanded] = useState(false);
  const [newBookName, setNewBookName] = useState("");
  const [showAddBook, setShowAddBook] = useState(false);
  const { data: items, isLoading } = useListProgress({ subject, category });
  const queryClient = useQueryClient();
  const createProgress = useCreateProgress();

  const isChapterwiseTest = category === "chapterwise_test";
  const isExerciseBook = category === "exercise_book";

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: getListProgressQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetProgressSummaryQueryKey() });
  };

  const handleAdd = () => {
    if (isExerciseBook) {
      setShowAddBook(true);
      setExpanded(true);
      return;
    }
    if (isChapterwiseTest) {
      createProgress.mutate({
        data: { subject, category, subCategory: "part1", chapter: "New Chapter", status: "not_started" }
      }, { onSuccess: invalidate });
    } else {
      createProgress.mutate({
        data: { subject, category, chapter: "New Chapter", status: "not_started" }
      }, { onSuccess: invalidate });
    }
    setExpanded(true);
  };

  const handleAddBook = () => {
    const name = newBookName.trim();
    if (!name) return;
    createProgress.mutate({
      data: { subject, category, subCategory: name, chapter: "Chapter 1", status: "not_started" }
    }, { onSuccess: invalidate });
    setNewBookName("");
    setShowAddBook(false);
  };

  const completedCount = items?.filter(i => i.status === "completed").length || 0;
  const totalCount = items?.length || 0;
  const percent = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  return (
    <Card className="border-border/50 overflow-hidden transition-all duration-200">
      <div
        className="p-4 flex items-center justify-between cursor-pointer hover:bg-secondary/20"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex-1 flex items-center gap-4">
          <div className="p-2 bg-secondary rounded-md">
            {expanded ? <ChevronUp className="w-5 h-5 text-muted-foreground" /> : <ChevronDown className="w-5 h-5 text-muted-foreground" />}
          </div>
          <div>
            <h3 className="text-lg font-semibold">{label}</h3>
            <div className="text-sm text-muted-foreground">{completedCount} / {totalCount} Completed</div>
          </div>
        </div>
        <div className="w-48 hidden md:block">
          <Progress value={percent} className="h-2" />
        </div>
        <Button variant="ghost" size="icon" className="ml-4" onClick={e => { e.stopPropagation(); handleAdd(); }}>
          <Plus className="w-5 h-5" />
        </Button>
      </div>

      {expanded && (
        <div className="p-4 border-t border-border/50 bg-background">
          {isLoading ? (
            <div className="h-24 bg-secondary animate-pulse rounded-md" />
          ) : (
            <div className="space-y-3">
              {isExerciseBook && (
                <ExerciseBookView
                  items={items || []}
                  subject={subject}
                  category={category}
                  showAddBook={showAddBook}
                  newBookName={newBookName}
                  onNewBookNameChange={setNewBookName}
                  onAddBook={handleAddBook}
                  onCancelAddBook={() => { setShowAddBook(false); setNewBookName(""); }}
                />
              )}
              {isChapterwiseTest && (
                items?.length === 0 ? (
                  <EmptyState />
                ) : (
                  <ChapterwiseGroup items={items || []} subject={subject} category={category} />
                )
              )}
              {!isExerciseBook && !isChapterwiseTest && (
                items?.length === 0 ? (
                  <EmptyState />
                ) : (
                  items?.map(item => <ProgressRow key={item.id} item={item} />)
                )
              )}
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

function EmptyState() {
  return (
    <div className="text-center p-6 text-muted-foreground bg-secondary/30 rounded-md border border-dashed border-border">
      No items yet. Click the + button to add your first entry.
    </div>
  );
}

function ExerciseBookView({
  items,
  subject,
  category,
  showAddBook,
  newBookName,
  onNewBookNameChange,
  onAddBook,
  onCancelAddBook,
}: {
  items: any[];
  subject: string;
  category: string;
  showAddBook: boolean;
  newBookName: string;
  onNewBookNameChange: (v: string) => void;
  onAddBook: () => void;
  onCancelAddBook: () => void;
}) {
  const queryClient = useQueryClient();
  const createProgress = useCreateProgress();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: getListProgressQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetProgressSummaryQueryKey() });
  };

  const grouped = items.reduce((acc, item) => {
    const book = item.subCategory || "Uncategorised";
    if (!acc[book]) acc[book] = [];
    acc[book].push(item);
    return acc;
  }, {} as Record<string, any[]>);

  const handleAddChapter = (bookName: string) => {
    const existingChapters = grouped[bookName] || [];
    const chapterNum = existingChapters.length + 1;
    createProgress.mutate({
      data: { subject, category, subCategory: bookName, chapter: `Chapter ${chapterNum}`, status: "not_started" }
    }, { onSuccess: invalidate });
  };

  if (items.length === 0 && !showAddBook) {
    return <EmptyState />;
  }

  return (
    <div className="space-y-4">
      {showAddBook && (
        <div className="flex gap-2 items-center p-3 rounded-lg border border-dashed border-primary/50 bg-primary/5">
          <BookMarked className="w-4 h-4 text-primary shrink-0" />
          <Input
            placeholder="Book name (e.g. HC Verma, RD Sharma)"
            value={newBookName}
            onChange={e => onNewBookNameChange(e.target.value)}
            onKeyDown={e => e.key === "Enter" && onAddBook()}
            autoFocus
            className="h-9 bg-background"
          />
          <Button size="sm" onClick={onAddBook} disabled={!newBookName.trim()}>Add</Button>
          <Button size="sm" variant="ghost" onClick={onCancelAddBook}>Cancel</Button>
        </div>
      )}

      {(Object.entries(grouped) as [string, any[]][]).map(([bookName, chapters]) => (
        <BookFolder
          key={bookName}
          bookName={bookName}
          chapters={chapters}
          onAddChapter={() => handleAddChapter(bookName)}
        />
      ))}
    </div>
  );
}

function BookFolder({ bookName, chapters, onAddChapter }: { bookName: string; chapters: any[]; onAddChapter: () => void }) {
  const [open, setOpen] = useState(true);
  const completed = chapters.filter(c => c.status === "completed").length;

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <div
        className="bg-secondary/50 px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-secondary/70 transition-colors"
        onClick={() => setOpen(!open)}
      >
        <div className="flex items-center gap-3">
          <BookMarked className="w-4 h-4 text-primary" />
          <span className="font-semibold">{bookName}</span>
          <span className="text-xs text-muted-foreground">{completed}/{chapters.length} chapters done</span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            className="h-7 text-xs gap-1"
            onClick={e => { e.stopPropagation(); onAddChapter(); }}
          >
            <Plus className="w-3 h-3" /> Chapter
          </Button>
          {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </div>
      </div>
      {open && (
        <div className="p-3 space-y-2">
          {chapters.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-3">No chapters yet. Click + Chapter to add one.</p>
          ) : (
            chapters.map(item => <ProgressRow key={item.id} item={item} showBookLabel={false} />)
          )}
        </div>
      )}
    </div>
  );
}

function ChapterwiseGroup({ items, subject, category }: { items: any[]; subject: string; category: string }) {
  const grouped = items.reduce((acc, item) => {
    const key = item.chapter || "";
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {} as Record<string, any[]>);

  const createProgress = useCreateProgress();
  const queryClient = useQueryClient();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: getListProgressQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetProgressSummaryQueryKey() });
  };

  const handleAddPart = (chapter: string) => {
    const existingParts = grouped[chapter].map((i: any) => i.subCategory);
    const nextPart = ["part1", "part2", "part3", "part4", "part5"].find(p => !existingParts.includes(p));
    if (nextPart) {
      createProgress.mutate({
        data: { subject, category, subCategory: nextPart, chapter, status: "not_started" }
      }, { onSuccess: invalidate });
    }
  };

  return (
    <div className="space-y-6">
      {(Object.entries(grouped) as [string, any[]][]).map(([chapter, parts]) => (
        <div key={chapter} className="border border-border rounded-md overflow-hidden">
          <div className="bg-secondary/50 px-4 py-2 font-medium flex justify-between items-center border-b border-border">
            <span className="font-semibold">{chapter}</span>
            {parts.length < 5 && (
              <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => handleAddPart(chapter)}>
                <Plus className="w-3 h-3 mr-1" /> Part
              </Button>
            )}
          </div>
          <div className="p-2 space-y-2">
            {[...parts].sort((a, b) => (a.subCategory || "").localeCompare(b.subCategory || "")).map(item => (
              <ProgressRow key={item.id} item={item} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function ProgressRow({ item, showBookLabel = true }: { item: any; showBookLabel?: boolean }) {
  const updateProgress = useUpdateProgress();
  const deleteProgress = useDeleteProgress();
  const queryClient = useQueryClient();

  const [localCompleted, setLocalCompleted] = useState<string>(item.completedQuestions?.toString() ?? "");
  const [localTotal, setLocalTotal] = useState<string>(item.totalQuestions?.toString() ?? "");
  const [localScore, setLocalScore] = useState<string>(item.score?.toString() ?? "");

  useEffect(() => {
    setLocalCompleted(item.completedQuestions?.toString() ?? "");
    setLocalTotal(item.totalQuestions?.toString() ?? "");
    setLocalScore(item.score != null ? Math.round(item.score).toString() : "");
  }, [item.id, item.completedQuestions, item.totalQuestions, item.score]);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: getListProgressQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetProgressSummaryQueryKey() });
  };

  const handleUpdate = (field: string, value: unknown) => {
    updateProgress.mutate({ id: item.id, data: { [field]: value } as any }, { onSuccess: invalidate });
  };

  const computeAndSaveQuestions = (completed: string, total: string) => {
    const c = parseInt(completed);
    const t = parseInt(total);
    const patch: Record<string, unknown> = {
      completedQuestions: isNaN(c) ? null : c,
      totalQuestions: isNaN(t) ? null : t,
    };
    if (!isNaN(c) && !isNaN(t) && t > 0) {
      const auto = Math.round((c / t) * 100);
      patch.score = auto;
      setLocalScore(auto.toString());
    }
    updateProgress.mutate({ id: item.id, data: patch as any }, { onSuccess: invalidate });
  };

  const handleDelete = () => {
    deleteProgress.mutate({ id: item.id }, { onSuccess: invalidate });
  };

  return (
    <div className="flex items-center gap-3 p-3 rounded-md border border-border bg-card/50 hover:bg-secondary/30 transition-colors">
      <div className="flex-1 grid grid-cols-12 gap-2 items-center">
        <div className="col-span-12 md:col-span-4 flex items-center gap-2">
          {item.subCategory && item.category === "chapterwise_test" && (
            <span className="text-xs uppercase font-bold text-primary bg-primary/10 px-2 py-1 rounded shrink-0">
              {item.subCategory.replace("part", "P")}
            </span>
          )}
          <Input
            value={item.chapter || ""}
            onChange={e => handleUpdate("chapter", e.target.value)}
            placeholder="Chapter / topic name"
            className="h-9 bg-background/50 text-sm"
          />
        </div>

        <div className="col-span-7 md:col-span-3 flex items-center gap-1 text-sm">
          <Input
            type="number"
            value={localCompleted}
            onChange={e => setLocalCompleted(e.target.value)}
            onBlur={() => computeAndSaveQuestions(localCompleted, localTotal)}
            placeholder="Done"
            className="h-9 text-center px-1 text-sm"
          />
          <span className="text-muted-foreground shrink-0">/</span>
          <Input
            type="number"
            value={localTotal}
            onChange={e => setLocalTotal(e.target.value)}
            onBlur={() => computeAndSaveQuestions(localCompleted, localTotal)}
            placeholder="Total"
            className="h-9 text-center px-1 text-sm"
          />
        </div>

        <div className="col-span-5 md:col-span-2">
          <div className="flex items-center gap-1">
            <Input
              type="number"
              value={localScore}
              onChange={e => setLocalScore(e.target.value)}
              onBlur={() => {
                const v = parseFloat(localScore);
                handleUpdate("score", isNaN(v) ? null : v);
              }}
              placeholder="Score"
              className="h-9 text-sm"
            />
            <span className="text-muted-foreground text-sm shrink-0">%</span>
          </div>
        </div>

        <div className="col-span-12 md:col-span-2">
          <Select value={item.status} onValueChange={val => handleUpdate("status", val)}>
            <SelectTrigger className="h-9 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="not_started">Not Started</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="col-span-12 md:col-span-1 flex justify-end">
          <Button variant="ghost" size="icon" className="h-9 w-9 text-destructive hover:bg-destructive/10" onClick={handleDelete}>
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
