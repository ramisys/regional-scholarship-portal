# Loading Components

Reusable loading primitives for the portal frontend live here.

## Folder Structure

```text
src/app/components/loading/
  ButtonLoader.tsx
  FullScreenLoader.tsx
  GlobalRequestBar.tsx
  LoadingErrorState.tsx
  LoadingSpinner.tsx
  PageLoader.tsx
  SkeletonCard.tsx
  SkeletonForm.tsx
  SkeletonTable.tsx
  UploadProgressLoader.tsx
  loading-store.ts
  index.ts
```

## Global Strategy

- `loading-store.ts` tracks active API requests with a reference count.
- `GlobalRequestBar` renders immediately whenever the request count is above zero.
- `AuthContext` boots the session with `/auth/profile` before routes render.
- `App.tsx` lazy-loads routes and uses `FullScreenLoader` for route transitions.

## Page-Level Patterns

- Use `PageLoader` plus skeleton children for data-driven pages.
- Use `SkeletonCard` for dashboard stats and summary blocks.
- Use `SkeletonTable` for searchable tables and admin queues.
- Use `SkeletonForm` for multi-field draft or wizard loading.
- Use `UploadProgressLoader` for file uploads with progress feedback.
- Use `ButtonLoader` inside submit buttons for inline action feedback.

## API Loading Example

```ts
import api from '../utils/api';

const response = await api.get('/student/stats');
const data = response.data?.data ?? response.data;
```

The Axios client automatically starts and stops the global loading counter for requests, including token refresh flows.

## Best Practices

- Prefer skeletons over spinners when content shape is known.
- Keep loaders close to the content they replace.
- Disable inputs and actions while requests are in flight.
- Preserve layout height to avoid jarring shifts.
- Show retry actions on recoverable failures.
- Keep animations subtle and avoid multiple competing loaders.