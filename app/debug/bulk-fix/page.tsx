'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/context/AuthContext';
import { toast, Toaster } from 'react-hot-toast';

interface DevotionInfo {
  date: string;
  bibleText: string;
  hasReflectionSections: boolean;
  reflectionSectionsCount: number;
  hasMissingPassages: boolean;
}

export default function BulkFixPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [devotions, setDevotions] = useState<DevotionInfo[]>([]);
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [filterMissingPassages, setFilterMissingPassages] = useState(true);

  useEffect(() => {
    if (user) {
      fetchDevotions();
    }
  }, [user]);

  const fetchDevotions = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/devotions/fix-data-bulk');
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch devotions');
      }
      
      setDevotions(data.devotions || []);
    } catch (error) {
      console.error('Error fetching devotions:', error);
      toast.error((error as Error).message || 'Failed to fetch devotions');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkUpdate = async () => {
    if (selectedDates.length === 0) {
      toast.error('Please select at least one date to update');
      return;
    }

    setUpdating(true);
    try {
      const response = await fetch('/api/devotions/fix-data-bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dates: selectedDates,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update devotions');
      }
      
      toast.success(`Successfully processed ${selectedDates.length} devotions`);
      
      // Show detailed results
      const results = data.results || {};
      const successCount = Object.values(results).filter(r => r === 'Updated' || r === 'Created sections').length;
      const errorCount = Object.values(results).filter(r => r === 'Error').length;
      const notFoundCount = Object.values(results).filter(r => r === 'Not found').length;
      
      toast(`Results: ${successCount} updated, ${errorCount} errors, ${notFoundCount} not found`, { duration: 5000 });
      
      // Refresh the devotions list
      fetchDevotions();
      
      // Clear selections
      setSelectedDates([]);
    } catch (error) {
      console.error('Error updating devotions:', error);
      toast.error((error as Error).message || 'Failed to update devotions');
    } finally {
      setUpdating(false);
    }
  };

  const toggleSelectAll = () => {
    if (selectedDates.length === filteredDevotions.length) {
      setSelectedDates([]);
    } else {
      setSelectedDates(filteredDevotions.map(d => d.date));
    }
  };

  const toggleDateSelection = (date: string) => {
    if (selectedDates.includes(date)) {
      setSelectedDates(selectedDates.filter(d => d !== date));
    } else {
      setSelectedDates([...selectedDates, date]);
    }
  };

  // Filter devotions based on the missing passages filter
  const filteredDevotions = filterMissingPassages
    ? devotions.filter(d => d.hasMissingPassages)
    : devotions;

  if (!user) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p>Please sign in to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <Toaster position="top-center" />
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-4">Bulk Fix Devotion Data</h1>
        <p className="mb-8">
          This tool will update multiple devotions to ensure all reflection sections have proper passage fields.
        </p>
        
        <div className="mb-6">
          <button
            onClick={fetchDevotions}
            disabled={loading}
            className={`px-6 py-2 rounded-lg mr-4 ${
              loading ? 'bg-zinc-700 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {loading ? 'Loading...' : 'Refresh Data'}
          </button>
          
          <label className="inline-flex items-center ml-4">
            <input
              type="checkbox"
              checked={filterMissingPassages}
              onChange={() => setFilterMissingPassages(!filterMissingPassages)}
              className="mr-2 h-4 w-4"
            />
            <span>Only show devotions with missing passages</span>
          </label>
        </div>
        
        {devotions.length > 0 ? (
          <div className="mb-8">
            <div className="bg-zinc-900 rounded-xl p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">
                  {filteredDevotions.length} Devotions {filterMissingPassages ? 'with Missing Passages' : 'Available'}
                </h2>
                <div>
                  <button
                    onClick={toggleSelectAll}
                    className="px-4 py-1 bg-zinc-800 hover:bg-zinc-700 rounded-lg mr-2"
                  >
                    {selectedDates.length === filteredDevotions.length ? 'Unselect All' : 'Select All'}
                  </button>
                  <button
                    onClick={handleBulkUpdate}
                    disabled={updating || selectedDates.length === 0}
                    className={`px-6 py-2 rounded-lg ${
                      updating || selectedDates.length === 0 
                        ? 'bg-zinc-700 cursor-not-allowed' 
                        : 'bg-green-600 hover:bg-green-700'
                    }`}
                  >
                    {updating ? 'Updating...' : `Fix ${selectedDates.length} Selected`}
                  </button>
                </div>
              </div>
              
              <div className="max-h-96 overflow-y-auto bg-black/30 rounded-lg p-4">
                <table className="w-full border-collapse">
                  <thead className="bg-zinc-800 sticky top-0">
                    <tr>
                      <th className="p-2 text-left">Select</th>
                      <th className="p-2 text-left">Date</th>
                      <th className="p-2 text-left">Bible Text</th>
                      <th className="p-2 text-left">Has Sections</th>
                      <th className="p-2 text-left">Sections Count</th>
                      <th className="p-2 text-left">Missing Passages</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDevotions.map((devotion) => (
                      <tr 
                        key={devotion.date} 
                        className={`border-b border-zinc-700 hover:bg-zinc-800/50 ${
                          devotion.hasMissingPassages ? 'bg-red-900/20' : ''
                        }`}
                      >
                        <td className="p-2">
                          <input
                            type="checkbox"
                            checked={selectedDates.includes(devotion.date)}
                            onChange={() => toggleDateSelection(devotion.date)}
                            className="h-5 w-5"
                          />
                        </td>
                        <td className="p-2">{devotion.date}</td>
                        <td className="p-2 truncate max-w-[200px]" title={devotion.bibleText}>{devotion.bibleText}</td>
                        <td className="p-2">{devotion.hasReflectionSections ? '✓' : '✗'}</td>
                        <td className="p-2">{devotion.reflectionSectionsCount}</td>
                        <td className="p-2">{devotion.hasMissingPassages ? '✓' : '✗'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-2 border-white border-t-transparent"></div>
          </div>
        ) : (
          <div className="text-center py-12 bg-zinc-900 rounded-xl">
            <p>No devotions found.</p>
          </div>
        )}
      </div>
    </div>
  );
} 