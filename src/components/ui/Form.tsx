/**
 * Re-exports from form directory for backward compatibility
 *
 * This file exists because some imports use `ui/form` expecting the directory index,
 * but Vite resolves `form.tsx` before `form/index.ts`. This re-exports everything
 * from the form directory to make both import styles work.
 */

// Also export form primitives for components that need them
export { FormDescription, FormItem, FormLabel, FormMessage } from "./FormPrimitives";
// Re-export all form components from the directory
export * from "./form/index";
