'use client'

import { useState, useEffect } from 'react'
import { useAuthenticatedSession } from '@/hooks/useAuthenticatedSession'
import { Button } from '@/components/ui/button'
import { Heart, MessageCircle, Share2, Camera, Sparkles, Grid, List, Upload, Send, User } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

interface SocialPost {
  id: string
  petId: string
  petName: string
  petSpecies: string
  imageUrl: string
  caption: string
  aiAnalysis?: {
    mood: string
    activity: string
    healthNotes: string
    tags: string[]
  }
  likes: number
  comments: number
  createdAt: string
  isLiked: boolean
  user: {
    id: string
    name: string
    avatar?: string
  }
}

interface Comment {
  id: string
  content: string
  createdAt: string
  user: {
    id: string
    name: string
    avatar?: string
  }
}

export default function SocialGalleryPage() {
  const { session } = useAuthenticatedSession()
  const [posts, setPosts] = useState<SocialPost[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list')
  const [selectedFilter, setSelectedFilter] = useState<string>('all')
  const [selectedPost, setSelectedPost] = useState<string | null>(null)
  const [comments, setComments] = useState<{ [postId: string]: Comment[] }>({})
  const [newComment, setNewComment] = useState<{ [postId: string]: string }>({})
  const [loadingComments, setLoadingComments] = useState<{ [postId: string]: boolean }>({})

  useEffect(() => {
    if (session?.user?.id) {
      fetchPosts()
    }
  }, [session])

  const fetchPosts = async () => {
    try {
      const response = await fetch('/api/social/posts')
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

  const fetchComments = async (postId: string) => {
    if (comments[postId] || loadingComments[postId]) return

    setLoadingComments(prev => ({ ...prev, [postId]: true }))
    try {
      const response = await fetch(`/api/social/posts/${postId}/comments`)
      if (response.ok) {
        const data = await response.json()
        setComments(prev => ({ ...prev, [postId]: data }))
      }
    } catch (error) {
      console.error('Error fetching comments:', error)
    } finally {
      setLoadingComments(prev => ({ ...prev, [postId]: false }))
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

  const handleCommentSubmit = async (postId: string) => {
    const content = newComment[postId]?.trim()
    if (!content) return

    try {
      const response = await fetch(`/api/social/posts/${postId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ content })
      })

      if (response.ok) {
        const newCommentData = await response.json()
        setComments(prev => ({
          ...prev,
          [postId]: [...(prev[postId] || []), newCommentData]
        }))
        setNewComment(prev => ({ ...prev, [postId]: '' }))
        
        // Update comment count in posts
        setPosts(posts.map(post => 
          post.id === postId 
            ? { ...post, comments: post.comments + 1 }
            : post
        ))
      }
    } catch (error) {
      console.error('Error adding comment:', error)
    }
  }

  const handleShare = async (post: SocialPost) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${post.petName} - Pet Gallery`,
          text: post.caption,
          url: window.location.href
        })
      } catch {
        console.log('Share cancelled')
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(`Check out ${post.petName}: ${post.caption} - ${window.location.href}`)
      alert('Link copied to clipboard!')
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

  const filteredPosts = selectedFilter === 'all' 
    ? posts 
    : posts.filter(post => post.petSpecies === selectedFilter)

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground mt-4">Loading pet gallery...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Camera className="h-8 w-8 text-primary" />
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">Pet Social Gallery</h1>
          </div>
          <p className="text-muted-foreground mt-1 md:mt-2 text-sm md:text-base">
            Share your pet&apos;s moments with AI-powered insights
          </p>
        </div>
        <div className="flex items-center space-x-4">
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
          <Link href="/social/upload">
            <Button className="flex items-center space-x-2 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70">
              <Upload className="h-4 w-4" />
              <span>Share Photo</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-center">
        <select
          value={selectedFilter}
          onChange={(e) => setSelectedFilter(e.target.value)}
          className="px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring bg-background"
        >
          <option value="all">All Pets</option>
          <option value="dog">Dogs</option>
          <option value="cat">Cats</option>
          <option value="bird">Birds</option>
          <option value="fish">Fish</option>
          <option value="rabbit">Rabbits</option>
          <option value="hamster">Hamsters</option>
          <option value="reptile">Reptiles</option>
        </select>

        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="text-sm text-muted-foreground">AI-Enhanced Gallery</span>
        </div>
      </div>

      {/* Posts */}
      {filteredPosts.length > 0 ? (
        <div className={
          viewMode === 'grid' 
            ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            : "max-w-2xl mx-auto space-y-8"
        }>
          {filteredPosts.map((post) => (
            <div key={post.id} className={`card overflow-hidden ${viewMode === 'list' ? 'bg-card border border-border shadow-sm' : ''}`}>
              {/* Post Header - only in list view */}
              {viewMode === 'list' && (
                <div className="flex items-center justify-between p-4 pb-0">
                  <Link href={`/profile/${post.user.id}`} className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
                    <div className="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center">
                      {post.user.avatar ? (
                        <Image
                          src={post.user.avatar}
                          alt={post.user.name}
                          width={32}
                          height={32}
                          className="object-cover w-full h-full"
                        />
                      ) : (
                        <User className="h-4 w-4 text-primary" />
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-foreground">{post.user.name}</p>
                      <p className="text-xs text-muted-foreground">{post.petName} • {post.petSpecies}</p>
                    </div>
                  </Link>
                  <span className="text-xs text-muted-foreground">
                    {new Date(post.createdAt).toLocaleDateString()}
                  </span>
                </div>
              )}

              {/* Image */}
              <div className={`relative ${viewMode === 'list' ? 'aspect-square' : 'aspect-square'}`}>
                <Image
                  src={post.imageUrl || '/images/default-pet.jpg'}
                  alt={`${post.petName} photo`}
                  fill
                  className="object-cover hover:scale-105 transition-transform duration-300"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = '/images/default-pet.jpg'
                  }}
                />
                {post.aiAnalysis?.mood && (
                  <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm rounded-full px-2 py-1 text-sm shadow-md">
                    {getMoodEmoji(post.aiAnalysis.mood)}
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-4">
                {/* Grid view header */}
                {viewMode === 'grid' && (
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-foreground">{post.petName}</h3>
                      <p className="text-sm text-muted-foreground capitalize">{post.petSpecies}</p>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(post.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={() => handleLike(post.id)}
                      className={`flex items-center space-x-2 text-sm transition-all duration-200 ${
                        post.isLiked 
                          ? 'text-red-600 scale-110' 
                          : 'text-muted-foreground hover:text-red-600 hover:scale-105'
                      }`}
                    >
                      <Heart className={`h-5 w-5 ${post.isLiked ? 'fill-current' : ''}`} />
                      <span className="font-medium">{post.likes}</span>
                    </button>
                    <button
                      onClick={() => {
                        setSelectedPost(selectedPost === post.id ? null : post.id)
                        if (selectedPost !== post.id) {
                          fetchComments(post.id)
                        }
                      }}
                      className="flex items-center space-x-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <MessageCircle className="h-5 w-5" />
                      <span className="font-medium">{post.comments}</span>
                    </button>
                  </div>
                  <button
                    onClick={() => handleShare(post)}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Share2 className="h-5 w-5" />
                  </button>
                </div>

                {/* Likes count */}
                {post.likes > 0 && (
                  <p className="text-sm font-medium text-foreground mb-2">
                    {post.likes} {post.likes === 1 ? 'like' : 'likes'}
                  </p>
                )}

                {/* Caption */}
                <div className="mb-3">
                  <span className="font-semibold text-foreground text-sm">{post.user.name} </span>
                  <span className="text-foreground text-sm">{post.caption}</span>
                </div>

                {/* AI Analysis */}
                {post.aiAnalysis && (
                  <div className="mb-4 p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className="h-4 w-4 text-purple-600" />
                      <span className="text-sm font-medium text-purple-800">AI Insights</span>
                    </div>
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

                {/* Comments Section */}
                {selectedPost === post.id && (
                  <div className="border-t border-border pt-3 mt-3">
                    {/* Comments List */}
                    <div className="space-y-3 mb-4">
                      {loadingComments[post.id] ? (
                        <div className="text-center py-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mx-auto"></div>
                        </div>
                      ) : comments[post.id]?.length > 0 ? (
                        comments[post.id].map((comment) => (
                          <div key={comment.id} className="flex space-x-2">
                            <div className="w-6 h-6 rounded-full overflow-hidden bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center flex-shrink-0">
                              {comment.user.avatar ? (
                                <Image
                                  src={comment.user.avatar}
                                  alt={comment.user.name}
                                  width={24}
                                  height={24}
                                  className="object-cover w-full h-full"
                                />
                              ) : (
                                <User className="h-3 w-3 text-primary" />
                              )}
                            </div>
                            <div className="flex-1">
                              <p className="text-sm">
                                <span className="font-semibold text-foreground">{comment.user.name} </span>
                                <span className="text-foreground">{comment.content}</span>
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {new Date(comment.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground text-center py-2">No comments yet</p>
                      )}
                    </div>

                    {/* Add Comment */}
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 rounded-full overflow-hidden bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center flex-shrink-0">
                        {false ? (
                          <Image
                            src=""
                            alt={session?.user?.name || 'You'}
                            width={24}
                            height={24}
                            className="object-cover w-full h-full"
                          />
                        ) : (
                          <User className="h-3 w-3 text-primary" />
                        )}
                      </div>
                      <input
                        type="text"
                        placeholder="Add a comment..."
                        value={newComment[post.id] || ''}
                        onChange={(e) => setNewComment(prev => ({ ...prev, [post.id]: e.target.value }))}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            handleCommentSubmit(post.id)
                          }
                        }}
                        className="flex-1 text-sm border-none outline-none bg-transparent placeholder-muted-foreground"
                      />
                      <button
                        onClick={() => handleCommentSubmit(post.id)}
                        disabled={!newComment[post.id]?.trim()}
                        className="text-primary hover:text-primary/80 disabled:text-muted-foreground transition-colors"
                      >
                        <Send className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Camera className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">No photos yet</h3>
          <p className="text-muted-foreground mb-6">
            Share your first pet photo to start building your gallery with AI insights.
          </p>
          <Link href="/social/upload">
            <Button className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70">
              <Upload className="h-4 w-4 mr-2" />
              Share First Photo
            </Button>
          </Link>
        </div>
      )}

      {/* AI Features Info */}
      <div className="card p-6 bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <div className="flex items-center gap-3 mb-4">
          <Sparkles className="h-6 w-6 text-purple-600" />
          <h3 className="text-lg font-semibold text-purple-900">AI-Powered Features</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="flex items-start space-x-2">
            <div className="w-2 h-2 bg-purple-600 rounded-full mt-2 flex-shrink-0"></div>
            <div>
              <p className="font-medium text-purple-800">Mood Detection</p>
              <p className="text-purple-700">AI analyzes your pet&apos;s facial expressions and body language</p>
            </div>
          </div>
          <div className="flex items-start space-x-2">
            <div className="w-2 h-2 bg-purple-600 rounded-full mt-2 flex-shrink-0"></div>
            <div>
              <p className="font-medium text-purple-800">Activity Recognition</p>
              <p className="text-purple-700">Automatically identifies what your pet is doing</p>
            </div>
          </div>
          <div className="flex items-start space-x-2">
            <div className="w-2 h-2 bg-purple-600 rounded-full mt-2 flex-shrink-0"></div>
            <div>
              <p className="font-medium text-purple-800">Health Insights</p>
              <p className="text-purple-700">Provides general wellness observations</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}