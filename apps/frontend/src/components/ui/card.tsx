//src/components/ui/card.tsx - Cards
import { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
}

export function Card({ children, className = '' }: CardProps) {
  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-300 ${className}`}>
      {children}
    </div>
  )
}

interface CardContentProps {
  children: ReactNode
  className?: string
}

export function CardContent({ children, className = '' }: CardContentProps) {
  return (
    <div className={`p-6 ${className}`}>
      {children}
    </div>
  )
}

interface CardHeaderProps {
  children: ReactNode
  className?: string
}

export function CardHeader({ children, className = '' }: CardHeaderProps) {
  return (
    <div className={`p-6 pb-2 ${className}`}>
      {children}
    </div>
  )
}

interface StatCardProps {
  title: string
  value: string | number
  icon: ReactNode
  trend?: {
    value: number
    isPositive: boolean
  }
  className?: string
}

export function StatCard({ title, value, icon, trend, className = '' }: StatCardProps) {
  return (
    <Card className={`hover:scale-[1.02] transition-transform ${className}`}>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="p-3 rounded-full bg-gray-50">
              {icon}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">{title}</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
              {trend && (
                <div className={`flex items-center mt-1 text-sm ${
                  trend.isPositive ? 'text-green-600' : 'text-red-600'
                }`}>
                  <span className="font-medium">
                    {trend.isPositive ? '+' : ''}{trend.value}%
                  </span>
                  <span className="ml-1 text-gray-500">vs mês anterior</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}