export interface OutreachContactImportDraft {
  email: string;
  firstName?: string;
  lastName?: string;
  company?: string;
  timezone?: string;
  tags?: string[];
  customFields?: Record<string, string>;
}

export interface ParsedOutreachContactImport {
  contacts: OutreachContactImportDraft[];
  headers: string[];
  skippedEmptyRows: number;
}

const REQUIRED_EMAIL_HEADERS = new Set(["email", "mail", "emailaddress"]);

const CONTACT_HEADER_ALIASES: Record<string, keyof OutreachContactImportDraft> = {
  company: "company",
  email: "email",
  emailaddress: "email",
  firstname: "firstName",
  givenname: "firstName",
  lastname: "lastName",
  mail: "email",
  organization: "company",
  surname: "lastName",
  tag: "tags",
  tags: "tags",
  timezone: "timezone",
  tz: "timezone",
};

function normalizeHeader(header: string): string {
  return header
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, "");
}

function sanitizeOptionalString(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function splitDelimitedValues(value: string): string[] {
  return Array.from(
    new Set(
      value
        .split(/[;,|]/)
        .map((entry) => entry.trim())
        .filter(Boolean),
    ),
  );
}

function assertValidCustomFieldEntry(line: string, separatorIndex: number) {
  if (separatorIndex < 1 || separatorIndex === line.length - 1) {
    throw new Error(`Invalid custom field entry "${line}". Use one key=value pair per line.`);
  }
}

/** Parse `key=value` lines from the contact form into custom field records. */
export function parseContactCustomFieldsInput(value: string): Record<string, string> | undefined {
  const lines = value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) {
    return undefined;
  }

  const customFields: Record<string, string> = {};
  for (const line of lines) {
    const separatorIndex = line.indexOf("=");
    assertValidCustomFieldEntry(line, separatorIndex);

    const key = line.slice(0, separatorIndex).trim();
    const fieldValue = line.slice(separatorIndex + 1).trim();
    if (!key || !fieldValue) {
      throw new Error(`Invalid custom field entry "${line}". Use one key=value pair per line.`);
    }

    customFields[key] = fieldValue;
  }

  return Object.keys(customFields).length > 0 ? customFields : undefined;
}

