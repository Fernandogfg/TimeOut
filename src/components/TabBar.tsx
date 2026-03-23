interface Tab {
  key: string
  label: string
}

interface TabBarProps {
  tabs: Tab[]
  active: string
  onChange: (key: string) => void
}

export default function TabBar({ tabs, active, onChange }: TabBarProps) {
  return (
    <div role="tablist" className="flex border-b border-gray-700 mb-4">
      {tabs.map((tab) => {
        const isActive = tab.key === active
        return (
          <button
            key={tab.key}
            role="tab"
            aria-selected={isActive}
            onClick={() => { if (!isActive) onChange(tab.key) }}
            className={`flex-1 py-2.5 text-sm font-semibold transition-colors ${
              isActive
                ? 'text-white border-b-2 border-green-500 -mb-px'
                : 'text-gray-500'
            }`}
          >
            {tab.label}
          </button>
        )
      })}
    </div>
  )
}
