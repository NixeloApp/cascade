/**
 * Hook for managing async mutations with loading state and error handling
 */

import { useState } from "react";
import { showError } from "../lib/toast";

export interface UseAsyncMutationOptions<TResult> {
  onSuccess?: (result: TResult) => void;
  onError?: (error: unknown) => void;
  showErrorToast?: boolean;
  errorMessage?: string;
}

export interface UseAsyncMutationReturn<TArgs extends unknown[], TResult> {
  mutate: (...args: TArgs) => Promise<TResult | undefined>;
  isLoading: boolean;
  error: Error | null;
}

/**
 * Wrap an async function with loading state and error handling
 * Useful for wrapping Convex mutations or any async operation
 *
 * @example
 * const createIssue = useMutation(api.issues.createIssue);
 * const { mutate, isLoading } = useAsyncMutation(createIssue, {
 *   onSuccess: () => toast.success("Created!"),
 *   showErrorToast: true,
 * });
 */
export function useAsyncMutation<TArgs extends unknown[], TResult>(
  mutationFn: (...args: TArgs) => Promise<TResult>,
  options: UseAsyncMutationOptions<TResult> = {},
): UseAsyncMutationReturn<TArgs, TResult> {
  const { onSuccess, onError, showErrorToast = true, errorMessage = "Operation failed" } = options;

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const mutate = async (...args: TArgs): Promise<TResult | undefined> => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await mutationFn(...args);
      onSuccess?.(result);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      onError?.(error);

      if (showErrorToast) {
        showError(error, errorMessage);
      }

      return undefined;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    mutate,
    isLoading,
    error,
  };
}
