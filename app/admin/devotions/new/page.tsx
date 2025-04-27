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
    scriptureReference: "",
    scriptureText: "",
    content: "",
    prayer: "",
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

  const handleQuestionChange = (index: number, value: string) => {
    const newQuestions = [...devotion.reflectionQuestions];
    newQuestions[index] = value;
    setDevotion({ ...devotion, reflectionQuestions: newQuestions });
  };

  const addQuestion = () => {
    setDevotion({
      ...devotion,
      reflectionQuestions: [...devotion.reflectionQuestions, ""],
    });
  };

  const removeQuestion = (index: number) => {
    const newQuestions = devotion.reflectionQuestions.filter(
      (_, i) => i !== index
    );
    setDevotion({ ...devotion, reflectionQuestions: newQuestions });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!devotion.date) {
      toast.error("Please select a date");
      return;
    }

    try {
      setSaving(true);
      const devotionRef = safeDoc("devotions", devotion.date);

      await safeSetDoc(devotionRef, {
        ...devotion,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: user.email,
      });

      toast.success("Devotion saved successfully!");

      // Clear form
      setDevotion({
        date: "",
        title: "",
        scriptureReference: "",
        scriptureText: "",
        content: "",
        prayer: "",
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
              value={devotion.scriptureReference}
              onChange={(e) =>
                setDevotion({ ...devotion, scriptureReference: e.target.value })
              }
              className="w-full px-4 py-2 rounded-lg bg-zinc-900 border border-zinc-700"
              required
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
            <label className="block text-sm font-medium mb-2">
              Reflection Questions
            </label>
            <div className="space-y-3">
              {devotion.reflectionQuestions.map((question, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    value={question}
                    onChange={(e) =>
                      handleQuestionChange(index, e.target.value)
                    }
                    className="flex-1 px-4 py-2 rounded-lg bg-zinc-900 border border-zinc-700"
                    placeholder={`Question ${index + 1}`}
                    required
                  />
                  {devotion.reflectionQuestions.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeQuestion(index)}
                      className="px-3 py-2 rounded-lg bg-red-900/30 text-red-400 hover:bg-red-900/50"
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={addQuestion}
                className="w-full px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 transition-colors"
              >
                Add Question
              </button>
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
