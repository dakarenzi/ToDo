import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, Clock, X, Save, Edit, GripVertical } from 'lucide-react';
import { UseMutationResult } from '@tanstack/react-query';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
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
import type { Todo } from '@shared/types';
interface TodoItemProps {
  todo: Todo;
  updateTodoMutation: UseMutationResult<Todo[], Error, Partial<Todo> & { id: string }, unknown>;
  deleteTodoMutation: UseMutationResult<Todo[], Error, string, unknown>;
  isFirst: boolean;
}
export function TodoItem({ todo, updateTodoMutation, deleteTodoMutation, isFirst }: TodoItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(todo.text);
  const [editDueDate, setEditDueDate] = useState<Date | undefined>(
    todo.dueDate ? new Date(todo.dueDate) : undefined
  );
  const [editStartTime, setEditStartTime] = useState(todo.startTime || '');
  const [editEndTime, setEditEndTime] = useState(todo.endTime || '');
  const [isDeleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: todo.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 'auto',
  };
  useEffect(() => {
    if (!isEditing) {
      setEditText(todo.text);
      setEditDueDate(todo.dueDate ? new Date(todo.dueDate) : undefined);
      setEditStartTime(todo.startTime || '');
      setEditEndTime(todo.endTime || '');
    }
  }, [isEditing, todo]);
  const handleSave = () => {
    if (editText.trim()) {
      const hasChanges =
        editText.trim() !== todo.text ||
        (editDueDate?.toISOString() || undefined) !== todo.dueDate ||
        (editStartTime || undefined) !== todo.startTime ||
        (editEndTime || undefined) !== todo.endTime;
      if (hasChanges) {
        updateTodoMutation.mutate({
          id: todo.id,
          text: editText.trim(),
          dueDate: editDueDate?.toISOString(),
          startTime: editStartTime || undefined,
          endTime: editEndTime || undefined,
        });
      }
      setIsEditing(false);
    }
  };
  const handleCancel = () => {
    setIsEditing(false);
  };
  return (
    <>
      <motion.div
        ref={setNodeRef}
        style={style}
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.2 }}
        className={cn("group relative bg-card", !isFirst && "border-t", isDragging && "shadow-lg")}
      >
        <div className="flex items-start p-4 hover:bg-accent transition-colors duration-200">
          <div {...attributes} {...listeners} className="touch-none cursor-grab p-2 -ml-2 mr-2">
            <GripVertical className="h-5 w-5 text-muted-foreground" />
          </div>
          <Checkbox
            id={`todo-${todo.id}`}
            checked={todo.completed}
            onCheckedChange={(checked) => updateTodoMutation.mutate({ id: todo.id, completed: !!checked })}
            className="h-6 w-6 rounded-full mt-1 flex-shrink-0"
            disabled={isEditing}
          />
          {isEditing ? (
            <div className="flex-grow px-4 space-y-2">
              <Input
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                className="text-lg h-auto"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSave();
                  if (e.key === 'Escape') handleCancel();
                }}
              />
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "justify-start text-left font-normal h-10",
                        !editDueDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {editDueDate ? format(editDueDate, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={editDueDate}
                      onSelect={setEditDueDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <Input type="time" value={editStartTime} onChange={e => setEditStartTime(e.target.value)} className="h-10" />
                <Input type="time" value={editEndTime} onChange={e => setEditEndTime(e.target.value)} className="h-10" />
              </div>
              <div className="flex items-center gap-2 pt-2">
                <Button size="sm" onClick={handleSave}><Save className="h-4 w-4 mr-2" /> Save</Button>
                <Button size="sm" variant="ghost" onClick={handleCancel}>Cancel</Button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex-grow px-4 min-w-0" onDoubleClick={() => setIsEditing(true)}>
                <label
                  htmlFor={`todo-${todo.id}`}
                  className={cn(
                    "text-lg cursor-pointer transition-colors break-words",
                    todo.completed ? "line-through text-muted-foreground" : "text-foreground"
                  )}
                >
                  {todo.text}
                </label>
                {(todo.dueDate || (todo.startTime && todo.endTime)) && (
                  <div className="text-xs text-muted-foreground mt-1 flex items-center gap-2 flex-wrap">
                    {todo.dueDate && (
                      <span className="flex items-center gap-1"><CalendarIcon className="h-3 w-3" /> {format(new Date(todo.dueDate), "MMM d")}</span>
                    )}
                    {todo.startTime && todo.endTime && (
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {todo.startTime} - {todo.endTime}</span>
                    )}
                  </div>
                )}
              </div>
              <div className="flex items-center ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full"
                  onClick={() => setIsEditing(true)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full"
                  onClick={() => setDeleteConfirmOpen(true)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </>
          )}
        </div>
      </motion.div>
      <AlertDialog open={isDeleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this task.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteTodoMutation.mutate(todo.id)}>
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}