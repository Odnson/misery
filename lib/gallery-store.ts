"use client"

export type GalleryImage = {
  id: string
  src: string
  alt: string
}

const STORAGE_KEY = "gallery-images"

export function getGalleryImages(): GalleryImage[] {
  if (typeof window === "undefined") return []

  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      return JSON.parse(stored)
    }
  } catch (e) {
    console.error("Error reading gallery images:", e)
  }

  return []
}

export function saveGalleryImages(images: GalleryImage[]): void {
  if (typeof window === "undefined") return

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(images))
    // Dispatch custom event to notify other components
    window.dispatchEvent(new CustomEvent("gallery-images-updated"))
  } catch (e) {
    console.error("Error saving gallery images:", e)
  }
}

export function addGalleryImage(image: Omit<GalleryImage, "id">): GalleryImage {
  const images = getGalleryImages()
  const newImage: GalleryImage = {
    ...image,
    id: crypto.randomUUID(),
  }
  images.push(newImage)
  saveGalleryImages(images)
  return newImage
}

export function addGalleryImages(newImages: Omit<GalleryImage, "id">[]): GalleryImage[] {
  const images = getGalleryImages()
  const addedImages: GalleryImage[] = newImages.map((image) => ({
    ...image,
    id: crypto.randomUUID(),
  }))
  images.push(...addedImages)
  saveGalleryImages(images)
  return addedImages
}

export function updateGalleryImage(id: string, updates: Partial<Omit<GalleryImage, "id">>): void {
  const images = getGalleryImages()
  const index = images.findIndex((img) => img.id === id)
  if (index !== -1) {
    images[index] = { ...images[index], ...updates }
    saveGalleryImages(images)
  }
}

export function deleteGalleryImage(id: string): void {
  const images = getGalleryImages()
  const filtered = images.filter((img) => img.id !== id)
  saveGalleryImages(filtered)
}

export function clearGalleryImages(): void {
  saveGalleryImages([])
}
