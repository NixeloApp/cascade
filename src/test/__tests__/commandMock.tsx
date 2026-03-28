import type { ReactNode } from "react";

type MockCommandSearch = {
  "aria-label"?: string;
  ariaLabel?: string;
  placeholder?: string;
  testId?: string;
  value: string;
  onValueChange: (value: string) => void;
};

type MockCommandItem = {
  disabled?: boolean;
  onSelect?: (value: string) => void;
  render: ReactNode;
  testId?: string;
  value: string;
};

type MockCommandSection =
  | {
      content: ReactNode;
      id: string;
      testId?: string;
      type: "content";
    }
  | {
      heading?: string;
      id: string;
      items: MockCommandItem[];
      testId?: string;
      type?: "group";
    };

type MockCommandProps = {
  emptyMessage?: string;
  filter?: (value: string, search: string) => number;
  footer?: ReactNode;
  header?: ReactNode;
  loading?: boolean;
  loadingContent?: ReactNode;
  loadingMessage?: string;
  search?: MockCommandSearch;
  sections?: MockCommandSection[];
  shouldFilter?: boolean;
};

let lastCommandProps: MockCommandProps | null = null;

/** Returns the most recent Command props received by the shared test mock. */
export function getLastCommandProps() {
  return lastCommandProps;
}

/** Clears the shared Command mock state between tests. */
export function resetCommandMock() {
  lastCommandProps = null;
}

function getVisibleItems(props: MockCommandProps, items: MockCommandItem[]) {
  if (props.shouldFilter === false || !props.search?.value || !props.filter) {
    return items;
  }

  return items.filter((item) => props.filter?.(item.value, props.search?.value ?? "") !== 0);
}

/** Test-only Command mock that exercises the wrapper API without cmdk internals. */
export function Command(props: MockCommandProps) {
  lastCommandProps = props;
  const sections = props.sections ?? [];
  const visibleSections = sections
    .map((section) =>
      section.type === "content"
        ? section
        : {
            ...section,
            items: getVisibleItems(props, section.items),
          },
    )
    .filter((section) => section.type === "content" || section.items.length > 0);
  const visibleItemCount = visibleSections.reduce(
    (count, section) => count + (section.type === "content" ? 0 : section.items.length),
    0,
  );

  return (
    <div>
      {props.search ? (
        <input
          aria-label={props.search.ariaLabel ?? props.search["aria-label"]}
          data-testid={props.search.testId}
          placeholder={props.search.placeholder}
          value={props.search.value}
          onChange={(event) => props.search?.onValueChange(event.target.value)}
        />
      ) : null}
      {props.header}
      {props.loading
        ? (props.loadingContent ?? <div>{props.loadingMessage ?? "Loading..."}</div>)
        : null}
      {!props.loading && props.emptyMessage && visibleItemCount === 0 ? (
        <div>{props.emptyMessage}</div>
      ) : null}
      {!props.loading
        ? visibleSections.map((section) =>
            section.type === "content" ? (
              <div key={section.id} data-testid={section.testId}>
                {section.content}
              </div>
            ) : (
              <section key={section.id} aria-label={section.heading} data-testid={section.testId}>
                {section.heading ? <div>{section.heading}</div> : null}
                {section.items.map((item) => (
                  <button
                    key={`${section.id}-${item.value}`}
                    type="button"
                    data-testid={item.testId}
                    disabled={item.disabled}
                    onClick={() => item.onSelect?.(item.value)}
                  >
                    {item.render}
                  </button>
                ))}
              </section>
            ),
          )
        : null}
      {props.footer}
    </div>
  );
}

/** Test-only CommandDialog mock that renders inline instead of using a portal. */
export function CommandDialog({
  children,
  open,
  title,
}: {
  children: ReactNode;
  open: boolean;
  title?: string;
}) {
  if (!open) {
    return null;
  }

  return (
    <div role="dialog" aria-label={title}>
      {children}
    </div>
  );
}
