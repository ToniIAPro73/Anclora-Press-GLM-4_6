"use client"

import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp } from "lucide-react"
import { cn } from "@/lib/utils"
import { ButtonHTMLAttributes } from "react"

interface NavigatorButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  activeColor?: string
  isActive: boolean
}

const buttonBase =
  "w-10 h-10 rounded-full flex items-center justify-center shadow-xl shadow-black/25 transition-all duration-200 border border-white/10 backdrop-blur pointer-events-auto"

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
}: FloatingNavigatorProps) {
  return (
    <div className="fixed bottom-4 right-4 z-40 pointer-events-none">
      <div className="grid grid-cols-3 grid-rows-3 gap-1.5 pointer-events-auto">
        <div />
        <NavigatorButton
          aria-label="Subir"
          isActive={canScrollUp}
          onClick={onScrollUp}
          className="col-start-2 row-start-1"
        >
          <ArrowUp className="w-4 h-4" />
        </NavigatorButton>
        <div />

        <NavigatorButton
          aria-label="Anterior"
          isActive={canGoPrevious}
          onClick={onPrevious}
          className="col-start-1 row-start-2"
        >
          <ArrowLeft className="w-4 h-4" />
        </NavigatorButton>

        <div className="col-start-2 row-start-2 w-3 h-3 rounded-full bg-white/30 shadow-inner shadow-black/30 place-self-center" />

        <NavigatorButton
          aria-label="Siguiente"
          isActive={canGoNext}
          onClick={onNext}
          className="col-start-3 row-start-2"
        >
          <ArrowRight className="w-4 h-4" />
        </NavigatorButton>

        <div />
        <NavigatorButton
          aria-label="Bajar"
          isActive={canScrollDown}
          onClick={onScrollDown}
          className="col-start-2 row-start-3"
        >
          <ArrowDown className="w-4 h-4" />
        </NavigatorButton>
        <div />
      </div>
    </div>
  )
}
