import { useState } from "react";
import { useRouter } from "next/navigation";
import { format, parse } from "date-fns";
import DatePicker from "./DatePicker";
import { CalendarIcon } from "@heroicons/react/24/outline";

interface DateSelectionProps {
  currentDate: string; // Format: YYYY-MM-DD
}

export default function DateSelection({ currentDate }: DateSelectionProps) {
  const router = useRouter();
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  // Parse the date string to a Date object
  const parsedDate = parse(currentDate, "yyyy-MM-dd", new Date());

  // Format for display
  const displayDate = format(parsedDate, "MMMM d, yyyy");

  const handleDateChange = (date: Date) => {
    // Format the new date as YYYY-MM-DD for the URL
    const formattedDate = format(date, "yyyy-MM-dd");
    router.push(`/daily-devotional/${formattedDate}`);
  };

  return (
    <div className="relative">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium">Select Date</h2>

        <button
          onClick={() => setIsCalendarOpen(!isCalendarOpen)}
          className="flex items-center space-x-1 text-gray-700 dark:text-gray-300 hover:text-primary transition-colors"
        >
          <span>{displayDate}</span>
          <CalendarIcon className="w-5 h-5" />
        </button>
      </div>

      <DatePicker
        initialDate={parsedDate}
        onDateSelect={handleDateChange}
        isOpen={isCalendarOpen}
        onClose={() => setIsCalendarOpen(false)}
        highlightAvailableDates={true}
      />
    </div>
  );
}
