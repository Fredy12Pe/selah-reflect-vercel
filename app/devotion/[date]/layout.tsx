import React from "react";

export function generateStaticParams() {
  // This generates a static placeholder for the date parameter
  return [{ date: "placeholder" }];
}

export default function DateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
