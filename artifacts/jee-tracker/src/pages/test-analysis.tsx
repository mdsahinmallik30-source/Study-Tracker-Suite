import { useState } from "react";
import {
  useListTests, useCreateTest, useUpdateTest, useDeleteTest,
  useListTestQuestions, useCreateTestQuestion, useUpdateTestQuestion, useDeleteTestQuestion,
  getListTestsQueryKey, getListTestQuestionsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Plus, Trash2, ChevronDown, ChevronUp, FlaskConical, CheckCircle2,
  AlertCircle, BookMarked, X, RotateCcw
} from "lucide-react";

const SUBJECT_COLORS: Record<string, string> = {
  physics: "text-blue-400 bg-blue-400/10 border-blue-400/20",
  chemistry: "text-green-400 bg-green-400/10 border-green-400/20",
  maths: "text-purple-400 bg-purple-400/10 border-purple-400/20",
  mixed: "text-orange-400 bg-orange-400/10 border-orange-400/20",
};

const ERROR_TYPES = [
  { key: "conceptualError" as const, label: "Conceptual Error", color: "border-red-500 text-red-400 data-[checked=true]:bg-red-500/20 data-[checked=true]:border-red-500" },
  { key: "calculationMistake" as const, label: "Calculation Mistake", color: "border-yellow-500 text-yellow-400 data-[checked=true]:bg-yellow-500/20 data-[checked=true]:border-yellow-500" },
  { key: "unknown" as const, label: "Unknown", color: "border-slate-500 text-slate-400 data-[checked=true]:bg-slate-500/20 data-[checked=true]:border-slate-500" },
  { key: "readingError" as const, label: "Reading Error", color: "border-cyan-500 text-cyan-400 data-[checked=true]:bg-cyan-500/20 data-[checked=true]:border-cyan-500" },
];

