'use client'

import { useState, useEffect } from 'react'
import { Camera, Upload, Sparkles, X, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AuthGuard } from '@/components/AuthGuard'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Pet {
  id: string
  name: string
  species: string
  breed?: string
}

export default function UploadPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [pets, setPets] = useState<Pet[]>([])
  const [selectedPet, setSelectedPet] = useState<string>('')
  const [caption, setCaption] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string>('')
  const [uploading, setUploading] = useState(false)
  const [aiAnalyzing, setAiAnalyzing] = useState(false)

  useEffect(() => {
    if (session?.user?.id) {
      fetchPets()
    }
  }, [session])

  const fetchPets = async () => {
    try {
      const response = await fetch('/api/pets')
      if (response.ok) {
        const data = await response.json()
        setPets(data)
        if (data.length > 0) {
          setSelectedPet(data[0].id)
        }
      }
    } catch (error) {
      console.error('Error fetching pets:', error)
    }
  }

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setImageFile(file)
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
    }
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    
    if (!imageFile || !selectedPet) {
      alert('Please select an image and a pet')
      return
    }

    setUploading(true)
    setAiAnalyzing(true)

    try {
      // Create FormData for file upload
      const formData = new FormData()
      formData.append('image', imageFile)
      formData.append('petId', selectedPet)
      formData.append('caption', caption)

      const response = await fetch('/api/social/posts', {
        method: 'POST',
        body: formData
      })

      if (response.ok) {
        const post = await response.json()
        router.push('/social')
      } else {
        const error = await response.json()
        alert(`Upload failed: ${error.error}`)
      }
    } catch (error) {
      console.error('Error uploading post:', error)
      alert('Upload failed. Please try again.')
    } finally {
      setUploading(false)
      setAiAnalyzing(false)
    }
  }

  const removeImage = () => {
    setImageFile(null)
    setPreviewUrl('')
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
    }
  }

  return (
    <AuthGuard>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">Share Pet Photo</h1>
            <p className="text-muted-foreground mt-1 md:mt-2 text-sm md:text-base">
              Upload a photo of your pet with AI-powered insights
            </p>
          </div>
          <Link href="/social">
            <Button variant="outline">
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
          </Link>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Pet Selection */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">Select Pet</h2>
            {pets.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {pets.map((pet) => (
                  <button
                    key={pet.id}
                    type="button"
                    onClick={() => setSelectedPet(pet.id)}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      selectedPet === pet.id
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <div className="text-left">
                      <h3 className="font-medium text-foreground">{pet.name}</h3>
                      <p className="text-sm text-muted-foreground capitalize">
                        {pet.species} {pet.breed && `• ${pet.breed}`}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">No pets found</p>
                <Link href="/pets/new">
                  <Button>
                    <Camera className="h-4 w-4 mr-2" />
                    Add Pet First
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Image Upload */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">Upload Photo</h2>
            
            {!previewUrl ? (
              <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">
                  Click to upload or drag and drop
                </p>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                  id="image-upload"
                />
                <label htmlFor="image-upload">
                  <Button asChild>
                    <span>
                      <Camera className="h-4 w-4 mr-2" />
                      Choose Photo
                    </span>
                  </Button>
                </label>
              </div>
            ) : (
              <div className="relative">
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="w-full max-w-md mx-auto rounded-lg"
                />
                <button
                  type="button"
                  onClick={removeImage}
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>

          {/* Caption */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">Add Caption</h2>
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Share what your pet is doing..."
              className="w-full p-3 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
              rows={3}
            />
          </div>

          {/* AI Features Info */}
          <div className="card p-6 bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
            <div className="flex items-center gap-3 mb-4">
              <Sparkles className="h-6 w-6 text-purple-600" />
              <h3 className="text-lg font-semibold text-purple-900">AI-Powered Analysis</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-purple-600 rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <p className="font-medium text-purple-800">Mood Detection</p>
                  <p className="text-purple-700">AI will analyze your pet's mood from the photo</p>
                </div>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-purple-600 rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <p className="font-medium text-purple-800">Activity Recognition</p>
                  <p className="text-purple-700">Automatically identify what your pet is doing</p>
                </div>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-purple-600 rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <p className="font-medium text-purple-800">Health Insights</p>
                  <p className="text-purple-700">Get general wellness observations</p>
                </div>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-4">
            <Link href="/social">
              <Button variant="outline">
                Cancel
              </Button>
            </Link>
            <Button
              type="submit"
              disabled={!imageFile || !selectedPet || uploading}
              className="flex items-center space-x-2"
            >
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Uploading...</span>
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  <span>Share Photo</span>
                </>
              )}
            </Button>
          </div>

          {aiAnalyzing && (
            <div className="text-center py-4">
              <div className="flex items-center justify-center space-x-2 text-purple-600">
                <Sparkles className="h-4 w-4 animate-pulse" />
                <span>AI analyzing your photo...</span>
              </div>
            </div>
          )}
        </form>
      </div>
    </AuthGuard>
  )
}