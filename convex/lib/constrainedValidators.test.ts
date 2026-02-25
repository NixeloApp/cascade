import { ConvexError } from "convex/values";
import { describe, expect, it } from "vitest";
import {
  ARRAY_LIMITS,
  STRING_LIMITS,
  validate,
  validateArrayLength,
  validateEmail,
  validateProjectKey,
  validateSlug,
  validateStringLength,
  validateUrl,
} from "./constrainedValidators";

function expectValidationError(fn: () => void, messagePart?: string) {
  try {
    fn();
  } catch (e) {
    if (e instanceof ConvexError) {
      const data = e.data as any;
      expect(data.code).toBe("VALIDATION");
      if (messagePart) {
        expect(data.message).toContain(messagePart);
      }
      return;
    }
    throw e;
  }
  throw new Error("Expected validation error");
}

describe("constrained validators", () => {
  describe("STRING_LIMITS", () => {
    it("should have correct KEY limits", () => {
      expect(STRING_LIMITS.KEY).toEqual({ min: 1, max: 10 });
    });

    it("should have correct NAME limits", () => {
      expect(STRING_LIMITS.NAME).toEqual({ min: 1, max: 100 });
    });

    it("should have correct TITLE limits", () => {
      expect(STRING_LIMITS.TITLE).toEqual({ min: 1, max: 200 });
    });

    it("should have correct DESCRIPTION limits", () => {
      expect(STRING_LIMITS.DESCRIPTION).toEqual({ min: 0, max: 10000 });
    });

    it("should have correct URL limits", () => {
      expect(STRING_LIMITS.URL).toEqual({ min: 0, max: 2048 });
    });

    it("should have correct EMAIL limits", () => {
      expect(STRING_LIMITS.EMAIL).toEqual({ min: 3, max: 254 });
    });

    it("should have correct SLUG limits", () => {
      expect(STRING_LIMITS.SLUG).toEqual({ min: 1, max: 50 });
    });
  });

  describe("ARRAY_LIMITS", () => {
    it("should have correct TAGS limits", () => {
      expect(ARRAY_LIMITS.TAGS).toEqual({ min: 0, max: 50 });
    });

    it("should have correct MEMBERS limits", () => {
      expect(ARRAY_LIMITS.MEMBERS).toEqual({ min: 0, max: 100 });
    });

    it("should have correct BULK_IDS limits", () => {
      expect(ARRAY_LIMITS.BULK_IDS).toEqual({ min: 1, max: 100 });
    });

    it("should have correct WORKFLOW_STATES limits", () => {
      expect(ARRAY_LIMITS.WORKFLOW_STATES).toEqual({ min: 1, max: 20 });
    });
  });

  describe("validateStringLength", () => {
    it("should accept valid string within limits", () => {
      expect(() => validateStringLength("hello", "field", 1, 10)).not.toThrow();
    });

    it("should accept string at minimum length", () => {
      expect(() => validateStringLength("a", "field", 1, 10)).not.toThrow();
    });

    it("should accept string at maximum length", () => {
      expect(() => validateStringLength("abcdefghij", "field", 1, 10)).not.toThrow();
    });

    it("should throw for string below minimum length", () => {
      expectValidationError(
        () => validateStringLength("", "title", 1, 10),
        "title must be at least 1 characters (got 0)",
      );
    });

    it("should throw for string above maximum length", () => {
      expectValidationError(
        () => validateStringLength("this is too long", "name", 1, 5),
        "name must be at most 5 characters (got 16)",
      );
    });

    it("should accept empty string when min is 0", () => {
      expect(() => validateStringLength("", "description", 0, 1000)).not.toThrow();
    });
  });

  describe("validateArrayLength", () => {
    it("should accept valid array within limits", () => {
      expect(() => validateArrayLength([1, 2, 3], "items", 1, 10)).not.toThrow();
    });

    it("should accept array at minimum length", () => {
      expect(() => validateArrayLength([1], "items", 1, 10)).not.toThrow();
    });

    it("should accept array at maximum length", () => {
      const arr = Array(10).fill(1);
      expect(() => validateArrayLength(arr, "items", 1, 10)).not.toThrow();
    });

    it("should throw for array below minimum length", () => {
      expectValidationError(
        () => validateArrayLength([], "ids", 1, 10),
        "ids must have at least 1 items (got 0)",
      );
    });

    it("should throw for array above maximum length", () => {
      const arr = Array(15).fill(1);
      expectValidationError(
        () => validateArrayLength(arr, "tags", 0, 10),
        "tags must have at most 10 items (got 15)",
      );
    });

    it("should accept empty array when min is 0", () => {
      expect(() => validateArrayLength([], "tags", 0, 50)).not.toThrow();
    });
  });

  describe("validateProjectKey", () => {
    it("should accept valid project keys", () => {
      expect(() => validateProjectKey("AB")).not.toThrow();
      expect(() => validateProjectKey("PROJ")).not.toThrow();
      expect(() => validateProjectKey("P1")).not.toThrow();
      expect(() => validateProjectKey("ABC123")).not.toThrow();
      expect(() => validateProjectKey("ABCDEFGHIJ")).not.toThrow(); // 10 chars max
    });

    it("should accept lowercase and convert to uppercase", () => {
      expect(() => validateProjectKey("proj")).not.toThrow();
      expect(() => validateProjectKey("Abc")).not.toThrow();
    });

    it("should trim whitespace", () => {
      expect(() => validateProjectKey("  PROJ  ")).not.toThrow();
    });

    it("should reject single character", () => {
      expectValidationError(
        () => validateProjectKey("A"),
        "projectKey must be 2-10 uppercase alphanumeric characters, starting with a letter",
      );
    });

    it("should reject keys starting with number", () => {
      expectValidationError(
        () => validateProjectKey("1ABC"),
        "projectKey must be 2-10 uppercase alphanumeric characters",
      );
    });

    it("should reject keys with special characters", () => {
      expectValidationError(
        () => validateProjectKey("AB-C"),
        "projectKey must be 2-10 uppercase alphanumeric characters",
      );
      expectValidationError(() => validateProjectKey("AB_C"));
      expectValidationError(() => validateProjectKey("AB C"));
    });

    it("should reject keys longer than 10 characters", () => {
      expectValidationError(
        () => validateProjectKey("ABCDEFGHIJK"),
        "projectKey must be 2-10 uppercase alphanumeric characters",
      );
    });
  });

  describe("validateSlug", () => {
    it("should accept valid slugs", () => {
      expect(() => validateSlug("a")).not.toThrow();
      expect(() => validateSlug("abc")).not.toThrow();
      expect(() => validateSlug("my-project")).not.toThrow();
      expect(() => validateSlug("project-123")).not.toThrow();
      expect(() => validateSlug("123")).not.toThrow();
    });

    it("should reject slugs starting with hyphen", () => {
      expectValidationError(
        () => validateSlug("-abc"),
        "must be lowercase letters, numbers, and hyphens",
      );
    });

    it("should reject slugs ending with hyphen", () => {
      expectValidationError(
        () => validateSlug("abc-"),
        "must be lowercase letters, numbers, and hyphens",
      );
    });

    it("should reject uppercase characters", () => {
      expectValidationError(
        () => validateSlug("MyProject"),
        "must be lowercase letters, numbers, and hyphens",
      );
    });

    it("should reject special characters", () => {
      expectValidationError(() => validateSlug("my_project"));
      expectValidationError(() => validateSlug("my.project"));
      expectValidationError(() => validateSlug("my project"));
    });

    it("should reject slugs longer than 50 characters", () => {
      const longSlug = "a".repeat(51);
      expectValidationError(() => validateSlug(longSlug), "must be at most 50 characters");
    });

    it("should use custom field name in error", () => {
      expectValidationError(
        () => validateSlug("-abc", "workspaceSlug"),
        "workspaceSlug must be lowercase",
      );
    });
  });

  describe("validateEmail", () => {
    it("should accept valid emails", () => {
      expect(() => validateEmail("user@example.com")).not.toThrow();
      expect(() => validateEmail("test.user@domain.org")).not.toThrow();
      expect(() => validateEmail("a@b.c")).not.toThrow();
    });

    it("should reject email without @", () => {
      expectValidationError(() => validateEmail("userexample.com"), "Invalid email format");
    });

    it("should reject email without .", () => {
      expectValidationError(() => validateEmail("user@examplecom"), "Invalid email format");
    });

    it("should reject email too short", () => {
      expectValidationError(() => validateEmail("a@"), "email must be at least 3 characters");
    });

    it("should reject email too long", () => {
      const longEmail = `${"a".repeat(251)}@b.c`; // 255 chars, exceeds 254 limit
      expectValidationError(() => validateEmail(longEmail), "email must be at most 254 characters");
    });
  });

  describe("validateUrl", () => {
    it("should accept valid URLs", () => {
      expect(() => validateUrl("https://example.com")).not.toThrow();
      expect(() => validateUrl("http://localhost:3000")).not.toThrow();
      expect(() => validateUrl("https://sub.domain.com/path?query=1")).not.toThrow();
    });

    it("should reject invalid URLs", () => {
      expectValidationError(() => validateUrl("not-a-url"), "must be a valid URL");
      expectValidationError(() => validateUrl("example.com"), "must be a valid URL");
    });

    it("should reject empty URL", () => {
      expectValidationError(() => validateUrl(""), "must be at least 1 characters");
    });

    it("should reject URL too long", () => {
      const longUrl = `https://example.com/${"a".repeat(2030)}`;
      expectValidationError(() => validateUrl(longUrl), "must be at most 2048 characters");
    });

    it("should use custom field name in error", () => {
      expectValidationError(() => validateUrl("bad", "website"), "website must be a valid URL");
    });
  });

  describe("validate object", () => {
    describe("validate.projectKey", () => {
      it("should validate project keys", () => {
        expect(() => validate.projectKey("PROJ")).not.toThrow();
        expectValidationError(() => validate.projectKey("A"));
      });
    });

    describe("validate.name", () => {
      it("should validate names within limits", () => {
        expect(() => validate.name("My Project")).not.toThrow();
      });

      it("should reject empty name", () => {
        expectValidationError(() => validate.name(""), "name must be at least 1 characters");
      });

      it("should reject name over 100 chars", () => {
        expectValidationError(
          () => validate.name("a".repeat(101)),
          "name must be at most 100 characters",
        );
      });

      it("should use custom field name", () => {
        expectValidationError(
          () => validate.name("", "teamName"),
          "teamName must be at least 1 characters",
        );
      });
    });

    describe("validate.title", () => {
      it("should validate titles within limits", () => {
        expect(() => validate.title("Issue Title")).not.toThrow();
      });

      it("should reject empty title", () => {
        expectValidationError(() => validate.title(""), "title must be at least 1 characters");
      });

      it("should reject title over 200 chars", () => {
        expectValidationError(
          () => validate.title("a".repeat(201)),
          "title must be at most 200 characters",
        );
      });
    });

    describe("validate.description", () => {
      it("should validate descriptions within limits", () => {
        expect(() => validate.description("A longer description")).not.toThrow();
      });

      it("should accept empty description", () => {
        expect(() => validate.description("")).not.toThrow();
      });

      it("should accept undefined description", () => {
        expect(() => validate.description(undefined)).not.toThrow();
      });

      it("should reject description over 10000 chars", () => {
        expectValidationError(
          () => validate.description("a".repeat(10001)),
          "description must be at most 10000 characters",
        );
      });
    });

    describe("validate.tags", () => {
      it("should validate tags array within limits", () => {
        expect(() => validate.tags(["bug", "feature"])).not.toThrow();
      });

      it("should accept empty tags", () => {
        expect(() => validate.tags([])).not.toThrow();
      });

      it("should reject more than 50 tags", () => {
        const manyTags = Array(51).fill("tag");
        expectValidationError(() => validate.tags(manyTags), "tags must have at most 50 items");
      });
    });

    describe("validate.bulkIds", () => {
      it("should validate bulk IDs within limits", () => {
        expect(() => validate.bulkIds(["id1", "id2"])).not.toThrow();
      });

      it("should reject empty bulk IDs", () => {
        expectValidationError(() => validate.bulkIds([]), "ids must have at least 1 items");
      });

      it("should reject more than 100 bulk IDs", () => {
        const manyIds = Array(101).fill("id");
        expectValidationError(() => validate.bulkIds(manyIds), "ids must have at most 100 items");
      });
    });

    describe("validate.url", () => {
      it("should validate URLs", () => {
        expect(() => validate.url("https://example.com")).not.toThrow();
      });

      it("should accept undefined URL", () => {
        expect(() => validate.url(undefined)).not.toThrow();
      });

      it("should reject invalid URL", () => {
        expectValidationError(() => validate.url("not-valid"), "must be a valid URL");
      });
    });

    describe("validate.email", () => {
      it("should validate emails", () => {
        expect(() => validate.email("test@example.com")).not.toThrow();
      });

      it("should reject invalid email", () => {
        expectValidationError(() => validate.email("invalid"), "Invalid email format");
      });
    });

    describe("validate.slug", () => {
      it("should validate slugs", () => {
        expect(() => validate.slug("my-slug")).not.toThrow();
      });

      it("should reject invalid slug", () => {
        expectValidationError(() => validate.slug("My Slug"), "must be lowercase");
      });

      it("should use custom field name", () => {
        expectValidationError(() => validate.slug("-bad", "orgSlug"), "orgSlug must be lowercase");
      });
    });
  });
});
