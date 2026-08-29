// Thin re-export of the auth hook so auth-module code (and any future
// consumers) can import from `hooks/` per the project's structure,
// without duplicating the `useContext` + null-check logic that lives
// alongside `AuthProvider` in `context/AuthContext.tsx`.
export { useAuth } from '../context/AuthContext';
export type { AuthContextValue } from '../context/AuthContext';
