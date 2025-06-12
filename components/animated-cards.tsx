"use client"

import { Children } from "react"

import { cn } from "@/lib/utils"
import { useEffect, useRef, useState, useCallback } from "react"

interface AnimatedCardsProps {
  className?: string
  children: React.ReactNode[]
  interval?: number
  direction?: "horizontal" | "vertical"
}

export function AnimatedCards({ className, children, interval = 3000, direction = "horizontal" }: AnimatedCardsProps) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const childArray = Children.toArray(children)

  const nextCard = useCallback(() => {
    if (isAnimating) return

    setIsAnimating(true)
    setActiveIndex((prev) => (prev + 1) % childArray.length)

    setTimeout(() => {
      setIsAnimating(false)
    }, 600) // Match this with the CSS transition duration
  }, [isAnimating, childArray.length])

  useEffect(() => {
    timerRef.current = setInterval(nextCard, interval)

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [nextCard, interval])

  const getCardClassName = (index: number) => {
    if (index === activeIndex) {
      return "opacity-100 scale-100 z-20"
    } else if (index === activeIndex + 1 || (activeIndex === childArray.length - 1 && index === 0)) {
      return direction === "horizontal"
        ? "opacity-70 scale-95 translate-x-[40%] z-10"
        : "opacity-70 scale-95 translate-y-[40%] z-10"
    } else {
      return direction === "horizontal"
        ? "opacity-50 scale-90 -translate-x-[40%] z-0"
        : "opacity-50 scale-90 -translate-y-[40%] z-0"
    }
  }

  return (
    <div className={cn("relative w-full h-full", className)}>
      {childArray.map((child, index) => (
        <div
          key={index}
          className={cn("absolute inset-0 transition-all duration-600 ease-in-out", getCardClassName(index))}
          onClick={nextCard}
        >
          {child}
        </div>
      ))}

      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
        {childArray.map((_, index) => (
          <button
            key={index}
            className={cn("w-2 h-2 rounded-full transition-all", index === activeIndex ? "bg-primary w-4" : "bg-muted")}
            onClick={() => {
              if (isAnimating) return
              setIsAnimating(true)
              setActiveIndex(index)
              setTimeout(() => setIsAnimating(false), 600)
            }}
          />
        ))}
      </div>
    </div>
  )
}
