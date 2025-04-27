interface ScriptureProps {
  reference: string;
  text: string;
}

export default function Scripture({ reference, text }: ScriptureProps) {
  return (
    <div className="p-6 bg-black/90 text-white">
      <h2 className="text-3xl font-bold mb-6">{reference}</h2>
      <p className="text-lg leading-relaxed">{text}</p>
    </div>
  );
}
