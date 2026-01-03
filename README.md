# frame-master-plugin-react-session

A Frame-Master plugin that provides type-safe session management for React applications. It handles session data on both client and server sides with support for cookies, in-memory storage, or custom storage backends.

## Installation

```bash
bun add frame-master-plugin-react-session
```

## Usage

### Server Configuration

```typescript
import type { FrameMasterConfig } from "frame-master/server/types";
import reactSessionPlugin from "frame-master-plugin-react-session";

const config: FrameMasterConfig = {
  HTTPServer: { port: 3000 },
  plugins: [
    reactSessionPlugin({
      sessionType: "cookie", // or "memory" or custom storage
      skipForRoutes: ["/api/public/*"], // optional: routes to skip session handling
      cookieOptions: {
        httpOnly: true,
        secure: true,
        sameSite: "strict",
      },
    }),
  ],
};

export default config;
```

### Client Usage

Wrap your app with `SessionProvider` and use the `useSession` hook:

```tsx
import {
  SessionProvider,
  useSession,
} from "frame-master-plugin-react-session/client";

// In your app wrapper
function App() {
  return (
    <SessionProvider>
      <MyComponent />
    </SessionProvider>
  );
}

// In your components
function MyComponent() {
  const session = useSession();
  const data = session.getData();

  if (data.client) {
    console.log(data.client.userId); // Type-safe access
  }

  return <div>User: {data.client?.userId}</div>;
}
```

### Server-Side Session Management

```typescript
import sessionManager from "frame-master-plugin-react-session/server";

// In your server route handler
export function GET(master: masterRequest) {
  // Get session data
  const session = sessionManager(master).getSessionData();

  // Set session data
  session.setSessionData({
    client: { userId: "user-123" },
    server: { secretInfo: "sensitive-data" },
  });

  // Delete session
  session.deleteSession(master);
}
```

## Type-Safe Session Data

This plugin supports TypeScript declaration merging to provide type-safe session data. Create a declaration file in your project to extend the session interfaces:

### Step 1: Create a Type Declaration File

Insert in your `.frame-master/frame-master-custom-type.d.ts`:

```typescript
declare global {
  interface SessionDataClient {
    userId: string;
    username: string;
    preferences: {
      theme: "light" | "dark";
    };
  }

  interface SessionDataServer {
    secretToken: string;
    permissions: string[];
  }
}

export {};
```

### How It Works

- **`SessionDataClient`**: Data that is accessible on both client and server. This is sent to the browser and should NOT contain sensitive information.
- **`SessionDataServer`**: Data that is only accessible on the server. This is never sent to the client and can contain sensitive information.
- **`SessionData`**: The complete session object containing `client`, `server`, and `meta` (timestamps).

After extending these interfaces, you get full type-safety and autocomplete:

```typescript
const session = useSession();
const data = session.getData();

// ✅ Type-safe - TypeScript knows about userId
data.client?.userId;

// ✅ Type-safe - TypeScript knows about theme
data.client?.preferences.theme;

// ❌ Type error - unknownField doesn't exist
data.client?.unknownField;
```

## Features

- 🔒 **Type-safe sessions** - Full TypeScript support with declaration merging
- 🍪 **Multiple storage backends** - Cookie, in-memory, or custom storage
- ⚛️ **React integration** - `SessionProvider` and `useSession` hook
- 🔐 **Client/Server separation** - Keep sensitive data server-side only
- ⏰ **Session expiration** - Built-in expiration handling with metadata
- 🚀 **SSR compatible** - Works with server-side rendering

## API Reference

### Plugin Options

| Option          | Type                                    | Default    | Description                           |
| --------------- | --------------------------------------- | ---------- | ------------------------------------- |
| `sessionType`   | `"cookie" \| "memory" \| CustomStorage` | `"cookie"` | Storage backend for sessions          |
| `skipForRoutes` | `string[]`                              | `[]`       | URL patterns to skip session handling |
| `cookieOptions` | `CookieOptions`                         | `{}`       | Cookie configuration options          |

### Session Metadata

Every session includes metadata:

```typescript
interface SessionData {
  client?: SessionDataClient;
  server?: SessionDataServer;
  meta: {
    updatedAt: number; // Last update timestamp
    createdAt: number; // Creation timestamp
    expiresAt: number; // Expiration timestamp
  };
}
```

## License

MIT
