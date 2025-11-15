import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AnimatePresence } from 'framer-motion';
import { v4 as uuidv4 } from 'uuid';
import { Check, Plus, Calendar as CalendarIcon } from 'lucide-react';
import { Toaster, toast } from 'sonner';
import { format } from 'date-fns';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { TodoItem } from '@/components/TodoItem';
import type { Todo, ApiResponse } from '@shared/types';
type FilterType = 'all' | 'active' | 'completed';
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
  const [filter, setFilter] = useState<FilterType>('all');
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
      addTodoMutation.mutate({
        id: uuidv4(),
        text: newTodoText.trim(),
        completed: false,
        createdAt: new Date().toISOString(),
        dueDate: dueDate?.toISOString(),
        startTime: startTime || undefined,
        endTime: endTime || undefined,
      });
      setNewTodoText('');
      setDueDate(undefined);
      setStartTime('');
      setEndTime('');
    }
  };
  const filteredTodos = useMemo(() => {
    if (filter === 'active') return todos.filter(t => !t.completed);
    if (filter === 'completed') return todos.filter(t => t.completed);
    return todos;
  }, [todos, filter]);
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
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={filteredTodos.map(t => t.id)} strategy={verticalListSortingStrategy}>
                  <AnimatePresence>
                    {filteredTodos.map((todo, index) => (
                      <TodoItem
                        key={todo.id}
                        todo={todo}
                        updateTodoMutation={updateTodoMutation}
                        deleteTodoMutation={deleteTodoMutation}
                        isFirst={index === 0}
                      />
                    ))}
                  </AnimatePresence>
                </SortableContext>
              </DndContext>
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
                    onClick={() => clearCompletedMutation.mutate()}
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
    </>
  );
}