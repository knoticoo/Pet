import { Heart, Calendar, DollarSign, Bell, Plus } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { RecentPets } from '@/components/RecentPets'
import { UpcomingReminders } from '@/components/UpcomingReminders'
import { AuthGuard } from '@/components/AuthGuard'

export default function Dashboard() {
  const stats = [
    {
      title: 'Total Pets',
      value: '3',
      icon: Heart,
      color: 'text-pink-600',
      bgColor: 'bg-pink-100'
    },
    {
      title: 'Upcoming Appointments',
      value: '2',
      icon: Calendar,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      title: 'Monthly Expenses',
      value: '$245',
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      title: 'Active Reminders',
      value: '5',
      icon: Bell,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100'
    }
  ]

  return (
    <AuthGuard>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground mt-2">
              Welcome back! Here's an overview of your pets' care.
            </p>
          </div>
          <Link href="/pets/new">
            <Button className="flex items-center space-x-2">
              <Plus className="h-4 w-4" />
              <span>Add Pet</span>
            </Button>
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat) => (
            <div key={stat.title} className="stat-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </p>
                  <p className="text-2xl font-bold text-foreground">
                    {stat.value}
                  </p>
                </div>
                <div className={`p-3 rounded-full ${stat.bgColor}`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Pets */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-foreground">My Pets</h2>
              <Link href="/pets">
                <Button variant="outline" size="sm">
                  View All
                </Button>
              </Link>
            </div>
            <RecentPets />
          </div>

          {/* Upcoming Reminders */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-foreground">Upcoming Reminders</h2>
              <Link href="/reminders">
                <Button variant="outline" size="sm">
                  View All
                </Button>
              </Link>
            </div>
            <UpcomingReminders />
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card p-6">
          <h2 className="text-xl font-semibold text-foreground mb-6">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link href="/appointments/new">
              <Button variant="outline" className="w-full h-24 flex flex-col space-y-2">
                <Calendar className="h-6 w-6" />
                <span>Schedule Appointment</span>
              </Button>
            </Link>
            <Link href="/expenses/new">
              <Button variant="outline" className="w-full h-24 flex flex-col space-y-2">
                <DollarSign className="h-6 w-6" />
                <span>Add Expense</span>
              </Button>
            </Link>
            <Link href="/reminders/new">
              <Button variant="outline" className="w-full h-24 flex flex-col space-y-2">
                <Bell className="h-6 w-6" />
                <span>Set Reminder</span>
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </AuthGuard>
  )
}
