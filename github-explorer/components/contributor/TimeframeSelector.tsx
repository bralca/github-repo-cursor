import { TimeFrame } from "@/types/contributor";

interface TimeframeSelectorProps {
  value: TimeFrame;
  onChange: (value: TimeFrame) => void;
  className?: string;
}

export default function TimeframeSelector({ 
  value, 
  onChange, 
  className = ""
}: TimeframeSelectorProps) {
  const options: { value: TimeFrame; label: string }[] = [
    { value: '30days', label: '30 days' },
    { value: '90days', label: '90 days' },
    { value: '6months', label: '6 months' },
    { value: '1year', label: '1 year' },
    { value: 'all', label: 'All time' },
  ];

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg flex ${className}`}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as TimeFrame)}
        className="px-3 py-2 rounded-lg bg-transparent focus:outline-none text-sm font-medium"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
} 