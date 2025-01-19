import * as React from "react"
import { VariantProps, cva } from "class-variance-authority"
import { cn } from "@/lib/utils"

const SIDEBAR_COOKIE_NAME = "sidebar-state"
const SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 365 // 1 year

type SidebarContextValue = {
  open: boolean
  setOpen: (value: boolean | ((value: boolean) => boolean)) => void
  collapsible?: "icon" | "overlay"
}

const SidebarContext = React.createContext<SidebarContextValue | undefined>(undefined)

interface SidebarProviderProps extends React.PropsWithChildren {
  defaultOpen?: boolean
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

function SidebarProvider({
  children,
  defaultOpen = true,
  open: openProp,
  onOpenChange: setOpenProp,
}: SidebarProviderProps) {
  const [_open, _setOpen] = React.useState(defaultOpen)
  const open = openProp ?? _open
  
  const setOpen = React.useCallback(
    (value: boolean | ((value: boolean) => boolean)) => {
      const openState = typeof value === "function" ? value(open) : value
      if (setOpenProp) {
        setOpenProp(openState)
      } else {
        _setOpen(openState)
      }
      document.cookie = `${SIDEBAR_COOKIE_NAME}=${openState}; path=/; max-age=${SIDEBAR_COOKIE_MAX_AGE}`
    },
    [setOpenProp, open]
  )

  return (
    <SidebarContext.Provider value={{ open, setOpen }}>
      {children}
    </SidebarContext.Provider>
  )
}

const sidebarVariants = cva(
  "relative h-full border-r bg-sidebar-background text-sidebar-foreground",
  {
    variants: {
      variant: {
        default: "",
        floating: "m-2 rounded-lg border shadow-lg",
      },
      side: {
        left: "",
        right: "right-0",
      },
      collapsible: {
        icon: [
          "transition-[width] duration-300",
          "data-[state=closed]:w-[4rem] data-[state=open]:w-[16rem]",
        ],
        overlay: [
          "fixed top-0 z-50",
          "transition-transform duration-300",
          "data-[state=closed]:-translate-x-full data-[state=open]:translate-x-0",
        ],
      },
    },
    defaultVariants: {
      variant: "default",
      side: "left",
    },
  }
)

interface SidebarProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof sidebarVariants> {}

function Sidebar({
  className,
  variant,
  side,
  collapsible,
  ...props
}: SidebarProps) {
  const context = React.useContext(SidebarContext)
  if (!context) {
    throw new Error("Sidebar must be used within a SidebarProvider")
  }

  const { open } = context

  return (
    <div
      data-state={open ? "open" : "closed"}
      className={cn(sidebarVariants({ variant, side, collapsible }), className)}
      {...props}
    />
  )
}

function SidebarTrigger() {
  const context = React.useContext(SidebarContext)
  if (!context) {
    throw new Error("SidebarTrigger must be used within a SidebarProvider")
  }

  const { setOpen } = context

  return (
    <button
      onClick={() => setOpen((prev) => !prev)}
      className="inline-flex h-10 w-10 items-center justify-center"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <line x1="3" y1="12" x2="21" y2="12" />
        <line x1="3" y1="6" x2="21" y2="6" />
        <line x1="3" y1="18" x2="21" y2="18" />
      </svg>
    </button>
  )
}

const SidebarHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("sticky top-0 border-b bg-sidebar-background", className)}
    {...props}
  />
))
SidebarHeader.displayName = "SidebarHeader"

const SidebarContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-1 flex-col overflow-hidden", className)}
    {...props}
  />
))
SidebarContent.displayName = "SidebarContent"

const SidebarFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("sticky bottom-0 border-t bg-sidebar-background", className)}
    {...props}
  />
))
SidebarFooter.displayName = "SidebarFooter"

export {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarProvider,
  SidebarTrigger,
}
