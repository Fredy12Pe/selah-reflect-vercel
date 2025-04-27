import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import fs from "fs";
import path from "path";

// Export viewport configuration
export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#000000",
};

// Export metadata configuration
export const metadata = {
  title: "Selah - Apple Touch Icon",
  description: "Apple Touch Icon for Selah app",
};

// This replaces the default route handler for /apple-touch-icon.png
export async function GET(request: NextRequest) {
  const imagePath = path.join(process.cwd(), "public", "icon-192.png");
  const imageBuffer = fs.readFileSync(imagePath);

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          background: "black",
          width: "100%",
          height: "100%",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <img
          src={`data:image/png;base64,${imageBuffer.toString("base64")}`}
          width={180}
          height={180}
          alt="Selah Icon"
        />
      </div>
    ),
    {
      width: 180,
      height: 180,
    }
  );
}
