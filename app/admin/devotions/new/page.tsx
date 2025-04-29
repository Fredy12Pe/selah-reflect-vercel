"use client";

import { useState } from "react";
import { useAuth } from "@/lib/context/AuthContext";
import { safeDoc, safeSetDoc } from "@/lib/utils/firebase-helpers";
import { toast, Toaster } from "react-hot-toast";

export default function NewDevotion() {
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const ADMIN_EMAILS = ["fredypedro3@gmail.com"];

  const [devotion, setDevotion] = useState({
    date: "",
    title: "",
    bibleText: "",
    scriptureText: "",
    content: "",
    prayer: "",
    reflectionSections: [
      {
        passage: "",
        questions: [""]
      }
    ],
    // Keep legacy field for backwards compatibility
    reflectionQuestions: [""],
  });

  if (!user || !ADMIN_EMAILS.includes(user.email || "")) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p>You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  const handleSectionChange = (sectionIndex: number, field: string, value: any) => {
    const newSections = [...devotion.reflectionSections];
    newSections[sectionIndex] = {
      ...newSections[sectionIndex],
      [field]: value
    };
    setDevotion({ ...devotion, reflectionSections: newSections });
  };

  const handleQuestionChange = (sectionIndex: number, questionIndex: number, value: string) => {
    const newSections = [...devotion.reflectionSections];
    const newQuestions = [...newSections[sectionIndex].questions];
    newQuestions[questionIndex] = value;
    newSections[sectionIndex] = {
      ...newSections[sectionIndex],
      questions: newQuestions
    };
    setDevotion({ ...devotion, reflectionSections: newSections });
  };

  const addQuestion = (sectionIndex: number) => {
    const newSections = [...devotion.reflectionSections];
    newSections[sectionIndex] = {
      ...newSections[sectionIndex],
      questions: [...newSections[sectionIndex].questions, ""]
    };
    setDevotion({ ...devotion, reflectionSections: newSections });
  };

  const removeQuestion = (sectionIndex: number, questionIndex: number) => {
    const newSections = [...devotion.reflectionSections];
    const newQuestions = newSections[sectionIndex].questions.filter(
      (_, i) => i !== questionIndex
    );
    newSections[sectionIndex] = {
      ...newSections[sectionIndex],
      questions: newQuestions
    };
    setDevotion({ ...devotion, reflectionSections: newSections });
  };

  const addSection = () => {
    setDevotion({
      ...devotion,
      reflectionSections: [
        ...devotion.reflectionSections,
        {
          passage: "",
          questions: [""]
        }
      ]
    });
  };

  const removeSection = (index: number) => {
    if (devotion.reflectionSections.length <= 1) {
      toast.error("You must have at least one reflection section");
      return;
    }
    
    const newSections = devotion.reflectionSections.filter((_, i) => i !== index);
    setDevotion({ ...devotion, reflectionSections: newSections });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!devotion.date) {
      toast.error("Please select a date");
      return;
    }

    // Validate that all sections have passages
    const invalidSections = devotion.reflectionSections.filter(section => !section.passage);
    if (invalidSections.length > 0) {
      toast.error("All reflection sections must have a passage reference");
      return;
    }

    try {
      setSaving(true);
      
      // Format the date as YYYY-MM-DD for the document ID
      const formattedDate = devotion.date;
      const devotionRef = safeDoc("devotions", formattedDate);

      // Create a flattened array of all questions for backward compatibility
      const allQuestions = devotion.reflectionSections.flatMap(section => section.questions);

      await safeSetDoc(devotionRef, {
        ...devotion,
        reflectionQuestions: allQuestions, // Keep for backward compatibility
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: user.email,
        updatedBy: user.email,
      });

      toast.success("Devotion saved successfully!");

      // Clear form
      setDevotion({
        date: "",
        title: "",
        bibleText: "",
        scriptureText: "",
        content: "",
        prayer: "",
        reflectionSections: [
          {
            passage: "",
            questions: [""]
          }
        ],
        reflectionQuestions: [""],
      });
    } catch (error) {
      console.error("Error saving devotion:", error);
      toast.error("Failed to save devotion");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <Toaster position="top-center" />
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Add New Devotion</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Date</label>
              <input
                type="date"
                value={devotion.date}
                onChange={(e) =>
                  setDevotion({ ...devotion, date: e.target.value })
                }
                className="w-full px-4 py-2 rounded-lg bg-zinc-900 border border-zinc-700"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Title</label>
              <input
                type="text"
                value={devotion.title}
                onChange={(e) =>
                  setDevotion({ ...devotion, title: e.target.value })
                }
                className="w-full px-4 py-2 rounded-lg bg-zinc-900 border border-zinc-700"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Scripture Reference
            </label>
            <input
              type="text"
              value={devotion.bibleText}
              onChange={(e) =>
                setDevotion({ ...devotion, bibleText: e.target.value })
              }
              className="w-full px-4 py-2 rounded-lg bg-zinc-900 border border-zinc-700"
              required
              placeholder="e.g., Luke 24:1-12"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Scripture Text
            </label>
            <textarea
              value={devotion.scriptureText}
              onChange={(e) =>
                setDevotion({ ...devotion, scriptureText: e.target.value })
              }
              className="w-full px-4 py-2 rounded-lg bg-zinc-900 border border-zinc-700 h-32"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Content</label>
            <textarea
              value={devotion.content}
              onChange={(e) =>
                setDevotion({ ...devotion, content: e.target.value })
              }
              className="w-full px-4 py-2 rounded-lg bg-zinc-900 border border-zinc-700 h-48"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Prayer</label>
            <textarea
              value={devotion.prayer}
              onChange={(e) =>
                setDevotion({ ...devotion, prayer: e.target.value })
              }
              className="w-full px-4 py-2 rounded-lg bg-zinc-900 border border-zinc-700 h-32"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 flex justify-between items-center">
              <span>Reflection Sections</span>
              <button
                type="button"
                onClick={addSection}
                className="text-sm px-3 py-1 rounded-lg bg-blue-900/30 text-blue-400 hover:bg-blue-900/50"
              >
                Add Section
              </button>
            </label>
            
            <div className="space-y-6">
              {devotion.reflectionSections.map((section, sectionIndex) => (
                <div key={sectionIndex} className="p-4 border border-zinc-700 rounded-lg">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="font-medium">Section {sectionIndex + 1}</h3>
                    {devotion.reflectionSections.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeSection(sectionIndex)}
                        className="text-sm px-3 py-1 rounded-lg bg-red-900/30 text-red-400 hover:bg-red-900/50"
                      >
                        Remove Section
                      </button>
                    )}
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-2">Passage Reference</label>
                    <input
                      type="text"
                      value={section.passage}
                      onChange={(e) => handleSectionChange(sectionIndex, "passage", e.target.value)}
                      className="w-full px-4 py-2 rounded-lg bg-zinc-900 border border-zinc-700"
                      placeholder="e.g., Luke 24:1-2, 12"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Questions</label>
                    <div className="space-y-3">
                      {section.questions.map((question, questionIndex) => (
                        <div key={questionIndex} className="flex gap-2">
                          <input
                            type="text"
                            value={question}
                            onChange={(e) => handleQuestionChange(sectionIndex, questionIndex, e.target.value)}
                            className="flex-1 px-4 py-2 rounded-lg bg-zinc-900 border border-zinc-700"
                            placeholder={`Question ${questionIndex + 1}`}
                            required
                          />
                          {section.questions.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeQuestion(sectionIndex, questionIndex)}
                              className="px-3 py-2 rounded-lg bg-red-900/30 text-red-400 hover:bg-red-900/50"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => addQuestion(sectionIndex)}
                        className="w-full px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 transition-colors"
                      >
                        Add Question
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-white text-black rounded-full py-4 px-6 font-medium hover:bg-white/90 transition-colors disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Devotion"}
          </button>
        </form>
      </div>
    </div>
  );
}
