import type { Metadata } from 'next'
import { Barlow, Playfair_Display } from 'next/font/google'
import './globals.css'
import WhatsAppButton from '@/components/sections/WhatsAppButton'

const barlow = Barlow({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  variable: '--font-barlow',
})
const playfair = Playfair_Display({
  subsets: ['latin'],
  weight: ['400', '600'],
  variable: '--font-playfair',
})

export const metadata: Metadata = {
  title: 'Atlantic Services | General Construction Indianapolis',
  description: 'Professional construction, flooring, painting, restoration and more in Indianapolis, Indiana.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${barlow.variable} ${playfair.variable} font-sans`}>
        {children}
        <WhatsAppButton />
      </body>
    </html>
  )
}