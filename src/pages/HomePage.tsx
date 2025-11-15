import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AnimatePresence } from 'framer-motion';
import { v4 as uuidv4 } from 'uuid';
import { Check, Plus, Calendar as CalendarIcon, Search } from 'lucide-react';
import { Toaster, toast } from 'sonner';
import { format } from 'date-fns';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from '@/lib/utils';
import { TodoItem } from '@/components/TodoItem';
import type { Todo, ApiResponse, Priority } from '@shared/types';
type FilterType = 'all' | 'active' | 'completed';
type SortByType = 'manual' | 'dueDate' | 'priority' | 'createdAt';
type GroupByType = 'none' | 'priority' | 'dueDate';
const priorityOrder: Record<Priority, number> = { high: 3, medium: 2, low: 1, none: 0 };
const priorityLabels: Record<Priority, string> = { high: 'High', medium: 'Medium', low: 'Low', none: 'No Priority' };
const fetchTodos = async (): Promise<Todo[]> => {
  const res = await fetch('/api/todos');
  if (!res.ok) throw new Error('Network response was not ok');
  const data: ApiResponse<Todo[]> = await res.json();
  if (!data.success) throw new Error(data.error || 'Failed to fetch todos');
  return data.data || [];
};
const apiCall = async <T,>(url: string, method: string, body?: T): Promise<Todo[]> => {
  const res = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error('Network response was not ok');
  const data: ApiResponse<Todo[]> = await res.json();
  if (!data.success) throw new Error(data.error || 'API call failed');
  return data.data || [];
};
export function HomePage() {
  const queryClient = useQueryClient();
  const [newTodoText, setNewTodoText] = useState('');
  const [dueDate, setDueDate] = useState<Date | undefined>();
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [newPriority, setNewPriority] = useState<Priority>('none');
  const [newTags, setNewTags] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<SortByType>('manual');
  const [groupBy, setGroupBy] = useState<GroupByType>('none');
  const [isClearConfirmOpen, setClearConfirmOpen] = useState(false);
  const { data: todos = [], isLoading, isError } = useQuery<Todo[]>({
    queryKey: ['todos'],
    queryFn: fetchTodos,
  });
  const mutationOptions = {
    onSuccess: (data: Todo[]) => {
      queryClient.setQueryData(['todos'], data);
    },
    onError: (error: Error) => {
      toast.error(error.message || "An unexpected error occurred.");
      queryClient.invalidateQueries({ queryKey: ['todos'] });
    },
  };
  const addTodoMutation = useMutation({
    mutationFn: (newTodo: Todo) => apiCall('/api/todos', 'POST', newTodo),
    ...mutationOptions,
    onMutate: async (newTodo: Todo) => {
      await queryClient.cancelQueries({ queryKey: ['todos'] });
      const previousTodos = queryClient.getQueryData<Todo[]>(['todos']);
      queryClient.setQueryData<Todo[]>(['todos'], (old = []) => [...old, newTodo]);
      return { previousTodos };
    },
    onError: (err, newTodo, context) => {
      if (context?.previousTodos) {
        queryClient.setQueryData(['todos'], context.previousTodos);
      }
      toast.error("Failed to add task.");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] });
    },
  });
  const updateTodoMutation = useMutation({
    mutationFn: (updatedTodo: Partial<Todo> & { id: string }) =>
      apiCall(`/api/todos/${updatedTodo.id}`, 'PUT', updatedTodo),
    ...mutationOptions,
  });
  const deleteTodoMutation = useMutation({
    mutationFn: (id: string) => apiCall(`/api/todos/${id}`, 'DELETE'),
    ...mutationOptions,
  });
  const clearCompletedMutation = useMutation({
    mutationFn: () => apiCall('/api/todos/clear-completed', 'POST'),
    ...mutationOptions,
  });
  const reorderTodosMutation = useMutation({
    mutationFn: (orderedIds: string[]) => apiCall('/api/todos/reorder', 'POST', { orderedIds }),
    ...mutationOptions,
  });
  const handleAddTodo = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTodoText.trim()) {
      const tags = newTags.split(',').map(tag => tag.trim()).filter(Boolean);
      addTodoMutation.mutate({
        id: uuidv4(),
        text: newTodoText.trim(),
        completed: false,
        createdAt: new Date().toISOString(),
        dueDate: dueDate?.toISOString(),
        startTime: startTime || undefined,
        endTime: endTime || undefined,
        priority: newPriority,
        tags: tags.length > 0 ? tags : undefined,
      });
      setNewTodoText('');
      setDueDate(undefined);
      setStartTime('');
      setEndTime('');
      setNewPriority('none');
      setNewTags('');
    }
  };
  const processedTodos = useMemo(() => {
    let processed = [...todos];
    // 1. Filter
    if (filter === 'active') processed = processed.filter(t => !t.completed);
    if (filter === 'completed') processed = processed.filter(t => t.completed);
    if (searchTerm) {
      const lowercasedFilter = searchTerm.toLowerCase();
      processed = processed.filter(todo =>
        todo.text.toLowerCase().includes(lowercasedFilter) ||
        (todo.tags && todo.tags.some(tag => tag.toLowerCase().includes(lowercasedFilter)))
      );
    }
    // 2. Sort
    if (sortBy !== 'manual') {
      processed.sort((a, b) => {
        switch (sortBy) {
          case 'dueDate':
            if (!a.dueDate && !b.dueDate) return 0;
            if (!a.dueDate) return 1;
            if (!b.dueDate) return -1;
            return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
          case 'priority':
            return (priorityOrder[b.priority || 'none']) - (priorityOrder[a.priority || 'none']);
          case 'createdAt':
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          default:
            return 0;
        }
      });
    }
    // 3. Group
    if (groupBy !== 'none') {
      return processed.reduce((acc, todo) => {
        let key = 'Uncategorized';
        if (groupBy === 'priority') {
          key = priorityLabels[todo.priority || 'none'];
        } else if (groupBy === 'dueDate') {
          key = todo.dueDate ? format(new Date(todo.dueDate), 'PPP') : 'No Due Date';
        }
        if (!acc[key]) acc[key] = [];
        acc[key].push(todo);
        return acc;
      }, {} as Record<string, Todo[]>);
    }
    return processed;
  }, [todos, filter, searchTerm, sortBy, groupBy]);
  const activeCount = useMemo(() => todos.filter(t => !t.completed).length, [todos]);
  const completedCount = todos.length - activeCount;
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );
  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = todos.findIndex((t) => t.id === active.id);
      const newIndex = todos.findIndex((t) => t.id === over.id);
      const reorderedTodos = arrayMove(todos, oldIndex, newIndex);
      queryClient.setQueryData(['todos'], reorderedTodos);
      reorderTodosMutation.mutate(reorderedTodos.map(t => t.id));
    }
  }
  const renderTodoList = (todoList: Todo[]) => (
    <AnimatePresence>
      {todoList.map((todo, index) => (
        <TodoItem
          key={todo.id}
          todo={todo}
          updateTodoMutation={updateTodoMutation}
          deleteTodoMutation={deleteTodoMutation}
          isFirst={index === 0}
        />
      ))}
    </AnimatePresence>
  );
  return (
    <>
      <Toaster richColors position="bottom-right" />
      <ThemeToggle className="fixed top-4 right-4" />
      <div className="min-h-screen bg-background text-foreground font-sans flex flex-col items-center">
        <div className="w-full max-w-2xl mx-auto px-4 sm:px-6 py-12 md:py-24 flex-grow">
          <header className="text-center mb-10">
            <h1 className="text-5xl md:text-7xl font-bold tracking-tighter text-foreground/90">
              Clarity
            </h1>
          </header>
          <main className="space-y-6">
            <form onSubmit={handleAddTodo} className="space-y-3">
              <div className="relative">
                <Plus className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  type="text"
                  value={newTodoText}
                  onChange={(e) => setNewTodoText(e.target.value)}
                  placeholder="What needs to be done?"
                  className="pl-12 h-14 text-lg rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-background"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <Input
                  type="text"
                  value={newTags}
                  onChange={e => setNewTags(e.target.value)}
                  placeholder="Tags (comma-separated)"
                  className="h-11"
                />
                <Select value={newPriority} onValueChange={(v) => setNewPriority(v as Priority)}>
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Set priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Priority</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "justify-start text-left font-normal h-11",
                        !dueDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dueDate ? format(dueDate, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={dueDate}
                      onSelect={setDueDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <Input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} className="h-11" />
                <Input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} className="h-11" />
              </div>
            </form>
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search tasks or tags..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 w-full h-11"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortByType)}>
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manual">Sort: Manual</SelectItem>
                    <SelectItem value="dueDate">Sort: Due Date</SelectItem>
                    <SelectItem value="priority">Sort: Priority</SelectItem>
                    <SelectItem value="createdAt">Sort: Creation Date</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={groupBy} onValueChange={(v) => setGroupBy(v as GroupByType)}>
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Group by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Group: None</SelectItem>
                    <SelectItem value="dueDate">Group: By Due Date</SelectItem>
                    <SelectItem value="priority">Group: By Priority</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="bg-card rounded-lg shadow-sm overflow-hidden">
              {isLoading && <div className="p-6 text-center text-muted-foreground">Loading tasks...</div>}
              {isError && <div className="p-6 text-center text-red-500">Error loading tasks.</div>}
              {!isLoading && !isError && todos.length === 0 && (
                <div className="p-10 text-center text-muted-foreground animate-fade-in">
                  <Check className="mx-auto h-12 w-12 text-green-500 mb-4" />
                  <h3 className="text-lg font-medium text-foreground">All clear!</h3>
                  <p>Your task list is empty. Add a task to get started.</p>
                </div>
              )}
              {sortBy !== 'manual' && groupBy === 'none' && (
                <div className="p-2 text-center text-xs text-muted-foreground bg-accent">
                  Drag-and-drop is disabled while a sort order is active.
                </div>
              )}
              {Array.isArray(processedTodos) ? (
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd} enabled={sortBy === 'manual'}>
                  <SortableContext items={processedTodos.map(t => t.id)} strategy={verticalListSortingStrategy} disabled={sortBy !== 'manual'}>
                    {renderTodoList(processedTodos)}
                  </SortableContext>
                </DndContext>
              ) : (
                <Accordion type="multiple" className="w-full" defaultValue={Object.keys(processedTodos)}>
                  {Object.entries(processedTodos).map(([groupTitle, groupTodos]) => (
                    <AccordionItem value={groupTitle} key={groupTitle}>
                      <AccordionTrigger className="px-4 py-3 text-sm font-medium hover:bg-accent">
                        {groupTitle} ({groupTodos.length})
                      </AccordionTrigger>
                      <AccordionContent className="border-t">
                        {renderTodoList(groupTodos)}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              )}
              {todos.length > 0 && (
                <footer className="flex items-center justify-between p-3 text-sm text-muted-foreground border-t">
                  <span>{activeCount} {activeCount === 1 ? 'item' : 'items'} left</span>
                  <div className="hidden sm:flex items-center space-x-2">
                    <Button variant={filter === 'all' ? 'secondary' : 'ghost'} size="sm" onClick={() => setFilter('all')}>All</Button>
                    <Button variant={filter === 'active' ? 'secondary' : 'ghost'} size="sm" onClick={() => setFilter('active')}>Active</Button>
                    <Button variant={filter === 'completed' ? 'secondary' : 'ghost'} size="sm" onClick={() => setFilter('completed')}>Completed</Button>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setClearConfirmOpen(true)}
                    disabled={completedCount === 0}
                    className={cn(completedCount === 0 && "invisible")}
                  >
                    Clear completed
                  </Button>
                </footer>
              )}
            </div>
            {todos.length > 0 && (
              <div className="flex sm:hidden items-center justify-center space-x-2 p-2 bg-card rounded-lg shadow-sm mt-4">
                <Button variant={filter === 'all' ? 'secondary' : 'ghost'} size="sm" onClick={() => setFilter('all')}>All</Button>
                <Button variant={filter === 'active' ? 'secondary' : 'ghost'} size="sm" onClick={() => setFilter('active')}>Active</Button>
                <Button variant={filter === 'completed' ? 'secondary' : 'ghost'} size="sm" onClick={() => setFilter('completed')}>Completed</Button>
              </div>
            )}
          </main>
        </div>
        <footer className="w-full text-center py-6 text-xs text-muted-foreground">
          <p>Built with ❤️ at Cloudflare</p>
        </footer>
      </div>
      <AlertDialog open={isClearConfirmOpen} onOpenChange={setClearConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete all completed tasks. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => clearCompletedMutation.mutate()}>
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}