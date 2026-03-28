import { describe, expect, it } from "vitest";
import {
  getDocumentSidebarClosedToggleClassName,
  getDocumentSidebarEmptyContentsClassName,
  getDocumentSidebarHeaderClassName,
  getDocumentSidebarInfoRowClassName,
  getDocumentSidebarSectionBodyClassName,
  getDocumentSidebarSectionChevronClassName,
  getDocumentSidebarSectionClassName,
  getDocumentSidebarSectionTitleClassName,
  getDocumentSidebarShellClassName,
  getDocumentSidebarTocButtonClassName,
  getDocumentSidebarTocIconClassName,
  getDocumentSidebarTocTextClassName,
} from "./documentSidebarSurfaceClassNames";

describe("documentSidebarSurfaceClassNames", () => {
  it("returns the owned document sidebar shell classes", () => {
    expect(getDocumentSidebarClosedToggleClassName()).toBe("fixed right-4 top-20 z-10");
    expect(getDocumentSidebarShellClassName()).toBe("h-full w-sidebar shrink-0 overflow-y-auto");
    expect(getDocumentSidebarHeaderClassName()).toBe("p-2");
    expect(getDocumentSidebarSectionClassName()).toBe(
      "border-b border-ui-border/30 last:border-b-0",
    );
    expect(getDocumentSidebarSectionBodyClassName()).toBe("p-2 pt-0");
    expect(getDocumentSidebarInfoRowClassName()).toBe("p-1");
    expect(getDocumentSidebarEmptyContentsClassName()).toBe("p-1 text-ui-text-tertiary");
  });

  it("returns the owned table-of-contents chrome and clamps indent levels", () => {
    expect(getDocumentSidebarSectionTitleClassName()).toBe("text-left");
    expect(getDocumentSidebarSectionChevronClassName(true)).toBe(
      "transition-transform duration-default",
    );
    expect(getDocumentSidebarSectionChevronClassName(false)).toBe(
      "transition-transform duration-default -rotate-90",
    );
    expect(getDocumentSidebarTocButtonClassName()).toBe(
      "w-full justify-start truncate text-ui-text-secondary",
    );
    expect(getDocumentSidebarTocIconClassName()).toBe("shrink-0");
    expect(getDocumentSidebarTocTextClassName()).toBe("truncate");
  });
});
