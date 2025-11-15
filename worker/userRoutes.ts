import { Hono } from "hono";
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { Env } from './core-utils';
import type { Todo, ApiResponse } from '@shared/types';
const todoSchema = z.object({
    id: z.string(),
    text: z.string().min(1),
    completed: z.boolean(),
    createdAt: z.string().datetime(),
});
const updateTodoSchema = z.object({
    text: z.string().min(1).optional(),
    completed: z.boolean().optional(),
});
export function userRoutes(app: Hono<{ Bindings: Env }>) {
    // Todos API
    app.get('/api/todos', async (c) => {
        const durableObjectStub = c.env.GlobalDurableObject.get(c.env.GlobalDurableObject.idFromName("global"));
        const data = await durableObjectStub.getTodos();
        return c.json({ success: true, data } satisfies ApiResponse<Todo[]>);
    });
    app.post('/api/todos', zValidator('json', todoSchema), async (c) => {
        const todo = c.req.valid('json');
        const durableObjectStub = c.env.GlobalDurableObject.get(c.env.GlobalDurableObject.idFromName("global"));
        const data = await durableObjectStub.addTodo(todo);
        return c.json({ success: true, data } satisfies ApiResponse<Todo[]>);
    });
    app.put('/api/todos/:id', zValidator('json', updateTodoSchema), async (c) => {
        const id = c.req.param('id');
        const body = c.req.valid('json');
        const durableObjectStub = c.env.GlobalDurableObject.get(c.env.GlobalDurableObject.idFromName("global"));
        const data = await durableObjectStub.updateTodo(id, body);
        return c.json({ success: true, data } satisfies ApiResponse<Todo[]>);
    });
    app.delete('/api/todos/:id', async (c) => {
        const id = c.req.param('id');
        const durableObjectStub = c.env.GlobalDurableObject.get(c.env.GlobalDurableObject.idFromName("global"));
        const data = await durableObjectStub.deleteTodo(id);
        return c.json({ success: true, data } satisfies ApiResponse<Todo[]>);
    });
    app.post('/api/todos/clear-completed', async (c) => {
        const durableObjectStub = c.env.GlobalDurableObject.get(c.env.GlobalDurableObject.idFromName("global"));
        const data = await durableObjectStub.clearCompletedTodos();
        return c.json({ success: true, data } satisfies ApiResponse<Todo[]>);
    });
}