# Architecture: Next.js 16 + PocketBase Auth

**Mandatory Reference:** [PocketBase GitHub Discussion #5313](https://github.com/pocketbase/pocketbase/discussions/5313) (Guidelines directly from PocketBase creator, Gani).

This document defines the correct and secure approach for integrating PocketBase (backend) with Next.js 16 (JS SSR / App Router).

## 1. Critical Security Rule: Instance Isolation

- ❌ **FORBIDDEN:** Creating and exporting a single shared global PocketBase instance (`const pb = new PocketBase(...)`) for regular users on the server. Since Next.js runs as a long-running process, concurrent requests would overwrite the same `pb.authStore`. One user could potentially gain the privileges of another.
- ✅ **REQUIRED:** For **every server request** (Server Components, Server Actions, API Routes/Handlers), you must initialize a **completely new instance** of PocketBase.

## 2. Session State Management (Cookies)

The authentication state (token and model) is synchronized between the browser and SSR exclusively via cookies.

- **On the client:** Sign-in proceeds normally. Upon success, save the state to a cookie.
- **On the server (Next.js):** Create a helper function to initialize a per-request client with data from the cookies:

```typescript
import PocketBase from "pocketbase";
import { cookies } from "next/headers";

// Call this function at the top of every Server Component or Server Action
export async function createServerPB() {
  const pb = new PocketBase(process.env.NEXT_PUBLIC_PB_URL);

  // In Next.js 15+ / 16, cookies() is asynchronous
  const cookieStore = await cookies();
  const pbAuthCookie = cookieStore.get("pb_auth")?.value || "";

  // Load the specific user's identity
  pb.authStore.loadFromCookie(pbAuthCookie);

  // Security fallback: clear the store if the token is invalid
  if (!pb.authStore.isValid) {
    pb.authStore.clear();
  }

  return pb;
}
```

### Next.js 16 Cookie Boundary

- ✅ **REQUIRED:** Treat render-time server code as cookie-read-only. Pages, layouts, and other Server Components may read `cookies()`, but must never call `.set()` or `.delete()`.
- ✅ **REQUIRED:** Commit cookie writes only in Server Actions, Route Handlers, or other response-writing contexts.
- ✅ **REQUIRED:** If a service returns serialized `setCookie[]`, that is response metadata only. A Server Action must commit it explicitly, or a Route Handler must append it to `NextResponse`.
- ✅ **REQUIRED:** URL-token auth flows, such as email verification completion, should terminate in Route Handlers rather than mutating state in `page.tsx`.
- ✅ **REQUIRED:** Keep `proxy.ts` optimistic only. Real auth validation and cleanup must happen in per-request server logic near the data.

## 3. Disabling Next.js Fetch Cache

The default `fetch` in Next.js can aggressively cache responses, causing PocketBase to return stale data.

- **Solution:** When fetching data, modify the `fetch` behavior directly in the PocketBase method using the `SendOptions` object (the last argument):

```typescript
await pb.collection("posts").getList(1, 30, {
  fetch: (url, config) => fetch(url, { ...config, cache: "no-store" }),
});
```

## 4. Exceptions and Specific Cases

- **OAuth2 Sign-in:** The "All-in-one" flow (with a popup window) requires an active realtime connection and works **only on the client**. If you want to handle OAuth2 purely via the server, you must implement the "Manual code exchange". The recommended approach is to perform OAuth2 on the client and save the result into cookies.
- **Global Admin/Superuser Instance:** The only exception where you are allowed to have a global instance on the server (`export default pb`) is a dedicated admin client for background server-side processes. In this case, you must disable automatic request cancellation:

```typescript
superuserClient.autoCancellation(false);
superuserClient.authStore.save("YOUR_SUPERUSER_TOKEN");
```
