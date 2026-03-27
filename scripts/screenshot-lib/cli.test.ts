import { describe, expect, it } from "vitest";
import {
  collectFlagValues,
  collectSingleFlagValue,
  parseCliOptions,
  parseCsvValues,
  parsePositiveIntegerFlagValue,
} from "../../e2e/screenshot-lib/cli";

describe("parseCliOptions", () => {
  it("splits comma-separated values and trims whitespace", () => {
    expect(parseCsvValues([" desktop-light , mobile-light ", "tablet-light"])).toEqual([
      "desktop-light",
      "mobile-light",
      "tablet-light",
    ]);
  });

  it("collects repeated flag values across split and equals syntax", () => {
    expect(
      collectFlagValues(
        [
          "--config",
          "desktop-light,mobile-light",
          "--match=issues-loading,calendar",
          "--match",
          "board",
        ],
        "--match",
      ),
    ).toEqual(["issues-loading", "calendar", "board"]);
  });

  it("rejects repeated single-value flags", () => {
    expect(() => collectSingleFlagValue(["--shard", "1/4", "--shard=2/4"], "--shard")).toThrow(
      /may only be provided once/i,
    );
  });

  it("rejects non-positive integer flag values", () => {
    expect(() => parsePositiveIntegerFlagValue("0", "--shard-total")).toThrow(
      /must be a positive integer/i,
    );
  });

  it("parses shard shorthand syntax", () => {
    const options = parseCliOptions(["--shard", "2/4"]);
    expect(options.shardIndex).toBe(2);
    expect(options.shardTotal).toBe(4);
  });

  it("parses explicit shard flags", () => {
    const options = parseCliOptions(["--shard-index", "3", "--shard-total", "5"]);
    expect(options.shardIndex).toBe(3);
    expect(options.shardTotal).toBe(5);
  });

  it("rejects partial shard flags", () => {
    expect(() => parseCliOptions(["--shard-index", "1"])).toThrow(
      /--shard-index and --shard-total must be provided together/i,
    );
  });

  it("rejects invalid shard ranges", () => {
    expect(() => parseCliOptions(["--shard", "5/4"])).toThrow(/index cannot be greater than/i);
  });
});
