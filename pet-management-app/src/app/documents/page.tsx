'use client'

import { useState, useEffect, useRef } from 'react'
import { FileText, Upload, Download, Trash2, Eye, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AuthGuard } from '@/components/AuthGuard'
import { useSession } from 'next-auth/react'
import { t } from '@/lib/translations'

interface Document {
  id: string
  name: string
  type: string
  size: string
  uploadDate: string
  petId?: string
  petName?: string
  url?: string
}

export default function DocumentsPage() {
  const { data: session } = useSession()
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [selectedPet, setSelectedPet] = useState<string>('all')
  const [pets, setPets] = useState<any[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (session?.user?.id) {
      fetchDocuments()
      fetchPets()
    }
  }, [session])

  const fetchDocuments = async () => {
    try {
      const response = await fetch('/api/documents')
      if (response.ok) {
        const data = await response.json()
        setDocuments(data)
      }
    } catch (error) {
      console.error('Error fetching documents:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchPets = async () => {
    try {
      const response = await fetch('/api/pets')
      if (response.ok) {
        const data = await response.json()
        setPets(data)
      }
    } catch (error) {
      console.error('Error fetching pets:', error)
    }
  }

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', files[0])
      if (selectedPet !== 'all') {
        formData.append('petId', selectedPet)
      }

      const response = await fetch('/api/documents/upload', {
        method: 'POST',
        body: formData,
      })

      if (response.ok) {
        const newDocument = await response.json()
        setDocuments(prev => [newDocument, ...prev])
        alert('Документ успешно загружен!')
      } else {
        alert('Ошибка при загрузке документа')
      }
    } catch (error) {
      console.error('Error uploading document:', error)
      alert('Ошибка при загрузке документа')
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleUploadClick = () => {
    fileInputRef.current?.click()
  }

  const filteredDocuments = selectedPet === 'all' 
    ? documents 
    : documents.filter(doc => doc.petId === selectedPet)

  const getFileIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'pdf':
        return '📄'
      case 'jpg':
      case 'jpeg':
      case 'png':
        return '🖼️'
      case 'doc':
      case 'docx':
        return '📝'
      default:
        return '📁'
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('ru-RU', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date)
  }

  const handleDelete = async (documentId: string) => {
    if (confirm('Вы уверены, что хотите удалить этот документ?')) {
      try {
        const response = await fetch(`/api/documents/${documentId}`, {
          method: 'DELETE'
        })
        if (response.ok) {
          setDocuments(documents.filter(doc => doc.id !== documentId))
        }
      } catch (error) {
        console.error('Error deleting document:', error)
      }
    }
  }

  if (loading) {
    return (
      <AuthGuard>
        <div className="space-y-8">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground mt-4">{t('common.loading')}</p>
          </div>
        </div>
      </AuthGuard>
    )
  }

  return (
    <AuthGuard>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">{t('documents.title')}</h1>
            <p className="text-muted-foreground mt-1 md:mt-2 text-sm md:text-base">
              Храните и управляйте документами и записями ваших питомцев.
            </p>
          </div>
          <Button 
            className="flex items-center space-x-2 w-full md:w-auto"
            onClick={handleUploadClick}
            disabled={uploading}
          >
            <Upload className="h-4 w-4" />
            <span>{uploading ? 'Загрузка...' : t('documents.upload')}</span>
          </Button>
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleUpload}
          accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
          className="hidden"
        />

        {/* Filter */}
        <div className="flex space-x-4">
          <select
            value={selectedPet}
            onChange={(e) => setSelectedPet(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Все питомцы</option>
            {pets.map((pet) => (
              <option key={pet.id} value={pet.id}>
                {pet.name}
              </option>
            ))}
          </select>
        </div>

        {/* Documents Grid */}
        {filteredDocuments.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDocuments.map((document) => (
              <div key={document.id} className="card p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="text-3xl">{getFileIcon(document.type)}</div>
                    <div>
                      <h3 className="font-medium text-foreground truncate">{document.name}</h3>
                      <p className="text-sm text-muted-foreground">{document.size}</p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    {document.url && (
                      <Button size="sm" variant="outline" onClick={() => window.open(document.url, '_blank')}>
                        <Eye className="h-4 w-4" />
                      </Button>
                    )}
                    <Button size="sm" variant="outline" onClick={() => handleDelete(document.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p>Загружено: {formatDate(document.uploadDate)}</p>
                  {document.petName && <p>Питомец: {document.petName}</p>}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">Документов пока нет</h3>
            <p className="text-muted-foreground mb-6">
              Загрузите свой первый документ для организации записей питомцев.
            </p>
            <Button onClick={handleUploadClick}>
              <Upload className="h-4 w-4 mr-2" />
              Загрузить первый документ
            </Button>
          </div>
        )}
      </div>
    </AuthGuard>
  )
}