export default function TestAnalysis() {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [openTestId, setOpenTestId] = useState<number | null>(null);

  const queryClient = useQueryClient();
  const { data: tests, isLoading } = useListTests();
  const createTest = useCreateTest();
  const deleteTest = useDeleteTest();

  const invalidateTests = () => queryClient.invalidateQueries({ queryKey: getListTestsQueryKey() });

  const [form, setForm] = useState({
    title: "", subject: "mixed", date: format(new Date(), "yyyy-MM-dd"),
    score: "", maxScore: "", timeTaken: "", notes: "",
  });

  const handleCreate = () => {
    if (!form.title.trim()) return;
    createTest.mutate({
      data: {
        title: form.title.trim(),
        subject: form.subject,
        date: form.date,
        score: form.score ? parseFloat(form.score) : null,
        maxScore: form.maxScore ? parseFloat(form.maxScore) : null,
        timeTaken: form.timeTaken ? parseInt(form.timeTaken) : null,
        notes: form.notes.trim() || null,
        revised: false,
      },
    }, {
      onSuccess: (t) => {
        invalidateTests();
        setShowCreateForm(false);
        setOpenTestId(t.id);
        setForm({ title: "", subject: "mixed", date: format(new Date(), "yyyy-MM-dd"), score: "", maxScore: "", timeTaken: "", notes: "" });
      },
    });
  };

  const handleDelete = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteTest.mutate({ id }, { onSuccess: invalidateTests });
  };

  const sortedTests = [...(tests || [])].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Test Analysis</h1>
          <p className="text-muted-foreground mt-1">Break down every wrong question. Turn mistakes into mastery.</p>
        </div>
        <Button onClick={() => setShowCreateForm(v => !v)} className="gap-2 shrink-0">
          <Plus className="w-4 h-4" /> New Test
        </Button>
      </div>

      {showCreateForm && (
        <Card className="border-primary/30 bg-primary/5 animate-in slide-in-from-top-2 duration-200">
          <CardHeader className="pb-4">
            <CardTitle className="text-base">Log a New Test</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Test Name *</label>
                <Input
                  placeholder="e.g. JEE Mock Test 3 / Chapter 5 Test"
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  onKeyDown={e => e.key === "Enter" && handleCreate()}
                  autoFocus
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Subject</label>
                <Select value={form.subject} onValueChange={v => setForm(f => ({ ...f, subject: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mixed">Mixed</SelectItem>
                    <SelectItem value="physics">Physics</SelectItem>
                    <SelectItem value="chemistry">Chemistry</SelectItem>
                    <SelectItem value="maths">Maths</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Date</label>
                <Input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Score</label>
                <div className="flex items-center gap-2">
                  <Input placeholder="Marks scored" value={form.score} onChange={e => setForm(f => ({ ...f, score: e.target.value }))} type="number" />
                  <span className="text-muted-foreground shrink-0">/</span>
                  <Input placeholder="Max marks" value={form.maxScore} onChange={e => setForm(f => ({ ...f, maxScore: e.target.value }))} type="number" />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Time Taken (min)</label>
                <Input placeholder="e.g. 180" value={form.timeTaken} onChange={e => setForm(f => ({ ...f, timeTaken: e.target.value }))} type="number" />
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="ghost" onClick={() => setShowCreateForm(false)}>Cancel</Button>
              <Button onClick={handleCreate} disabled={!form.title.trim() || createTest.isPending}>
                {createTest.isPending ? "Creating…" : "Create & Add Questions"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="h-20 bg-secondary animate-pulse rounded-lg" />)}
        </div>
      ) : sortedTests.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground border border-dashed border-border rounded-xl">
          <FlaskConical className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No tests logged yet.</p>
          <p className="text-sm mt-1">Click "New Test" to start analysing your mistakes.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {sortedTests.map(test => (
            <TestCard
              key={test.id}
              test={test}
              isOpen={openTestId === test.id}
              onToggle={() => setOpenTestId(openTestId === test.id ? null : test.id)}
              onDelete={e => handleDelete(test.id, e)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function TestCard({ test, isOpen, onToggle, onDelete }: {
  test: any; isOpen: boolean; onToggle: () => void; onDelete: (e: React.MouseEvent) => void;
}) {
  const queryClient = useQueryClient();
  const updateTest = useUpdateTest();
  const { data: questions } = useListTestQuestions(test.id, { query: { enabled: isOpen } });

  const invalidateTests = () => queryClient.invalidateQueries({ queryKey: getListTestsQueryKey() });

  const scorePercent = test.score != null && test.maxScore ? Math.round((test.score / test.maxScore) * 100) : null;

  const toggleRevised = (e: React.MouseEvent) => {
    e.stopPropagation();
    updateTest.mutate({ id: test.id, data: { revised: !test.revised } }, { onSuccess: invalidateTests });
  };

  const errorCounts = questions ? {
    conceptual: questions.filter((q: any) => q.conceptualError).length,
    calculation: questions.filter((q: any) => q.calculationMistake).length,
    unknown: questions.filter((q: any) => q.unknown).length,
    reading: questions.filter((q: any) => q.readingError).length,
  } : null;

  return (
    <Card className={`border-border/50 overflow-hidden transition-all duration-200 ${isOpen ? "border-primary/30" : ""}`}>
      <div
        className="p-4 flex items-center gap-4 cursor-pointer hover:bg-secondary/20 transition-colors"
        onClick={onToggle}
      >
        <div className="p-2 bg-secondary rounded-md shrink-0">
          {isOpen ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="font-semibold text-base truncate">{test.title}</span>
            <span className={`text-xs px-2 py-0.5 rounded border font-medium capitalize ${SUBJECT_COLORS[test.subject] || SUBJECT_COLORS.mixed}`}>
              {test.subject}
            </span>
            {test.revised && (
              <span className="text-xs px-2 py-0.5 rounded border border-green-500/30 text-green-400 bg-green-400/10 font-medium flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Revised
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <span>{format(new Date(test.date), "dd MMM yyyy")}</span>
            {scorePercent != null && (
              <span className={`font-semibold ${scorePercent >= 70 ? "text-green-400" : scorePercent >= 50 ? "text-yellow-400" : "text-red-400"}`}>
                {test.score}/{test.maxScore} ({scorePercent}%)
              </span>
            )}
            {test.timeTaken && <span>{test.timeTaken} min</span>}
            {questions != null && (
              <span>{questions.length} wrong question{questions.length !== 1 ? "s" : ""}</span>
            )}
          </div>
        </div>

        {errorCounts && isOpen && (
          <div className="hidden md:flex items-center gap-2 shrink-0">
            {errorCounts.conceptual > 0 && <ErrorPill label={`${errorCounts.conceptual} Concept`} color="text-red-400 bg-red-400/10" />}
            {errorCounts.calculation > 0 && <ErrorPill label={`${errorCounts.calculation} Calc`} color="text-yellow-400 bg-yellow-400/10" />}
            {errorCounts.reading > 0 && <ErrorPill label={`${errorCounts.reading} Reading`} color="text-cyan-400 bg-cyan-400/10" />}
            {errorCounts.unknown > 0 && <ErrorPill label={`${errorCounts.unknown} Unknown`} color="text-slate-400 bg-slate-400/10" />}
          </div>
        )}

        <div className="flex items-center gap-1 shrink-0" onClick={e => e.stopPropagation()}>
          <button
            onClick={toggleRevised}
            title={test.revised ? "Mark as not revised" : "Mark as revised"}
            className={`p-1.5 rounded transition-colors ${test.revised ? "text-green-400 hover:text-green-300" : "text-muted-foreground hover:text-foreground"}`}
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button onClick={onDelete} className="p-1.5 rounded text-muted-foreground hover:text-destructive transition-colors">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="border-t border-border/50 bg-background p-4 space-y-4 animate-in fade-in duration-150">
          <QuestionsPanel testId={test.id} questions={questions || []} />
        </div>
      )}
    </Card>
  );
}

function ErrorPill({ label, color }: { label: string; color: string }) {
  return <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${color}`}>{label}</span>;
}

function QuestionsPanel({ testId, questions }: { testId: number; questions: any[] }) {
  const queryClient = useQueryClient();
  const createQ = useCreateTestQuestion();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: getListTestQuestionsQueryKey(testId) });
    queryClient.invalidateQueries({ queryKey: getListTestsQueryKey() });
  };

  const handleAddQuestion = () => {
    createQ.mutate({
      testId,
      data: { questionText: "", conceptualError: false, calculationMistake: false, unknown: false, readingError: false, takeaway: "" },
    }, { onSuccess: invalidate });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
          <AlertCircle className="w-4 h-4" /> Wrong Questions ({questions.length})
        </h4>
        <Button size="sm" variant="outline" className="h-8 gap-1.5 text-xs" onClick={handleAddQuestion} disabled={createQ.isPending}>
          <Plus className="w-3.5 h-3.5" /> Add Question
        </Button>
      </div>

      {questions.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground border border-dashed border-border rounded-lg">
          <BookMarked className="w-7 h-7 mx-auto mb-2 opacity-30" />
          <p className="text-sm">No wrong questions logged yet.</p>
          <p className="text-xs mt-0.5">Click "Add Question" to start breaking down your mistakes.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {questions.map((q, idx) => (
            <QuestionCard key={q.id} question={q} index={idx + 1} testId={testId} />
          ))}
        </div>
      )}
    </div>
  );
}

function QuestionCard({ question, index, testId }: { question: any; index: number; testId: number }) {
  const queryClient = useQueryClient();
  const updateQ = useUpdateTestQuestion();
  const deleteQ = useDeleteTestQuestion();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: getListTestQuestionsQueryKey(testId) });
    queryClient.invalidateQueries({ queryKey: getListTestsQueryKey() });
  };

  const handleUpdate = (field: string, value: unknown) => {
    updateQ.mutate({ testId, id: question.id, data: { [field]: value } as any }, { onSuccess: invalidate });
  };

  const handleDelete = () => {
    deleteQ.mutate({ testId, id: question.id }, { onSuccess: invalidate });
  };

  const activeErrors = ERROR_TYPES.filter(e => question[e.key]);

  return (
    <div className="rounded-lg border border-border bg-card/60 overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-2.5 bg-secondary/30 border-b border-border/50">
        <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">Q{index}</span>
        {activeErrors.length > 0 && (
          <div className="flex gap-1.5 flex-wrap">
            {activeErrors.map(e => (
              <span key={e.key} className="text-xs px-1.5 py-0.5 rounded border" style={{ opacity: 0.9 }}>
                {e.label}
              </span>
            ))}
          </div>
        )}
        <button onClick={handleDelete} className="ml-auto p-1 rounded text-muted-foreground hover:text-destructive transition-colors">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="p-4 space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">The question I did wrong</label>
          <Textarea
            placeholder="Write out the question, formula, or concept you got wrong..."
            className="min-h-[80px] resize-none text-sm bg-background/50"
            defaultValue={question.questionText}
            onBlur={e => handleUpdate("questionText", e.target.value)}
            key={`q-${question.id}`}
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Why was it wrong?</label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {ERROR_TYPES.map(({ key, label, color }) => {
              const isChecked = question[key] as boolean;
              return (
                <button
                  key={key}
                  data-checked={isChecked}
                  onClick={() => handleUpdate(key, !isChecked)}
                  className={`px-3 py-2 rounded-lg border text-xs font-medium transition-all duration-150 text-left
                    ${isChecked
                      ? `${color} ring-1 ring-current`
                      : "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground"
                    }`}
                >
                  <div className={`w-3 h-3 rounded-sm border inline-block mr-1.5 mb-0.5 align-middle transition-colors
                    ${isChecked ? "bg-current border-current" : "border-muted-foreground/40"}`}
                  />
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
            <BookMarked className="w-3 h-3" /> Take Away
          </label>
          <Textarea
            placeholder="What's the key lesson? What will you remember next time?"
            className="min-h-[70px] resize-none text-sm bg-background/50 border-primary/20 focus:border-primary"
            defaultValue={question.takeaway}
            onBlur={e => handleUpdate("takeaway", e.target.value)}
            key={`t-${question.id}`}
          />
        </div>
      </div>
    </div>
  );
}
