import type { Metadata } from 'next'
import { Barlow, Playfair_Display } from 'next/font/google'
import './globals.css'
import WhatsAppButton from '@/components/sections/WhatsAppButton'
import { LanguageProvider } from '@/lib/LanguageContext'

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

const SITE_URL = 'https://www.atlanticser.com'
const SITE_TITLE = 'Atlantic Services | General Construction Indianapolis'
const SITE_DESCRIPTION = 'Professional construction, flooring, painting, restoration and more in Indianapolis, Indiana.'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
  alternates: { canonical: '/' },
  openGraph: {
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    siteName: 'Atlantic Services',
    images: [{ url: '/images/Logo-transparent.png', width: 1200, height: 630 }],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: ['/images/Logo-transparent.png'],
  },
}

const localBusinessJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'GeneralContractor',
  name: 'Atlantic Services LLC',
  image: `${SITE_URL}/images/Logo-transparent.png`,
  url: SITE_URL,
  telephone: '+1-317-991-5878',
  email: 'info@atlanticser.com',
  address: {
    '@type': 'PostalAddress',
    streetAddress: '5341 W. 86th St.',
    addressLocality: 'Indianapolis',
    addressRegion: 'IN',
    postalCode: '46268',
    addressCountry: 'US',
  },
  openingHoursSpecification: [
    {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      opens: '08:00',
      closes: '17:00',
    },
    {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: 'Saturday',
      opens: '09:00',
      closes: '12:00',
    },
  ],
  areaServed: ['Indiana', 'Illinois', 'Ohio', 'Michigan', 'Kentucky'],
  sameAs: [
    'https://www.instagram.com/atlanticservicesllc',
    'https://www.facebook.com/Atlantic-Services-LLC-107708467472972/',
    'https://www.linkedin.com/company/atlantic-services/',
  ],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${barlow.variable} ${playfair.variable} font-sans`}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessJsonLd) }}
        />
        <LanguageProvider>
          {children}
          <WhatsAppButton />
        </LanguageProvider>
      </body>
    </html>
  )
}