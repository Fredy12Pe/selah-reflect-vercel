interface HymnOfTheMonthProps {
  title: string;
  backgroundImage?: string;
}

export default function HymnOfTheMonth({
  title,
  backgroundImage,
}: HymnOfTheMonthProps) {
  return (
    <div className="p-6 bg-black/95">
      <h3 className="text-white/70 text-sm font-medium mb-2">
        Hymn of the Month:
      </h3>
      <div
        className="relative rounded-xl overflow-hidden bg-cover bg-center h-32"
        style={{
          backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.3), rgba(0,0,0,0.6)), url(${
            backgroundImage || "/default-ocean.jpg"
          })`,
        }}
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <h2 className="text-2xl font-bold text-white text-center px-4">
            {title}
          </h2>
        </div>
      </div>
    </div>
  );
}
