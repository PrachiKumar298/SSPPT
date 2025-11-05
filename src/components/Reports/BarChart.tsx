type BarChartProps = {
  data: Array<{ week: string; hours: number }>;
};

export function BarChart({ data }: BarChartProps) {
  if (data.length === 0) return null;

  const maxHours = Math.max(...data.map(d => d.hours));
  const scale = 100 / (maxHours || 1);

  return (
    <div className="space-y-2">
      <div className="flex items-end space-x-2 h-48">
        {data.map((item, index) => {
          const height = item.hours * scale;
          return (
            <div key={index} className="flex-1 flex flex-col items-center justify-end">
              <div className="relative w-full group">
                <div
                  className="w-full bg-blue-600 dark:bg-blue-500 rounded-t transition-all hover:bg-blue-700"
                  style={{ height: `${height}%`, minHeight: item.hours > 0 ? '8px' : '0' }}
                />
                <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-900 dark:bg-gray-700 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap">
                  {item.hours}h
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
        {data.map((item, index) => (
          <span key={index} className="flex-1 text-center">{item.week}</span>
        ))}
      </div>
    </div>
  );
}
