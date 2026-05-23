import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const QUICK_COMMANDS = [
  "Show vacant units",
  "Revenue forecast",
  "Risk analysis",
  "Top opportunities",
];

export default function CommandBar({ open = false, onSubmit, onClose }) {
  const [query, setQuery] = useState("");
  const inputRef = useRef(null);

  useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [open]);

  function handleSubmit() {
    const trimmed = query.trim();
    if (!trimmed) return;
    onSubmit?.(trimmed);
    setQuery("");
  }

  function handleKeyDown(e) {
    if (e.key === "Enter") {
      handleSubmit();
    }
    if (e.key === "Escape") {
      onClose?.();
    }
  }

  function handleChip(chip) {
    setQuery(chip);
    inputRef.current?.focus();
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Command Bar */}
          <motion.div
            className="fixed bottom-6 left-1/2 z-50 w-full max-w-2xl px-4"
            style={{ x: "-50%", marginLeft: "0" }}
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
          >
            <div className="bg-panel border border-cyan/20 rounded-2xl shadow-cyanGlow overflow-hidden">
              {/* Input row */}
              <div className="flex items-center gap-3 px-4 py-3.5 border-b border-white/5">
                <span className="text-blue font-bold font-mono text-sm flex-shrink-0 select-none">
                  Q&gt;
                </span>
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask QLVIN AI anything..."
                  className="flex-1 bg-transparent text-white text-sm outline-none placeholder-gray-600"
                />
                {query.length === 0 ? (
                  <span className="text-xs text-gray-600 font-mono flex-shrink-0">⌘K</span>
                ) : (
                  <motion.button
                    onClick={handleSubmit}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="text-xs px-3 py-1.5 bg-blue/20 border border-blue/30 text-blue rounded-lg hover:bg-blue/30 transition-colors flex-shrink-0"
                  >
                    Send ↵
                  </motion.button>
                )}
              </div>

              {/* Quick command chips */}
              <div className="flex flex-wrap gap-2 px-4 py-3">
                {QUICK_COMMANDS.map((cmd) => (
                  <motion.button
                    key={cmd}
                    onClick={() => handleChip(cmd)}
                    whileHover={{ scale: 1.03, backgroundColor: "rgba(47,128,255,0.12)" }}
                    whileTap={{ scale: 0.97 }}
                    className="text-xs px-3 py-1.5 bg-panel-light border border-white/10 text-gray-400 rounded-lg hover:text-white hover:border-blue/30 transition-colors"
                  >
                    {cmd}
                  </motion.button>
                ))}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
