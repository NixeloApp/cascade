/**
 * TanStack Form utilities and field wrappers
 *
 * Provides typed field components that connect TanStack Form to our UI components.
 *
 * @example
 * ```tsx
 * import { useForm } from "@tanstack/react-form";
 * import { z } from "zod";
 * import { FormInput, FormSelect } from "@/lib/form";
 *
 * const schema = z.object({
 *   title: z.string().min(1, "Title is required"),
 *   priority: z.enum(["low", "medium", "high"]),
 * });
 *
 * function MyForm() {
 *   const form = useForm({
 *     defaultValues: { title: "", priority: "medium" as "low" | "medium" | "high" },
 *     validators: { onChange: schema },
 *     onSubmit: async ({ value }) => {
 *       await saveToDB(value);
 *     },
 *   });
 *
 *   return (
 *     <form onSubmit={(e) => { e.preventDefault(); form.handleSubmit(); }}>
 *       <form.Field name="title">
 *         {(field) => <FormInput field={field} label="Title" />}
 *       </form.Field>
 *       <form.Field name="priority">
 *         {(field) => (
 *           <FormSelect field={field} label="Priority" options={priorityOptions} />
 *         )}
 *       </form.Field>
 *       <form.Subscribe selector={(state) => state.isSubmitting}>
 *         {(isSubmitting) => (
 *           <Button type="submit" isLoading={isSubmitting}>Save</Button>
 *         )}
 *       </form.Subscribe>
 *     </form>
 *   );
 * }
 * ```
 */

export {
  FormCheckbox,
  FormInput,
  FormSelect,
  FormSelectRadix,
  FormTextarea,
} from "./FormFields";
export type { AppFieldApi, AppFormApi, FormFieldProps } from "./types";
