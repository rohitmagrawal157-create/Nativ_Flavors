'use client'

import NextLink from 'next/link'
import {
  useParams as useNextParams,
  usePathname,
  useRouter,
  useSearchParams as useNextSearchParams,
} from 'next/navigation'
import {
  useCallback,
  type AnchorHTMLAttributes,
  type ReactNode,
} from 'react'

export function BrowserRouter({ children }: { children?: ReactNode }) {
  return <>{children}</>
}

export function Routes({ children }: { children?: ReactNode }) {
  return <>{children}</>
}

export function Route(_props: { path?: string; element?: ReactNode }) {
  return null
}

type LinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> & {
  to?: string
  href?: string
  replace?: boolean
  scroll?: boolean
  prefetch?: boolean
  children?: ReactNode
}

function isExternal(dest: string) {
  return /^(https?:|mailto:|tel:)/i.test(dest) || dest.startsWith('#')
}

/** Drop-in replacement for react-router-dom's Link. Accepts `to` or `href`. */
export function Link({
  to,
  href,
  children,
  replace,
  scroll,
  prefetch,
  ...rest
}: LinkProps) {
  const dest = href ?? to ?? '#'
  if (isExternal(dest)) {
    return (
      <a href={dest} {...rest}>
        {children}
      </a>
    )
  }
  return (
    <NextLink href={dest} replace={replace} scroll={scroll} prefetch={prefetch} {...rest}>
      {children}
    </NextLink>
  )
}

type NavigateOptions = { replace?: boolean; state?: unknown }

export function useNavigate() {
  const router = useRouter()
  return useCallback(
    (to: string | number, options?: NavigateOptions) => {
      if (typeof to === 'number') {
        window.history.go(to)
        return
      }
      if (options?.replace) router.replace(to)
      else router.push(to)
    },
    [router],
  )
}

export function useLocation() {
  const pathname = usePathname() || '/'
  const searchParams = useNextSearchParams()
  const query = searchParams.toString()
  return {
    pathname,
    search: query ? `?${query}` : '',
    hash: '',
    state: null as null,
    key: 'next',
  }
}

export function useParams<
  T extends Record<string, string | undefined> = Record<string, string | undefined>,
>(): T {
  const params = useNextParams()
  const normalized: Record<string, string | undefined> = {}
  Object.entries(params).forEach(([key, value]) => {
    normalized[key] = Array.isArray(value) ? value[0] : value
  })
  return normalized as T
}

export function useSearchParams() {
  const searchParams = useNextSearchParams()
  const router = useRouter()
  const pathname = usePathname() || '/'
  const setSearchParams = (
    next: URLSearchParams | Record<string, string>,
  ) => {
    const params = next instanceof URLSearchParams ? next : new URLSearchParams(next)
    const query = params.toString()
    router.push(query ? `${pathname}?${query}` : pathname)
  }
  return [searchParams, setSearchParams] as const
}
