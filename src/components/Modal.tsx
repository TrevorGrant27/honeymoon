"use client";

import { useEffect, useCallback } from "react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  maxWidth?: string;
}

export function Modal({ isOpen, onClose, children, maxWidth = "max-w-2xl" }: ModalProps) {
  const handleEscape = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [isOpen, handleEscape]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-overlay bg-espresso/25"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={`relative w-full ${maxWidth} max-h-[90vh] overflow-y-auto bg-cream rounded-2xl shadow-2xl border border-border-soft`}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-white/80 hover:bg-white text-warm-brown transition-colors z-10 border border-border-soft"
        >
          &times;
        </button>
        {children}
      </div>
    </div>
  );
}
