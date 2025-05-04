"use client";

import { useState, useEffect } from 'react';
import { getHymnByMonth } from '@/lib/services/devotionService';
import { Hymn } from '@/lib/types/devotion';
import { format, addMonths, subMonths } from 'date-fns';

// Extended hymn type with source tracking
interface EnhancedHymn extends Hymn {
  _source?: 'FIREBASE' | 'FALLBACK';
}

// Helper function to check hymn data components
const checkHymnComponents = (hymn: Hymn | null): Record<string, boolean> => {
  if (!hymn) return {};
  
  return {
    title: Boolean(hymn.title),
    author: Boolean(hymn.author),
    lyrics: Boolean(Array.isArray(hymn.lyrics) && hymn.lyrics.length > 0),
    month: Boolean(hymn.month),
    monthId: Boolean(hymn.monthId),
  };
};

export default function HymnAvailabilityPage() {
  const [hymnData, setHymnData] = useState<{[month: string]: EnhancedHymn | null}>({});
  const [hymnComponents, setHymnComponents] = useState<{[month: string]: Record<string, boolean>}>({});
  const [loading, setLoading] = useState<{[month: string]: boolean}>({});
  const [error, setError] = useState<{[month: string]: string | null}>({});
  const [pageLoading, setPageLoading] = useState(true);
  
  // Get current month for highlighting
  const currentDate = new Date();
  const currentMonth = format(currentDate, 'yyyy-MM');
  
  // Generate an array of months (current month +/- 12 months)
  const months = Array.from({ length: 25 }, (_, i) => {
    const date = addMonths(subMonths(currentDate, 12), i);
    return {
      formattedMonth: format(date, 'yyyy-MM'),
      displayName: format(date, 'MMMM yyyy')
    };
  });

  // Function to fetch hymn data for a specific month
  async function fetchHymnForMonth(month: string, displayName: string) {
    setLoading(prev => ({ ...prev, [month]: true }));
    setError(prev => ({ ...prev, [month]: null }));
    
    try {
      console.log(`Fetching hymn data for ${month} (${displayName})`);
      
      // Extract just the month name from the formatted display name
      // This ensures we're using the same month format as the main app
      const monthName = displayName.split(' ')[0]; // Gets "May" from "May 2024"
      console.log(`Using month name: ${monthName} for fetching hymn`);
      
      const hymn = await getHymnByMonth(monthName);
      console.log(`Received hymn data for ${monthName}:`, hymn);
      
      // Add a property to track if data is from fallback
      const isFallback = hymn && (!hymn.updatedAt || hymn.updatedBy === 'fallback');
      const enhancedHymn = hymn ? { 
        ...hymn, 
        _source: isFallback ? 'FALLBACK' : 'FIREBASE' 
      } as EnhancedHymn : null;
      
      setHymnData(prev => ({ ...prev, [month]: enhancedHymn }));
      
      // Check which components are available
      const components = checkHymnComponents(hymn);
      setHymnComponents(prev => ({ ...prev, [month]: components }));
    } catch (err) {
      console.error(`Error fetching hymn for ${month}:`, err);
      setError(prev => ({
        ...prev,
        [month]: err instanceof Error ? err.message : 'Failed to fetch hymn'
      }));
    } finally {
      setLoading(prev => ({ ...prev, [month]: false }));
    }
  }
  
  // Fetch hymn data for all months on load
  useEffect(() => {
    async function loadAllHymns() {
      setPageLoading(true);
      
      // Only show loader for initial batch
      try {
        // Prioritize current month and those closest to it
        const sortedMonths = [...months].sort((a, b) => {
          // Current month first
          if (a.formattedMonth === currentMonth) return -1;
          if (b.formattedMonth === currentMonth) return 1;
          
          // Then sort by proximity to current month
          const aDate = new Date(a.formattedMonth + "-01");
          const bDate = new Date(b.formattedMonth + "-01");
          const currentDate = new Date(currentMonth + "-01");
          
          return Math.abs(aDate.getTime() - currentDate.getTime()) - 
                 Math.abs(bDate.getTime() - currentDate.getTime());
        });
        
        // Check current month first
        if (currentMonth) {
          const current = months.find(m => m.formattedMonth === currentMonth);
          if (current) {
            await fetchHymnForMonth(current.formattedMonth, current.displayName);
          }
        }
        
        // Then check a few more (limit to avoid too many requests)
        const otherMonthsToCheck = sortedMonths
          .filter(m => m.formattedMonth !== currentMonth)
          .slice(0, 5);
          
        await Promise.all(
          otherMonthsToCheck.map(month => 
            fetchHymnForMonth(month.formattedMonth, month.displayName)
          )
        );
      } catch (err) {
        console.error('Error loading hymns:', err);
      } finally {
        setPageLoading(false);
      }
    }
    
    loadAllHymns();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Hymn Data Availability</h1>
      
      {pageLoading ? (
        <div className="text-center p-4">Loading hymn data...</div>
      ) : (
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Available Hymns by Month</h2>
            <button
              onClick={async () => {
                setPageLoading(true);
                try {
                  await Promise.all(
                    months.map(month => fetchHymnForMonth(month.formattedMonth, month.displayName))
                  );
                } catch (err) {
                  console.error('Error refreshing hymns:', err);
                } finally {
                  setPageLoading(false);
                }
              }}
              className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
            >
              Refresh All Hymns
            </button>
          </div>
          
          <div className="overflow-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border px-4 py-2 text-left font-bold text-black">Month</th>
                  <th className="border px-4 py-2 text-left font-bold text-black">Status</th>
                  <th className="border px-4 py-2 text-left font-bold text-black">Title</th>
                  <th className="border px-4 py-2 text-left font-bold text-black">Components</th>
                  <th className="border px-4 py-2 text-left font-bold text-black">Actions</th>
                </tr>
              </thead>
              <tbody>
                {months.map(({ formattedMonth, displayName }) => {
                  const isCurrentMonth = formattedMonth === currentMonth;
                  return (
                    <tr 
                      key={formattedMonth} 
                      className={
                        isCurrentMonth
                          ? "bg-blue-100 text-black font-medium border-l-4 border-l-blue-500"
                          : hymnData[formattedMonth] 
                            ? "bg-green-50 text-black" 
                            : hymnData[formattedMonth] === null 
                              ? "bg-red-50 text-black" 
                              : "bg-white text-black"
                      }
                    >
                      <td className="border px-4 py-2 font-medium">
                        {isCurrentMonth ? '📅 ' : ''}{displayName}
                      </td>
                      <td className="border px-4 py-2">
                        {loading[formattedMonth] ? (
                          <span className="text-gray-700">Checking...</span>
                        ) : hymnData[formattedMonth] ? (
                          <span className="text-green-700 font-medium">✓ Available</span>
                        ) : hymnData[formattedMonth] === null ? (
                          <span className="text-red-700 font-medium">✗ Not available</span>
                        ) : (
                          <span className="text-gray-700">Unknown</span>
                        )}
                      </td>
                      <td className="border px-4 py-2 font-medium">
                        {hymnData[formattedMonth]?.title || '-'}
                        {hymnData[formattedMonth]?._source && (
                          <span className={`ml-2 text-xs px-1 py-0.5 rounded ${
                            hymnData[formattedMonth]?._source === 'FIREBASE' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {hymnData[formattedMonth]?._source}
                          </span>
                        )}
                      </td>
                      <td className="border px-4 py-2">
                        {hymnComponents[formattedMonth] ? (
                          <div className="flex flex-wrap gap-1">
                            {Object.entries(hymnComponents[formattedMonth]).map(([key, available]) => (
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
                          onClick={() => fetchHymnForMonth(formattedMonth, displayName)}
                          disabled={loading[formattedMonth]}
                          className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 disabled:bg-gray-300"
                        >
                          {loading[formattedMonth] ? 'Checking...' : 'Check Hymn'}
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
        <h2 className="text-xl font-semibold mb-4">Hymn Details</h2>
        <div className="bg-white border border-gray-300 p-4 rounded overflow-auto max-h-96">
          <pre className="text-black">
            {JSON.stringify(
              Object.fromEntries(
                Object.entries(hymnData)
                  .filter(([_, data]) => data !== null)
                  .map(([month, data]) => [month, data])
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