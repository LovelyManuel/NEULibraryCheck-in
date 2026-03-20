
"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker } from "react-day-picker"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

export type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({
  className,
  classNames,
  showOutsideDays = false,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-4 w-full",
        caption: "flex justify-center items-center h-10 relative mb-4",
        caption_label: "text-sm font-bold tracking-tight text-slate-900 dark:text-slate-100",
        nav: "flex items-center absolute left-0 right-0 justify-between pointer-events-none px-1",
        nav_button: cn(
          buttonVariants({ variant: "outline" }),
          "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 rounded-lg border-slate-200 dark:border-slate-800 pointer-events-auto transition-all"
        ),
        month_grid: "w-full border-collapse",
        weekdays: "flex w-full justify-center mb-2",
        weekday: "text-slate-400 dark:text-slate-500 rounded-md w-9 font-bold text-[10px] uppercase tracking-widest text-center",
        week: "flex w-full mt-1 justify-center",
        day: cn(
          buttonVariants({ variant: "ghost" }),
          "h-9 w-9 p-0 font-medium rounded-md transition-all flex items-center justify-center mx-auto aria-selected:opacity-100"
        ),
        range_start: "day-range-start rounded-r-none bg-primary text-primary-foreground",
        range_end: "day-range-end rounded-l-none bg-primary text-primary-foreground",
        range_middle: "aria-selected:bg-primary/10 aria-selected:text-primary dark:aria-selected:bg-primary/20 rounded-none",
        selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground shadow-lg shadow-primary/30 opacity-100",
        today: "relative font-bold text-primary ring-1 ring-primary/20 rounded-md",
        outside: "day-outside text-slate-300 dark:text-slate-600 opacity-20",
        disabled: "text-slate-300 dark:text-slate-600 opacity-50",
        hidden: "invisible",
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation }) => {
          const Icon = orientation === "left" ? ChevronLeft : ChevronRight;
          return <Icon className="h-4 w-4" />;
        },
      }}
      weekStartsOn={1}
      {...props}
    />
  )
}
Calendar.displayName = "Calendar"

export { Calendar }
