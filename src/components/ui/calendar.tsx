
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
        caption: "flex justify-center items-center h-10 relative mb-4 px-10",
        caption_label: "text-base font-bold tracking-tight text-slate-900 dark:text-slate-100 font-headline",
        nav: "flex items-center absolute left-0 right-0 justify-between px-4 h-10 pointer-events-none",
        button_previous: cn(
          buttonVariants({ variant: "ghost" }),
          "h-8 w-8 bg-transparent p-0 text-slate-400 hover:text-primary hover:bg-primary/10 dark:hover:bg-primary/20 transition-all z-20 cursor-pointer rounded-xl pointer-events-auto"
        ),
        button_next: cn(
          buttonVariants({ variant: "ghost" }),
          "h-8 w-8 bg-transparent p-0 text-slate-400 hover:text-primary hover:bg-primary/10 dark:hover:bg-primary/20 transition-all z-20 cursor-pointer rounded-xl pointer-events-auto"
        ),
        month_grid: "w-full border-collapse",
        weekdays: "flex w-full justify-center mb-6",
        weekday: "text-slate-400 dark:text-slate-500 rounded-md w-9 font-bold text-[10px] uppercase tracking-widest text-center font-headline",
        week: "flex w-full mt-1 justify-center",
        day: cn(
          buttonVariants({ variant: "ghost" }),
          "h-10 w-10 p-0 font-medium rounded-xl transition-all flex items-center justify-center mx-auto aria-selected:opacity-100 font-headline text-sm"
        ),
        range_start: "day-range-start rounded-r-none bg-primary/10 text-primary border-2 border-primary",
        range_end: "day-range-end rounded-l-none bg-primary/10 text-primary border-2 border-primary",
        range_middle: "aria-selected:bg-primary/5 aria-selected:text-primary dark:aria-selected:bg-primary/10 rounded-none",
        selected: "bg-primary/5 text-primary border-2 border-primary/40 hover:bg-primary/10 hover:text-primary focus:bg-primary/10 focus:text-primary opacity-100",
        today: "relative font-bold text-primary",
        outside: "day-outside text-slate-300 dark:text-slate-600 opacity-20",
        disabled: "text-slate-300 dark:text-slate-600 opacity-50",
        hidden: "invisible",
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation }) => {
          const Icon = orientation === "left" ? ChevronLeft : ChevronRight;
          return <Icon className="h-5 w-5 text-current" />;
        },
      }}
      weekStartsOn={1}
      {...props}
    />
  )
}
Calendar.displayName = "Calendar"

export { Calendar }
