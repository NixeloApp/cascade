export interface ViewportThemeConfig<
  Viewport extends string = string,
  Theme extends string = string,
> {
  viewport: Viewport;
  theme: Theme;
}

export interface ConfigMatrixRunContext<Config extends ViewportThemeConfig = ViewportThemeConfig> {
  config: Config;
  index: number;
  label: string;
}

export function formatViewportThemeConfigLabel(config: ViewportThemeConfig): string {
  return `${config.viewport}-${config.theme}`;
}

export async function runConfigMatrix<Config extends ViewportThemeConfig>(
  configs: readonly Config[],
  runner: (context: ConfigMatrixRunContext<Config>) => Promise<void>,
): Promise<void> {
  for (const [index, config] of configs.entries()) {
    await runner({
      config,
      index,
      label: formatViewportThemeConfigLabel(config),
    });
  }
}
