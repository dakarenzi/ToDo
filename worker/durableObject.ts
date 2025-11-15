import { DurableObject } from "cloudflare:workers";
import type { Todo } from '@shared/types';
const TODOS_STORAGE_KEY = "todos_list_v1";
export class GlobalDurableObject extends DurableObject {
    async getTodos(): Promise<Todo[]> {
        const todos = await this.ctx.storage.get<Todo[]>(TODOS_STORAGE_KEY);
        return todos || [];
    }
    async addTodo(todo: Todo): Promise<Todo[]> {
        const todos = await this.getTodos();
        const updatedTodos = [...todos, todo];
        await this.ctx.storage.put(TODOS_STORAGE_KEY, updatedTodos);
        return updatedTodos;
    }
    async updateTodo(id: string, updates: Partial<Omit<Todo, 'id'>>): Promise<Todo[]> {
        const todos = await this.getTodos();
        const updatedTodos = todos.map(todo =>
            todo.id === id ? { ...todo, ...updates } : todo
        );
        await this.ctx.storage.put(TODOS_STORAGE_KEY, updatedTodos);
        return updatedTodos;
    }
    async deleteTodo(id: string): Promise<Todo[]> {
        const todos = await this.getTodos();
        const updatedTodos = todos.filter(todo => todo.id !== id);
        await this.ctx.storage.put(TODOS_STORAGE_KEY, updatedTodos);
        return updatedTodos;
    }
    async clearCompletedTodos(): Promise<Todo[]> {
        const todos = await this.getTodos();
        const activeTodos = todos.filter(todo => !todo.completed);
        await this.ctx.storage.put(TODOS_STORAGE_KEY, activeTodos);
        return activeTodos;
    }
}