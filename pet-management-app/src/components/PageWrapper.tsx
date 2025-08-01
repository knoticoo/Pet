'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { useTheme } from '@/lib/theme-provider'

interface PageWrapperProps {
  children: React.ReactNode
}

export function PageWrapper({ children }: PageWrapperProps) {
  const pathname = usePathname()
  const { setCurrentPage } = useTheme()

  useEffect(() => {
    setCurrentPage(pathname)
  }, [pathname, setCurrentPage])

  return <>{children}</>
}