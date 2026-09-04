'use client';

import * as React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import {
  DayPicker,
  getDefaultClassNames,
  type DayButtonProps,
  type ChevronProps,
} from 'react-day-picker';
import { ptBR } from 'date-fns/locale';

import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  locale = ptBR,
  ...props
}: React.ComponentProps<typeof DayPicker>) {
  const defaultClassNames = getDefaultClassNames();

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      locale={locale}
      className={cn('bg-card p-3', className)}
      classNames={{
        root: cn('w-fit', defaultClassNames.root),
        months: cn('flex gap-4 flex-col md:flex-row', defaultClassNames.months),
        month: cn('flex flex-col gap-3', defaultClassNames.month),
        nav: cn(
          'flex items-center justify-between absolute inset-x-0 top-0 px-1',
          defaultClassNames.nav,
        ),
        button_previous: cn(
          buttonVariants({ variant: 'ghost' }),
          'size-8 p-0 cursor-pointer',
          defaultClassNames.button_previous,
        ),
        button_next: cn(
          buttonVariants({ variant: 'ghost' }),
          'size-8 p-0 cursor-pointer',
          defaultClassNames.button_next,
        ),
        month_caption: cn(
          'flex items-center justify-center h-8',
          defaultClassNames.month_caption,
        ),
        caption_label: cn(
          'text-sm font-medium text-foreground',
          defaultClassNames.caption_label,
        ),
        weekdays: cn('flex', defaultClassNames.weekdays),
        weekday: cn(
          'text-muted-foreground w-8 font-normal text-[0.75rem]',
          defaultClassNames.weekday,
        ),
        week: cn('flex w-full mt-1', defaultClassNames.week),
        day: cn(
          'relative p-0 text-center text-sm w-8 h-8 [&:has([data-selected])]:bg-[var(--ei-accent)]/10',
          defaultClassNames.day,
        ),
        range_start: cn('rounded-l-md', defaultClassNames.range_start),
        range_middle: cn('rounded-none', defaultClassNames.range_middle),
        range_end: cn('rounded-r-md', defaultClassNames.range_end),
        today: cn(
          'text-[var(--ei-accent)] font-semibold',
          defaultClassNames.today,
        ),
        outside: cn('text-muted-foreground/50', defaultClassNames.outside),
        disabled: cn('text-muted-foreground/30', defaultClassNames.disabled),
        hidden: cn('invisible', defaultClassNames.hidden),
        ...classNames,
      }}
      components={{
        Chevron: CalendarChevron,
        DayButton: CalendarDayButton,
      }}
      {...props}
    />
  );
}

function CalendarChevron({ className, orientation, ...props }: ChevronProps) {
  const Icon = orientation === 'left' ? ChevronLeft : ChevronRight;
  return <Icon className={cn('size-4', className)} {...props} />;
}

function CalendarDayButton({
  className,
  day,
  modifiers,
  ...props
}: DayButtonProps) {
  const ref = React.useRef<HTMLButtonElement>(null);
  React.useEffect(() => {
    if (modifiers.focused) ref.current?.focus();
  }, [modifiers.focused]);

  const selecionado =
    modifiers.selected || modifiers.range_start || modifiers.range_end;

  return (
    <button
      ref={ref}
      type="button"
      data-day={day.date.toISOString()}
      className={cn(
        'flex items-center justify-center w-8 h-8 rounded-md text-sm cursor-pointer transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-30',
        modifiers.range_middle && 'bg-[var(--ei-accent)]/15 rounded-none',
        className,
      )}
      style={
        selecionado
          ? {
              backgroundColor: 'var(--ei-accent)',
              color: 'var(--ei-accent-foreground)',
            }
          : undefined
      }
      {...props}
    />
  );
}

export { Calendar };
