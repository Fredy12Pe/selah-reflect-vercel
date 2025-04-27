"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { useAuth } from "@/lib/context/AuthContext";
import DynamicBackground from "./DynamicBackground";

export default function DailyDevotion() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [userName, setUserName] = useState<string>("");
  const today = format(new Date(), "yyyy-MM-dd");

  useEffect(() => {
    if (!loading) {
      if (user) {
        const displayName =
          user.displayName?.split(" ")[0] ||
          user.email?.split("@")[0] ||
          "Guest";
        setUserName(displayName);
      } else {
        router.push("/auth/login");
      }
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <DynamicBackground
      date={today}
      query="landscape mountains sunshine morning"
      imageType="devotion"
      overlayOpacity={0.5}
      className="min-h-screen"
      showAttribution={true}
    >
      {/* Content Layer */}
      <main
        className="relative min-h-screen p-8 flex flex-col items-center"
        style={{ zIndex: 1 }}
      >
        <div className="w-full max-w-[393px] space-y-6">
          <div>
            <h1 className="text-6xl font-bold text-white">
              {format(new Date(), "EEEE,")}
            </h1>
            <h2 className="text-6xl font-bold text-white mt-2">
              {format(new Date(), "MMMM d")}
            </h2>
            <h3 className="text-3xl text-white mt-4">
              Have a blessed day, {userName}!
            </h3>
          </div>

          <div className="mt-[224px] w-[393px] h-[556px] rounded-t-[20px] backdrop-blur-[90px] bg-black/50 px-7 py-7 space-y-[29px]">
            <h2 className="text-4xl font-bold text-white">Luke 23: 26-34</h2>
            <p className="text-xl text-white leading-relaxed">
              As the soldiers led him away, they seized Simon from Cyrene, who
              was on his way in from the country, and put the cross on him and
              made him carry it behind Jesus. A large number of people followed
              him, including women who mourned and wailed for him. Jesus turned
              and said to them, "Daughters of Jerusalem, do not weep for me;
              weep for yourselves and for your children. For the time will come
              when you will say, 'Blessed are the childless women, the wombs
              that never bore and the breasts that never nursed!' Then they will
              say to the mountains, "Fall on us!"
            </p>
          </div>

          <div className="mt-auto">
            <button
              onClick={() =>
                router.push(
                  `/devotion/${format(new Date(), "yyyy-MM-dd")}/reflection`
                )
              }
              className="flex items-center space-x-4 bg-white rounded-lg px-6 py-4 text-black"
            >
              <span className="text-lg">See Today's Reflection</span>
              <svg
                className="w-8 h-8"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
              >
                <path d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </main>
    </DynamicBackground>
  );
}
