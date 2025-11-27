"use client"

import type React from "react"

import { useEffect, useMemo, useRef, useCallback, useState, memo } from "react"
import { useGesture } from "@use-gesture/react"

type ImageItem = string | { src: string; alt?: string }

type DomeGalleryProps = {
  images?: ImageItem[]
  fit?: number
  fitBasis?: "auto" | "min" | "max" | "width" | "height"
  minRadius?: number
  maxRadius?: number
  padFactor?: number
  overlayBlurColor?: string
  maxVerticalRotationDeg?: number
  dragSensitivity?: number
  enlargeTransitionMs?: number
  segments?: number
  dragDampening?: number
  openedImageWidth?: string
  openedImageHeight?: string
  imageBorderRadius?: string
  openedImageBorderRadius?: string
  grayscale?: boolean
}

type ItemDef = {
  src: string
  alt: string
  x: number
  y: number
  sizeX: number
  sizeY: number
}

type ScatterPosition = {
  x: number
  y: number
  z: number
  rotateX: number
  rotateY: number
  rotateZ: number
  scale: number
}

const DEFAULT_IMAGES: ImageItem[] = [
  { src: "/memory001.webp", alt: "Memory 001" },
  { src: "/memory002.webp", alt: "Memory 002" },
  { src: "/memory003.webp", alt: "Memory 003" },
  { src: "/memory004.webp", alt: "Memory 004" },
  { src: "/memory005.webp", alt: "Memory 005" },
  { src: "/memory006.webp", alt: "Memory 006" },
  { src: "/memory007.webp", alt: "Memory 007" },
  { src: "/memory008.webp", alt: "Memory 008" },
  { src: "/memory009.webp", alt: "Memory 009" },
  { src: "/memory010.webp", alt: "Memory 010" },
  { src: "/memory011.webp", alt: "Memory 011" },
  { src: "/memory012.webp", alt: "Memory 012" },
  { src: "/memory013.webp", alt: "Memory 013" },
  { src: "/memory014.webp", alt: "Memory 014" },
  { src: "/memory015.webp", alt: "Memory 015" },
  { src: "/memory016.webp", alt: "Memory 016" },
  { src: "/memory017.webp", alt: "Memory 017" },
  { src: "/memory018.webp", alt: "Memory 018" },
  { src: "/memory019.webp", alt: "Memory 019" },
  { src: "/memory020.webp", alt: "Memory 020" },
  { src: "/memory021.webp", alt: "Memory 021" },
  { src: "/memory022.webp", alt: "Memory 022" },
  { src: "/memory023.webp", alt: "Memory 023" },
  { src: "/memory024.webp", alt: "Memory 024" },
  { src: "/memory025.webp", alt: "Memory 025" },
  { src: "/memory026.webp", alt: "Memory 026" },
  { src: "/memory027.webp", alt: "Memory 027" },
  { src: "/memory028.webp", alt: "Memory 028" },
  { src: "/memory029.webp", alt: "Memory 029" },
  { src: "/memory030.webp", alt: "Memory 030" },
  { src: "/memory031.webp", alt: "Memory 031" },
  { src: "/memory032.webp", alt: "Memory 032" },
  { src: "/memory033.webp", alt: "Memory 033" },
  { src: "/memory034.webp", alt: "Memory 034" },
  { src: "/memory035.webp", alt: "Memory 035" },
  { src: "/memory036.webp", alt: "Memory 036" },
  { src: "/memory037.webp", alt: "Memory 037" },
  { src: "/memory038.webp", alt: "Memory 038" },
  { src: "/memory039.webp", alt: "Memory 039" },
  { src: "/memory040.webp", alt: "Memory 040" },
  { src: "/memory041.webp", alt: "Memory 041" },
  { src: "/memory042.webp", alt: "Memory 042" },
  { src: "/memory043.webp", alt: "Memory 043" },
  { src: "/memory044.webp", alt: "Memory 044" },
  { src: "/memory045.webp", alt: "Memory 045" },
  { src: "/memory046.webp", alt: "Memory 046" },
  { src: "/memory047.webp", alt: "Memory 047" },
  { src: "/memory048.webp", alt: "Memory 048" },
  { src: "/memory049.webp", alt: "Memory 049" },
  { src: "/memory050.webp", alt: "Memory 050" },
  { src: "/memory051.webp", alt: "Memory 051" },
  { src: "/memory052.webp", alt: "Memory 052" },
  { src: "/memory053.webp", alt: "Memory 053" },
]

export { DEFAULT_IMAGES }

const DEFAULTS = {
  maxVerticalRotationDeg: 5,
  dragSensitivity: 20,
  enlargeTransitionMs: 300,
  segments: 35,
}

const clamp = (v: number, min: number, max: number) => Math.min(Math.max(v, min), max)
const normalizeAngle = (d: number) => ((d % 360) + 360) % 360
const wrapAngleSigned = (deg: number) => {
  const a = (((deg + 180) % 360) + 360) % 360
  return a - 180
}
const getDataNumber = (el: HTMLElement, name: string, fallback: number) => {
  const attr = el.dataset[name] ?? el.getAttribute(`data-${name}`)
  const n = attr == null ? Number.NaN : Number.parseFloat(attr)
  return Number.isFinite(n) ? n : fallback
}

function buildItems(pool: ImageItem[], seg: number): ItemDef[] {
  const xCols = Array.from({ length: seg }, (_, i) => -37 + i * 2)
  const evenYs = [-4, -2, 0, 2, 4]
  const oddYs = [-3, -1, 1, 3, 5]

  const coords = xCols.flatMap((x, c) => {
    const ys = c % 2 === 0 ? evenYs : oddYs
    return ys.map((y) => ({ x, y, sizeX: 2, sizeY: 2 }))
  })

  const totalSlots = coords.length
  if (pool.length === 0) {
    return coords.map((c) => ({ ...c, src: "", alt: "" }))
  }
  if (pool.length > totalSlots) {
    console.warn(
      `[DomeGallery] Provided image count (${pool.length}) exceeds available tiles (${totalSlots}). Some images will not be shown.`,
    )
  }

  const normalizedImages = pool.map((image) => {
    if (typeof image === "string") {
      return { src: image, alt: "" }
    }
    return { src: image.src || "", alt: image.alt || "" }
  })

  const usedImages = Array.from({ length: totalSlots }, (_, i) => normalizedImages[i % normalizedImages.length])

  for (let i = 1; i < usedImages.length; i++) {
    if (usedImages[i].src === usedImages[i - 1].src) {
      for (let j = i + 1; j < usedImages.length; j++) {
        if (usedImages[j].src !== usedImages[i].src) {
          const tmp = usedImages[i]
          usedImages[i] = usedImages[j]
          usedImages[j] = tmp
          break
        }
      }
    }
  }

  return coords.map((c, i) => ({
    ...c,
    src: usedImages[i].src,
    alt: usedImages[i].alt,
  }))
}

