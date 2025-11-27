"use client"

import { useEffect, useState } from "react"
import DomeGallery, { DEFAULT_IMAGES } from "@/components/dome-gallery"
import LightRays from "@/components/light-rays"
import { getGalleryImages, type GalleryImage } from "@/lib/gallery-store"

export default function Home() {
  const [customImages, setCustomImages] = useState<GalleryImage[]>([])

  useEffect(() => {
    setCustomImages(getGalleryImages())

    const handleUpdate = () => {
      setCustomImages(getGalleryImages())
    }

    window.addEventListener("gallery-images-updated", handleUpdate)
    return () => window.removeEventListener("gallery-images-updated", handleUpdate)
  }, [])

  const galleryImages =
    customImages.length > 0 ? customImages.map((img) => ({ src: img.src, alt: img.alt })) : DEFAULT_IMAGES

  return (
    <main className="w-full h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 overflow-hidden">
      <div className="absolute inset-0 z-0">
        <LightRays
          raysOrigin="top-center"
          raysColor="#3b82f6"
          raysSpeed={0.8}
          lightSpread={2}
          rayLength={2.5}
          fadeDistance={0.8}
          saturation={1.2}
          followMouse={true}
          mouseInfluence={0.05}
          pulsating={true}
          className="absolute inset-0"
        />
      </div>

      <div className="absolute inset-0 z-10">
        <DomeGallery
          images={galleryImages}
          minRadius={500}
          maxRadius={800}
          fit={0.55}
          fitBasis="auto"
          dragSensitivity={20}
          enlargeTransitionMs={350}
          overlayBlurColor="#0f172a"
          imageBorderRadius="20px"
          openedImageBorderRadius="24px"
          grayscale={false}
        />
      </div>

      <div className="absolute top-0 left-0 right-0 z-20 pointer-events-none">
        <div className="h-20 md:h-32 bg-gradient-to-b from-slate-950 via-slate-950/80 to-transparent" />
      </div>

      <div className="absolute bottom-0 left-0 right-0 z-20 pointer-events-none">
        <div className="h-24 md:h-32 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent" />
        <div className="absolute bottom-4 md:bottom-6 left-4 md:left-6 right-4 md:right-6 text-center">
          <p className="text-slate-400 text-xs md:text-sm font-light tracking-wide hidden md:block">
            Scroll to zoom • Drag to rotate • Click to enlarge • ESC to close
          </p>
          <p className="text-slate-400 text-xs font-light tracking-wide md:hidden">
            Pinch to zoom • Swipe to rotate • Tap to enlarge
          </p>
        </div>
      </div>
    </main>
  )
}
