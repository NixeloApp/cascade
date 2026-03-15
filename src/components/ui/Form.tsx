/**
 * Re-exports from form directory for backward compatibility
 *
 * This file exists because some imports use `ui/form` expecting the directory index,
 * but Vite resolves `form.tsx` before `form/index.ts`. This re-exports everything
 * from the form directory to make both import styles work.
 */

// Also export form primitives for components that need them
export { FormDescription, FormItem, FormLabel, FormMessage } from "./FormPrimitives";
// Re-export form components from the directory
export { Checkbox, type CheckboxProps } from "./form/Checkbox";
export { Input, type InputProps } from "./form/Input";
export { Select, type SelectProps } from "./form/Select";
export { Textarea, type TextareaProps } from "./form/Textarea";
