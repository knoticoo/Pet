import { Heart, Calendar, DollarSign, Bell, Plus } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { RecentPets } from '@/components/RecentPets'
import { UpcomingReminders } from '@/components/UpcomingReminders'
import { AuthGuard } from '@/components/AuthGuard'
import { DashboardStats } from '@/components/DashboardStats'

export default function Dashboard() {
  return (
    <AuthGuard>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground mt-1 md:mt-2 text-sm md:text-base">
              Welcome back! Here's an overview of your pets' care.
            </p>
          </div>
          <Link href="/pets/new">
            <Button className="flex items-center space-x-2 w-full md:w-auto">
              <Plus className="h-4 w-4" />
              <span>Add Pet</span>
            </Button>
          </Link>
        </div>

        {/* Stats Grid */}
        <DashboardStats />

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
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
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
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
