import { useState } from "react";
import { useListProgress, useCreateProgress, useUpdateProgress, useDeleteProgress, getListProgressQueryKey } from "@workspace/api-client-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { Progress } from "@/components/ui/progress";

const CATEGORIES = [
  { id: 'dpp', label: 'DPP' },
  { id: 'jee_replica', label: 'JEE Replica' },
  { id: 'practice_sheet', label: 'Practice Sheet' },
  { id: 'chapterwise_test', label: 'Chapterwise Test' },
  { id: 'cengage', label: 'Cengage' },
  { id: 'exercise_book', label: 'Exercise Book' }
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

        <TabsContent value="physics" className="space-y-8">
          <SubjectView subject="physics" />
        </TabsContent>
        <TabsContent value="chemistry" className="space-y-8">
          <SubjectView subject="chemistry" />
        </TabsContent>
        <TabsContent value="maths" className="space-y-8">
          <SubjectView subject="maths" />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function SubjectView({ subject }: { subject: string }) {
  return (
    <div className="grid grid-cols-1 gap-6">
      {CATEGORIES.map(cat => (
        <CategorySection key={cat.id} subject={subject} category={cat.id} label={cat.label} />
      ))}
    </div>
  );
}

function CategorySection({ subject, category, label }: { subject: string, category: string, label: string }) {
  const [expanded, setExpanded] = useState(false);
  const { data: items, isLoading } = useListProgress({ subject, category });
  const queryClient = useQueryClient();
  const createProgress = useCreateProgress();

  const isChapterwiseTest = category === 'chapterwise_test';

  const handleAdd = () => {
    if (isChapterwiseTest) {
      // Create part 1 by default, the rest can be added manually or we can expand and show Add for parts
      createProgress.mutate({
        data: {
          subject,
          category,
          subCategory: 'part1',
          chapter: 'New Chapter',
          status: 'not_started'
        }
      }, {
        onSuccess: () => queryClient.invalidateQueries({ queryKey: getListProgressQueryKey() })
      });
      setExpanded(true);
    } else {
      createProgress.mutate({
        data: {
          subject,
          category,
          chapter: 'New Chapter',
          status: 'not_started'
        }
      }, {
        onSuccess: () => queryClient.invalidateQueries({ queryKey: getListProgressQueryKey() })
      });
      setExpanded(true);
    }
  };

  const completedCount = items?.filter(i => i.status === 'completed').length || 0;
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
            <div className="text-sm text-muted-foreground flex items-center gap-2">
              {completedCount} / {totalCount} Completed
            </div>
          </div>
        </div>
        <div className="w-48 hidden md:block">
          <Progress value={percent} className="h-2" />
        </div>
        <Button variant="ghost" size="icon" className="ml-4" onClick={(e) => { e.stopPropagation(); handleAdd(); }}>
          <Plus className="w-5 h-5" />
        </Button>
      </div>

      {expanded && (
        <div className="p-4 border-t border-border/50 bg-background">
          {isLoading ? (
            <div className="h-24 bg-secondary animate-pulse rounded-md" />
          ) : items?.length === 0 ? (
            <div className="text-center p-6 text-muted-foreground bg-secondary/30 rounded-md border border-dashed border-border">
              No items yet. Click the + button to add your first chapter.
            </div>
          ) : (
            <div className="space-y-3">
              {isChapterwiseTest ? (
                <ChapterwiseGroup items={items || []} subject={subject} category={category} />
              ) : (
                items?.map(item => (
                  <ProgressRow key={item.id} item={item} />
                ))
              )}
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

function ChapterwiseGroup({ items, subject, category }: { items: any[], subject: string, category: string }) {
  // Group by chapter name
  const grouped = items.reduce((acc, item) => {
    if (!acc[item.chapter || '']) acc[item.chapter || ''] = [];
    acc[item.chapter || ''].push(item);
    return acc;
  }, {} as Record<string, any[]>);

  const createProgress = useCreateProgress();
  const queryClient = useQueryClient();

  const handleAddPart = (chapter: string) => {
    const existingParts = grouped[chapter].map(i => i.subCategory);
    const nextPart = ['part1', 'part2', 'part3', 'part4', 'part5'].find(p => !existingParts.includes(p));
    
    if (nextPart) {
      createProgress.mutate({
        data: {
          subject,
          category,
          subCategory: nextPart,
          chapter,
          status: 'not_started'
        }
      }, {
        onSuccess: () => queryClient.invalidateQueries({ queryKey: getListProgressQueryKey() })
      });
    }
  };

  return (
    <div className="space-y-6">
      {Object.entries(grouped).map(([chapter, parts]) => (
        <div key={chapter} className="border border-border rounded-md overflow-hidden">
          <div className="bg-secondary/50 px-4 py-2 font-medium flex justify-between items-center border-b border-border">
            <Input 
              value={chapter}
              onChange={(e) => {
                // To rename a chapter we would need to update all parts. For simplicity, just display it if it's new.
              }}
              className="h-8 w-64 bg-transparent border-none font-semibold focus-visible:ring-1 p-0 px-2"
            />
            {parts.length < 5 && (
              <Button size="sm" variant="ghost" onClick={() => handleAddPart(chapter)}>
                Add Part +
              </Button>
            )}
          </div>
          <div className="p-2 space-y-2">
            {parts.sort((a, b) => (a.subCategory || '').localeCompare(b.subCategory || '')).map(item => (
              <ProgressRow key={item.id} item={item} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function ProgressRow({ item }: { item: any }) {
  const updateProgress = useUpdateProgress();
  const deleteProgress = useDeleteProgress();
  const queryClient = useQueryClient();

  const handleUpdate = (field: string, value: any) => {
    updateProgress.mutate({
      id: item.id,
      data: { [field]: value }
    }, {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: getListProgressQueryKey() })
    });
  };

  const handleDelete = () => {
    deleteProgress.mutate({ id: item.id }, {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: getListProgressQueryKey() })
    });
  };

  return (
    <div className="flex items-center gap-3 p-3 rounded-md border border-border bg-card/50 hover:bg-secondary/30 transition-colors">
      <div className="flex-1 grid grid-cols-12 gap-3 items-center">
        <div className="col-span-12 md:col-span-4 flex items-center gap-2">
          {item.subCategory && (
            <span className="text-xs uppercase font-bold text-primary bg-primary/10 px-2 py-1 rounded">
              {item.subCategory.replace('part', 'Part ')}
            </span>
          )}
          {!item.subCategory && (
            <Input 
              value={item.chapter || ''} 
              onChange={(e) => handleUpdate('chapter', e.target.value)}
              placeholder="Chapter Name"
              className="h-9 bg-background/50"
            />
          )}
        </div>
        
        <div className="col-span-6 md:col-span-2 flex items-center gap-2 text-sm">
          <Input 
            type="number" 
            value={item.completedQuestions || ''} 
            onChange={(e) => handleUpdate('completedQuestions', parseInt(e.target.value) || 0)}
            placeholder="Done"
            className="h-9 text-center px-1"
          />
          <span className="text-muted-foreground">/</span>
          <Input 
            type="number" 
            value={item.totalQuestions || ''} 
            onChange={(e) => handleUpdate('totalQuestions', parseInt(e.target.value) || 0)}
            placeholder="Total"
            className="h-9 text-center px-1"
          />
        </div>

        <div className="col-span-6 md:col-span-2">
          <div className="flex items-center gap-1">
            <Input 
              type="number" 
              value={item.score || ''} 
              onChange={(e) => handleUpdate('score', parseInt(e.target.value) || 0)}
              placeholder="Score"
              className="h-9"
            />
            <span className="text-muted-foreground text-sm">%</span>
          </div>
        </div>

        <div className="col-span-12 md:col-span-3">
          <Select value={item.status} onValueChange={(val) => handleUpdate('status', val)}>
            <SelectTrigger className="h-9">
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
