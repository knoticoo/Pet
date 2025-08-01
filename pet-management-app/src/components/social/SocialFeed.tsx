'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  Heart, 
  MessageCircle, 
  Share, 
  Plus, 
  Camera,
  Users,
  Calendar
} from 'lucide-react'
import { t } from '@/lib/translations'

interface SocialPost {
  id: string
  content: string
  photos?: string
  likes: number
  comments: number
  createdAt: string
  user: {
    id: string
    name: string
    email: string
  }
  pet?: {
    id: string
    name: string
    species: string
    breed: string
  }
}

export function SocialFeed() {
  const { data: session } = useSession()
  const [posts, setPosts] = useState<SocialPost[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchPosts()
  }, [])

  const fetchPosts = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/social/posts')
      if (response.ok) {
        const data = await response.json()
        setPosts(data.posts)
      } else {
        setError('Failed to fetch posts')
      }
    } catch (error) {
      setError('An error occurred while fetching posts')
    } finally {
      setLoading(false)
    }
  }

  const createPost = async (content: string, photos?: string[]) => {
    try {
      const response = await fetch('/api/social/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, photos })
      })

      if (response.ok) {
        const newPost = await response.json()
        setPosts(prev => [newPost, ...prev])
      } else {
        setError('Failed to create post')
      }
    } catch (error) {
      setError('An error occurred while creating post')
    }
  }

  const likePost = async (postId: string) => {
    // In a real app, you'd have a separate API for likes
    setPosts(prev => prev.map(post => 
      post.id === postId 
        ? { ...post, likes: post.likes + 1 }
        : post
    ))
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="p-4 animate-pulse">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-32"></div>
                <div className="h-3 bg-gray-200 rounded w-24"></div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded w-full"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </div>
          </Card>
        ))}
      </div>
    )
  }

  if (!session) {
    return (
      <div className="text-center py-8">
        <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium mb-2">{t('social.signInRequired')}</h3>
        <p className="text-muted-foreground mb-4">{t('social.signInToViewFeed')}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      {/* Create Post */}
      <Card className="p-4">
        <div className="flex items-start space-x-3">
          <Avatar>
            <AvatarImage src={session.user?.image || ''} />
            <AvatarFallback>{session.user?.name?.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <textarea
              placeholder={t('social.whatsOnYourMind')}
              className="w-full p-3 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary"
              rows={3}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  const content = e.currentTarget.value.trim()
                  if (content) {
                    createPost(content)
                    e.currentTarget.value = ''
                  }
                }
              }}
            />
            <div className="flex items-center justify-between mt-3">
              <div className="flex items-center space-x-2">
                <Button size="sm" variant="outline">
                  <Camera className="w-4 h-4 mr-2" />
                  {t('social.addPhoto')}
                </Button>
              </div>
              <Button size="sm">
                <Plus className="w-4 h-4 mr-2" />
                {t('social.post')}
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Posts Feed */}
      <div className="space-y-4">
        {posts.map((post) => (
          <Card key={post.id} className="p-4">
            <div className="flex items-start space-x-3 mb-3">
              <Avatar>
                <AvatarImage src="" />
                <AvatarFallback>{post.user.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <span className="font-medium">{post.user.name}</span>
                  {post.pet && (
                    <span className="text-sm text-muted-foreground">
                      with {post.pet.name}
                    </span>
                  )}
                </div>
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>

            <div className="mb-3">
              <p className="text-foreground">{post.content}</p>
              {post.photos && (
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {JSON.parse(post.photos).map((photo: string, index: number) => (
                    <img
                      key={index}
                      src={photo}
                      alt="Post photo"
                      className="w-full h-32 object-cover rounded-lg"
                    />
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-3 border-t">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => likePost(post.id)}
                  className="flex items-center space-x-1 text-muted-foreground hover:text-primary transition-colors"
                >
                  <Heart className="w-4 h-4" />
                  <span className="text-sm">{post.likes}</span>
                </button>
                <button className="flex items-center space-x-1 text-muted-foreground hover:text-primary transition-colors">
                  <MessageCircle className="w-4 h-4" />
                  <span className="text-sm">{post.comments}</span>
                </button>
              </div>
              <button className="text-muted-foreground hover:text-primary transition-colors">
                <Share className="w-4 h-4" />
              </button>
            </div>
          </Card>
        ))}

        {posts.length === 0 && (
          <div className="text-center py-8">
            <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">{t('social.noPosts')}</h3>
            <p className="text-muted-foreground">{t('social.beFirstToPost')}</p>
          </div>
        )}
      </div>
    </div>
  )
}