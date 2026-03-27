import type { BrowserContext, BrowserContextOptions, Page } from "@playwright/test";

type IsolatedPageOverrides = Pick<BrowserContextOptions, "colorScheme" | "timezoneId">;

export type PageTarget = {
  close: () => Promise<void>;
  page: Page;
};

export type IsolatedPageTarget = PageTarget & {
  context: BrowserContext;
};

export async function withSiblingPageTarget<T>(
  sourcePage: Page,
  run: (target: PageTarget) => Promise<T>,
): Promise<T> {
  const target = await createSiblingPageTarget(sourcePage);

  try {
    return await run(target);
  } finally {
    await target.close();
  }
}

export async function withIsolatedPageTarget<T>(
  sourcePage: Page,
  run: (target: IsolatedPageTarget) => Promise<T>,
  overrides: IsolatedPageOverrides = {},
): Promise<T> {
  const target = await createIsolatedPageTarget(sourcePage, overrides);

  try {
    return await run(target);
  } finally {
    await target.close();
  }
}

export async function createSiblingPageTarget(sourcePage: Page): Promise<PageTarget> {
  const page = await sourcePage.context().newPage();

  return {
    page,
    close: async () => {
      if (!page.isClosed()) {
        await page.close();
      }
    },
  };
}

export async function createIsolatedPageTarget(
  sourcePage: Page,
  overrides: IsolatedPageOverrides = {},
): Promise<IsolatedPageTarget> {
  const browser = sourcePage.context().browser();
  if (!browser) {
    throw new Error("Unable to create isolated page without an attached browser instance");
  }

  const context = await browser.newContext({
    storageState: await sourcePage.context().storageState(),
    viewport: sourcePage.viewportSize() ?? undefined,
    ...overrides,
  });

  try {
    const page = await context.newPage();

    return {
      context,
      page,
      close: async () => {
        await context.close();
      },
    };
  } catch (error) {
    await context.close();
    throw error;
  }
}
