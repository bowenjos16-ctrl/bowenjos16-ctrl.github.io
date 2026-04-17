"use client";

import { useEffect, useState } from "react";

type Ember = {
  id: number;
  left: number;
  duration: number;
  delay: number;
  size: number;
};

export default function Embers({ count = 30 }: { count?: number }) {
  const [embers, setEmbers] = useState<Ember[]>([]);

  useEffect(() => {
    const arr: Ember[] = Array.from({ length: count }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      duration: 8 + Math.random() * 12,
      delay: Math.random() * 10,
      size: 1 + Math.random() * 3,
    }));
    setEmbers(arr);
  }, [count]);

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      {embers.map((e) => (
        <span
          key={e.id}
          className="ember"
          style={{
            left: `${e.left}%`,
            width: `${e.size}px`,
            height: `${e.size}px`,
            animationDuration: `${e.duration}s`,
            animationDelay: `${e.delay}s`,
          }}
        />
      ))}
    </div>
  );
}
