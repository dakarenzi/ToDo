# Clarity

A visually stunning, minimalist todo list application designed for focus and clarity.

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/dakarenzi/ToDo)

Clarity is a minimalist, visually stunning todo list application designed for focus and simplicity. Built on Cloudflare's edge network, it offers a lightning-fast, distraction-free experience. The core philosophy is 'less is more,' emphasizing clean layouts, generous white space, a limited and sophisticated color palette, and elegant typography. Users can add, manage, and complete tasks through a serene and intuitive interface. Interactions are enhanced with subtle, fluid animations to provide a delightful and responsive user experience. The application persists all tasks, ensuring user data is always available across sessions.

## Key Features

-   **Minimalist & Distraction-Free UI**: A clean, focused interface to help you manage your tasks effectively.
-   **Persistent Storage**: Your tasks are saved automatically using Cloudflare's globally distributed Durable Objects.
-   **Blazing Fast**: Built on Cloudflare Workers for an instant, responsive experience anywhere in the world.
-   **Task Management**: Easily add, toggle completion, delete, and filter tasks.
-   **Elegant Animations**: Smooth, subtle animations powered by Framer Motion enhance the user experience.
-   **Responsive Design**: Flawless experience across desktop, tablet, and mobile devices.
-   **Light & Dark Modes**: Beautifully crafted themes to match your preference.

## Technology Stack

-   **Frontend**: [React](https://react.dev/), [Vite](https://vitejs.dev/), [Tailwind CSS](https://tailwindcss.com/), [shadcn/ui](https://ui.shadcn.com/)
-   **State Management**: [@tanstack/react-query](https://tanstack.com/query/latest) for server state management.
-   **Backend**: [Hono](https://hono.dev/) running on [Cloudflare Workers](https://workers.cloudflare.com/).
-   **Database**: [Cloudflare Durable Objects](https://developers.cloudflare.com/durable-objects/) for stateful, persistent storage.
-   **Language**: [TypeScript](https://www.typescriptlang.org/)
-   **Tooling**: [Bun](https://bun.sh/), [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/)

## Getting Started

Follow these instructions to get a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

-   [Bun](https://bun.sh/docs/installation) installed on your machine.
-   A [Cloudflare account](https://dash.cloudflare.com/sign-up).
-   [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install-and-update/) installed and authenticated.

```bash
bun install -g wrangler
wrangler login
```

### Installation

1.  **Clone the repository:**

    ```bash
    git clone https://github.com/your-username/clarity_todo_app.git
    cd clarity_todo_app
    ```

2.  **Install dependencies:**

    This project uses Bun as the package manager.

    ```bash
    bun install
    ```

3.  **Run the development server:**

    This command starts the Vite frontend server and the local Wrangler server for the backend API.

    ```bash
    bun dev
    ```

    -   The frontend will be available at `http://localhost:3000` (or the next available port).
    -   The backend worker will be available at `http://localhost:8787`.

## Project Structure

-   `src/`: Contains the frontend React application code.
    -   `pages/`: Main application views.
    -   `components/`: Reusable UI components.
    -   `lib/`: Utilities and helper functions.
-   `worker/`: Contains the backend Hono application and Durable Object code.
    -   `index.ts`: The Cloudflare Worker entry point.
    -   `durableObject.ts`: The implementation of the Global Durable Object for state persistence.
    -   `userRoutes.ts`: API route definitions.
-   `shared/`: Contains TypeScript types shared between the frontend and backend.

## Available Scripts

-   `bun dev`: Starts the local development environment.
-   `bun build`: Builds the frontend application for production.
-   `bun lint`: Lints the codebase using ESLint.
-   `bun deploy`: Deploys the application to your Cloudflare account.

## Deployment

Deploying this application to Cloudflare is a simple, one-command process.

1.  **Ensure you are logged in to Wrangler:**

    ```bash
    wrangler login
    ```

2.  **Run the deploy script:**

    This script will build the application and deploy it to your Cloudflare account.

    ```bash
    bun deploy
    ```

Alternatively, you can deploy your own version of this project with a single click.

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/dakarenzi/ToDo)

## License

This project is licensed under the MIT License.