'use client'

import { useCallback, useEffect, useState } from 'react'
import useEmblaCarousel from 'embla-carousel-react'
import Autoplay from 'embla-carousel-autoplay'
import Image from 'next/image'
import { ChevronLeftIcon, ChevronRightIcon, EnterFullScreenIcon } from '@radix-ui/react-icons'
import type { ProductImage } from '@/lib/db/schema'
import { cn } from '@/lib/utils'

interface ProductCarouselProps {
  images: ProductImage[]
  productName: string
  className?: string
}

export function ProductCarousel({ images, productName, className }: ProductCarouselProps) {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [lightboxOpen, setLightboxOpen] = useState(false)

  const [mainRef, mainApi] = useEmblaCarousel({ loop: true }, [
    Autoplay({ delay: 4000, stopOnInteraction: true }),
  ])
  const [thumbRef, thumbApi] = useEmblaCarousel({
    containScroll: 'keepSnaps',
    dragFree: true,
  })

  const onThumbClick = useCallback(
    (index: number) => {
      if (!mainApi || !thumbApi) return
      mainApi.scrollTo(index)
    },
    [mainApi, thumbApi]
  )

  const onSelect = useCallback(() => {
    if (!mainApi || !thumbApi) return
    setSelectedIndex(mainApi.selectedScrollSnap())
    thumbApi.scrollTo(mainApi.selectedScrollSnap())
  }, [mainApi, thumbApi, setSelectedIndex])

  useEffect(() => {
    if (!mainApi) return
    onSelect()
    mainApi.on('select', onSelect)
    mainApi.on('reInit', onSelect)
  }, [mainApi, onSelect])

  const scrollPrev = useCallback(() => mainApi?.scrollPrev(), [mainApi])
  const scrollNext = useCallback(() => mainApi?.scrollNext(), [mainApi])

  if (images.length === 0) {
    return (
      <div className={cn('aspect-square bg-brand-arctic border border-brand-border rounded-sm flex items-center justify-center', className)}>
        <div className="text-center text-brand-muted">
          <div className="text-4xl mb-2">🖨️</div>
          <p className="text-sm">No image</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className={cn('select-none', className)}>
        {/* Main carousel */}
        <div className="relative group">
          <div className="overflow-hidden rounded-sm" ref={mainRef}>
            <div className="flex touch-pan-y">
              {images.map((image, i) => (
                <div
                  key={image.id}
                  className="relative min-w-0 flex-[0_0_100%] aspect-square bg-brand-arctic cursor-zoom-in"
                  onClick={() => setLightboxOpen(true)}
                >
                  <Image
                    src={image.url}
                    alt={image.alt || `${productName} ${i + 1}`}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 50vw"
                    priority={i === 0}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <button
                    className="absolute top-3 right-3 p-2 bg-brand-surface/90 border border-brand-border rounded-sm opacity-0 group-hover:opacity-100 transition-opacity text-brand-muted hover:text-brand-blue shadow-sm"
                    onClick={(e) => { e.stopPropagation(); setLightboxOpen(true) }}
                  >
                    <EnterFullScreenIcon className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Nav buttons */}
          {images.length > 1 && (
            <>
              <button
                onClick={scrollPrev}
                className="absolute left-3 top-1/2 -translate-y-1/2 p-2 bg-brand-surface/90 border border-brand-border rounded-sm text-brand-muted hover:text-brand-blue hover:border-brand-blue transition-all opacity-0 group-hover:opacity-100 shadow-sm"
              >
                <ChevronLeftIcon className="w-5 h-5" />
              </button>
              <button
                onClick={scrollNext}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-brand-surface/90 border border-brand-border rounded-sm text-brand-muted hover:text-brand-blue hover:border-brand-blue transition-all opacity-0 group-hover:opacity-100 shadow-sm"
              >
                <ChevronRightIcon className="w-5 h-5" />
              </button>
            </>
          )}

          {/* Dot indicators */}
          {images.length > 1 && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
              {images.map((_, i) => (
                <button
                  key={i}
                  onClick={() => mainApi?.scrollTo(i)}
                  className={cn(
                    'h-1.5 rounded-full transition-all duration-300',
                    i === selectedIndex
                      ? 'w-6 bg-brand-blue'
                      : 'w-1.5 bg-brand-surface/70 hover:bg-brand-surface'
                  )}
                />
              ))}
            </div>
          )}
        </div>

        {/* Thumbnails */}
        {images.length > 1 && (
          <div className="overflow-hidden mt-3" ref={thumbRef}>
            <div className="flex gap-2 touch-pan-y">
              {images.map((image, i) => (
                <button
                  key={image.id}
                  onClick={() => onThumbClick(i)}
                  className={cn(
                    'relative flex-[0_0_72px] aspect-square rounded-sm overflow-hidden border-2 transition-all',
                    i === selectedIndex
                      ? 'border-brand-blue'
                      : 'border-brand-border opacity-60 hover:opacity-100 hover:border-brand-slate'
                  )}
                >
                  <Image
                    src={image.url}
                    alt={image.alt || `${productName} ${i + 1}`}
                    fill
                    className="object-cover"
                    sizes="72px"
                  />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightboxOpen(false)}
        >
          <button
            className="absolute top-4 right-4 p-2 text-white/70 hover:text-white"
            onClick={() => setLightboxOpen(false)}
          >
            ✕
          </button>
          <div
            className="relative max-w-4xl max-h-[90vh] w-full aspect-square"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={images[selectedIndex].url}
              alt={images[selectedIndex].alt || productName}
              fill
              className="object-contain"
              sizes="90vw"
            />
          </div>
        </div>
      )}
    </>
  )
}
