"use client"

import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp } from "lucide-react"
import { cn } from "@/lib/utils"
import { ButtonHTMLAttributes } from "react"

interface NavigatorButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  activeColor?: string
  isActive: boolean
}

const buttonBase =
  "w-9 h-9 rounded-full flex items-center justify-center shadow-xl shadow-black/25 transition-all duration-200 border border-white/10 backdrop-blur pointer-events-auto"

const activeClasses =
  "bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"

const inactiveClasses =
  "bg-[#1F2A3C]/90 text-[#4B5B70] cursor-not-allowed opacity-70"

function NavigatorButton({ isActive, className, ...props }: NavigatorButtonProps) {
  return (
    <button
      type="button"
      disabled={!isActive}
      className={cn(
        buttonBase,
        isActive ? activeClasses : inactiveClasses,
        className
      )}
      {...props}
    />
  )
}

interface FloatingNavigatorProps {
  canScrollUp: boolean
  canScrollDown: boolean
  onScrollUp: () => void
  onScrollDown: () => void
  canGoPrevious: boolean
  canGoNext: boolean
  onPrevious: () => void
  onNext: () => void
  rightOffset?: number
}

export function FloatingNavigator({
  canScrollUp,
  canScrollDown,
  onScrollUp,
  onScrollDown,
  canGoPrevious,
  canGoNext,
  onPrevious,
  onNext,
  rightOffset = 16,
}: FloatingNavigatorProps) {
  const buttonSize = 36 // px (w-9)
  const spacing = 26 // distance from center to each button
  const containerSize = buttonSize + spacing * 2
  const center = containerSize / 2

  const getStyle = (x: number, y: number) => ({
    left: `${x}px`,
    top: `${y}px`,
    transform: "translate(-50%, -50%)",
  })

  return (
    <div
      className="fixed bottom-4 z-40 pointer-events-none"
      style={{ right: rightOffset }}
    >
      <div
        className="relative pointer-events-auto"
        style={{ width: containerSize, height: containerSize }}
      >
        <NavigatorButton
          aria-label="Subir"
          isActive={canScrollUp}
          onClick={onScrollUp}
          className="absolute"
          style={getStyle(center, center - spacing)}
        >
          <ArrowUp className="w-4 h-4" />
        </NavigatorButton>

        <NavigatorButton
          aria-label="Anterior"
          isActive={canGoPrevious}
          onClick={onPrevious}
          className="absolute"
          style={getStyle(center - spacing, center)}
        >
          <ArrowLeft className="w-4 h-4" />
        </NavigatorButton>

        <div
          className="absolute w-2.5 h-2.5 rounded-full bg-white/30 shadow-inner shadow-black/30"
          style={getStyle(center, center)}
        />

        <NavigatorButton
          aria-label="Siguiente"
          isActive={canGoNext}
          onClick={onNext}
          className="absolute"
          style={getStyle(center + spacing, center)}
        >
          <ArrowRight className="w-4 h-4" />
        </NavigatorButton>

        <NavigatorButton
          aria-label="Bajar"
          isActive={canScrollDown}
          onClick={onScrollDown}
          className="absolute"
          style={getStyle(center, center + spacing)}
        >
          <ArrowDown className="w-4 h-4" />
        </NavigatorButton>
      </div>
    </div>
  )
}
