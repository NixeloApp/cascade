import { describe, expect, it, vi } from "vitest";
import { handleKeyboardClick, handleKeyboardClickWithEvent } from "./accessibility";

describe("accessibility utilities", () => {
  describe("handleKeyboardClick", () => {
    it("should call handler when Enter key is pressed", () => {
      const handler = vi.fn();
      const keyboardHandler = handleKeyboardClick(handler);

      const event = {
        key: "Enter",
        preventDefault: vi.fn(),
      } as unknown as React.KeyboardEvent;

      keyboardHandler(event);

      expect(handler).toHaveBeenCalledTimes(1);
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it("should call handler when Space key is pressed", () => {
      const handler = vi.fn();
      const keyboardHandler = handleKeyboardClick(handler);

      const event = {
        key: " ",
        preventDefault: vi.fn(),
      } as unknown as React.KeyboardEvent;

      keyboardHandler(event);

      expect(handler).toHaveBeenCalledTimes(1);
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it("should not call handler when other keys are pressed", () => {
      const handler = vi.fn();
      const keyboardHandler = handleKeyboardClick(handler);

      const keys = ["Escape", "Tab", "a", "1", "ArrowDown", "ArrowUp"];

      keys.forEach((key) => {
        const event = {
          key,
          preventDefault: vi.fn(),
        } as unknown as React.KeyboardEvent;

        keyboardHandler(event);

        expect(event.preventDefault).not.toHaveBeenCalled();
      });

      expect(handler).not.toHaveBeenCalled();
    });

    it("should work with handler that has no return value", () => {
      const handler = vi.fn(() => {
        // No return value
      });
      const keyboardHandler = handleKeyboardClick(handler);

      const event = {
        key: "Enter",
        preventDefault: vi.fn(),
      } as unknown as React.KeyboardEvent;

      keyboardHandler(event);

      expect(handler).toHaveBeenCalledTimes(1);
    });

    it("should work when called multiple times", () => {
      const handler = vi.fn();
      const keyboardHandler = handleKeyboardClick(handler);

      const enterEvent = {
        key: "Enter",
        preventDefault: vi.fn(),
      } as unknown as React.KeyboardEvent;

      const spaceEvent = {
        key: " ",
        preventDefault: vi.fn(),
      } as unknown as React.KeyboardEvent;

      keyboardHandler(enterEvent);
      keyboardHandler(spaceEvent);

      expect(handler).toHaveBeenCalledTimes(2);
    });
  });

  describe("handleKeyboardClickWithEvent", () => {
    it("should call handler with event when Enter key is pressed", () => {
      const handler = vi.fn();
      const keyboardHandler = handleKeyboardClickWithEvent(handler);

      const event = {
        key: "Enter",
        preventDefault: vi.fn(),
      } as unknown as React.KeyboardEvent;

      keyboardHandler(event);

      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith(event);
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it("should call handler with event when Space key is pressed", () => {
      const handler = vi.fn();
      const keyboardHandler = handleKeyboardClickWithEvent(handler);

      const event = {
        key: " ",
        preventDefault: vi.fn(),
      } as unknown as React.KeyboardEvent;

      keyboardHandler(event);

      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith(event);
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it("should not call handler when other keys are pressed", () => {
      const handler = vi.fn();
      const keyboardHandler = handleKeyboardClickWithEvent(handler);

      const keys = ["Escape", "Tab", "a", "1", "ArrowDown", "ArrowUp"];

      keys.forEach((key) => {
        const event = {
          key,
          preventDefault: vi.fn(),
        } as unknown as React.KeyboardEvent;

        keyboardHandler(event);

        expect(event.preventDefault).not.toHaveBeenCalled();
      });

      expect(handler).not.toHaveBeenCalled();
    });

    it("should pass the correct event type to handler", () => {
      const handler = vi.fn((e: React.KeyboardEvent<HTMLDivElement>) => {
        // Handler can access event properties
        expect(e.key).not.toBeUndefined();
        expect(typeof e.key).toBe("string");
      });

      const keyboardHandler = handleKeyboardClickWithEvent<HTMLDivElement>(
        handler as unknown as (
          e: React.KeyboardEvent<HTMLDivElement> | React.MouseEvent<HTMLDivElement>,
        ) => void,
      );

      const event = {
        key: "Enter",
        preventDefault: vi.fn(),
      } as unknown as React.KeyboardEvent<HTMLDivElement>;

      keyboardHandler(event);

      expect(handler).toHaveBeenCalledWith(event);
    });

    it("should work with generic type parameter", () => {
      const handler = vi.fn();
      const keyboardHandler = handleKeyboardClickWithEvent<HTMLButtonElement>(handler);

      const event = {
        key: "Enter",
        preventDefault: vi.fn(),
      } as unknown as React.KeyboardEvent<HTMLButtonElement>;

      keyboardHandler(event);

      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith(event);
    });

    it("should work when called multiple times", () => {
      const handler = vi.fn();
      const keyboardHandler = handleKeyboardClickWithEvent(handler);

      const enterEvent = {
        key: "Enter",
        preventDefault: vi.fn(),
      } as unknown as React.KeyboardEvent;

      const spaceEvent = {
        key: " ",
        preventDefault: vi.fn(),
      } as unknown as React.KeyboardEvent;

      keyboardHandler(enterEvent);
      keyboardHandler(spaceEvent);

      expect(handler).toHaveBeenCalledTimes(2);
      expect(handler).toHaveBeenNthCalledWith(1, enterEvent);
      expect(handler).toHaveBeenNthCalledWith(2, spaceEvent);
    });

    it("should handle handler that modifies event", () => {
      let eventKey = "";
      const handler = vi.fn((e: React.KeyboardEvent | React.MouseEvent) => {
        if ("key" in e) {
          eventKey = e.key;
        }
      });

      const keyboardHandler = handleKeyboardClickWithEvent(handler);

      const event = {
        key: "Enter",
        preventDefault: vi.fn(),
      } as unknown as React.KeyboardEvent;

      keyboardHandler(event);

      expect(handler).toHaveBeenCalledWith(event);
      expect(eventKey).toBe("Enter");
    });
  });

  describe("accessibility patterns", () => {
    it("should support common accessibility use case with div role=button", () => {
      const onClick = vi.fn();
      const onKeyDown = handleKeyboardClick(onClick);

      // Simulate click
      onClick();
      expect(onClick).toHaveBeenCalledTimes(1);

      // Simulate keyboard Enter
      const enterEvent = {
        key: "Enter",
        preventDefault: vi.fn(),
      } as unknown as React.KeyboardEvent;
      onKeyDown(enterEvent);
      expect(onClick).toHaveBeenCalledTimes(2);

      // Simulate keyboard Space
      const spaceEvent = {
        key: " ",
        preventDefault: vi.fn(),
      } as unknown as React.KeyboardEvent;
      onKeyDown(spaceEvent);
      expect(onClick).toHaveBeenCalledTimes(3);
    });

    it("should support event delegation pattern", () => {
      const handleClick = vi.fn((e: React.MouseEvent | React.KeyboardEvent) => {
        // Can access event target
        expect(e).not.toBeUndefined();
        expect(typeof e).toBe("object");
      });

      const onKeyDown = handleKeyboardClickWithEvent(handleClick);

      const event = {
        key: "Enter",
        preventDefault: vi.fn(),
        target: { id: "test-element" },
      } as unknown as React.KeyboardEvent;

      onKeyDown(event);

      expect(handleClick).toHaveBeenCalledWith(event);
    });
  });
});
