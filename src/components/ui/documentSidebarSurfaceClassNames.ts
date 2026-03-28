export function getDocumentSidebarSectionClassName() {
  return "border-b border-ui-border/30 last:border-b-0";
}

export function getDocumentSidebarSectionTitleClassName() {
  return "text-left";
}

export function getDocumentSidebarSectionChevronClassName(isOpen: boolean) {
  return isOpen
    ? "transition-transform duration-default"
    : "transition-transform duration-default -rotate-90";
}

export function getDocumentSidebarSectionBodyClassName() {
  return "p-2 pt-0";
}

export function getDocumentSidebarEmptyContentsClassName() {
  return "p-1 text-ui-text-tertiary";
}

export function getDocumentSidebarTocButtonClassName() {
  return "w-full justify-start truncate text-ui-text-secondary";
}

export function getDocumentSidebarTocIconClassName() {
  return "shrink-0";
}

export function getDocumentSidebarTocTextClassName() {
  return "truncate";
}

export function getDocumentSidebarInfoRowClassName() {
  return "p-1";
}

export function getDocumentSidebarClosedToggleClassName() {
  return "fixed right-4 top-20 z-10";
}

export function getDocumentSidebarShellClassName() {
  return "h-full w-sidebar shrink-0 overflow-y-auto";
}

export function getDocumentSidebarHeaderClassName() {
  return "p-2";
}
