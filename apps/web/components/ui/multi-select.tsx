'use client'

import * as React from 'react'
import { Check, ChevronsUpDown, X, Search } from 'lucide-react'
import * as Popover from '@radix-ui/react-popover'

import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'

export interface MultiSelectOption {
  value: string
  label: string
  disabled?: boolean
}

interface MultiSelectProps {
  options: MultiSelectOption[]
  selected: string[]
  onChange: (selected: string[]) => void
  placeholder?: string
  emptyMessage?: string
  className?: string
  maxDisplayed?: number
}

export function MultiSelect({
  options,
  selected,
  onChange,
  placeholder = 'Select...',
  emptyMessage = 'No options found.',
  className,
  maxDisplayed = 2,
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState('')

  const handleSelect = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter((v) => v !== value))
    } else {
      onChange([...selected, value])
    }
  }

  const handleRemove = (value: string, e: React.MouseEvent) => {
    e.stopPropagation()
    onChange(selected.filter((v) => v !== value))
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange([])
  }

  const filteredOptions = options.filter((option) =>
    option.label.toLowerCase().includes(search.toLowerCase())
  )

  const displayedItems = selected.slice(0, maxDisplayed)
  const remainingCount = selected.length - maxDisplayed

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <div
          role="combobox"
          aria-expanded={open}
          tabIndex={0}
          className={cn(
            "border-border data-[placeholder]:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 flex min-h-9 w-full items-center justify-between gap-2 rounded-md border bg-input/50 hover:bg-input/70 px-3 py-1.5 text-sm shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer",
            className
          )}
        >
          <div className="flex flex-1 flex-wrap items-center gap-1 overflow-hidden">
            {selected.length === 0 ? (
              <span className="text-muted-foreground">{placeholder}</span>
            ) : (
              <>
                {displayedItems.map((value) => {
                  const option = options.find((o) => o.value === value)
                  return (
                    <Badge
                      key={value}
                      variant="secondary"
                      className="h-5 gap-1 px-1.5 text-xs font-normal"
                    >
                      <span className="truncate max-w-[100px]">
                        {option?.label ?? value}
                      </span>
                      <span
                        role="button"
                        tabIndex={0}
                        className="ml-0.5 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 cursor-pointer"
                        onClick={(e) => handleRemove(value, e)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault()
                            handleRemove(value, e as unknown as React.MouseEvent)
                          }
                        }}
                      >
                        <X className="h-3 w-3" />
                        <span className="sr-only">Remove {option?.label}</span>
                      </span>
                    </Badge>
                  )
                })}
                {remainingCount > 0 && (
                  <Badge
                    variant="secondary"
                    className="h-5 px-1.5 text-xs font-normal"
                  >
                    +{remainingCount} more
                  </Badge>
                )}
              </>
            )}
          </div>
          <div className="flex items-center gap-1">
            {selected.length > 0 && (
              <span
                role="button"
                tabIndex={0}
                className="rounded-sm opacity-50 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 cursor-pointer"
                onClick={handleClear}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    handleClear(e as unknown as React.MouseEvent)
                  }
                }}
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Clear all</span>
              </span>
            )}
            <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
          </div>
        </div>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          className="bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 w-[var(--radix-popover-trigger-width)] min-w-[200px] overflow-hidden rounded-md border p-0 shadow-md"
          sideOffset={4}
          align="start"
        >
          <div className="flex flex-col">
            {/* Search input */}
            <div className="flex items-center border-b px-3">
              <Search className="h-4 w-4 shrink-0 opacity-50 mr-2" />
              <input
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex h-9 w-full bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
            
            {/* Options list */}
            <div className="max-h-[200px] overflow-y-auto overflow-x-hidden p-1">
              {filteredOptions.length === 0 ? (
                <div className="py-6 text-center text-sm text-muted-foreground">
                  {emptyMessage}
                </div>
              ) : (
                filteredOptions.map((option) => {
                  const isSelected = selected.includes(option.value)
                  return (
                    <div
                      key={option.value}
                      role="option"
                      aria-selected={isSelected}
                      data-disabled={option.disabled || undefined}
                      onClick={() => !option.disabled && handleSelect(option.value)}
                      className={cn(
                        "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground",
                        option.disabled && "pointer-events-none opacity-50"
                      )}
                    >
                      <div
                        className={cn(
                          "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                          isSelected
                            ? "bg-primary text-primary-foreground"
                            : "opacity-50 [&_svg]:invisible"
                        )}
                      >
                        <Check className="h-3 w-3" />
                      </div>
                      <span>{option.label}</span>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}
