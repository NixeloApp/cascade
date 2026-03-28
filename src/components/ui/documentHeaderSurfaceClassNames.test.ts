import { describe, expect, it } from "vitest";
import { getDocumentHeaderResponsiveWidthClassName } from "./documentHeaderSurfaceClassNames";

describe("documentHeaderSurfaceClassNames", () => {
  it("returns the owned responsive width helper used by the document header layout", () => {
    expect(getDocumentHeaderResponsiveWidthClassName()).toBe("w-full sm:w-auto");
  });
});
