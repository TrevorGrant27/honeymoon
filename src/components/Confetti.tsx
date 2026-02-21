"use client";

import { useEffect, useState } from "react";

const COLORS = ["#C9918F", "#B47B79", "#9CAF88", "#C5A572", "#E8DED2", "#B49CAF", "#D4BBA0"];

interface ConfettiPiece {
  id: number;
  left: number;
  color: string;
  size: number;
  delay: number;
  duration: number;
  shape: "square" | "circle" | "strip";
}

export function Confetti() {
  const [pieces, setPieces] = useState<ConfettiPiece[]>([]);

  useEffect(() => {
    const generated: ConfettiPiece[] = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      size: Math.random() * 8 + 4,
      delay: Math.random() * 2,
      duration: Math.random() * 2 + 2,
      shape: (["square", "circle", "strip"] as const)[Math.floor(Math.random() * 3)],
    }));
    setPieces(generated);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {pieces.map((p) => (
        <div
          key={p.id}
          className="confetti-piece"
          style={{
            left: `${p.left}%`,
            backgroundColor: p.color,
            width: p.shape === "strip" ? p.size * 0.4 : p.size,
            height: p.shape === "strip" ? p.size * 2.5 : p.size,
            borderRadius: p.shape === "circle" ? "50%" : p.shape === "strip" ? "2px" : "1px",
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
          }}
        />
      ))}
    </div>
  );
}
