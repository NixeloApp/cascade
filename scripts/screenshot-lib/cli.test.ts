import { describe, expect, it } from "vitest";
import { parseCliOptions } from "../../e2e/screenshot-lib/cli";

describe("parseCliOptions", () => {
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