function computeItemBaseRotation(offsetX: number, offsetY: number, sizeX: number, sizeY: number, segments: number) {
  const unit = 360 / segments / 2
  const rotateY = unit * (offsetX + (sizeX - 1) / 2)
  const rotateX = unit * (offsetY - (sizeY - 1) / 2)
  return { rotateX, rotateY }
}

function generateScatterPosition(index: number, total: number): ScatterPosition {
  const seededRandom = (seed: number) => {
    const x = Math.sin(seed * 9999) * 10000
    return x - Math.floor(x)
  }

  const rand1 = seededRandom(index * 1.1)
  const rand2 = seededRandom(index * 2.2)
  const rand3 = seededRandom(index * 3.3)
  const rand4 = seededRandom(index * 4.4)
  const rand5 = seededRandom(index * 5.5)
  const rand6 = seededRandom(index * 6.6)
  const rand7 = seededRandom(index * 7.7)

  return {
    x: (rand1 - 0.5) * 2000,
    y: (rand2 - 0.5) * 1500,
    z: (rand3 - 0.5) * 1500 - 500,
    rotateX: (rand4 - 0.5) * 180,
    rotateY: (rand5 - 0.5) * 360,
    rotateZ: (rand6 - 0.5) * 90,
    scale: 0.3 + rand7 * 0.7,
  }
}

const SphereItem = memo(function SphereItem({
  item,
  index,
  scatter,
  scatterFactor,
  imageBorderRadius,
  grayscale,
  onItemClick,
  draggingRef,
  movedRef,
  lastDragEndAt,
  openingRef,
}: {
  item: ItemDef
  index: number
  scatter: ScatterPosition
  scatterFactor: number
  imageBorderRadius: string
  grayscale: boolean
  onItemClick: (el: HTMLElement) => void
  draggingRef: React.RefObject<boolean>
  movedRef: React.RefObject<boolean>
  lastDragEndAt: React.RefObject<number>
  openingRef: React.RefObject<boolean>
}) {
  const domeRotY = `calc(var(--rot-y) * (var(--offset-x) + ((var(--item-size-x) - 1) / 2)) + var(--rot-y-delta, 0deg))`
  const domeRotX = `calc(var(--rot-x) * (var(--offset-y) - ((var(--item-size-y) - 1) / 2)) + var(--rot-x-delta, 0deg))`

  // Pre-calculate scatter values
  const scatterX = scatter.x * scatterFactor
  const scatterY = scatter.y * scatterFactor
  const scatterZ = scatter.z * scatterFactor
  const scatterRotX = scatter.rotateX * scatterFactor
  const scatterRotY = scatter.rotateY * scatterFactor
  const scatterRotZ = scatter.rotateZ * scatterFactor
  const scatterScale = 1 - (1 - scatter.scale) * scatterFactor

  const isScattered = scatterFactor > 0.01

  const handleClick = useCallback(
    (e: React.MouseEvent | React.PointerEvent) => {
      if (draggingRef.current) return
      if (movedRef.current) return
      if (performance.now() - lastDragEndAt.current < 80) return
      if (openingRef.current) return
      if (scatterFactor > 0.3) return
      onItemClick(e.currentTarget as HTMLElement)
    },
    [scatterFactor, onItemClick, draggingRef, movedRef, lastDragEndAt, openingRef],
  )

  return (
    <div
      className="sphere-item"
      data-src={item.src}
      data-alt={item.alt}
      data-offset-x={item.x}
      data-offset-y={item.y}
      data-size-x={item.sizeX}
      data-size-y={item.sizeY}
      style={{
        ["--offset-x" as string]: item.x,
        ["--offset-y" as string]: item.y,
        ["--item-size-x" as string]: item.sizeX,
        ["--item-size-y" as string]: item.sizeY,
        willChange: isScattered ? "transform, opacity" : "auto",
        transform: isScattered
          ? `translate3d(${scatterX}px, ${scatterY}px, ${scatterZ}px) rotateX(${scatterRotX}deg) rotateY(${scatterRotY}deg) rotateZ(${scatterRotZ}deg) scale3d(${scatterScale}, ${scatterScale}, ${scatterScale})`
          : `rotateY(${domeRotY}) rotateX(${domeRotX}) translateZ(var(--radius))`,
        opacity: isScattered ? Math.max(0.3, 1 - scatterFactor * 0.5) : 1,
      }}
    >
      <div
        className="item__image"
        role="button"
        tabIndex={0}
        aria-label={item.alt || "Open image"}
        onClick={handleClick}
        onPointerUp={(e) => {
          if ((e.nativeEvent as PointerEvent).pointerType !== "touch") return
          handleClick(e)
        }}
        style={{
          borderRadius: `var(--tile-radius, ${imageBorderRadius})`,
        }}
      >
        <img
          src={item.src || "/placeholder.svg"}
          draggable={false}
          alt={item.alt}
          loading="lazy"
          decoding="async"
          className="w-full h-full object-cover pointer-events-none"
          style={{
            filter: `var(--image-filter, ${grayscale ? "grayscale(1)" : "none"})`,
          }}
        />
      </div>
    </div>
  )
})

