import { createNavigation } from 'next-intl/navigation';
import { routing } from './routing';

// Обёртки над Link/useRouter/redirect, которые сами добавляют
// текущую локаль в путь — используем их вместо стандартных next/navigation.
export const { Link, redirect, usePathname, useRouter } =
  createNavigation(routing);
