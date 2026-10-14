'use client';

// Thin react-router-compatible layer on top of next/navigation.
import NextLink from 'next/link';
import { redirect, usePathname, useRouter, useParams as useNextParams } from 'next/navigation';
import { useCallback, useEffect, type ComponentProps } from 'react';

type NavigateOptions = { replace?: boolean };

export function useNavigate() {
  const router = useRouter();
  return useCallback(
    (to: string | number, options?: NavigateOptions) => {
      if (typeof to === 'number') {
        if (to < 0) router.back();
        else router.forward();
        return;
      }
      if (options?.replace) router.replace(to);
      else router.push(to);
    },
    [router],
  );
}

export function useLocation() {
  const pathname = usePathname();
  // search/hash are only read client-side, outside of render-critical paths.
  return {
    pathname,
    search: typeof window === 'undefined' ? '' : window.location.search,
    hash: typeof window === 'undefined' ? '' : window.location.hash,
  };
}

export function useParams<T extends Record<string, string | undefined> = Record<string, string | undefined>>() {
  return useNextParams() as unknown as T;
}

export function Link({ to, ...props }: Omit<ComponentProps<typeof NextLink>, 'href'> & { to: string }) {
  return <NextLink href={to} {...props} />;
}

export function Navigate({ to, replace }: { to: string; replace?: boolean }) {
  const router = useRouter();
  useEffect(() => {
    if (replace) router.replace(to);
    else router.push(to);
  }, [router, to, replace]);
  return null;
}

export { redirect };
