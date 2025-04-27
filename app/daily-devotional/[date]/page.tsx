"use client";

import { format, parseISO } from "date-fns";
import DateSelection from "@/app/components/DateSelection";

interface DailyDevotionalPageProps {
  params: {
    date: string;
  };
}

export default function DailyDevotionalPage({
  params,
}: DailyDevotionalPageProps) {
  const { date } = params;

  // Validate the date parameter
  let formattedDate = "";
  try {
    const parsedDate = parseISO(date);
    formattedDate = format(parsedDate, "EEEE, MMMM d, yyyy");
  } catch (error) {
    console.error("Invalid date format:", date);
    formattedDate = "Invalid date";
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <DateSelection currentDate={date} />
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold mb-4">
          Daily Devotional for {formattedDate}
        </h1>

        {/* Devotional content would go here */}
        <div className="prose dark:prose-invert max-w-none">
          <p className="text-gray-600 dark:text-gray-300">
            Content for this day's devotional will be displayed here.
          </p>
        </div>
      </div>
    </div>
  );
}
