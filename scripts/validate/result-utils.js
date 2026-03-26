/**
 * Shared validator result helpers.
 *
 * Validators run in isolated Node processes and return plain JSON, so the
 * result contract needs to stay simple and explicit:
 * - enforced checks fail CI when errors > 0
 * - audit checks never fail CI
 * - passing audit checks can still opt into printing messages
 */

function normalizeCount(value) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, Math.trunc(value));
}

function normalizeMessages(messages) {
  if (!Array.isArray(messages)) {
    return [];
  }

  return messages.filter((message) => typeof message === "string" && message.trim().length > 0);
}

function assertBlockingResultContract(result, rawErrors) {
  if (result.passed === false && rawErrors === 0) {
    throw new Error(
      "Malformed enforced validator result: passed=false requires errors >= 1. Use createValidatorResult() or report a real error count.",
    );
  }

  if (result.passed === true && rawErrors > 0) {
    throw new Error(
      "Malformed enforced validator result: passed=true requires errors === 0. Use createValidatorResult() or fix the reported error count.",
    );
  }
}

export function normalizeValidatorResult(result = {}) {
  const blocking = result.blocking !== false;
  const rawErrors = normalizeCount(result.errors);
  const normalizedMessages = normalizeMessages(result.messages);
  const normalizedFindings = normalizeCount(result.findings ?? rawErrors);

  if (blocking) {
    assertBlockingResultContract(result, rawErrors);
  }

  return {
    ...result,
    blocking,
    passed: blocking ? result.passed !== false && rawErrors === 0 : true,
    errors: blocking ? rawErrors : 0,
    findings: normalizedFindings,
    messages: normalizedMessages,
    showMessagesOnPass:
      typeof result.showMessagesOnPass === "boolean"
        ? result.showMessagesOnPass
        : !blocking && normalizedMessages.length > 0,
  };
}

export function createValidatorResult(options) {
  return normalizeValidatorResult(options);
}

function countOverageItems(overageEntries) {
  return overageEntries.reduce(
    (total, [, overage]) => total + normalizeCount(overage?.overageItems?.length),
    0,
  );
}

export function createCountRatchetResult({
  analysis,
  overageEntries,
  messages,
  overageDetail,
  baselineDetail,
  countBy = "items",
  currentCountByFile,
  findings,
  showMessagesOnPass,
  blocking = true,
}) {
  const normalizedEntries = Array.isArray(overageEntries) ? overageEntries : [];
  const overageCount =
    findings ??
    (countBy === "entries" ? normalizedEntries.length : countOverageItems(normalizedEntries));

  return createValidatorResult({
    blocking,
    errors: overageCount,
    findings: overageCount,
    detail: overageCount > 0 ? overageDetail : baselineDetail,
    messages,
    currentCountByFile,
    showMessagesOnPass,
    analysis,
  });
}
