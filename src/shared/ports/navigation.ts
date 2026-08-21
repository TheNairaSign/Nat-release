export interface NavigationPort {
  navigate(href: string): void;
  replace(href: string): void;
  back(): void;
}
