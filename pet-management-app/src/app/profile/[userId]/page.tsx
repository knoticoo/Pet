'use client'

import { useState, useEffect } from 'react'
import { useAuthenticatedSession } from '@/hooks/useAuthenticatedSession'
import { useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Heart, MessageCircle, Share2, Camera, MapPin, Calendar, UserPlus, UserMinus, Settings, Grid, List, PawPrint } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { AuthGuard } from '@/components/AuthGuard'

interface UserProfile {
  id: string
  name: string
  email: string
  avatar?: string
  bio?: string
  location?: string
  createdAt: string
  isOwnProfile: boolean
  isFollowing: boolean
  stats: {
    postsCount: number
    petsCount: number
    followersCount: number
    followingCount: number
  }
}

interface Pet {
  id: string
  name: string
  species: string
  breed?: string
  photo?: string
  age?: number
}

interface SocialPost {
  id: string
  petId: string
  petName: string
  petSpecies: string
  imageUrl: string
  caption: string
  likes: number
  comments: number
  createdAt: string
  isLiked: boolean
  aiAnalysis?: {
    mood: string
    activity: string
    healthNotes: string
    tags: string[]
  }
}

export default function UserProfilePage() {
  const { session } = useAuthenticatedSession()
  const params = useParams()
  const userId = params.userId as string

  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [pets, setPets] = useState<Pet[]>([])
  const [posts, setPosts] = useState<SocialPost[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [activeTab, setActiveTab] = useState<'posts' | 'pets'>('posts')

  useEffect(() => {
    if (session?.user?.id) {
      fetchProfile()
      fetchUserPets()
      fetchUserPosts()
    }
  }, [session, userId])

  const fetchProfile = async () => {
    try {
      const response = await fetch(`/api/users/${userId}/profile`)
      if (response.ok) {
        const data = await response.json()
        setProfile(data)
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
    }
  }

  const fetchUserPets = async () => {
    try {
      const response = await fetch(`/api/users/${userId}/pets`)
      if (response.ok) {
        const data = await response.json()
        setPets(data)
      }
    } catch (error) {
      console.error('Error fetching pets:', error)
    }
  }

  const fetchUserPosts = async () => {
    try {
      const response = await fetch(`/api/users/${userId}/posts`)
      if (response.ok) {
        const data = await response.json()
        setPosts(data)
      }
    } catch (error) {
      console.error('Error fetching posts:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFollow = async () => {
    if (!profile) return

    try {
      const response = await fetch(`/api/users/${userId}/follow`, {
        method: 'POST'
      })

      if (response.ok) {
        const data = await response.json()
        setProfile({
          ...profile,
          isFollowing: data.isFollowing,
          stats: {
            ...profile.stats,
            followersCount: data.isFollowing 
              ? profile.stats.followersCount + 1 
              : profile.stats.followersCount - 1
          }
        })
      }
    } catch (error) {
      console.error('Error toggling follow:', error)
    }
  }

  const handleLike = async (postId: string) => {
    try {
      const response = await fetch(`/api/social/posts/${postId}/like`, {
        method: 'POST'
      })
      if (response.ok) {
        setPosts(posts.map(post => 
          post.id === postId 
            ? { ...post, isLiked: !post.isLiked, likes: post.isLiked ? post.likes - 1 : post.likes + 1 }
            : post
        ))
      }
    } catch (error) {
      console.error('Error liking post:', error)
    }
  }

  const getMoodEmoji = (mood: string) => {
    switch (mood?.toLowerCase()) {
      case 'happy': return '😊'
      case 'playful': return '😄'
      case 'calm': return '😌'
      case 'excited': return '🤩'
      case 'sleepy': return '😴'
      case 'curious': return '🤔'
      default: return '🐾'
    }
  }

  const getActivityColor = (activity: string) => {
    switch (activity?.toLowerCase()) {
      case 'playing': return 'bg-green-100 text-green-800'
      case 'sleeping': return 'bg-blue-100 text-blue-800'
      case 'eating': return 'bg-orange-100 text-orange-800'
      case 'exercising': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const calculateAge = (birthDate: string) => {
    const today = new Date()
    const birth = new Date(birthDate)
    const age = today.getFullYear() - birth.getFullYear()
    const monthDiff = today.getMonth() - birth.getMonth()
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      return age - 1
    }
    return age
  }

  if (loading) {
    return (
      <AuthGuard>
        <div className="space-y-8">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground mt-4">Loading profile...</p>
          </div>
        </div>
      </AuthGuard>
    )
  }

  if (!profile) {
    return (
      <AuthGuard>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-foreground mb-4">Profile not found</h2>
          <p className="text-muted-foreground">The user profile you're looking for doesn't exist.</p>
        </div>
      </AuthGuard>
    )
  }

  return (
    <AuthGuard>
      <div className="space-y-8">
        {/* Profile Header */}
        <div className="card p-8">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            {/* Avatar */}
            <div className="relative">
              <div className="w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center">
                {profile.avatar ? (
                  <Image
                    src={profile.avatar}
                    alt={profile.name || 'User'}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <span className="text-3xl md:text-4xl font-bold text-primary">
                    {profile.name?.charAt(0).toUpperCase() || 'U'}
                  </span>
                )}
              </div>
            </div>

            {/* Profile Info */}
            <div className="flex-1">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
                    {profile.name || 'Pet Lover'}
                  </h1>
                  {profile.bio && (
                    <p className="text-muted-foreground mb-3">{profile.bio}</p>
                  )}
                  <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                    {profile.location && (
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        <span>{profile.location}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>Joined {new Date(profile.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-3 mt-4 md:mt-0">
                  {profile.isOwnProfile ? (
                    <Link href="/settings">
                      <Button variant="outline">
                        <Settings className="h-4 w-4 mr-2" />
                        Edit Profile
                      </Button>
                    </Link>
                  ) : (
                    <Button onClick={handleFollow} variant={profile.isFollowing ? "outline" : "default"}>
                      {profile.isFollowing ? (
                        <>
                          <UserMinus className="h-4 w-4 mr-2" />
                          Unfollow
                        </>
                      ) : (
                        <>
                          <UserPlus className="h-4 w-4 mr-2" />
                          Follow
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-4 gap-4 pt-4 border-t border-border">
                <div className="text-center">
                  <p className="text-2xl font-bold text-foreground">{profile.stats.postsCount}</p>
                  <p className="text-sm text-muted-foreground">Posts</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-foreground">{profile.stats.petsCount}</p>
                  <p className="text-sm text-muted-foreground">Pets</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-foreground">{profile.stats.followersCount}</p>
                  <p className="text-sm text-muted-foreground">Followers</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-foreground">{profile.stats.followingCount}</p>
                  <p className="text-sm text-muted-foreground">Following</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1">
            <Button
              variant={activeTab === 'posts' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('posts')}
              className="flex items-center gap-2"
            >
              <Camera className="h-4 w-4" />
              Posts
            </Button>
            <Button
              variant={activeTab === 'pets' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('pets')}
              className="flex items-center gap-2"
            >
              <PawPrint className="h-4 w-4" />
              Pets
            </Button>
          </div>

          {activeTab === 'posts' && (
            <div className="flex items-center space-x-2">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        {/* Content */}
        {activeTab === 'posts' ? (
          posts.length > 0 ? (
            <div className={
              viewMode === 'grid' 
                ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                : "space-y-6"
            }>
              {posts.map((post) => (
                <div key={post.id} className={`card overflow-hidden ${viewMode === 'list' ? 'flex' : ''}`}>
                  {/* Image */}
                  <div className={`relative ${viewMode === 'list' ? 'w-48 h-48 flex-shrink-0' : 'aspect-square'}`}>
                    <Image
                      src={post.imageUrl}
                      alt={`${post.petName} photo`}
                      fill
                      className="object-cover"
                    />
                    {post.aiAnalysis?.mood && (
                      <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm rounded-full px-2 py-1 text-sm">
                        {getMoodEmoji(post.aiAnalysis.mood)}
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-4 flex-1">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-foreground">{post.petName}</h3>
                        <p className="text-sm text-muted-foreground capitalize">{post.petSpecies}</p>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(post.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <p className="text-sm text-foreground mb-3">{post.caption}</p>

                    {/* AI Analysis */}
                    {post.aiAnalysis && (
                      <div className="mb-4 p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
                        <div className="space-y-2 text-xs">
                          {post.aiAnalysis.activity && (
                            <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getActivityColor(post.aiAnalysis.activity)}`}>
                              {post.aiAnalysis.activity}
                            </span>
                          )}
                          {post.aiAnalysis.healthNotes && (
                            <p className="text-purple-700">{post.aiAnalysis.healthNotes}</p>
                          )}
                          {post.aiAnalysis.tags && post.aiAnalysis.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {post.aiAnalysis.tags.map((tag, index) => (
                                <span key={index} className="inline-block px-2 py-1 bg-purple-100 text-purple-600 rounded-full text-xs">
                                  #{tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <button
                          onClick={() => handleLike(post.id)}
                          className={`flex items-center space-x-2 text-sm transition-colors ${
                            post.isLiked ? 'text-red-600' : 'text-muted-foreground hover:text-red-600'
                          }`}
                        >
                          <Heart className={`h-4 w-4 ${post.isLiked ? 'fill-current' : ''}`} />
                          <span>{post.likes}</span>
                        </button>
                        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                          <MessageCircle className="h-4 w-4" />
                          <span>{post.comments}</span>
                        </div>
                      </div>
                      <button className="text-muted-foreground hover:text-foreground transition-colors">
                        <Share2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Camera className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No posts yet</h3>
              <p className="text-muted-foreground">
                {profile.isOwnProfile ? 'Share your first pet story!' : `${profile.name} hasn't shared any stories yet.`}
              </p>
            </div>
          )
        ) : (
          /* Pets Tab */
          pets.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pets.map((pet) => (
                <div key={pet.id} className="card p-6">
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="w-16 h-16 rounded-full overflow-hidden bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center">
                      {pet.photo ? (
                        <Image
                          src={pet.photo}
                          alt={pet.name}
                          width={64}
                          height={64}
                          className="object-cover w-full h-full"
                        />
                      ) : (
                        <PawPrint className="h-8 w-8 text-primary" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">{pet.name}</h3>
                      <p className="text-sm text-muted-foreground capitalize">
                        {pet.species} {pet.breed && `• ${pet.breed}`}
                      </p>
                      {pet.age && (
                        <p className="text-xs text-muted-foreground">{pet.age} years old</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <PawPrint className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No pets added</h3>
              <p className="text-muted-foreground">
                {profile.isOwnProfile ? 'Add your first pet to get started!' : `${profile.name} hasn't added any pets yet.`}
              </p>
            </div>
          )
        )}
      </div>
    </AuthGuard>
  )
}