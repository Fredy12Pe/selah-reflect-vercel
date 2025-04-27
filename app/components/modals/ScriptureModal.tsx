import { Fragment, useState, useEffect } from "react";
import { Dialog, Transition, Listbox } from "@headlessui/react";
import {
  XMarkIcon,
  ChevronUpDownIcon,
  CheckIcon,
} from "@heroicons/react/24/outline";

const BIBLE_VERSIONS = [
  { id: "kjv", name: "King James Version" },
  { id: "web", name: "World English Bible" },
  { id: "bbe", name: "Basic Bible in English" },
];

type ScriptureModalProps = {
  isOpen: boolean;
  onClose: () => void;
  reference: string;
};

export default function ScriptureModal({
  isOpen,
  onClose,
  reference,
}: ScriptureModalProps) {
  const [selectedVersion, setSelectedVersion] = useState(BIBLE_VERSIONS[0]);
  const [scripture, setScripture] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchScripture() {
      if (!isOpen) return;

      setLoading(true);
      setError("");

      try {
        const response = await fetch(
          `https://bible-api.com/${reference}?translation=${selectedVersion.id}`
        );

        if (!response.ok) throw new Error("Failed to fetch scripture");

        const data = await response.json();
        setScripture(data.text);
      } catch (err) {
        setError("Unable to load scripture. Please try again later.");
        console.error("Scripture fetch error:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchScripture();
  }, [reference, selectedVersion.id, isOpen]);

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

                <div className="mt-3 text-center sm:mt-0 sm:text-left">
                  <Dialog.Title
                    as="h3"
                    className="text-2xl font-semibold leading-6 text-white mb-4"
                  >
                    {reference}
                  </Dialog.Title>

                  <Listbox
                    value={selectedVersion}
                    onChange={setSelectedVersion}
                  >
                    <div className="relative mt-1 mb-6">
                      <Listbox.Button className="relative w-full cursor-pointer rounded-lg bg-zinc-800 py-2 pl-3 pr-10 text-left shadow-md focus:outline-none focus-visible:border-indigo-500 focus-visible:ring-2 focus-visible:ring-white/75 focus-visible:ring-offset-2 focus-visible:ring-offset-orange-300 sm:text-sm">
                        <span className="block truncate text-white">
                          {selectedVersion.name}
                        </span>
                        <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                          <ChevronUpDownIcon className="h-5 w-5 text-gray-400" />
                        </span>
                      </Listbox.Button>
                      <Transition
                        as={Fragment}
                        leave="transition ease-in duration-100"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                      >
                        <Listbox.Options className="absolute mt-1 max-h-60 w-full overflow-auto rounded-md bg-zinc-800 py-1 text-base shadow-lg ring-1 ring-black/5 focus:outline-none sm:text-sm">
                          {BIBLE_VERSIONS.map((version) => (
                            <Listbox.Option
                              key={version.id}
                              className={({ active }) =>
                                `relative cursor-pointer select-none py-2 pl-10 pr-4 ${
                                  active
                                    ? "bg-zinc-700 text-white"
                                    : "text-gray-300"
                                }`
                              }
                              value={version}
                            >
                              {({ selected }) => (
                                <>
                                  <span
                                    className={`block truncate ${
                                      selected ? "font-medium" : "font-normal"
                                    }`}
                                  >
                                    {version.name}
                                  </span>
                                  {selected ? (
                                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-white">
                                      <CheckIcon className="h-5 w-5" />
                                    </span>
                                  ) : null}
                                </>
                              )}
                            </Listbox.Option>
                          ))}
                        </Listbox.Options>
                      </Transition>
                    </div>
                  </Listbox>

                  <div className="mt-2">
                    {loading ? (
                      <div className="flex justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white"></div>
                      </div>
                    ) : error ? (
                      <p className="text-red-400 text-center py-8">{error}</p>
                    ) : (
                      <p className="text-lg text-gray-200 leading-relaxed whitespace-pre-line">
                        {scripture}
                      </p>
                    )}
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
