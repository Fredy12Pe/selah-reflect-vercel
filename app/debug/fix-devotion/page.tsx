'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/context/AuthContext';
import { toast, Toaster } from 'react-hot-toast';

export default function FixDevotionPage() {
  const { user } = useAuth();
  const [date, setDate] = useState('');
  const [devotionData, setDevotionData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [bibleText, setBibleText] = useState('');
  const [reflectionSections, setReflectionSections] = useState<any[]>([]);

  const handleCheck = async () => {
    if (!date) {
      toast.error('Please enter a date');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/devotions/fix-data?date=${date}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch devotion data');
      }
      
      setDevotionData(data);
      
      // If we have reflection sections, set them for editing
      if (data.data?.reflectionSections) {
        setReflectionSections(data.data.reflectionSections.map((section: any) => {
          // If section is missing the passage field, create it with bible text as default
          if (!section.passage && data.data?.bibleText) {
            return {
              ...section,
              passage: data.data.bibleText
            };
          }
          return section;
        }));
      } else {
        // Initialize with a single empty section using bible text as passage
        setReflectionSections([{ 
          passage: data.data?.bibleText || data.data?.scriptureReference || '', 
          questions: data.data?.reflectionQuestions || [''] 
        }]);
      }
      
      // Set the Bible text if available
      if (data.data?.bibleText) {
        setBibleText(data.data.bibleText);
      } else if (data.data?.scriptureReference) {
        setBibleText(data.data.scriptureReference);
      } else {
        setBibleText('');
      }
      
    } catch (error) {
      console.error('Error checking devotion:', error);
      toast.error((error as Error).message || 'Failed to check devotion');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!date) {
      toast.error('Please enter a date');
      return;
    }

    // Validate that all sections have passages
    const invalidSections = reflectionSections.filter(section => !section.passage);
    if (invalidSections.length > 0) {
      toast.error('All reflection sections must have a passage reference');
      return;
    }

    setUpdating(true);
    try {
      const response = await fetch('/api/devotions/fix-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          date,
          bibleText,
          reflectionSections,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update devotion data');
      }
      
      toast.success('Devotion data updated successfully');
      setDevotionData(data);
      
    } catch (error) {
      console.error('Error updating devotion:', error);
      toast.error((error as Error).message || 'Failed to update devotion');
    } finally {
      setUpdating(false);
    }
  };

  const handleSectionChange = (index: number, field: string, value: any) => {
    const newSections = [...reflectionSections];
    newSections[index] = {
      ...newSections[index],
      [field]: value,
    };
    setReflectionSections(newSections);
  };

  const handleQuestionChange = (sectionIndex: number, questionIndex: number, value: string) => {
    const newSections = [...reflectionSections];
    const newQuestions = [...newSections[sectionIndex].questions];
    newQuestions[questionIndex] = value;
    newSections[sectionIndex] = {
      ...newSections[sectionIndex],
      questions: newQuestions,
    };
    setReflectionSections(newSections);
  };

  const addQuestion = (sectionIndex: number) => {
    const newSections = [...reflectionSections];
    newSections[sectionIndex] = {
      ...newSections[sectionIndex],
      questions: [...newSections[sectionIndex].questions, ''],
    };
    setReflectionSections(newSections);
  };

  const removeQuestion = (sectionIndex: number, questionIndex: number) => {
    const newSections = [...reflectionSections];
    const newQuestions = newSections[sectionIndex].questions.filter(
      (_, i) => i !== questionIndex
    );
    newSections[sectionIndex] = {
      ...newSections[sectionIndex],
      questions: newQuestions,
    };
    setReflectionSections(newSections);
  };

  const addSection = () => {
    setReflectionSections([
      ...reflectionSections,
      {
        passage: '',
        questions: [''],
      },
    ]);
  };

  const removeSection = (index: number) => {
    if (reflectionSections.length <= 1) {
      toast.error('You must have at least one reflection section');
      return;
    }
    
    const newSections = reflectionSections.filter((_, i) => i !== index);
    setReflectionSections(newSections);
  };

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
        <h1 className="text-3xl font-bold mb-8">Fix Devotion Data</h1>
        
        <div className="mb-8 p-6 bg-zinc-900 rounded-xl">
          <h2 className="text-xl font-semibold mb-4">Check Devotion Data</h2>
          
          <div className="flex space-x-4 mb-4">
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="px-4 py-2 bg-black border border-zinc-700 rounded-lg flex-1"
              placeholder="YYYY-MM-DD"
            />
            
            <button
              onClick={handleCheck}
              disabled={loading}
              className={`px-6 py-2 rounded-lg ${
                loading ? 'bg-zinc-700 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {loading ? 'Checking...' : 'Check Data'}
            </button>
          </div>
          
          {devotionData && (
            <div className="mt-6">
              <h3 className="text-lg font-medium mb-2">Current Data:</h3>
              <div className="bg-black/50 p-4 rounded-lg mb-4">
                <p>Date: {devotionData.date}</p>
                <p>Has Reflection Sections: {devotionData.hasReflectionSections ? 'Yes' : 'No'}</p>
                <p>Reflection Sections Count: {devotionData.reflectionSectionsCount}</p>
                <p>Has Old Format: {devotionData.hasOldFormat ? 'Yes' : 'No'}</p>
                <p>Reflection Questions Count: {devotionData.reflectionQuestionsCount}</p>
              </div>
              
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2">Bible Text</label>
                <input
                  type="text"
                  value={bibleText}
                  onChange={(e) => setBibleText(e.target.value)}
                  className="w-full px-4 py-2 bg-black border border-zinc-700 rounded-lg"
                  placeholder="Enter Bible reference"
                />
              </div>
              
              <h3 className="text-lg font-medium mb-4">Reflection Sections:</h3>
              
              {reflectionSections.map((section, sectionIndex) => (
                <div key={sectionIndex} className="mb-8 p-4 bg-zinc-800 rounded-lg">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-md font-medium">Section {sectionIndex + 1}</h4>
                    <button
                      onClick={() => removeSection(sectionIndex)}
                      className="text-red-400 hover:text-red-300"
                    >
                      Remove
                    </button>
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-2">Passage</label>
                    <input
                      type="text"
                      value={section.passage || ''}
                      onChange={(e) => handleSectionChange(sectionIndex, 'passage', e.target.value)}
                      className={`w-full px-4 py-2 bg-black border ${!section.passage ? 'border-red-500' : 'border-zinc-700'} rounded-lg`}
                      placeholder="Enter passage reference or text"
                    />
                    {!section.passage && (
                      <p className="text-red-400 text-sm mt-1">
                        Please enter a passage. This field is required and causing display issues.
                      </p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Questions</label>
                    {section.questions.map((question: string, questionIndex: number) => (
                      <div key={questionIndex} className="flex mb-2">
                        <input
                          type="text"
                          value={question}
                          onChange={(e) => handleQuestionChange(sectionIndex, questionIndex, e.target.value)}
                          className="flex-1 px-4 py-2 bg-black border border-zinc-700 rounded-lg"
                          placeholder={`Question ${questionIndex + 1}`}
                        />
                        <button
                          onClick={() => removeQuestion(sectionIndex, questionIndex)}
                          className="ml-2 px-3 bg-red-900/50 hover:bg-red-900 rounded-lg"
                          disabled={section.questions.length <= 1}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                    
                    <button
                      onClick={() => addQuestion(sectionIndex)}
                      className="mt-2 px-4 py-1 bg-zinc-700 hover:bg-zinc-600 rounded-lg text-sm"
                    >
                      + Add Question
                    </button>
                  </div>
                </div>
              ))}
              
              <button
                onClick={addSection}
                className="mb-8 px-6 py-2 bg-zinc-700 hover:bg-zinc-600 rounded-lg"
              >
                + Add Section
              </button>
              
              <div>
                <button
                  onClick={handleUpdate}
                  disabled={updating}
                  className={`px-6 py-3 rounded-lg ${
                    updating ? 'bg-zinc-700 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'
                  }`}
                >
                  {updating ? 'Updating...' : 'Update Devotion Data'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 