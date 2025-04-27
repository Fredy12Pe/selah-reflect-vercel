import { Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import {
  PlayCircleIcon,
  BookOpenIcon,
  MicrophoneIcon,
} from "@heroicons/react/24/outline";

type Resource = {
  title: string;
  type: "video" | "article" | "podcast";
  url: string;
  source?: string;
};

type ResourcesModalProps = {
  isOpen: boolean;
  onClose: () => void;
  reference: string;
};

// Mock resources - replace with real data from your backend or AI service
const MOCK_RESOURCES: Resource[] = [
  {
    title: "Understanding Simon of Cyrene's Role",
    type: "video",
    url: "https://example.com/video1",
    source: "Bible Project",
  },
  {
    title: "Commentary on Luke 23:26-34",
    type: "article",
    url: "https://example.com/article1",
    source: "Bible Gateway",
  },
  {
    title: "The Path to Calvary",
    type: "podcast",
    url: "https://example.com/podcast1",
    source: "Through the Word",
  },
];

const TypeIcon = ({ type }: { type: Resource["type"] }) => {
  switch (type) {
    case "video":
      return <PlayCircleIcon className="h-6 w-6" />;
    case "article":
      return <BookOpenIcon className="h-6 w-6" />;
    case "podcast":
      return <MicrophoneIcon className="h-6 w-6" />;
  }
};

export default function ResourcesModal({
  isOpen,
  onClose,
  reference,
}: ResourcesModalProps) {
  const handleResourceClick = (url: string) => {
    window.open(url, "_blank");
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
                    className="text-2xl font-semibold leading-6 text-white mb-2"
                  >
                    Resources
                  </Dialog.Title>
                  <p className="text-gray-400 mb-6">
                    Study materials for {reference}
                  </p>

                  <div className="space-y-4">
                    {MOCK_RESOURCES.map((resource, index) => (
                      <button
                        key={index}
                        onClick={() => handleResourceClick(resource.url)}
                        className="w-full bg-zinc-800 rounded-xl p-4 text-left hover:bg-zinc-700 transition-colors"
                      >
                        <div className="flex items-start gap-4">
                          <div className="text-white/80">
                            <TypeIcon type={resource.type} />
                          </div>
                          <div>
                            <h4 className="text-white font-medium mb-1">
                              {resource.title}
                            </h4>
                            {resource.source && (
                              <p className="text-sm text-gray-400">
                                {resource.source}
                              </p>
                            )}
                          </div>
                        </div>
                      </button>
                    ))}
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