export default function DomeGallery({
  images = DEFAULT_IMAGES,
  fit = 0.5,
  fitBasis = "auto",
  minRadius = 600,
  maxRadius = Number.POSITIVE_INFINITY,
  padFactor = 0.25,
  overlayBlurColor = "#060010",
  maxVerticalRotationDeg = DEFAULTS.maxVerticalRotationDeg,
  dragSensitivity = DEFAULTS.dragSensitivity,
  enlargeTransitionMs = DEFAULTS.enlargeTransitionMs,
  segments = DEFAULTS.segments,
  dragDampening = 2,
  openedImageWidth = "400px",
  openedImageHeight = "400px",
  imageBorderRadius = "30px",
  openedImageBorderRadius = "30px",
  grayscale = true,
}: DomeGalleryProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const mainRef = useRef<HTMLDivElement>(null)
  const sphereRef = useRef<HTMLDivElement>(null)
  const frameRef = useRef<HTMLDivElement>(null)
  const viewerRef = useRef<HTMLDivElement>(null)
  const scrimRef = useRef<HTMLDivElement>(null)
  const focusedElRef = useRef<HTMLElement | null>(null)
  const originalTilePositionRef = useRef<{
    left: number
    top: number
    width: number
    height: number
  } | null>(null)

  const rotationRef = useRef({ x: 0, y: 0 })
  const startRotRef = useRef({ x: 0, y: 0 })
  const startPosRef = useRef<{ x: number; y: number } | null>(null)
  const draggingRef = useRef(false)
  const cancelTapRef = useRef(false)
  const movedRef = useRef(false)
  const inertiaRAF = useRef<number | null>(null)
  const pointerTypeRef = useRef<"mouse" | "pen" | "touch">("mouse")
  const tapTargetRef = useRef<HTMLElement | null>(null)
  const openingRef = useRef(false)
  const openStartedAtRef = useRef(0)
  const lastDragEndAt = useRef(0)

  const [zoomLevel, setZoomLevel] = useState(1)
  const zoomRef = useRef(1)
  const MIN_ZOOM = 0.3
  const MAX_ZOOM = 1

  const [isMobile, setIsMobile] = useState(false)
  const lastPinchDistRef = useRef<number | null>(null)
  const touchStartZoomRef = useRef(1)

  const [isLoading, setIsLoading] = useState(true)
  const [loadingProgress, setLoadingProgress] = useState(0)
  const [imagesLoaded, setImagesLoaded] = useState(0)
  const [initialTransition, setInitialTransition] = useState(false)

  const [animatedScatterFactor, setAnimatedScatterFactor] = useState(1)
  const scatterFactorRef = useRef(1)
  const animationRef = useRef<number | null>(null)
  const lastFrameTimeRef = useRef(0)

  const scrollLockedRef = useRef(false)
  const lockScroll = useCallback(() => {
    if (scrollLockedRef.current) return
    scrollLockedRef.current = true
    document.body.classList.add("dg-scroll-lock")
  }, [])
  const unlockScroll = useCallback(() => {
    if (!scrollLockedRef.current) return
    if (rootRef.current?.getAttribute("data-enlarging") === "true") return
    scrollLockedRef.current = false
    document.body.classList.remove("dg-scroll-lock")
  }, [])

  const items = useMemo(() => buildItems(images, segments), [images, segments])

  const scatterPositions = useMemo(() => {
    return items.map((_, index) => generateScatterPosition(index, items.length))
  }, [items])

  useEffect(() => {
    const imagesToLoad = items.filter((item) => item.src).map((item) => item.src)
    let loaded = 0

    if (imagesToLoad.length === 0) {
      setLoadingProgress(100)
      setTimeout(() => {
        setIsLoading(false)
        setInitialTransition(true)
      }, 500)
      return
    }

    imagesToLoad.forEach((src) => {
      const img = new Image()
      img.crossOrigin = "anonymous"
      img.onload = img.onerror = () => {
        loaded++
        setImagesLoaded(loaded)
        setLoadingProgress(Math.round((loaded / imagesToLoad.length) * 100))

        if (loaded === imagesToLoad.length) {
          setTimeout(() => {
            setIsLoading(false)
            setTimeout(() => {
              setInitialTransition(true)
            }, 100)
          }, 500)
        }
      }
      img.src = src
    })
  }, [items])

  useEffect(() => {
    if (isLoading) {
      let startTime: number | null = null

      const floatAnimation = (timestamp: number) => {
        if (!startTime) startTime = timestamp
        const elapsed = timestamp - startTime

        // Gentle oscillation - update ref directly, throttle state updates
        const oscillation = 0.925 + Math.sin(elapsed * 0.0008) * 0.075
        scatterFactorRef.current = oscillation

        // Throttle state updates to 30fps for smooth performance
        if (timestamp - lastFrameTimeRef.current > 33) {
          lastFrameTimeRef.current = timestamp
          setAnimatedScatterFactor(oscillation)
        }

        if (isLoading) {
          animationRef.current = requestAnimationFrame(floatAnimation)
        }
      }
      animationRef.current = requestAnimationFrame(floatAnimation)

      return () => {
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current)
        }
      }
    } else if (initialTransition) {
      let startTime: number | null = null
      const duration = 2500 // Slightly faster for better feel

      const gatherAnimation = (timestamp: number) => {
        if (!startTime) startTime = timestamp
        const elapsed = timestamp - startTime
        const progress = Math.min(elapsed / duration, 1)

        // Smoother ease-out for gathering effect
        const eased = 1 - Math.pow(1 - progress, 4)
        const newValue = 1 - eased
        scatterFactorRef.current = newValue

        // Throttle state updates to 30fps
        if (timestamp - lastFrameTimeRef.current > 33) {
          lastFrameTimeRef.current = timestamp
          setAnimatedScatterFactor(newValue)
        }

        if (progress < 1) {
          animationRef.current = requestAnimationFrame(gatherAnimation)
        } else {
          // Ensure final state is set
          scatterFactorRef.current = 0
          setAnimatedScatterFactor(0)
        }
      }
      animationRef.current = requestAnimationFrame(gatherAnimation)

      return () => {
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current)
        }
      }
    }
  }, [isLoading, initialTransition])

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768 || "ontouchstart" in window)
    }
    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  const applyTransform = useCallback((xDeg: number, yDeg: number) => {
    const el = sphereRef.current
    if (el) {
      el.style.transform = `translate3d(0, 0, calc(var(--radius) * -1)) rotateX(${xDeg}deg) rotateY(${yDeg}deg)`
    }
  }, [])

  const lockedRadiusRef = useRef<number | null>(null)

  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    const ro = new ResizeObserver((entries) => {
      const cr = entries[0].contentRect
      const w = Math.max(1, cr.width),
        h = Math.max(1, cr.height)
      const minDim = Math.min(w, h),
        maxDim = Math.max(w, h),
        aspect = w / h
      let basis: number
      switch (fitBasis) {
        case "min":
          basis = minDim
          break
        case "max":
          basis = maxDim
          break
        case "width":
          basis = w
          break
        case "height":
          basis = h
          break
        default:
          basis = aspect >= 1.3 ? w : minDim
      }
      let radius = basis * fit
      const heightGuard = h * 1.35
      radius = Math.min(radius, heightGuard)
      radius = clamp(radius, minRadius, maxRadius)
      lockedRadiusRef.current = Math.round(radius)

      const viewerPad = Math.max(8, Math.round(minDim * padFactor))
      root.style.setProperty("--radius", `${lockedRadiusRef.current}px`)
      root.style.setProperty("--viewer-pad", `${viewerPad}px`)
      root.style.setProperty("--overlay-blur-color", overlayBlurColor)
      root.style.setProperty("--tile-radius", imageBorderRadius)
      root.style.setProperty("--enlarge-radius", openedImageBorderRadius)
      root.style.setProperty("--image-filter", grayscale ? "grayscale(1)" : "none")
      applyTransform(rotationRef.current.x, rotationRef.current.y)

      const enlargedOverlay = viewerRef.current?.querySelector(".enlarge") as HTMLElement
      if (enlargedOverlay && frameRef.current && mainRef.current) {
        const frameR = frameRef.current.getBoundingClientRect()
        const mainR = mainRef.current.getBoundingClientRect()

        const hasCustomSize = openedImageWidth && openedImageHeight
        if (hasCustomSize) {
          const tempDiv = document.createElement("div")
          tempDiv.style.cssText = `position: absolute; width: ${openedImageWidth}; height: ${openedImageHeight}; visibility: hidden;`
          document.body.appendChild(tempDiv)
          const tempRect = tempDiv.getBoundingClientRect()
          document.body.removeChild(tempDiv)

          const centeredLeft = frameR.left - mainR.left + (frameR.width - tempRect.width) / 2
          const centeredTop = frameR.top - mainR.top + (frameR.height - tempRect.height) / 2

          enlargedOverlay.style.left = `${centeredLeft}px`
          enlargedOverlay.style.top = `${centeredTop}px`
        } else {
          enlargedOverlay.style.left = `${frameR.left - mainR.left}px`
          enlargedOverlay.style.top = `${frameR.top - mainR.top}px`
          enlargedOverlay.style.width = `${frameR.width}px`
          enlargedOverlay.style.height = `${frameR.height}px`
        }
      }
    })
    ro.observe(root)
    return () => ro.disconnect()
  }, [
    fit,
    fitBasis,
    minRadius,
    maxRadius,
    padFactor,
    overlayBlurColor,
    grayscale,
    imageBorderRadius,
    openedImageBorderRadius,
    openedImageWidth,
    openedImageHeight,
    applyTransform,
  ])

  useEffect(() => {
    applyTransform(rotationRef.current.x, rotationRef.current.y)
  }, [applyTransform])

  useEffect(() => {
    const root = rootRef.current
    if (!root) return

    let lastZoomUpdate = 0
    const ZOOM_THROTTLE = 16 // ~60fps

    const handleWheel = (e: WheelEvent) => {
      if (focusedElRef.current) return
      if (isLoading || animatedScatterFactor > 0.1) return
      e.preventDefault()

      const now = performance.now()
      if (now - lastZoomUpdate < ZOOM_THROTTLE) return
      lastZoomUpdate = now

      const delta = e.deltaY * -0.0015
      const newZoom = clamp(zoomRef.current + delta, MIN_ZOOM, MAX_ZOOM)
      zoomRef.current = newZoom
      setZoomLevel(newZoom)
    }

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        const dist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY,
        )
        lastPinchDistRef.current = dist
        touchStartZoomRef.current = zoomRef.current
      }
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2 && lastPinchDistRef.current !== null) {
        if (focusedElRef.current) return
        if (isLoading || animatedScatterFactor > 0.1) return

        e.preventDefault()

        const now = performance.now()
        if (now - lastZoomUpdate < ZOOM_THROTTLE) return
        lastZoomUpdate = now

        const dist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY,
        )
        const scale = dist / lastPinchDistRef.current
        const newZoom = clamp(touchStartZoomRef.current * scale, MIN_ZOOM, MAX_ZOOM)
        zoomRef.current = newZoom
        setZoomLevel(newZoom)
      }
    }

    const handleTouchEnd = () => {
      lastPinchDistRef.current = null
    }

    root.addEventListener("wheel", handleWheel, { passive: false })
    root.addEventListener("touchstart", handleTouchStart, { passive: true })
    root.addEventListener("touchmove", handleTouchMove, { passive: false })
    root.addEventListener("touchend", handleTouchEnd, { passive: true })

    return () => {
      root.removeEventListener("wheel", handleWheel)
      root.removeEventListener("touchstart", handleTouchStart)
      root.removeEventListener("touchmove", handleTouchMove)
      root.removeEventListener("touchend", handleTouchEnd)
    }
  }, [isLoading, animatedScatterFactor])

  const stopInertia = useCallback(() => {
    if (inertiaRAF.current) {
      cancelAnimationFrame(inertiaRAF.current)
      inertiaRAF.current = null
    }
  }, [])

  const startInertia = useCallback(
    (vx: number, vy: number) => {
      const MAX_V = 1.4
      let vX = clamp(vx, -MAX_V, MAX_V) * 80
      let vY = clamp(vy, -MAX_V, MAX_V) * 80
      let frames = 0
      const d = clamp(dragDampening ?? 0.6, 0, 1)
      const frictionMul = 0.94 + 0.055 * d
      const stopThreshold = 0.015 - 0.01 * d
      const maxFrames = Math.round(90 + 270 * d)
      const step = () => {
        vX *= frictionMul
        vY *= frictionMul
        if (Math.abs(vX) < stopThreshold && Math.abs(vY) < stopThreshold) {
          inertiaRAF.current = null
          return
        }
        if (++frames > maxFrames) {
          inertiaRAF.current = null
          return
        }
        const nextX = clamp(rotationRef.current.x - vY / 200, -maxVerticalRotationDeg, maxVerticalRotationDeg)
        const nextY = wrapAngleSigned(rotationRef.current.y + vX / 200)
        rotationRef.current = { x: nextX, y: nextY }
        applyTransform(nextX, nextY)
        inertiaRAF.current = requestAnimationFrame(step)
      }
      stopInertia()
      inertiaRAF.current = requestAnimationFrame(step)
    },
    [dragDampening, maxVerticalRotationDeg, stopInertia, applyTransform],
  )

  useGesture(
    {
      onDragStart: ({ event }) => {
        if (focusedElRef.current) return
        stopInertia()

        const evt = event as PointerEvent
        pointerTypeRef.current = (evt.pointerType as any) || "mouse"
        if (pointerTypeRef.current === "touch") evt.preventDefault()
        if (pointerTypeRef.current === "touch") lockScroll()
        draggingRef.current = true
        cancelTapRef.current = false
        movedRef.current = false
        startRotRef.current = { ...rotationRef.current }
        startPosRef.current = { x: evt.clientX, y: evt.clientY }
        const potential = (evt.target as Element).closest?.(".item__image") as HTMLElement | null
        tapTargetRef.current = potential || null
      },
      onDrag: ({ event, last, velocity: velArr = [0, 0], direction: dirArr = [0, 0], movement }) => {
        if (focusedElRef.current || !draggingRef.current || !startPosRef.current) return

        const evt = event as PointerEvent
        if (pointerTypeRef.current === "touch") evt.preventDefault()

        const dxTotal = evt.clientX - startPosRef.current.x
        const dyTotal = evt.clientY - startPosRef.current.y

        if (!movedRef.current) {
          const dist2 = dxTotal * dxTotal + dyTotal * dyTotal
          if (dist2 > 16) movedRef.current = true
        }

        const nextX = clamp(
          startRotRef.current.x - dyTotal / dragSensitivity,
          -maxVerticalRotationDeg,
          maxVerticalRotationDeg,
        )
        const nextY = startRotRef.current.y + dxTotal / dragSensitivity

        const cur = rotationRef.current
        if (cur.x !== nextX || cur.y !== nextY) {
          rotationRef.current = { x: nextX, y: nextY }
          applyTransform(nextX, nextY)
        }

        if (last) {
          draggingRef.current = false
          let isTap = false

          if (startPosRef.current) {
            const dx = evt.clientX - startPosRef.current.x
            const dy = evt.clientY - startPosRef.current.y
            const dist2 = dx * dx + dy * dy
            const TAP_THRESH_PX = pointerTypeRef.current === "touch" ? 10 : 6
            if (dist2 <= TAP_THRESH_PX * TAP_THRESH_PX) {
              isTap = true
            }
          }

          const [vMagX, vMagY] = velArr
          const [dirX, dirY] = dirArr
          let vx = vMagX * dirX
          let vy = vMagY * dirY

          if (!isTap && Math.abs(vx) < 0.001 && Math.abs(vy) < 0.001 && Array.isArray(movement)) {
            const [mx, my] = movement
            vx = (mx / dragSensitivity) * 0.02
            vy = (my / dragSensitivity) * 0.02
          }

          if (!isTap && (Math.abs(vx) > 0.005 || Math.abs(vy) > 0.005)) {
            startInertia(vx, vy)
          }
          startPosRef.current = null
          cancelTapRef.current = !isTap

          if (isTap && tapTargetRef.current && !focusedElRef.current) {
            openItemFromElement(tapTargetRef.current)
          }
          tapTargetRef.current = null

          if (cancelTapRef.current) setTimeout(() => (cancelTapRef.current = false), 120)
          if (pointerTypeRef.current === "touch") unlockScroll()
          if (movedRef.current) lastDragEndAt.current = performance.now()
          movedRef.current = false
        }
      },
    },
    { target: mainRef, eventOptions: { passive: false } },
  )

  useEffect(() => {
    const scrim = scrimRef.current
    if (!scrim) return

    const close = () => {
      if (performance.now() - openStartedAtRef.current < 250) return
      const el = focusedElRef.current
      if (!el) return
      const parent = el.parentElement as HTMLElement
      const overlay = viewerRef.current?.querySelector(".enlarge") as HTMLElement | null
      if (!overlay) return

      const refDiv = parent.querySelector(".item__image--reference") as HTMLElement | null

      const originalPos = originalTilePositionRef.current
      if (!originalPos) {
        overlay.remove()
        if (refDiv) refDiv.remove()
        parent.style.setProperty("--rot-y-delta", `0deg`)
        parent.style.setProperty("--rot-x-delta", `0deg`)
        el.style.visibility = ""
        ;(el.style as any).zIndex = 0
        focusedElRef.current = null
        rootRef.current?.removeAttribute("data-enlarging")
        openingRef.current = false
        return
      }

      const currentRect = overlay.getBoundingClientRect()
      const rootRect = rootRef.current!.getBoundingClientRect()

      const originalPosRelativeToRoot = {
        left: originalPos.left - rootRect.left,
        top: originalPos.top - rootRect.top,
        width: originalPos.width,
        height: originalPos.height,
      }

      const overlayRelativeToRoot = {
        left: currentRect.left - rootRect.left,
        top: currentRect.top - rootRect.top,
        width: currentRect.width,
        height: currentRect.height,
      }

      const animatingOverlay = document.createElement("div")
      animatingOverlay.className = "enlarge-closing"
      animatingOverlay.style.cssText = `
        position: absolute;
        left: ${overlayRelativeToRoot.left}px;
        top: ${overlayRelativeToRoot.top}px;
        width: ${overlayRelativeToRoot.width}px;
        height: ${overlayRelativeToRoot.height}px;
        z-index: 9999;
        border-radius: ${openedImageBorderRadius};
        overflow: hidden;
        box-shadow: 0 10px 30px rgba(0,0,0,.35);
        transition: all ${enlargeTransitionMs}ms ease-out;
        pointer-events: none;
        margin: 0;
        transform: none;
        filter: ${grayscale ? "grayscale(1)" : "none"};
        will-change: transform, opacity, left, top, width, height;
      `

      const originalImg = overlay.querySelector("img")
      if (originalImg) {
        const img = originalImg.cloneNode() as HTMLImageElement
        img.style.cssText = "width: 100%; height: 100%; object-fit: cover;"
        animatingOverlay.appendChild(img)
      }

      overlay.remove()
      rootRef.current!.appendChild(animatingOverlay)

      void animatingOverlay.getBoundingClientRect()

      requestAnimationFrame(() => {
        animatingOverlay.style.left = originalPosRelativeToRoot.left + "px"
        animatingOverlay.style.top = originalPosRelativeToRoot.top + "px"
        animatingOverlay.style.width = originalPosRelativeToRoot.width + "px"
        animatingOverlay.style.height = originalPosRelativeToRoot.height + "px"
        animatingOverlay.style.opacity = "0"
      })

      const cleanup = () => {
        animatingOverlay.remove()
        originalTilePositionRef.current = null

        if (refDiv) refDiv.remove()
        parent.style.transition = "none"
        el.style.transition = "none"

        parent.style.setProperty("--rot-y-delta", `0deg`)
        parent.style.setProperty("--rot-x-delta", `0deg`)

        requestAnimationFrame(() => {
          el.style.visibility = ""
          el.style.opacity = "0"
          ;(el.style as any).zIndex = 0
          focusedElRef.current = null
          rootRef.current?.removeAttribute("data-enlarging")

          requestAnimationFrame(() => {
            parent.style.transition = ""
            el.style.transition = "opacity 300ms ease-out"

            requestAnimationFrame(() => {
              el.style.opacity = "1"
              setTimeout(() => {
                el.style.transition = ""
                el.style.opacity = ""
                openingRef.current = false
                if (!draggingRef.current && rootRef.current?.getAttribute("data-enlarging") !== "true") {
                  document.body.classList.remove("dg-scroll-lock")
                }
              }, 300)
            })
          })
        })
      }

      animatingOverlay.addEventListener("transitionend", cleanup, {
        once: true,
      })
    }

    scrim.addEventListener("click", close)
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close()
    }
    window.addEventListener("keydown", onKey)

    return () => {
      scrim.removeEventListener("click", close)
      window.removeEventListener("keydown", onKey)
    }
  }, [enlargeTransitionMs, openedImageBorderRadius, grayscale])

  const openItemFromElement = useCallback(
    (el: HTMLElement) => {
      if (openingRef.current) return
      openingRef.current = true
      openStartedAtRef.current = performance.now()
      lockScroll()
      const parent = el.parentElement as HTMLElement
      focusedElRef.current = el
      el.setAttribute("data-focused", "true")
      const offsetX = getDataNumber(parent, "offsetX", 0)
      const offsetY = getDataNumber(parent, "offsetY", 0)
      const sizeX = getDataNumber(parent, "sizeX", 2)
      const sizeY = getDataNumber(parent, "sizeY", 2)
      const parentRot = computeItemBaseRotation(offsetX, offsetY, sizeX, sizeY, segments)
      const parentY = normalizeAngle(parentRot.rotateY)
      const globalY = normalizeAngle(rotationRef.current.y)
      let rotY = -(parentY + globalY) % 360
      if (rotY < -180) rotY += 360
      const rotX = -parentRot.rotateX - rotationRef.current.x
      parent.style.setProperty("--rot-y-delta", `${rotY}deg`)
      parent.style.setProperty("--rot-x-delta", `${rotX}deg`)
      const refDiv = document.createElement("div")
      refDiv.className = "item__image item__image--reference opacity-0"
      refDiv.style.transform = `rotateX(${-parentRot.rotateX}deg) rotateY(${-parentRot.rotateY}deg)`
      parent.appendChild(refDiv)

      void refDiv.offsetHeight

      const tileR = refDiv.getBoundingClientRect()
      const mainR = mainRef.current?.getBoundingClientRect()
      const frameR = frameRef.current?.getBoundingClientRect()

      if (!mainR || !frameR || tileR.width <= 0 || tileR.height <= 0) {
        openingRef.current = false
        focusedElRef.current = null
        parent.removeChild(refDiv)
        unlockScroll()
        return
      }

      originalTilePositionRef.current = {
        left: tileR.left,
        top: tileR.top,
        width: tileR.width,
        height: tileR.height,
      }
      el.style.visibility = "hidden"
      ;(el.style as any).zIndex = 0
      const overlay = document.createElement("div")
      overlay.className = "enlarge"
      overlay.style.cssText = `position:absolute; left:${frameR.left - mainR.left}px; top:${frameR.top - mainR.top}px; width:${frameR.width}px; height:${frameR.height}px; opacity:0; z-index:30; will-change:transform,opacity; transform-origin:top left; transition:transform ${enlargeTransitionMs}ms ease, opacity ${enlargeTransitionMs}ms ease; border-radius:${openedImageBorderRadius}; overflow:hidden; box-shadow:0 10px 30px rgba(0,0,0,.35);`
      const rawSrc = parent.dataset.src || (el.querySelector("img") as HTMLImageElement)?.src || ""
      const rawAlt = parent.dataset.alt || (el.querySelector("img") as HTMLImageElement)?.alt || ""
      const img = document.createElement("img")
      img.src = rawSrc
      img.alt = rawAlt
      img.style.cssText = `width:100%; height:100%; object-fit:cover; filter:${grayscale ? "grayscale(1)" : "none"};`
      overlay.appendChild(img)
      viewerRef.current!.appendChild(overlay)
      const tx0 = tileR.left - frameR.left
      const ty0 = tileR.top - frameR.top
      const sx0 = tileR.width / frameR.width
      const sy0 = tileR.height / frameR.height

      const validSx0 = isFinite(sx0) && sx0 > 0 ? sx0 : 1
      const validSy0 = isFinite(sy0) && sy0 > 0 ? sy0 : 1

      overlay.style.transform = `translate3d(${tx0}px, ${ty0}px, 0) scale3d(${validSx0}, ${validSy0}, 1)`
      setTimeout(() => {
        if (!overlay.parentElement) return
        overlay.style.opacity = "1"
        overlay.style.transform = "translate3d(0, 0, 0) scale3d(1, 1, 1)"
        rootRef.current?.setAttribute("data-enlarging", "true")
      }, 16)
      const wantsResize = openedImageWidth || openedImageHeight
      if (wantsResize) {
        const onFirstEnd = (ev: TransitionEvent) => {
          if (ev.propertyName !== "transform") return
          overlay.removeEventListener("transitionend", onFirstEnd)
          const prevTransition = overlay.style.transition
          overlay.style.transition = "none"
          const tempWidth = openedImageWidth || `${frameR.width}px`
          const tempHeight = openedImageHeight || `${frameR.height}px`
          overlay.style.width = tempWidth
          overlay.style.height = tempHeight
          const newRect = overlay.getBoundingClientRect()
          overlay.style.width = frameR.width + "px"
          overlay.style.height = frameR.height + "px"
          void overlay.offsetWidth
          overlay.style.transition = `left ${enlargeTransitionMs}ms ease, top ${enlargeTransitionMs}ms ease, width ${enlargeTransitionMs}ms ease, height ${enlargeTransitionMs}ms ease`
          const centeredLeft = frameR.left - mainR.left + (frameR.width - newRect.width) / 2
          const centeredTop = frameR.top - mainR.top + (frameR.height - newRect.height) / 2
          requestAnimationFrame(() => {
            overlay.style.left = `${centeredLeft}px`
            overlay.style.top = `${centeredTop}px`
            overlay.style.width = tempWidth
            overlay.style.height = tempHeight
          })
          const cleanupSecond = () => {
            overlay.removeEventListener("transitionend", cleanupSecond)
            overlay.style.transition = prevTransition
          }
          overlay.addEventListener("transitionend", cleanupSecond, {
            once: true,
          })
        }
        overlay.addEventListener("transitionend", onFirstEnd)
      }
    },
    [
      segments,
      lockScroll,
      unlockScroll,
      enlargeTransitionMs,
      openedImageBorderRadius,
      grayscale,
      openedImageWidth,
      openedImageHeight,
    ],
  )

  useEffect(() => {
    return () => {
      document.body.classList.remove("dg-scroll-lock")
    }
  }, [])

  const getScatterFactor = useCallback(() => {
    if (isLoading || !initialTransition || animatedScatterFactor > 0.01) {
      return animatedScatterFactor
    }
    return 1 - (zoomLevel - MIN_ZOOM) / (MAX_ZOOM - MIN_ZOOM)
  }, [isLoading, initialTransition, animatedScatterFactor, zoomLevel])

  const scatterFactor = getScatterFactor()

  const cssStyles = `
    .sphere-root {
      --radius: 520px;
      --viewer-pad: 72px;
      --circ: calc(var(--radius) * 3.14);
      --rot-y: calc((360deg / var(--segments-x)) / 2);
      --rot-x: calc((360deg / var(--segments-y)) / 2);
      --item-width: calc(var(--circ) / var(--segments-x));
      --item-height: calc(var(--circ) / var(--segments-y));
    }
    
    .sphere-root * { box-sizing: border-box; }
    .sphere, .sphere-item, .item__image { 
      transform-style: preserve-3d;
      -webkit-transform-style: preserve-3d;
    }
    
    .stage {
      width: 100%;
      height: 100%;
      display: grid;
      place-items: center;
      position: absolute;
      inset: 0;
      margin: auto;
      perspective: calc(var(--radius) * 2);
      perspective-origin: 50% 50%;
    }
    
    .sphere {
      transform: translate3d(0, 0, calc(var(--radius) * -1));
      will-change: transform;
      position: absolute;
      contain: layout style;
    }
    
    .sphere-item {
      width: calc(var(--item-width) * var(--item-size-x));
      height: calc(var(--item-height) * var(--item-size-y));
      position: absolute;
      top: -999px;
      bottom: -999px;
      left: -999px;
      right: -999px;
      margin: auto;
      transform-origin: 50% 50%;
      backface-visibility: hidden;
      -webkit-backface-visibility: hidden;
      contain: layout style paint;
    }
    
    .sphere-root[data-enlarging="true"] .scrim {
      opacity: 1 !important;
      pointer-events: all !important;
    }
    
    @media (max-aspect-ratio: 1/1) {
      .viewer-frame {
        height: auto !important;
        width: 100% !important;
      }
    }
    
    .item__image {
      position: absolute;
      inset: 10px;
      border-radius: var(--tile-radius, 12px);
      overflow: hidden;
      cursor: pointer;
      backface-visibility: hidden;
      -webkit-backface-visibility: hidden;
      pointer-events: auto;
      transform: translateZ(0);
      -webkit-transform: translateZ(0);
      contain: layout style paint;
    }
    
    .item__image--reference {
      position: absolute;
      inset: 10px;
      pointer-events: none;
    }
    
    @media (max-width: 767px) {
      .sphere-root {
        --viewer-pad: 24px;
      }
      
      .sphere-item {
        width: calc(var(--item-width) * var(--item-size-x) * 0.8);
        height: calc(var(--item-height) * var(--item-size-y) * 0.8);
      }
      
      .item__image {
        inset: 5px;
      }
      
      .loading-spinner {
        width: 48px !important;
        height: 48px !important;
      }
      
      .loading-text {
        font-size: 12px !important;
        letter-spacing: 2px !important;
      }
      
      .loading-progress {
        width: 160px !important;
      }
    }
    
    .loading-screen {
      position: absolute;
      inset: 0;
      z-index: 100;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #060010 0%, #0a0015 50%, #060010 100%);
      transition: opacity 800ms ease-out, visibility 800ms ease-out;
    }
    
    .loading-screen.hidden {
      opacity: 0;
      visibility: hidden;
      pointer-events: none;
    }
    
    .loading-spinner {
      width: 60px;
      height: 60px;
      border: 3px solid rgba(255, 255, 255, 0.1);
      border-top-color: rgba(255, 255, 255, 0.8);
      border-radius: 50%;
      animation: spin 1.5s linear infinite;
    }
    
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    
    .loading-text {
      margin-top: 24px;
      color: rgba(255, 255, 255, 0.7);
      font-size: 14px;
      letter-spacing: 3px;
      text-transform: uppercase;
    }
    
    .loading-subtext {
      margin-top: 8px;
      color: rgba(255, 255, 255, 0.4);
      font-size: 12px;
      font-style: italic;
      letter-spacing: 1px;
    }
    
    .loading-progress {
      margin-top: 24px;
      width: 200px;
      height: 2px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 2px;
      overflow: hidden;
    }
    
    .loading-progress-bar {
      height: 100%;
      background: linear-gradient(90deg, rgba(100, 150, 255, 0.6), rgba(150, 100, 255, 0.6));
      border-radius: 2px;
      transition: width 300ms ease-out;
    }
    
    .loading-percentage {
      margin-top: 12px;
      color: rgba(255, 255, 255, 0.4);
      font-size: 12px;
      font-variant-numeric: tabular-nums;
    }
  `

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: cssStyles }} />
      <div
        ref={rootRef}
        className="sphere-root relative w-full h-full"
        style={
          {
            ["--segments-x" as any]: segments,
            ["--segments-y" as any]: segments,
            ["--overlay-blur-color" as any]: overlayBlurColor,
            ["--tile-radius" as any]: imageBorderRadius,
            ["--enlarge-radius" as any]: openedImageBorderRadius,
            ["--image-filter" as any]: grayscale ? "grayscale(1)" : "none",
          } as React.CSSProperties
        }
      >
        <div className={`loading-screen ${!isLoading ? "hidden" : ""}`}>
          <div className="loading-spinner" />
          <div className="loading-text">Gathering Memories</div>
          <div className="loading-subtext">Please wait...</div>
          <div className="loading-progress">
            <div className="loading-progress-bar" style={{ width: `${loadingProgress}%` }} />
          </div>
          <div className="loading-percentage">{loadingProgress}%</div>
        </div>

        <main
          ref={mainRef}
          className="absolute inset-0 grid place-items-center overflow-hidden select-none bg-transparent"
          style={{
            touchAction: "none",
            WebkitUserSelect: "none",
          }}
        >
          <div className="stage">
            <div ref={sphereRef} className="sphere">
              {items.map((item, i) => (
                <SphereItem
                  key={`${item.x},${item.y},${i}`}
                  item={item}
                  index={i}
                  scatter={scatterPositions[i]}
                  scatterFactor={scatterFactor}
                  imageBorderRadius={imageBorderRadius}
                  grayscale={grayscale}
                  onItemClick={openItemFromElement}
                  draggingRef={draggingRef}
                  movedRef={movedRef}
                  lastDragEndAt={lastDragEndAt}
                  openingRef={openingRef}
                />
              ))}
            </div>
          </div>

          <div
            className="absolute inset-0 m-auto z-[3] pointer-events-none"
            style={{
              backgroundImage: `radial-gradient(rgba(235, 235, 235, 0) 65%, var(--overlay-blur-color, ${overlayBlurColor}) 100%)`,
            }}
          />

          <div
            className="absolute inset-0 m-auto z-[3] pointer-events-none"
            style={{
              WebkitMaskImage: `radial-gradient(rgba(235, 235, 235, 0) 70%, var(--overlay-blur-color, ${overlayBlurColor}) 90%)`,
              maskImage: `radial-gradient(rgba(235, 235, 235, 0) 70%, var(--overlay-blur-color, ${overlayBlurColor}) 90%)`,
              backdropFilter: "blur(3px)",
            }}
          />

          <div
            className="absolute left-0 right-0 top-0 h-[120px] z-[5] pointer-events-none rotate-180"
            style={{
              background: `linear-gradient(to bottom, transparent, var(--overlay-blur-color, ${overlayBlurColor}))`,
            }}
          />
          <div
            className="absolute left-0 right-0 bottom-0 h-[120px] z-[5] pointer-events-none"
            style={{
              background: `linear-gradient(to bottom, transparent, var(--overlay-blur-color, ${overlayBlurColor}))`,
            }}
          />

          <div
            ref={viewerRef}
            className="absolute inset-0 z-20 pointer-events-none flex items-center justify-center"
            style={{ padding: "var(--viewer-pad)" }}
          >
            <div
              ref={scrimRef}
              className="scrim absolute inset-0 z-10 pointer-events-none opacity-0 transition-opacity duration-500"
              style={{
                background: "rgba(0, 0, 0, 0.4)",
                backdropFilter: "blur(3px)",
              }}
            />
            <div ref={frameRef} className="viewer-frame relative aspect-square h-3/4 z-20 pointer-events-none" />
          </div>
        </main>

        {!isLoading && animatedScatterFactor < 0.01 && (
          <div className="absolute bottom-20 md:bottom-20 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center gap-2">
            <div className="w-1 h-16 md:h-20 bg-white/10 rounded-full overflow-hidden">
              <div
                className="w-full bg-white/50 rounded-full transition-all duration-150"
                style={{
                  height: `${((zoomLevel - MIN_ZOOM) / (MAX_ZOOM - MIN_ZOOM)) * 100}%`,
                  marginTop: `${100 - ((zoomLevel - MIN_ZOOM) / (MAX_ZOOM - MIN_ZOOM)) * 100}%`,
                }}
              />
            </div>
            {isMobile && <span className="text-white/40 text-xs mt-1">Pinch to zoom</span>}
          </div>
        )}
      </div>
    </>
  )
}
