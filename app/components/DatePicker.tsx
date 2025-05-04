"use client";

import { useState, useEffect } from "react";
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  isFuture,
  parseISO,
  addDays,
} from "date-fns";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { getAvailableDates } from "@/lib/services/devotionService";

interface DatePickerProps {
  initialDate?: Date;
  selectedDate?: Date;
  onDateSelect?: (date: Date) => void;
  onChange?: (date: Date) => void;
  isOpen?: boolean;
  onClose?: () => void;
  highlightAvailableDates?: boolean;
  className?: string;
  inline?: boolean;
}

export default function DatePicker({
  initialDate = new Date(),
  selectedDate: controlledSelectedDate,
  onDateSelect,
  onChange,
  isOpen = true,
  onClose = () => {},
  highlightAvailableDates = true,
  className = "",
  inline = false,
}: DatePickerProps) {
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(initialDate));
  const [internalSelectedDate, setInternalSelectedDate] = useState(controlledSelectedDate || initialDate);
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [isLoadingDates, setIsLoadingDates] = useState(false);
  
  const selectedDate = controlledSelectedDate || internalSelectedDate;

  const daysInMonth = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  });

  const prevMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const nextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  useEffect(() => {
    if (isOpen && highlightAvailableDates) {
      const fetchAvailableDates = async () => {
        try {
          setIsLoadingDates(true);
          // Log when we start fetching
          console.log("DatePicker: Fetching available dates");
          
          const dates = await getAvailableDates();
          console.log(`DatePicker: Received ${dates.length} available dates`);
          
          if (dates.length > 0) {
            setAvailableDates(dates);
          } else {
            console.warn("DatePicker: No available dates returned, using fallback");
            // If no dates were returned, create fallback dates for the past 90 days
            const fallbackDates = generateFallbackDates();
            setAvailableDates(fallbackDates);
          }
        } catch (error) {
          console.error("DatePicker: Error fetching available dates:", error);
          // On error, create fallback dates for the past 90 days
          const fallbackDates = generateFallbackDates();
          setAvailableDates(fallbackDates);
        } finally {
          setIsLoadingDates(false);
        }
      };

      fetchAvailableDates();
    }
  }, [isOpen, highlightAvailableDates]);

  // Helper function to generate fallback dates
  const generateFallbackDates = (): string[] => {
    const fallbackDates: string[] = [];
    const today = new Date();
    // Generate dates for the past 90 days
    for (let i = 0; i < 90; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const formattedDate = format(date, "yyyy-MM-dd");
      fallbackDates.push(formattedDate);
    }
    console.log("DatePicker: Generated fallback dates:", fallbackDates.length);
    return fallbackDates;
  };

  const isDateAvailable = (date: Date): boolean => {
    // If we're not highlighting available dates or dates are loading, consider all past dates available
    if (!highlightAvailableDates || isLoadingDates) {
      return !isFuture(date);
    }
    
    // Allow weekdays within 7 days in the future
    const isWithinPreviewPeriod = isFuture(date) && 
      date <= addDays(new Date(), 7);
    
    const isWeekday = !['Saturday', 'Sunday'].includes(format(date, 'EEEE'));
      
    if (isWithinPreviewPeriod && isWeekday) {
      return true;
    }
    
    // Otherwise, check if the date is in our list of available dates
    const dateString = format(date, "yyyy-MM-dd");
    return availableDates.includes(dateString);
  };

  // Add helper to check if a date is in the 7-day preview period
  const isInPreviewPeriod = (date: Date): boolean => {
    const isWeekday = !['Saturday', 'Sunday'].includes(format(date, 'EEEE'));
    return isFuture(date) && date <= addDays(new Date(), 7) && isWeekday;
  };

  const handleDateClick = (date: Date) => {
    setInternalSelectedDate(date);
    
    if (onDateSelect) onDateSelect(date);
    if (onChange) onChange(date);
    
    if (!inline && onClose) {
      onClose();
    }
  };

  // Define max allowed date (prevent selecting far future dates)
  const maxAllowedDate = addMonths(new Date(), 1);

  if (!isOpen) return null;

  if (inline) {
    return (
      <div className={`p-2 rounded-lg text-white ${className}`}>
        <div className="flex justify-between items-center mb-6">
          <button
            onClick={prevMonth}
            className="p-2 rounded-full hover:bg-zinc-800"
            aria-label="Previous month"
          >
            <ChevronLeftIcon className="w-5 h-5 text-white" />
          </button>

          <span className="font-medium text-white text-lg">
            {format(currentMonth, "MMMM yyyy")}
          </span>

          <button
            onClick={nextMonth}
            disabled={isSameMonth(currentMonth, maxAllowedDate)}
            className={`p-2 rounded-full ${
              isSameMonth(currentMonth, maxAllowedDate)
                ? "text-white/30 cursor-not-allowed"
                : "hover:bg-zinc-800 text-white"
            }`}
            aria-label="Next month"
          >
            <ChevronRightIcon className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-2 mb-4">
          {["S", "M", "T", "W", "T", "F", "S"].map((day, idx) => (
            <div
              key={idx}
              className="text-center text-sm font-medium text-white/70"
            >
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-y-2 gap-x-1">
          {Array.from({ length: startOfMonth(currentMonth).getDay() }).map((_, idx) => (
            <div key={`empty-start-${idx}`} className="h-9 w-9"></div>
          ))}
          
          {daysInMonth.map((day) => {
            const isCurrentMonth = isSameMonth(day, currentMonth);
            const isSelected = isSameDay(day, selectedDate);
            const isTodayDate = isToday(day);
            const hasDevotional = isDateAvailable(day);
            const isFutureDate = isFuture(day);

            // Only show current month's days
            if (!isCurrentMonth) return null;

            return (
              <button
                key={day.toString()}
                onClick={() => handleDateClick(day)}
                disabled={isFutureDate && !isDateAvailable(day)}
                className={`
                  h-9 w-9 text-sm rounded-full flex items-center justify-center mx-auto
                  ${
                    isSelected
                      ? "bg-white text-black font-medium"
                      : isInPreviewPeriod(day)
                      ? "bg-blue-600/30 hover:bg-blue-600/50 text-white"
                      : isFutureDate && !hasDevotional
                      ? "text-white/30 cursor-not-allowed"
                      : "text-white hover:bg-zinc-800"
                  }
                  ${isTodayDate && !isSelected ? "border border-white" : ""}
                  ${
                    hasDevotional && !isSelected && !isInPreviewPeriod(day)
                      ? "border border-green-500"
                      : ""
                  }
                `}
              >
                {format(day, "d")}
              </button>
            );
          })}
        </div>
        
        <div className="mt-4 flex flex-wrap items-center justify-between gap-y-2">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 border border-green-500 rounded-full"></div>
            <span className="text-xs text-white/60">Devotional available</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 border border-white rounded-full"></div>
            <span className="text-xs text-white/60">Today</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-blue-600/30 rounded-full"></div>
            <span className="text-xs text-white/60">Preview (next 7 days)</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50">
      <div className={`bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg max-w-sm w-full ${className}`}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Select a Date</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            &times;
          </button>
        </div>

        <div className="flex justify-between items-center mb-4">
          <button
            onClick={prevMonth}
            className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <ChevronLeftIcon className="w-5 h-5" />
          </button>

          <span className="font-medium">
            {format(currentMonth, "MMMM yyyy")}
          </span>

          <button
            onClick={nextMonth}
            className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <ChevronRightIcon className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 mb-2">
          {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
            <div
              key={day}
              className="text-center text-sm font-medium text-gray-500"
            >
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {isLoadingDates ? (
            <div className="col-span-7 py-8 flex justify-center">
              <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full"></div>
            </div>
          ) : (
            daysInMonth.map((day) => {
              const isCurrentMonth = isSameMonth(day, currentMonth);
              const isSelected = isSameDay(day, selectedDate);
              const isTodayDate = isToday(day);
              const hasDevotional = isDateAvailable(day);

              return (
                <button
                  key={day.toString()}
                  onClick={() => handleDateClick(day)}
                  className={`
                    h-8 w-8 text-sm rounded-full flex items-center justify-center
                    ${!isCurrentMonth ? "text-gray-400 dark:text-gray-600" : ""}
                    ${
                      isSelected
                        ? "bg-primary text-white"
                        : "hover:bg-gray-100 dark:hover:bg-gray-700"
                    }
                    ${isTodayDate && !isSelected ? "border border-primary" : ""}
                    ${
                      hasDevotional && !isSelected
                        ? "border-2 border-green-500 text-green-500 dark:border-green-400 dark:text-green-400"
                        : ""
                    }
                  `}
                >
                  {format(day, "d")}
                </button>
              );
            })
          )}
        </div>

        <div className="mt-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 border-2 border-green-500 rounded-full"></div>
            <span className="text-xs text-gray-500">Devotional available</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium rounded-md text-primary hover:bg-primary/10"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
