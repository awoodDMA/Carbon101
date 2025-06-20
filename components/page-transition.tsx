'use client'

import { usePathname } from 'next/navigation'
import { ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

export default function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  return (
    <AnimatePresence mode="wait">
      <motion.main
        key={pathname}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.3 }}
        className="flex-1 p-4"
      >
        {children}
      </motion.main>
    </AnimatePresence>
  )
}
