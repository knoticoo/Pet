'use client'

import { useState, useEffect } from 'react'
import { Camera, Upload, X, Download, Share2, Grid, List } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'

interface PetPhoto {
  id: string
  photoUrl: string
  title: string
  description?: string
  category: string
  date: string
  album?: {
    name: string
  }
}

interface PetPhotoGalleryProps {
  petId: string
  petName: string
}

export function PetPhotoGallery({ petId, petName }: PetPhotoGalleryProps) {
  const [photos, setPhotos] = useState<PetPhoto[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [selectedPhoto, setSelectedPhoto] = useState<PetPhoto | null>(null)
  const [showUploadDialog, setShowUploadDialog] = useState(false)
  const [uploadForm, setUploadForm] = useState({
    title: '',
    description: '',
    category: 'general'
  })

  useEffect(() => {
    fetchPhotos()
  }, [petId])

  const fetchPhotos = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/pets/${petId}/photos`)
      if (response.ok) {
        const data = await response.json()
        setPhotos(data.photos || [])
      }
    } catch (error) {
      console.error('Error fetching photos:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpload = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!uploadForm.title.trim()) return

    const formData = new FormData()
    const fileInput = document.getElementById('photo-file') as HTMLInputElement
    const file = fileInput?.files?.[0]

    if (!file) {
      alert('Please select a photo')
      return
    }

    formData.append('photo', file)
    formData.append('title', uploadForm.title)
    formData.append('description', uploadForm.description)
    formData.append('category', uploadForm.category)

    try {
      setUploading(true)
      const response = await fetch(`/api/pets/${petId}/photos`, {
        method: 'POST',
        body: formData
      })

      if (response.ok) {
        const newPhoto = await response.json()
        setPhotos(prev => [newPhoto, ...prev])
        setShowUploadDialog(false)
        setUploadForm({ title: '', description: '', category: 'general' })
        if (fileInput) fileInput.value = ''
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to upload photo')
      }
    } catch (error) {
      console.error('Error uploading photo:', error)
      alert('Failed to upload photo')
    } finally {
      setUploading(false)
    }
  }

  const handleDeletePhoto = async (photoId: string) => {
    if (!confirm('Are you sure you want to delete this photo?')) return

    try {
      const response = await fetch(`/api/pets/${petId}/photos?photoId=${photoId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setPhotos(prev => prev.filter(photo => photo.id !== photoId))
      } else {
        alert('Failed to delete photo')
      }
    } catch (error) {
      console.error('Error deleting photo:', error)
      alert('Failed to delete photo')
    }
  }

  const handleDownload = (photo: PetPhoto) => {
    const link = document.createElement('a')
    link.href = photo.photoUrl
    link.download = `${petName}-${photo.title}.jpg`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleShare = (photo: PetPhoto) => {
    if (navigator.share) {
      navigator.share({
        title: `${petName} - ${photo.title}`,
        text: photo.description || `Check out ${petName}!`,
        url: photo.photoUrl
      })
    } else {
      navigator.clipboard.writeText(photo.photoUrl)
      alert('Photo URL copied to clipboard!')
    }
  }

  if (loading) {
    return (
      <div className="card p-6">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground mt-4">Loading photos...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Camera className="h-6 w-6 text-primary" />
          <h3 className="text-xl font-semibold text-foreground">Photo Gallery</h3>
          <span className="text-sm text-muted-foreground">({photos.length} photos)</span>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="flex items-center space-x-1">
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
          
          <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
            <DialogTrigger asChild>
              <Button size="sm" className="flex items-center gap-2">
                <Upload className="h-4 w-4" />
                Add Photo
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Upload Photo</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleUpload} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Photo</label>
                  <input
                    id="photo-file"
                    type="file"
                    accept="image/*"
                    required
                    className="w-full p-2 border rounded-md"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Title</label>
                  <input
                    type="text"
                    value={uploadForm.title}
                    onChange={(e) => setUploadForm(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Photo title"
                    className="w-full p-2 border rounded-md"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Description</label>
                  <textarea
                    value={uploadForm.description}
                    onChange={(e) => setUploadForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Optional description"
                    className="w-full p-2 border rounded-md"
                    rows={3}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Category</label>
                  <select
                    value={uploadForm.category}
                    onChange={(e) => setUploadForm(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="general">General</option>
                    <option value="portrait">Portrait</option>
                    <option value="action">Action</option>
                    <option value="sleeping">Sleeping</option>
                    <option value="playing">Playing</option>
                    <option value="training">Training</option>
                  </select>
                </div>
                
                <div className="flex gap-2">
                  <Button type="submit" disabled={uploading} className="flex-1">
                    {uploading ? 'Uploading...' : 'Upload Photo'}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setShowUploadDialog(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Photos Grid/List */}
      {photos.length > 0 ? (
        <div className={
          viewMode === 'grid' 
            ? "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
            : "space-y-4"
        }>
          {photos.map((photo) => (
            <div key={photo.id} className={`card overflow-hidden ${viewMode === 'list' ? 'flex' : ''}`}>
              {/* Photo */}
              <div className={`relative ${viewMode === 'list' ? 'w-32 h-32 flex-shrink-0' : 'aspect-square'}`}>
                <img
                  src={photo.photoUrl}
                  alt={photo.title}
                  className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={() => setSelectedPhoto(photo)}
                />
                
                {/* Quick actions overlay */}
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 hover:opacity-100 transition-opacity">
                  <Button
                    size="sm"
                    variant="secondary"
                    className="h-6 w-6 p-0"
                    onClick={() => handleDownload(photo)}
                  >
                    <Download className="h-3 w-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    className="h-6 w-6 p-0"
                    onClick={() => handleShare(photo)}
                  >
                    <Share2 className="h-3 w-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    className="h-6 w-6 p-0"
                    onClick={() => handleDeletePhoto(photo.id)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              {/* Photo info */}
              <div className="p-3 flex-1">
                <h4 className="font-medium text-foreground text-sm">{photo.title}</h4>
                {photo.description && (
                  <p className="text-xs text-muted-foreground mt-1">{photo.description}</p>
                )}
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-muted-foreground capitalize">{photo.category}</span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(photo.date).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card p-8 text-center">
          <Camera className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h4 className="text-lg font-semibold text-foreground mb-2">No photos yet</h4>
          <p className="text-muted-foreground mb-4">
            Start building {petName}&apos;s photo collection by uploading the first photo!
          </p>
          <Button onClick={() => setShowUploadDialog(true)}>
            <Upload className="h-4 w-4 mr-2" />
            Upload First Photo
          </Button>
        </div>
      )}

      {/* Photo Modal */}
      {selectedPhoto && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="relative max-w-4xl max-h-full">
            <Button
              variant="ghost"
              size="sm"
              className="absolute top-4 right-4 text-white hover:bg-white/20"
              onClick={() => setSelectedPhoto(null)}
            >
              <X className="h-6 w-6" />
            </Button>
            <img
              src={selectedPhoto.photoUrl}
              alt={selectedPhoto.title}
              className="max-w-full max-h-full object-contain rounded-lg"
            />
            <div className="absolute bottom-4 left-4 right-4 bg-black/50 text-white p-4 rounded-lg">
              <h3 className="font-semibold">{selectedPhoto.title}</h3>
              {selectedPhoto.description && (
                <p className="text-sm mt-1">{selectedPhoto.description}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}