import { Fragment, useState, useEffect } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { getFirebaseFirestore } from "@/lib/firebase";
import { useAuth } from "@/lib/context/AuthContext";
import { isBrowser } from "@/lib/utils/environment";

type JournalModalProps = {
  isOpen: boolean;
  onClose: () => void;
  date: string;
  questions: string[];
};

export default function JournalModal({
  isOpen,
  onClose,
  date,
  questions,
}: JournalModalProps) {
  const { user } = useAuth();
  const [entries, setEntries] = useState<string[]>(questions.map(() => ""));
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">(
    "idle"
  );

  useEffect(() => {
    async function loadJournalEntry() {
      if (!user || !isOpen || !isBrowser) return;

      try {
        const db = getFirebaseFirestore();
        if (!db) {
          console.error("Firestore not initialized");
          return;
        }

        const docRef = doc(db, "users", user.uid, "journalEntries", date);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          setEntries(data.answers || questions.map(() => ""));
        }
      } catch (error) {
        console.error("Error loading journal entry:", error);
      }
    }

    loadJournalEntry();
  }, [user, date, isOpen, questions]);

  const handleSave = async () => {
    if (!user || !isBrowser) return;

    setSaving(true);
    setSaveStatus("idle");

    try {
      const db = getFirebaseFirestore();
      if (!db) {
        console.error("Firestore not initialized");
        setSaveStatus("error");
        return;
      }

      const docRef = doc(db, "users", user.uid, "journalEntries", date);
      await setDoc(docRef, {
        answers: entries,
        questions,
        updatedAt: new Date().toISOString(),
      });
      setSaveStatus("success");
      setTimeout(() => {
        onClose();
        setSaveStatus("idle");
      }, 1000);
    } catch (error) {
      console.error("Error saving journal entry:", error);
      setSaveStatus("error");
    } finally {
      setSaving(false);
    }
  };

  const handleEntryChange = (index: number, value: string) => {
    const newEntries = [...entries];
    newEntries[index] = value;
    setEntries(newEntries);
  };

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform overflow-hidden rounded-2xl bg-zinc-900 px-4 pb-4 pt-5 text-left shadow-xl transition-all w-full max-w-lg mx-4 sm:max-w-xl sm:p-6">
                <div className="absolute right-4 top-4">
                  <button
                    type="button"
                    className="text-gray-400 hover:text-gray-300"
                    onClick={onClose}
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                <div className="mt-3 sm:mt-0">
                  <Dialog.Title
                    as="h3"
                    className="text-2xl font-semibold leading-6 text-white mb-6"
                  >
                    Journal Entry
                  </Dialog.Title>

                  <div className="space-y-6">
                    {questions.map((question, index) => (
                      <div key={index}>
                        <label className="block text-lg text-white mb-2">
                          {index + 1}. {question}
                        </label>
                        <textarea
                          value={entries[index]}
                          onChange={(e) =>
                            handleEntryChange(index, e.target.value)
                          }
                          rows={4}
                          className="w-full rounded-lg bg-zinc-800 p-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white/20"
                          placeholder="Write your thoughts here..."
                        />
                      </div>
                    ))}
                  </div>

                  <div className="mt-8 flex justify-end">
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className={`px-6 py-3 rounded-full font-medium flex items-center gap-2 ${
                        saving
                          ? "bg-zinc-700 text-zinc-400"
                          : saveStatus === "success"
                          ? "bg-green-600 text-white"
                          : saveStatus === "error"
                          ? "bg-red-600 text-white"
                          : "bg-white text-black"
                      }`}
                    >
                      {saving ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                          <span>Saving...</span>
                        </>
                      ) : saveStatus === "success" ? (
                        "Saved!"
                      ) : saveStatus === "error" ? (
                        "Error Saving"
                      ) : (
                        "Save Entry"
                      )}
                    </button>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}
