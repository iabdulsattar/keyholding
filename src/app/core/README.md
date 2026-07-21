Core: API services and helpers

- `services/` — contains `api.service.ts`, `auth.service.ts`, `subscription.service.ts`.
- `interceptors/` — `auth.interceptor.ts` attaches bearer tokens from `localStorage`.
- `services/index.ts` — barrel export for convenient imports.

Usage examples

Import services from the barrel:

```ts
import { AuthService } from 'src/app/core/services';
```

Auth flow

- The `AuthInterceptor` will automatically add `Authorization` headers if an access token is stored in `localStorage` under `access_token_saas` or `access_token`.

To change API base URL, edit `src/app/core/config.ts`.
