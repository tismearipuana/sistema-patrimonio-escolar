import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ClientWrapper } from '@/components/client-wrapper'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Sistema de Patrimônio Escolar',
  description: 'Gestão Municipal de Ativos Educacionais',
}

export default function RootLayout({
  children,
}: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <ClientWrapper>
          {children}
        </ClientWrapper>
      </body>
    </html>
  )
}
