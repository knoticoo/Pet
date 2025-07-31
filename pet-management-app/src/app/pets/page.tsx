import { Heart, Plus } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { AuthGuard } from '@/components/AuthGuard'

export default function PetsPage() {
  return (
    <AuthGuard>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">My Pets</h1>
            <p className="text-muted-foreground mt-1 md:mt-2 text-sm md:text-base">
              Manage and track all your beloved pets.
            </p>
          </div>
          <Link href="/pets/new">
            <Button className="flex items-center space-x-2 w-full md:w-auto">
              <Plus className="h-4 w-4" />
              <span>Add New Pet</span>
            </Button>
          </Link>
        </div>

        {/* Pets Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Sample pet cards - replace with actual data */}
          <div className="pet-card">
            <div className="flex items-center space-x-4 mb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-pink-400 to-pink-600 rounded-full flex items-center justify-center">
                <Heart className="h-8 w-8 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">Buddy</h3>
                <p className="text-muted-foreground text-sm">Golden Retriever • 3 years old</p>
              </div>
            </div>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>Last checkup: 2 weeks ago</p>
              <p>Next appointment: In 1 month</p>
            </div>
          </div>

          <div className="pet-card">
            <div className="flex items-center space-x-4 mb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center">
                <Heart className="h-8 w-8 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">Whiskers</h3>
                <p className="text-muted-foreground text-sm">Persian Cat • 2 years old</p>
              </div>
            </div>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>Last checkup: 1 week ago</p>
              <p>Next appointment: In 3 weeks</p>
            </div>
          </div>

          <div className="pet-card">
            <div className="flex items-center space-x-4 mb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center">
                <Heart className="h-8 w-8 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">Charlie</h3>
                <p className="text-muted-foreground text-sm">Labrador Mix • 5 years old</p>
              </div>
            </div>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>Last checkup: 3 days ago</p>
              <p>Next appointment: In 2 months</p>
            </div>
          </div>
        </div>

        {/* Empty state if no pets */}
        <div className="text-center py-12 hidden">
          <Heart className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">No pets yet</h3>
          <p className="text-muted-foreground mb-6">
            Start by adding your first pet to begin tracking their care.
          </p>
          <Link href="/pets/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Pet
            </Button>
          </Link>
        </div>
      </div>
    </AuthGuard>
  )
}