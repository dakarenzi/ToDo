import { DurableObject } from "cloudflare:workers";
import type { Todo } from '@shared/types';
const TODOS_STORAGE_KEY = "todos_list_v1";
export class GlobalDurableObject extends DurableObject {
    async getTodos(): Promise<Todo[]> {
        const todos = await this.ctx.storage.get<Todo[]>(TODOS_STORAGE_KEY);
        const sortedTodos = (todos || []).sort((a, b) => {
            const orderA = a.order ?? new Date(a.createdAt).getTime();
            const orderB = b.order ?? new Date(b.createdAt).getTime();
            return orderA - orderB;
        });
        return sortedTodos;
    }
    async addTodo(todo: Todo): Promise<Todo[]> {
        const todos = await this.getTodos();
        const newTodoWithOrder = {
            ...todo,
            order: todo.order ?? Date.now(),
        };
        const updatedTodos = [...todos, newTodoWithOrder];
        await this.ctx.storage.put(TODOS_STORAGE_KEY, updatedTodos);
        return this.getTodos();
    }
    async updateTodo(id: string, updates: Partial<Omit<Todo, 'id'>>): Promise<Todo[]> {
        const todos = await this.getTodos();
        const updatedTodos = todos.map(todo =>
            todo.id === id ? { ...todo, ...updates } : todo
        );
        await this.ctx.storage.put(TODOS_STORAGE_KEY, updatedTodos);
        return this.getTodos();
    }
    async deleteTodo(id: string): Promise<Todo[]> {
        const todos = await this.getTodos();
        const updatedTodos = todos.filter(todo => todo.id !== id);
        await this.ctx.storage.put(TODOS_STORAGE_KEY, updatedTodos);
        return this.getTodos();
    }
    async clearCompletedTodos(): Promise<Todo[]> {
        const todos = await this.getTodos();
        const activeTodos = todos.filter(todo => !todo.completed);
        await this.ctx.storage.put(TODOS_STORAGE_KEY, activeTodos);
        return this.getTodos();
    }
    async reorderTodos(orderedIds: string[]): Promise<Todo[]> {
        const todos = await this.getTodos();
        const todoMap = new Map(todos.map(t => [t.id, t]));
        const reorderedTodos: Todo[] = [];
        const reorderedIdsSet = new Set<string>();
        orderedIds.forEach((id, index) => {
            const todo = todoMap.get(id);
            if (todo) {
                reorderedTodos.push({ ...todo, order: index });
                reorderedIdsSet.add(id);
            }
        });
        todos.forEach(todo => {
            if (!reorderedIdsSet.has(todo.id)) {
                reorderedTodos.push(todo);
            }
        });
        await this.ctx.storage.put(TODOS_STORAGE_KEY, reorderedTodos);
        return this.getTodos();
    }
}