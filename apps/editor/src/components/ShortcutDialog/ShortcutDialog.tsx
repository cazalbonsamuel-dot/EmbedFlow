import { useEffect } from "react";

interface ShortcutDialogProps {
  open: boolean;
  onClose: () => void;
}

const shortcuts = [
  { keys: ["Ctrl", "Z"], desc: "Annuler (Undo)" },
  { keys: ["Ctrl", "Y"], desc: "Refaire (Redo)" },
  { keys: ["Ctrl", "S"], desc: "Sauvegarder le projet" },
  { keys: ["Ctrl", "C"], desc: "Copier les blocs sélectionnés" },
  { keys: ["Ctrl", "V"], desc: "Coller les blocs" },
  { keys: ["Ctrl", "E"], desc: "Exporter le workflow" },
  { keys: ["Delete"], desc: "Supprimer le bloc sélectionné" },
  { keys: ["Ctrl", "/"], desc: "Afficher cette aide" },
];

export default function ShortcutDialog({ open, onClose }: ShortcutDialogProps) {
  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-gray-900 border border-gray-700 rounded-xl shadow-2xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
          <div className="flex items-center gap-2">
            <span className="text-lg">⌨️</span>
            <h2 className="text-base font-semibold text-gray-100">Raccourcis clavier</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-300 text-xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Shortcuts table */}
        <div className="px-6 py-4 space-y-2">
          {shortcuts.map((shortcut, i) => (
            <div key={i} className="flex items-center justify-between py-2">
              <span className="text-sm text-gray-300">{shortcut.desc}</span>
              <div className="flex items-center gap-1">
                {shortcut.keys.map((key, j) => (
                  <span key={j}>
                    {j > 0 && <span className="text-gray-600 text-xs mx-0.5">+</span>}
                    <kbd className="inline-block px-2 py-0.5 text-xs font-mono bg-gray-800 border border-gray-600 rounded text-gray-300 shadow-sm min-w-[28px] text-center">
                      {key}
                    </kbd>
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-gray-800">
          <p className="text-[10px] text-gray-600 text-center">
            Appuyez sur Echap pour fermer
          </p>
        </div>
      </div>
    </div>
  );
}
