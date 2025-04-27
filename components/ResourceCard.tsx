"use client";

import React from "react";

interface ResourceCardProps {
  title: string;
  type: "video" | "podcast" | "article";
  url: string;
  description?: string;
}

export default function ResourceCard({
  title,
  type,
  url,
  description,
}: ResourceCardProps) {
  const getIcon = () => {
    switch (type) {
      case "video":
        return "🎥";
      case "podcast":
        return "🎧";
      case "article":
        return "📚";
      default:
        return "📌";
    }
  };

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="block card hover:shadow-lg transition-shadow duration-200"
    >
      <div className="flex items-start gap-3">
        <span className="text-2xl" role="img" aria-label={type}>
          {getIcon()}
        </span>
        <div>
          <h4 className="font-semibold text-gray-900">{title}</h4>
          {description && (
            <p className="text-sm text-gray-600 mt-1">{description}</p>
          )}
          <span className="text-xs text-primary mt-2 block">
            Click to open {type} ↗
          </span>
        </div>
      </div>
    </a>
  );
}
