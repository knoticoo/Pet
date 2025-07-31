import { Calendar, Plus, Clock, MapPin, User } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { AuthGuard } from '@/components/AuthGuard'

export default function AppointmentsPage() {
  // Sample appointments data - replace with actual data fetching
  const appointments = [
    {
      id: '1',
      title: 'Annual Checkup',
      date: new Date('2024-02-15T10:00:00'),
      duration: 60,
      location: 'Downtown Veterinary Clinic',
      vetName: 'Dr. Sarah Johnson',
      appointmentType: 'checkup',
      status: 'scheduled',
      pet: { name: 'Buddy', species: 'dog' }
    },
    {
      id: '2',
      title: 'Vaccination Update',
      date: new Date('2024-02-20T14:30:00'),
      duration: 30,
      location: 'Pet Care Center',
      vetName: 'Dr. Michael Chen',
      appointmentType: 'vaccination',
      status: 'scheduled',
      pet: { name: 'Whiskers', species: 'cat' }
    },
    {
      id: '3',
      title: 'Dental Cleaning',
      date: new Date('2024-01-28T09:00:00'),
      duration: 90,
      location: 'Animal Hospital',
      vetName: 'Dr. Emily Rodriguez',
      appointmentType: 'dental',
      status: 'completed',
      pet: { name: 'Charlie', species: 'dog' }
    }
  ]

  const upcomingAppointments = appointments.filter(apt => apt.status === 'scheduled')
  const pastAppointments = appointments.filter(apt => apt.status === 'completed')

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date)
  }

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(date)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800'
      case 'completed': return 'bg-green-100 text-green-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'checkup': return 'bg-purple-100 text-purple-800'
      case 'vaccination': return 'bg-yellow-100 text-yellow-800'
      case 'surgery': return 'bg-red-100 text-red-800'
      case 'dental': return 'bg-teal-100 text-teal-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <AuthGuard>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">Appointments</h1>
            <p className="text-muted-foreground mt-1 md:mt-2 text-sm md:text-base">
              Manage your pets' veterinary appointments and schedules.
            </p>
          </div>
          <Link href="/appointments/new">
            <Button className="flex items-center space-x-2 w-full md:w-auto">
              <Plus className="h-4 w-4" />
              <span>Schedule Appointment</span>
            </Button>
          </Link>
        </div>

        {/* Upcoming Appointments */}
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold text-foreground mb-4">Upcoming Appointments</h2>
            {upcomingAppointments.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {upcomingAppointments.map((appointment) => (
                  <Link key={appointment.id} href={`/appointments/${appointment.id}`}>
                    <div className="card p-6 hover:shadow-md transition-shadow cursor-pointer">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-foreground">{appointment.title}</h3>
                          <p className="text-sm text-muted-foreground">for {appointment.pet.name}</p>
                        </div>
                        <div className="flex space-x-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}>
                            {appointment.status}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(appointment.appointmentType)}`}>
                            {appointment.appointmentType}
                          </span>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          <span>{formatDate(appointment.date)}</span>
                        </div>
                        
                        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          <span>{formatTime(appointment.date)} ({appointment.duration} minutes)</span>
                        </div>
                        
                        {appointment.location && (
                          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                            <MapPin className="h-4 w-4" />
                            <span>{appointment.location}</span>
                          </div>
                        )}
                        
                        {appointment.vetName && (
                          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                            <User className="h-4 w-4" />
                            <span>{appointment.vetName}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <Calendar className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">No upcoming appointments</h3>
                <p className="text-muted-foreground mb-6">
                  Schedule your pet's next veterinary visit to keep them healthy.
                </p>
                <Link href="/appointments/new">
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Schedule First Appointment
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Past Appointments */}
          {pastAppointments.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold text-foreground mb-4">Past Appointments</h2>
              <div className="space-y-4">
                {pastAppointments.map((appointment) => (
                  <Link key={appointment.id} href={`/appointments/${appointment.id}`}>
                    <div className="card p-4 hover:shadow-sm transition-shadow cursor-pointer opacity-75">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-foreground">{appointment.title}</h4>
                          <p className="text-sm text-muted-foreground">
                            {appointment.pet.name} • {formatDate(appointment.date)} at {formatTime(appointment.date)}
                          </p>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}>
                          {appointment.status}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </AuthGuard>
  )
}