'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { useAuthenticatedSession } from '@/hooks/useAuthenticatedSession'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Heart, MapPin, Calendar, Crown, Shield, Camera, Users, Trophy, Star } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

interface UserProfile {
  id: string
  name?: string
  email: string
  avatar?: string
  bio?: string
  location?: string
  isAdmin: boolean
  subscriptionTier?: string
  joinedDate: string
  petCount: number
  storyCount: number
  challengesWon: number
  isOwnProfile: boolean
  isFollowing?: boolean
}

interface Pet {
  id: string
  name: string
  species: string
  breed?: string
  photo?: string
  age?: number
}

interface Story {
  id: string
  petId: string
  petName: string
  imageUrl: string
  caption: string
  createdAt: string
  expiresAt: string
  viewCount: number
}

export default function UserProfilePage() {
  const params = useParams()
  const { session } = useAuthenticatedSession()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [pets, setPets] = useState<Pet[]>([])
  const [stories, setStories] = useState<Story[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState<'pets' | 'stories' | 'achievements'>('pets')

  const userId = params?.userId as string

  useEffect(() => {
    if (userId && session?.user?.id) {
      fetchUserProfile()
    }
  }, [userId, session?.user?.id])

  const fetchUserProfile = async () => {
    try {
      setLoading(true)
      
      const [profileResponse, petsResponse, storiesResponse] = await Promise.allSettled([
        fetch(`/api/users/${userId}/profile`),
        fetch(`/api/users/${userId}/pets`),
        fetch(`/api/users/${userId}/stories`)
      ])

      if (profileResponse.status === 'fulfilled' && profileResponse.value.ok) {
        const profileData = await profileResponse.value.json()
        setProfile(profileData)
      } else {
        setError('User not found or profile is private')
        return
      }

      if (petsResponse.status === 'fulfilled' && petsResponse.value.ok) {
        const petsData = await petsResponse.value.json()
        setPets(petsData)
      }

      if (storiesResponse.status === 'fulfilled' && storiesResponse.value.ok) {
        const storiesData = await storiesResponse.value.json()
        setStories(storiesData)
      }

    } catch (error) {
      console.error('Error fetching profile:', error)
      setError('Failed to load profile')
    } finally {
      setLoading(false)
    }
  }

  const handleFollow = async () => {
    if (!profile) return

    try {
      const response = await fetch(`/api/users/${userId}/follow`, {
        method: profile.isFollowing ? 'DELETE' : 'POST',
        headers: { 'Content-Type': 'application/json' }
      })

      if (response.ok) {
        setProfile({
          ...profile,
          isFollowing: !profile.isFollowing
        })
      }
    } catch (error) {
      console.error('Error updating follow status:', error)
    }
  }

  const calculateAge = (birthDate?: string) => {
    if (!birthDate) return 'Unknown age'
    const age = Math.floor((Date.now() - new Date(birthDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
    return `${age} year${age !== 1 ? 's' : ''} old`
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    )
  }

  if (error || !profile) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <Users className="h-24 w-24 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-3xl font-bold mb-4">Profile Not Found</h1>
          <p className="text-muted-foreground mb-6">{error}</p>
          <Button asChild>
            <Link href="/social">Back to Social</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Profile Header */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="relative">
              <Avatar className="h-32 w-32">
                <AvatarImage src={profile.avatar} alt={profile.name} />
                <AvatarFallback className="text-2xl">
                  {profile.name?.charAt(0) || profile.email.charAt(0)}
                </AvatarFallback>
              </Avatar>
              {profile.isAdmin && (
                <Crown className="absolute -top-2 -right-2 h-6 w-6 text-yellow-500" />
              )}
            </div>
            
            <div className="flex-1 text-center md:text-left">
              <div className="flex items-center gap-2 justify-center md:justify-start mb-2">
                <h1 className="text-2xl font-bold">{profile.name || 'Pet Lover'}</h1>
                {profile.subscriptionTier === 'premium' && (
                  <Badge variant="secondary" className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                    <Crown className="h-3 w-3 mr-1" />
                    Premium
                  </Badge>
                )}
                {profile.isAdmin && (
                  <Badge variant="secondary">
                    <Shield className="h-3 w-3 mr-1" />
                    Admin
                  </Badge>
                )}
              </div>
              
              {profile.bio && (
                <p className="text-muted-foreground mb-3">{profile.bio}</p>
              )}
              
              <div className="flex items-center gap-4 text-sm text-muted-foreground justify-center md:justify-start">
                {profile.location && (
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {profile.location}
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  Joined {new Date(profile.joinedDate).getFullYear()}
                </div>
              </div>
              
              <div className="flex items-center gap-6 mt-4 justify-center md:justify-start">
                <div className="text-center">
                  <div className="font-semibold">{profile.petCount}</div>
                  <div className="text-sm text-muted-foreground">Pets</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold">{profile.storyCount}</div>
                  <div className="text-sm text-muted-foreground">Stories</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold">{profile.challengesWon}</div>
                  <div className="text-sm text-muted-foreground">Challenges Won</div>
                </div>
              </div>
            </div>
            
            {!profile.isOwnProfile && (
              <div className="flex flex-col gap-2">
                <Button onClick={handleFollow} variant={profile.isFollowing ? "outline" : "default"}>
                  <Heart className={`h-4 w-4 mr-2 ${profile.isFollowing ? 'fill-current' : ''}`} />
                  {profile.isFollowing ? 'Following' : 'Follow'}
                </Button>
                <Button variant="outline" size="sm">
                  <Camera className="h-4 w-4 mr-2" />
                  Message
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Navigation Tabs */}
      <div className="flex gap-4 mb-6">
        <Button
          variant={activeTab === 'pets' ? 'default' : 'outline'}
          onClick={() => setActiveTab('pets')}
        >
          <Heart className="h-4 w-4 mr-2" />
          Pets ({pets.length})
        </Button>
        <Button
          variant={activeTab === 'stories' ? 'default' : 'outline'}
          onClick={() => setActiveTab('stories')}
        >
          <Camera className="h-4 w-4 mr-2" />
          Stories ({stories.length})
        </Button>
        <Button
          variant={activeTab === 'achievements' ? 'default' : 'outline'}
          onClick={() => setActiveTab('achievements')}
        >
          <Trophy className="h-4 w-4 mr-2" />
          Achievements
        </Button>
      </div>

      {/* Content */}
      {activeTab === 'pets' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pets.map((pet) => (
            <Card key={pet.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className="aspect-square relative">
                {pet.photo ? (
                  <Image
                    src={pet.photo}
                    alt={pet.name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                    <Heart className="h-16 w-16 text-blue-400" />
                  </div>
                )}
              </div>
              <CardContent className="p-4">
                <h3 className="font-semibold text-lg">{pet.name}</h3>
                <p className="text-muted-foreground">
                  {pet.breed || pet.species} • {calculateAge(pet.age?.toString())}
                </p>
                {profile.isOwnProfile && (
                  <Button asChild size="sm" className="mt-2 w-full">
                    <Link href={`/pets/${pet.id}`}>View Details</Link>
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
          
          {pets.length === 0 && (
            <div className="col-span-full text-center py-12">
              <Heart className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No pets yet</h3>
              <p className="text-muted-foreground">
                {profile.isOwnProfile ? 'Add your first pet to get started!' : `${profile.name} hasn't added any pets yet.`}
              </p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'stories' && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {stories.map((story) => (
            <Card key={story.id} className="overflow-hidden cursor-pointer hover:scale-105 transition-transform">
              <div className="aspect-square relative">
                <Image
                  src={story.imageUrl}
                  alt={`${story.petName}'s story`}
                  fill
                  className="object-cover"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3">
                  <p className="text-white text-sm font-medium">{story.petName}</p>
                  <p className="text-white/80 text-xs">{story.viewCount} views</p>
                </div>
              </div>
            </Card>
          ))}
          
          {stories.length === 0 && (
            <div className="col-span-full text-center py-12">
              <Camera className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No stories yet</h3>
              <p className="text-muted-foreground">
                {profile.isOwnProfile ? 'Share your first pet story!' : `${profile.name} hasn't shared any stories yet.`}
              </p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'achievements' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardContent className="p-6 text-center">
              <Star className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Pet Parent Level</h3>
              <p className="text-2xl font-bold text-yellow-600">Expert</p>
              <p className="text-sm text-muted-foreground">Based on care consistency</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6 text-center">
              <Trophy className="h-12 w-12 text-blue-500 mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Challenges Won</h3>
              <p className="text-2xl font-bold text-blue-600">{profile.challengesWon}</p>
              <p className="text-sm text-muted-foreground">Photo competitions</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6 text-center">
              <Heart className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Care Streak</h3>
              <p className="text-2xl font-bold text-red-600">47</p>
              <p className="text-sm text-muted-foreground">Days of consistent care</p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}