/** Convert saved contact custom fields back into the editable multiline form format. */
export function stringifyContactCustomFields(customFields?: Record<string, string>): string {
  if (!customFields) {
    return "";
  }

  return Object.entries(customFields)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}=${value}`)
    .join("\n");
}

/** Normalize free-form tag input into a deduplicated array. */
export function parseContactTagsInput(value: string): string[] | undefined {
  const tags = splitDelimitedValues(value);
  return tags.length > 0 ? tags : undefined;
}

function createCsvRowState() {
  return {
    currentRow: [] as string[],
    currentValue: "",
    insideQuotes: false,
    rows: [] as string[][],
  };
}

function pushCsvValue(state: ReturnType<typeof createCsvRowState>) {
  state.currentRow.push(state.currentValue);
  state.currentValue = "";
}

function pushCsvRow(state: ReturnType<typeof createCsvRowState>) {
  pushCsvValue(state);
  state.rows.push(state.currentRow);
  state.currentRow = [];
}

function handleQuotedCsvCharacter(
  state: ReturnType<typeof createCsvRowState>,
  character: string,
  nextCharacter: string | undefined,
): number {
  if (character !== '"') {
    state.currentValue += character;
    return 0;
  }

  if (nextCharacter === '"') {
    state.currentValue += '"';
    return 1;
  }

  state.insideQuotes = false;
  return 0;
}

function handleCsvCharacter(
  state: ReturnType<typeof createCsvRowState>,
  character: string,
  nextCharacter: string | undefined,
): number {
  if (character === '"') {
    state.insideQuotes = true;
    return 0;
  }

  if (character === ",") {
    pushCsvValue(state);
    return 0;
  }

  if (character === "\n" || character === "\r") {
    pushCsvRow(state);
    return character === "\r" && nextCharacter === "\n" ? 1 : 0;
  }

  state.currentValue += character;
  return 0;
}

function parseCsvRows(text: string): string[][] {
  const state = createCsvRowState();

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    const nextCharacter = text[index + 1];

    index += state.insideQuotes
      ? handleQuotedCsvCharacter(state, character, nextCharacter)
      : handleCsvCharacter(state, character, nextCharacter);
  }

  if (state.insideQuotes) {
    throw new Error("CSV contains an unterminated quoted field.");
  }

  pushCsvRow(state);

  return state.rows.filter((row) => row.some((cell) => cell.trim().length > 0));
}

function parseCsvHeaders(rows: string[][]) {
  const headers = rows[0].map((header) => header.trim());
  if (headers.length === 0 || headers.every((header) => header.length === 0)) {
    throw new Error("The first CSV row must contain headers.");
  }

  const normalizedHeaders = headers.map(normalizeHeader);
  const duplicateHeader = normalizedHeaders.find(
    (header, index) => header && normalizedHeaders.indexOf(header) !== index,
  );
  if (duplicateHeader) {
    throw new Error(`Duplicate CSV header "${duplicateHeader}" found.`);
  }

  if (!normalizedHeaders.some((header) => REQUIRED_EMAIL_HEADERS.has(header))) {
    throw new Error("CSV must include an email column.");
  }

  return { headers, normalizedHeaders };
}

function assignKnownContactField(
  draft: OutreachContactImportDraft,
  normalizedHeader: string,
  value: string,
): boolean {
  const knownField = CONTACT_HEADER_ALIASES[normalizedHeader];
  switch (knownField) {
    case "email":
      draft.email = value;
      return true;
    case "firstName":
      draft.firstName = value;
      return true;
    case "lastName":
      draft.lastName = value;
      return true;
    case "company":
      draft.company = value;
      return true;
    case "timezone":
      draft.timezone = value;
      return true;
    case "tags":
      draft.tags = splitDelimitedValues(value);
      return true;
    default:
      return false;
  }
}

function finalizeContactDraft(
  draft: OutreachContactImportDraft,
  customFields: Record<string, string>,
  rowIndex: number,
) {
  const email = sanitizeOptionalString(draft.email)?.toLowerCase();
  if (!email) {
    throw new Error(`Row ${rowIndex + 2} is missing an email address.`);
  }

  return {
    ...draft,
    company: sanitizeOptionalString(draft.company),
    customFields: Object.keys(customFields).length > 0 ? customFields : undefined,
    email,
    firstName: sanitizeOptionalString(draft.firstName),
    lastName: sanitizeOptionalString(draft.lastName),
    tags: draft.tags && draft.tags.length > 0 ? draft.tags : undefined,
    timezone: sanitizeOptionalString(draft.timezone),
  };
}

function parseContactRow(
  row: string[],
  rowIndex: number,
  headers: string[],
  normalizedHeaders: string[],
): OutreachContactImportDraft | null {
  const paddedRow = Array.from({ length: headers.length }, (_, index) => row[index] ?? "");
  if (paddedRow.every((cell) => cell.trim().length === 0)) {
    return null;
  }

  const draft: OutreachContactImportDraft = { email: "" };
  const customFields: Record<string, string> = {};

  for (const [cellIndex, rawValue] of paddedRow.entries()) {
    const normalizedHeader = normalizedHeaders[cellIndex];
    const originalHeader = headers[cellIndex];
    const value = rawValue.trim();

    if (!normalizedHeader || !value) {
      continue;
    }

    if (!assignKnownContactField(draft, normalizedHeader, value)) {
      customFields[originalHeader] = value;
    }
  }

  return finalizeContactDraft(draft, customFields, rowIndex);
}

/** Parse outreach CSV imports into contact drafts with normalized built-in fields. */
export function parseOutreachContactImportCsv(text: string): ParsedOutreachContactImport {
  const rows = parseCsvRows(text);
  if (rows.length === 0) {
    throw new Error("Add a header row and at least one contact before importing.");
  }

  const { headers, normalizedHeaders } = parseCsvHeaders(rows);

  const contacts: OutreachContactImportDraft[] = [];
  let skippedEmptyRows = 0;

  for (const [rowIndex, row] of rows.slice(1).entries()) {
    const contact = parseContactRow(row, rowIndex, headers, normalizedHeaders);
    if (!contact) {
      skippedEmptyRows += 1;
      continue;
    }
    contacts.push(contact);
  }

  if (contacts.length === 0) {
    throw new Error("No importable contacts were found in the CSV.");
  }

  return {
    contacts,
    headers,
    skippedEmptyRows,
  };
}
