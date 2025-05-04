"use client";

import { useState, useEffect } from 'react';
import { getAvailableDates, getDevotionByDate } from '@/lib/services/devotionService';
import { Devotion } from '@/lib/types/devotion';

// Define the interface here based on what's in the codebase
interface PartialDevotion extends Partial<Devotion> {
  notFound?: boolean;
  error?: string;
}

import { format, parseISO, eachDayOfInterval, subDays, addDays, isToday } from 'date-fns';

// Helper function to check if data components are available
const checkDataAvailability = (data: any): Record<string, boolean> => {
  if (!data) return {};
  
  return {
    bibleText: Boolean(data.bibleText || data.scriptureReference),
    reflectionSections: Boolean(Array.isArray(data.reflectionSections) && data.reflectionSections.length > 0),
    reflectionQuestions: Boolean(
      (Array.isArray(data.reflectionQuestions) && data.reflectionQuestions.length > 0) ||
      (Array.isArray(data.reflectionSections) && 
       data.reflectionSections.some((section: any) => 
         Array.isArray(section.questions) && section.questions.length > 0))
    ),
    prayer: Boolean(data.prayer),
    title: Boolean(data.title),
    content: Boolean(data.content),
  };
};

export default function DataAvailabilityPage() {
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [dateStatus, setDateStatus] = useState<{
    [key: string]: {
      available: boolean, 
      loading?: boolean, 
      error?: string, 
      data?: any, 
      components?: Record<string, boolean>,
      isWeekend?: boolean
    }
  }>({}); 
  const [rangeStart, setRangeStart] = useState<string>(
    format(subDays(new Date(), 30), 'yyyy-MM-dd')
  );
  const [rangeEnd, setRangeEnd] = useState<string>(
    format(addDays(new Date(), 30), 'yyyy-MM-dd')
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const today = format(new Date(), 'yyyy-MM-dd');

  // Fetch the available dates from the API and check data for visible dates
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const dates = await getAvailableDates();
        setAvailableDates(dates);
        
        // Initialize the status object for all dates
        const initialStatus: {[key: string]: {available: boolean}} = {};
        dates.forEach(date => {
          initialStatus[date] = { available: true };
        });
        setDateStatus(initialStatus);
        
        setLoading(false);
        
        // Once we have the dates, check data for those in the current range
        const rangeDates = datesInRange.filter(date => dates.includes(date));
        
        // Check data for each date in our range, but limit to 20 to avoid too many requests
        const datesToCheck = rangeDates.slice(0, 20);
        for (const date of datesToCheck) {
          await checkDateData(date);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch available dates');
        setLoading(false);
      }
    }
    
    fetchData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  // Effect to check data when date range changes
  useEffect(() => {
    async function checkNewVisibleDates() {
      if (availableDates.length === 0) return;
      
      // Find dates in the current range that haven't been checked yet
      const datesToCheck = datesInRange
        .filter(date => 
          availableDates.includes(date) && 
          !dateStatus[date]?.data && 
          !dateStatus[date]?.loading
        )
        .slice(0, 20); // Limit to 20 to avoid too many requests
      
      for (const date of datesToCheck) {
        await checkDateData(date);
      }
    }
    
    checkNewVisibleDates();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rangeStart, rangeEnd, availableDates]);

  // Generate the range of dates to display
  const datesInRange = eachDayOfInterval({
    start: parseISO(rangeStart),
    end: parseISO(rangeEnd)
  }).map(date => format(date, 'yyyy-MM-dd'));

  // Function to check whether a specific date has data
  async function checkDateData(date: string) {
    setDateStatus(prev => ({
      ...prev,
      [date]: { ...prev[date], loading: true, error: undefined }
    }));

    try {
      console.log(`Checking data for date: ${date}`);
      const devotion = await getDevotionByDate(date);
      console.log(`Result for ${date}:`, devotion);
      
      const components = checkDataAvailability(devotion);
      
      // Handle weekend dates specially - they should show as "Unknown" instead of "Not available"
      const dateObj = parseISO(date);
      const dayOfWeek = format(dateObj, 'EEEE');
      const isWeekend = dayOfWeek === 'Saturday' || dayOfWeek === 'Sunday';
      
      // Update status based on the API response
      setDateStatus(prev => ({
        ...prev,
        [date]: { 
          available: !!devotion && !devotion.notFound,
          loading: false,
          data: devotion,
          components,
          isWeekend // Add this flag to identify weekends
        }
      }));
    } catch (err) {
      console.error(`Error checking date ${date}:`, err);
      const errorMessage = err instanceof Error ? err.message : 'Error checking date';
      setDateStatus(prev => ({
        ...prev,
        [date]: {
          ...prev[date],
          available: false,
          loading: false,
          error: errorMessage.includes('configuration') ? 
            'Server configuration error. Firebase may need to be initialized.' : errorMessage
        }
      }));
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Date Data Availability</h1>
      
      <div className="mb-6 p-4 bg-gray-100 rounded">
        <h2 className="text-xl font-semibold mb-4">Date Range</h2>
        <div className="flex flex-col md:flex-row gap-4 mb-4">
          <div>
            <label className="block mb-2">Start Date:</label>
            <input
              type="date"
              value={rangeStart}
              onChange={(e) => setRangeStart(e.target.value)}
              className="border rounded px-2 py-1"
            />
          </div>
          
          <div>
            <label className="block mb-2">End Date:</label>
            <input
              type="date"
              value={rangeEnd}
              onChange={(e) => setRangeEnd(e.target.value)}
              className="border rounded px-2 py-1"
            />
          </div>
        </div>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 mt-2">
            <p className="font-bold">Error</p>
            <p>{error}</p>
          </div>
        )}
        
        <div className="mt-4">
          <p className="font-medium">Troubleshooting Tips:</p>
          <ul className="list-disc list-inside mt-2 pl-4 text-sm space-y-1">
            <li>Make sure your Firebase config is correctly set up in .env.local</li>
            <li>Check that you're signed in before accessing protected data</li>
            <li>If you see "Server configuration error," the backend Firebase initialization may have failed</li>
            <li>Check browser console for more detailed error messages</li>
          </ul>
        </div>
      </div>
      
      {loading ? (
        <div className="text-center p-4">Loading available dates...</div>
      ) : error ? (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p className="font-bold">Error</p>
          <p>{error}</p>
        </div>
      ) : (
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Available Dates</h2>
            <button
              onClick={async () => {
                setLoading(true);
                try {
                  // Refresh available dates
                  const dates = await getAvailableDates();
                  setAvailableDates(dates);
                  
                  // Initialize the status object for all dates
                  const initialStatus: {[key: string]: {available: boolean}} = {};
                  dates.forEach(date => {
                    initialStatus[date] = { available: true };
                  });
                  setDateStatus(initialStatus);
                  
                  // Check data for each date in our range
                  const datesToCheck = datesInRange.filter(date => 
                    dates.includes(date)).slice(0, 20);
                  
                  for (const date of datesToCheck) {
                    await checkDateData(date);
                  }
                } catch (err) {
                  setError(err instanceof Error ? err.message : 'Failed to refresh dates');
                } finally {
                  setLoading(false);
                }
              }}
              className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
            >
              Refresh All Dates
            </button>
          </div>
          
          <p className="mb-4">
            Found {availableDates.length} dates with data in the database.
          </p>
          
          <div className="overflow-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border px-4 py-2 text-left font-bold text-black">Date</th>
                  <th className="border px-4 py-2 text-left font-bold text-black">Day</th>
                  <th className="border px-4 py-2 text-left font-bold text-black">Status</th>
                  <th className="border px-4 py-2 text-left font-bold text-black">Data Components</th>
                  <th className="border px-4 py-2 text-left font-bold text-black">Actions</th>
                </tr>
              </thead>
              <tbody>
                {datesInRange.map(date => {
                  const isCurrentDate = date === today;
                  const dateObj = parseISO(date);
                  const dayOfWeek = format(dateObj, 'EEEE');
                  const isWeekend = dayOfWeek === 'Saturday' || dayOfWeek === 'Sunday';
                  
                  return (
                    <tr 
                      key={date} 
                      className={
                        isCurrentDate
                          ? "bg-blue-100 text-black font-medium border-l-4 border-l-blue-500"
                          : dateStatus[date]?.isWeekend || isWeekend
                            ? "bg-gray-50 text-black"
                          : dateStatus[date]?.available 
                            ? "bg-green-50 text-black" 
                            : dateStatus[date] 
                              ? "bg-red-50 text-black" 
                              : "bg-white text-black"
                      }
                    >
                      <td className="border px-4 py-2 font-medium">
                        {isCurrentDate ? '📅 ' : ''}{date}
                      </td>
                      <td className="border px-4 py-2 font-medium">{format(parseISO(date), 'EEEE')}</td>
                      <td className="border px-4 py-2">
                        {dateStatus[date]?.loading ? (
                          <span className="text-gray-700">Checking...</span>
                        ) : dateStatus[date]?.available ? (
                          <span className="text-green-700 font-medium">✓ Available</span>
                        ) : dateStatus[date]?.isWeekend || isWeekend ? (
                          <span className="text-gray-700 font-medium">Unknown</span>
                        ) : dateStatus[date] ? (
                          <span className="text-red-700 font-medium">✗ Not available</span>
                        ) : (
                          <span className="text-gray-700">Unknown</span>
                        )}
                      </td>
                      <td className="border px-4 py-2">
                        {dateStatus[date]?.components ? (
                          <div className="flex flex-wrap gap-1">
                            {Object.entries(dateStatus[date].components).map(([key, available]) => (
                              <span 
                                key={key}
                                className={`px-2 py-1 rounded text-xs ${
                                  available 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-gray-100 text-gray-500 line-through'
                                }`}
                              >
                                {key}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-gray-500">-</span>
                        )}
                      </td>
                      <td className="border px-4 py-2">
                        <button
                          onClick={() => checkDateData(date)}
                          disabled={dateStatus[date]?.loading}
                          className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 disabled:bg-gray-300"
                        >
                          {dateStatus[date]?.loading ? 'Checking...' : 'Check Data'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      <div className="p-4 bg-gray-100 rounded">
        <h2 className="text-xl font-semibold mb-4">Data Details</h2>
        <div className="bg-white border border-gray-300 p-4 rounded overflow-auto max-h-96">
          <pre className="text-black">
            {JSON.stringify(
              Object.fromEntries(
                Object.entries(dateStatus)
                  .filter(([_, status]) => status.data)
                  .map(([date, status]) => [date, status.data])
              ),
              null,
              2
            )}
          </pre>
        </div>
      </div>
    </div>
  );
} 