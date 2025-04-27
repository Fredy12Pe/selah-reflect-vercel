import Link from "next/link";

interface ReflectionQuestionsProps {
  questions: string[];
  date: string;
}

export default function ReflectionQuestions({
  questions,
  date,
}: ReflectionQuestionsProps) {
  return (
    <div className="p-6 bg-black/95 text-white">
      <h2 className="text-2xl font-bold mb-6">Reflection Questions</h2>
      <ol className="space-y-4 mb-8">
        {questions.map((question, index) => (
          <li key={index} className="flex gap-4">
            <span className="text-lg">{index + 1}.</span>
            <p className="text-lg">{question}</p>
          </li>
        ))}
      </ol>

      <Link
        href={`/devotion/${date}/journal`}
        className="inline-flex items-center px-6 py-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
      >
        Journal Entry
        <svg
          className="ml-2 w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5l7 7-7 7"
          />
        </svg>
      </Link>
    </div>
  );
}
