"use client"

import { useThemeStore } from "@/shared/theme/store"
import { Toaster as Sonner, type ToasterProps } from "sonner"
import { HugeiconsIcon } from "@hugeicons/react"
import { Tick02Icon, InformationCircleIcon, Alert02Icon, Cancel01Icon, Loading03Icon } from "@hugeicons/core-free-icons"

/** The icon in a round tile, like the confirm alert's — tinted from the toast's own text colour. */
const tile = (icon: typeof Tick02Icon, spin = false) => (
  <span className="grid size-8 place-items-center rounded-full bg-current/15">
    <HugeiconsIcon icon={icon} strokeWidth={2.4} className={spin ? "size-4 animate-spin" : "size-4"} />
  </span>
)

/**
 * Toasts in the same language as our alerts and menus: a rounded card with a soft deep shadow and
 * the icon in a round tile. Success = solid green, error = solid red (the outcome reads at a
 * glance); loading / info / warning = the frosted neutral card the menus use.
 */
const Toaster = ({ ...props }: ToasterProps) => {
  const theme = useThemeStore((s) => s.theme)

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      icons={{
        success: tile(Tick02Icon),
        info: tile(InformationCircleIcon),
        warning: tile(Alert02Icon),
        error: tile(Cancel01Icon),
        loading: tile(Loading03Icon, true),
      }}
      toastOptions={{
        unstyled: true,
        classNames: {
          toast:
            "cn-toast flex w-(--width) items-center gap-3 rounded-2xl bg-popover/85 p-3 pe-4 text-popover-foreground shadow-2xl shadow-foreground/10 backdrop-blur-xl",
          icon: "relative grid size-8 flex-none place-items-center",
          loader: "static! transform-none!",
          title: "text-sm leading-snug font-semibold text-pretty",
          description: "text-xs opacity-80",
          success: "bg-success! text-success-foreground!",
          error: "bg-destructive! text-destructive-foreground!",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
