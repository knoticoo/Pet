'use client'

import { useState } from 'react'
import { FileText, Upload, Download, Trash2, Eye, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Document {
  id: string
  name: string
  type: string
  size: string
  uploadDate: string
  petId?: string
  petName?: string
}

// Mock data for demonstration
const mockDocuments: Document[] = [
  {
    id: '1',
    name: 'Vaccination Record.pdf',
    type: 'pdf',
    size: '2.3 MB',
    uploadDate: '2024-01-15',
    petId: '1',
    petName: 'Pet 1'
  },
  {
    id: '2',
    name: 'Medical History.pdf',
    type: 'pdf',
    size: '1.8 MB',
    uploadDate: '2024-01-10',
    petId: '2',
    petName: 'Pet 2'
  },
  {
    id: '3',
    name: 'Insurance Certificate.pdf',
    type: 'pdf',
    size: '0.9 MB',
    uploadDate: '2024-01-08',
    petId: '1',
    petName: 'Pet 1'
  }
]

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>(mockDocuments)
  const [selectedPet, setSelectedPet] = useState<string>('all')

  const filteredDocuments = selectedPet === 'all' 
    ? documents 
    : documents.filter(doc => doc.petId === selectedPet)

  const handleDelete = (id: string) => {
    setDocuments(docs => docs.filter(doc => doc.id !== id))
  }

  const handleUpload = () => {
    // TODO: Implement actual upload functionality
    alert('Upload functionality not yet implemented')
  }

  const handleView = (id: string) => {
    // TODO: Implement document viewing
    alert(`View document functionality not yet implemented for document ${id}`)
  }

  const handleDownload = (id: string) => {
    // TODO: Implement document download
    alert(`Download functionality not yet implemented for document ${id}`)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Documents</h1>
          <p className="text-muted-foreground mt-2">
            Store and organize your pet documents securely
          </p>
        </div>
        <Button onClick={handleUpload} className="flex items-center space-x-2">
          <Plus className="h-4 w-4" />
          <span>Upload Document</span>
        </Button>
      </div>

      {/* Filter Bar */}
      <div className="bg-card rounded-lg border p-4">
        <div className="flex items-center space-x-4">
          <label htmlFor="pet-filter" className="text-sm font-medium text-foreground">
            Filter by Pet:
          </label>
          <select
            id="pet-filter"
            value={selectedPet}
            onChange={(e) => setSelectedPet(e.target.value)}
            className="rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="all">All Pets</option>
            {/* TODO: Replace with dynamic pet data */}
          </select>
        </div>
      </div>

      {/* Documents Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredDocuments.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No documents found</h3>
            <p className="text-muted-foreground mb-4">
              {selectedPet === 'all' 
                ? 'Upload your first document to get started'
                : 'No documents found for the selected pet'
              }
            </p>
            <Button onClick={handleUpload} variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Upload Document
            </Button>
          </div>
        ) : (
          filteredDocuments.map((document) => (
            <div key={document.id} className="card p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <FileText className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-foreground truncate">
                      {document.name}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {document.petName && `${document.petName} • `}
                      {document.size}
                    </p>
                  </div>
                </div>
              </div>

              <div className="text-xs text-muted-foreground">
                Uploaded on {new Intl.DateTimeFormat('en-US').format(new Date(document.uploadDate))}
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleView(document.id)}
                  className="flex-1"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  View
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownload(document.id)}
                >
                  <Download className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(document.id)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Upload Area */}
      <div className="border-2 border-dashed border-border rounded-lg p-8 text-center bg-card">
        <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium text-foreground mb-2">
          Drag and drop files here
        </h3>
        <p className="text-muted-foreground mb-4">
          or click to browse your files
        </p>
        <Button onClick={handleUpload} variant="outline">
          Choose Files
        </Button>
        <p className="text-xs text-muted-foreground mt-2">
          Supports PDF, JPG, PNG files up to 10MB
        </p>
      </div>
    </div>
  )
}