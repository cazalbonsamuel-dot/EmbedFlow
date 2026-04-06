import { useTranslation } from "react-i18next";

function App() {
  const { t, i18n } = useTranslation();

  const toggleLanguage = () => {
    const newLang = i18n.language === "fr" ? "en" : "fr";
    i18n.changeLanguage(newLang);
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-gray-800 bg-gray-900">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold text-blue-400">{t("app.title")}</h1>
          <span className="text-sm text-gray-400">{t("app.subtitle")}</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-900/50 text-green-400 border border-green-800">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400"></span>
            {t("status.ready")}
          </span>
          <button
            onClick={toggleLanguage}
            className="px-3 py-1.5 text-sm rounded-md bg-gray-800 hover:bg-gray-700 text-gray-300 transition-colors"
          >
            {t("language.toggle")}
          </button>
        </div>
      </header>

      {/* Toolbar */}
      <nav className="flex items-center gap-2 px-6 py-2 border-b border-gray-800 bg-gray-900/50">
        <button className="px-3 py-1.5 text-sm rounded-md bg-blue-600 hover:bg-blue-500 text-white transition-colors">
          {t("actions.newProject")}
        </button>
        <button className="px-3 py-1.5 text-sm rounded-md bg-gray-800 hover:bg-gray-700 text-gray-300 transition-colors">
          {t("actions.simulate")}
        </button>
        <button className="px-3 py-1.5 text-sm rounded-md bg-gray-800 hover:bg-gray-700 text-gray-300 transition-colors">
          {t("actions.viewCode")}
        </button>
        <button className="px-3 py-1.5 text-sm rounded-md bg-gray-800 hover:bg-gray-700 text-gray-300 transition-colors">
          {t("actions.compile")}
        </button>
        <button className="px-3 py-1.5 text-sm rounded-md bg-emerald-600 hover:bg-emerald-500 text-white transition-colors">
          {t("actions.flash")}
        </button>
      </nav>

      {/* Main content area */}
      <div className="flex flex-1">
        {/* Activity panel (left) */}
        <aside className="w-60 border-r border-gray-800 bg-gray-900/30 p-4">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            {t("workflow.addNode")}
          </h2>
          <div className="space-y-2">
            {["control", "sensors", "actuators", "display", "logic", "timing", "communication", "variables"].map(
              (cat) => (
                <div
                  key={cat}
                  className="px-3 py-2 rounded-md bg-gray-800/50 text-sm text-gray-300 hover:bg-gray-800 cursor-pointer transition-colors"
                >
                  {t(`categories.${cat}`)}
                </div>
              ),
            )}
          </div>
        </aside>

        {/* Canvas (center) */}
        <main className="flex-1 flex items-center justify-center bg-gray-950">
          <div className="text-center text-gray-600">
            <p className="text-lg">{t("app.title")}</p>
            <p className="text-sm mt-1">{t("app.subtitle")}</p>
          </div>
        </main>

        {/* Properties panel (right) */}
        <aside className="w-72 border-l border-gray-800 bg-gray-900/30 p-4">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            {t("nav.settings")}
          </h2>
          <p className="text-sm text-gray-600 mt-4">{t("workflow.addNode")}</p>
        </aside>
      </div>
    </div>
  );
}

export default App;
