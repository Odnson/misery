"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Plus, Pencil, Trash2, ArrowLeft, ImageIcon, Upload, X, Loader2 } from "lucide-react"
import Link from "next/link"
import {
  type GalleryImage,
  getGalleryImages,
  addGalleryImage,
  addGalleryImages,
  updateGalleryImage,
  deleteGalleryImage,
} from "@/lib/gallery-store"

type User = "vii" | "zud"

type ImageManagerProps = {
  user: User
  onLogout: () => void
}

type PendingImage = {
  id: string
  file: File
  preview: string
  alt: string
}

export default function ImageManager({ user, onLogout }: ImageManagerProps) {
  const [images, setImages] = useState<GalleryImage[]>([])
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isBulkUploadDialogOpen, setIsBulkUploadDialogOpen] = useState(false)
  const [editingImage, setEditingImage] = useState<GalleryImage | null>(null)
  const [deletingImage, setDeletingImage] = useState<GalleryImage | null>(null)
  const [newImageSrc, setNewImageSrc] = useState("")
  const [newImageAlt, setNewImageAlt] = useState("")
  const [pendingImages, setPendingImages] = useState<PendingImage[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setImages(getGalleryImages())
  }, [])

  useEffect(() => {
    return () => {
      pendingImages.forEach((img) => URL.revokeObjectURL(img.preview))
    }
  }, [pendingImages])

  const handleAdd = () => {
    if (!newImageSrc.trim()) return

    addGalleryImage({
      src: newImageSrc.trim(),
      alt: newImageAlt.trim() || "Gallery image",
    })

    setImages(getGalleryImages())
    setNewImageSrc("")
    setNewImageAlt("")
    setIsAddDialogOpen(false)
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    const newPendingImages: PendingImage[] = []

    Array.from(files).forEach((file) => {
      if (file.type.startsWith("image/")) {
        const preview = URL.createObjectURL(file)
        newPendingImages.push({
          id: crypto.randomUUID(),
          file,
          preview,
          alt: file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " "),
        })
      }
    })

    setPendingImages((prev) => [...prev, ...newPendingImages])

    // Reset input so same files can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const removePendingImage = (id: string) => {
    setPendingImages((prev) => {
      const toRemove = prev.find((img) => img.id === id)
      if (toRemove) {
        URL.revokeObjectURL(toRemove.preview)
      }
      return prev.filter((img) => img.id !== id)
    })
  }

  const updatePendingImageAlt = (id: string, alt: string) => {
    setPendingImages((prev) => prev.map((img) => (img.id === id ? { ...img, alt } : img)))
  }

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  const handleBulkUpload = async () => {
    if (pendingImages.length === 0) return

    setIsUploading(true)
    setUploadProgress(0)

    const imagesToAdd: { src: string; alt: string }[] = []

    for (let i = 0; i < pendingImages.length; i++) {
      const pending = pendingImages[i]
      try {
        const base64 = await fileToBase64(pending.file)
        imagesToAdd.push({
          src: base64,
          alt: pending.alt || "Gallery image",
        })
        setUploadProgress(Math.round(((i + 1) / pendingImages.length) * 100))
      } catch (error) {
        console.error("Error converting image:", error)
      }
    }

    if (imagesToAdd.length > 0) {
      addGalleryImages(imagesToAdd)
      setImages(getGalleryImages())
    }

    // Cleanup
    pendingImages.forEach((img) => URL.revokeObjectURL(img.preview))
    setPendingImages([])
    setIsUploading(false)
    setUploadProgress(0)
    setIsBulkUploadDialogOpen(false)
  }

  const handleCancelBulkUpload = () => {
    pendingImages.forEach((img) => URL.revokeObjectURL(img.preview))
    setPendingImages([])
    setIsBulkUploadDialogOpen(false)
  }

  const handleEdit = () => {
    if (!editingImage || !newImageSrc.trim()) return

    updateGalleryImage(editingImage.id, {
      src: newImageSrc.trim(),
      alt: newImageAlt.trim() || "Gallery image",
    })

    setImages(getGalleryImages())
    setEditingImage(null)
    setNewImageSrc("")
    setNewImageAlt("")
    setIsEditDialogOpen(false)
  }

  const handleDelete = () => {
    if (!deletingImage) return

    deleteGalleryImage(deletingImage.id)
    setImages(getGalleryImages())
    setDeletingImage(null)
    setIsDeleteDialogOpen(false)
  }

  const openEditDialog = (image: GalleryImage) => {
    setEditingImage(image)
    setNewImageSrc(image.src)
    setNewImageAlt(image.alt)
    setIsEditDialogOpen(true)
  }

  const openDeleteDialog = (image: GalleryImage) => {
    setDeletingImage(image)
    setIsDeleteDialogOpen(true)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 md:mb-8">
          <div className="flex items-center gap-3 md:gap-4">
            <Link href="/">
              <Button
                variant="ghost"
                size="icon"
                className="text-slate-400 hover:text-white hover:bg-slate-800 h-9 w-9 md:h-10 md:w-10"
              >
                <ArrowLeft className="w-4 h-4 md:w-5 md:h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-xl md:text-2xl font-light text-white tracking-wide">Gallery Settings</h1>
              <p className="text-slate-400 text-xs md:text-sm">
                Masuk sebagai <span className="text-pink-400 font-medium">{user === "vii" ? "Vii" : "Zud"}</span>
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={onLogout}
            className="border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white bg-transparent w-full sm:w-auto"
          >
            Keluar
          </Button>
        </div>

        {/* Add Image Card */}
        <Card className="bg-slate-900/50 border-slate-700/50 mb-4 md:mb-6">
          <CardHeader className="p-4 md:p-6">
            <CardTitle className="text-white flex items-center gap-2 text-base md:text-lg">
              <ImageIcon className="w-4 h-4 md:w-5 md:h-5" />
              Kelola Gambar Gallery
            </CardTitle>
            <CardDescription className="text-slate-400 text-xs md:text-sm">
              Tambah, edit, atau hapus gambar dari gallery dome
            </CardDescription>
          </CardHeader>
          <CardContent className="px-4 pb-4 md:px-6 md:pb-6 pt-0">
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Existing Add by URL Dialog */}
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white w-full sm:w-auto">
                    <Plus className="w-4 h-4 mr-2" />
                    Tambah dari URL
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-slate-900 border-slate-700 mx-4 max-w-[calc(100vw-2rem)] sm:max-w-lg">
                  <DialogHeader>
                    <DialogTitle className="text-white text-base md:text-lg">Tambah Gambar Baru</DialogTitle>
                    <DialogDescription className="text-slate-400 text-sm">
                      Masukkan URL gambar yang ingin ditambahkan
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="src" className="text-slate-300 text-sm">
                        URL Gambar
                      </Label>
                      <Input
                        id="src"
                        placeholder="https://example.com/image.jpg"
                        value={newImageSrc}
                        onChange={(e) => setNewImageSrc(e.target.value)}
                        className="bg-slate-800 border-slate-700 text-white text-base h-11 md:h-10"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="alt" className="text-slate-300 text-sm">
                        Deskripsi (opsional)
                      </Label>
                      <Input
                        id="alt"
                        placeholder="Deskripsi gambar"
                        value={newImageAlt}
                        onChange={(e) => setNewImageAlt(e.target.value)}
                        className="bg-slate-800 border-slate-700 text-white text-base h-11 md:h-10"
                      />
                    </div>
                    {newImageSrc && (
                      <div className="aspect-video rounded-lg overflow-hidden bg-slate-800">
                        <img
                          src={newImageSrc || "/placeholder.svg"}
                          alt="Preview"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            ;(e.target as HTMLImageElement).src = "/broken-image.png"
                          }}
                        />
                      </div>
                    )}
                  </div>
                  <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
                    <Button
                      variant="outline"
                      onClick={() => setIsAddDialogOpen(false)}
                      className="border-slate-700 text-slate-300 w-full sm:w-auto"
                    >
                      Batal
                    </Button>
                    <Button
                      onClick={handleAdd}
                      disabled={!newImageSrc.trim()}
                      className="bg-gradient-to-r from-pink-500 to-purple-500 w-full sm:w-auto"
                    >
                      Tambah
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Dialog
                open={isBulkUploadDialogOpen}
                onOpenChange={(open) => {
                  if (!open && !isUploading) {
                    handleCancelBulkUpload()
                  } else if (open) {
                    setIsBulkUploadDialogOpen(true)
                  }
                }}
              >
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    className="border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white bg-transparent w-full sm:w-auto"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Bulk Upload
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-slate-900 border-slate-700 mx-4 max-w-[calc(100vw-2rem)] sm:max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
                  <DialogHeader>
                    <DialogTitle className="text-white text-base md:text-lg">Bulk Upload Gambar</DialogTitle>
                    <DialogDescription className="text-slate-400 text-sm">
                      Pilih beberapa gambar sekaligus dari komputer Anda
                    </DialogDescription>
                  </DialogHeader>

                  <div className="flex-1 overflow-y-auto py-4 space-y-4">
                    {/* Drop zone / File input */}
                    <div
                      className="border-2 border-dashed border-slate-700 rounded-lg p-6 md:p-8 text-center hover:border-pink-500/50 transition-colors cursor-pointer"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                      <Upload className="w-10 h-10 md:w-12 md:h-12 mx-auto text-slate-500 mb-3" />
                      <p className="text-slate-300 text-sm md:text-base mb-1">Klik untuk pilih gambar</p>
                      <p className="text-slate-500 text-xs md:text-sm">atau drag & drop file ke sini</p>
                      <p className="text-slate-600 text-xs mt-2">Mendukung: JPG, PNG, GIF, WebP</p>
                    </div>

                    {/* Pending images preview */}
                    {pendingImages.length > 0 && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <p className="text-slate-300 text-sm">{pendingImages.length} gambar dipilih</p>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              pendingImages.forEach((img) => URL.revokeObjectURL(img.preview))
                              setPendingImages([])
                            }}
                            className="text-slate-400 hover:text-red-400 text-xs"
                          >
                            Hapus Semua
                          </Button>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[40vh] overflow-y-auto p-1">
                          {pendingImages.map((pending) => (
                            <div key={pending.id} className="relative bg-slate-800 rounded-lg overflow-hidden group">
                              <div className="aspect-square">
                                <img
                                  src={pending.preview || "/placeholder.svg"}
                                  alt={pending.alt}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              {/* Remove button */}
                              <button
                                onClick={() => removePendingImage(pending.id)}
                                className="absolute top-1 right-1 bg-black/60 hover:bg-red-500/80 rounded-full p-1 transition-colors"
                              >
                                <X className="w-3 h-3 md:w-4 md:h-4 text-white" />
                              </button>
                              {/* Alt text input */}
                              <div className="p-2">
                                <Input
                                  value={pending.alt}
                                  onChange={(e) => updatePendingImageAlt(pending.id, e.target.value)}
                                  placeholder="Deskripsi..."
                                  className="bg-slate-700/50 border-slate-600 text-white text-xs h-8"
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Upload progress */}
                    {isUploading && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-slate-300 text-sm">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Mengupload gambar... {uploadProgress}%</span>
                        </div>
                        <div className="w-full bg-slate-700 rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-pink-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${uploadProgress}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0 border-t border-slate-700 pt-4">
                    <Button
                      variant="outline"
                      onClick={handleCancelBulkUpload}
                      disabled={isUploading}
                      className="border-slate-700 text-slate-300 w-full sm:w-auto bg-transparent"
                    >
                      Batal
                    </Button>
                    <Button
                      onClick={handleBulkUpload}
                      disabled={pendingImages.length === 0 || isUploading}
                      className="bg-gradient-to-r from-pink-500 to-purple-500 w-full sm:w-auto"
                    >
                      {isUploading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Mengupload...
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4 mr-2" />
                          Upload {pendingImages.length > 0 ? `(${pendingImages.length})` : ""}
                        </>
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>

        {/* Images Grid */}
        {images.length === 0 ? (
          <Card className="bg-slate-900/30 border-slate-700/30 border-dashed">
            <CardContent className="py-10 md:py-12 text-center">
              <ImageIcon className="w-10 h-10 md:w-12 md:h-12 mx-auto text-slate-600 mb-3 md:mb-4" />
              <p className="text-slate-400 text-sm md:text-base">Belum ada gambar custom</p>
              <p className="text-slate-500 text-xs md:text-sm mt-1">Gallery akan menggunakan gambar default</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
            {images.map((image) => (
              <Card key={image.id} className="bg-slate-900/50 border-slate-700/50 overflow-hidden group">
                <div className="aspect-square relative">
                  <img
                    src={image.src || "/placeholder.svg"}
                    alt={image.alt}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      ;(e.target as HTMLImageElement).src = "/broken-image.png"
                    }}
                  />
                  <div className="absolute inset-0 bg-black/60 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <Button
                      size="icon"
                      variant="secondary"
                      onClick={() => openEditDialog(image)}
                      className="bg-white/20 hover:bg-white/30 h-9 w-9 md:h-10 md:w-10"
                    >
                      <Pencil className="w-4 h-4 text-white" />
                    </Button>
                    <Button
                      size="icon"
                      variant="secondary"
                      onClick={() => openDeleteDialog(image)}
                      className="bg-red-500/20 hover:bg-red-500/30 h-9 w-9 md:h-10 md:w-10"
                    >
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </Button>
                  </div>
                </div>
                <CardContent className="p-2 md:p-3">
                  <p className="text-slate-300 text-xs md:text-sm truncate">{image.alt || "No description"}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="bg-slate-900 border-slate-700 mx-4 max-w-[calc(100vw-2rem)] sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-white text-base md:text-lg">Edit Gambar</DialogTitle>
              <DialogDescription className="text-slate-400 text-sm">Ubah URL atau deskripsi gambar</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-src" className="text-slate-300 text-sm">
                  URL Gambar
                </Label>
                <Input
                  id="edit-src"
                  value={newImageSrc}
                  onChange={(e) => setNewImageSrc(e.target.value)}
                  className="bg-slate-800 border-slate-700 text-white text-base h-11 md:h-10"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-alt" className="text-slate-300 text-sm">
                  Deskripsi
                </Label>
                <Input
                  id="edit-alt"
                  value={newImageAlt}
                  onChange={(e) => setNewImageAlt(e.target.value)}
                  className="bg-slate-800 border-slate-700 text-white text-base h-11 md:h-10"
                />
              </div>
              {newImageSrc && (
                <div className="aspect-video rounded-lg overflow-hidden bg-slate-800">
                  <img
                    src={newImageSrc || "/placeholder.svg"}
                    alt="Preview"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      ;(e.target as HTMLImageElement).src = "/broken-image.png"
                    }}
                  />
                </div>
              )}
            </div>
            <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
              <Button
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
                className="border-slate-700 text-slate-300 w-full sm:w-auto"
              >
                Batal
              </Button>
              <Button onClick={handleEdit} className="bg-gradient-to-r from-pink-500 to-purple-500 w-full sm:w-auto">
                Simpan
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Dialog */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent className="bg-slate-900 border-slate-700 mx-4 max-w-[calc(100vw-2rem)] sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-white text-base md:text-lg">Hapus Gambar</DialogTitle>
              <DialogDescription className="text-slate-400 text-sm">
                Apakah kamu yakin ingin menghapus gambar ini?
              </DialogDescription>
            </DialogHeader>
            {deletingImage && (
              <div className="aspect-video rounded-lg overflow-hidden bg-slate-800 my-4">
                <img
                  src={deletingImage.src || "/placeholder.svg"}
                  alt={deletingImage.alt}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
              <Button
                variant="outline"
                onClick={() => setIsDeleteDialogOpen(false)}
                className="border-slate-700 text-slate-300 w-full sm:w-auto"
              >
                Batal
              </Button>
              <Button onClick={handleDelete} variant="destructive" className="w-full sm:w-auto">
                Hapus
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
