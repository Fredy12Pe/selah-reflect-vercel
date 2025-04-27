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
} from "date-fns";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { getAvailableDates } from "@/lib/services/devotionService";

interface DatePickerProps {
  initialDate?: Date;
  onDateSelect: (date: Date) => void;
  isOpen: boolean;
  onClose: () => void;
  highlightAvailableDates?: boolean;
}

export default function DatePicker({
  initialDate = new Date(),
  onDateSelect,
  isOpen,
  onClose,
  highlightAvailableDates = true,
}: DatePickerProps) {
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(initialDate));
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [isLoadingDates, setIsLoadingDates] = useState(false);

  // Get all days in the current month
  const daysInMonth = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  });

  // Navigate to previous month
  const prevMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  // Navigate to next month
  const nextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  // Fetch available devotion dates
  useEffect(() => {
    if (isOpen && highlightAvailableDates) {
      const fetchAvailableDates = async () => {
        try {
          setIsLoadingDates(true);
          const dates = await getAvailableDates();
          setAvailableDates(dates);
        } catch (error) {
          console.error("Error fetching available dates:", error);
        } finally {
          setIsLoadingDates(false);
        }
      };

      fetchAvailableDates();
    }
  }, [isOpen, highlightAvailableDates]);

  // Check if a date has an available devotion
  const isDateAvailable = (date: Date): boolean => {
    const dateString = format(date, "yyyy-MM-dd");
    return availableDates.includes(dateString);
  };

  // Handle date selection
  const handleDateClick = (date: Date) => {
    // Don't allow selecting future dates
    if (isFuture(date)) {
      return;
    }

    setSelectedDate(date);
    onDateSelect(date);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50">
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg max-w-sm w-full">
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
            className={`p-1 rounded-full ${
              currentMonth.getMonth() === new Date().getMonth() &&
              currentMonth.getFullYear() === new Date().getFullYear()
                ? "text-gray-300 cursor-not-allowed"
                : "hover:bg-gray-100 dark:hover:bg-gray-700"
            }`}
            disabled={
              currentMonth.getMonth() === new Date().getMonth() &&
              currentMonth.getFullYear() === new Date().getFullYear()
            }
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
              const cannotSelect = isFuture(day);

              return (
                <button
                  key={day.toString()}
                  onClick={() => handleDateClick(day)}
                  disabled={cannotSelect}
                  className={`
                    h-8 w-8 text-sm rounded-full flex items-center justify-center
                    ${!isCurrentMonth ? "text-gray-400 dark:text-gray-600" : ""}
                    ${
                      isSelected
                        ? "bg-primary text-white"
                        : cannotSelect
                        ? "cursor-not-allowed opacity-50"
                        : "hover:bg-gray-100 dark:hover:bg-gray-700"
                    }
                    ${isTodayDate && !isSelected ? "border border-primary" : ""}
                    ${
                      hasDevotional && !isSelected && !cannotSelect
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
