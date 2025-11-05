type PieChartProps = {
  data: Array<{ status: string; count: number }>;
};

const COLORS = ['#3B82F6', '#F59E0B', '#10B981', '#EF4444'];

export function PieChart({ data }: PieChartProps) {
  const total = data.reduce((sum, item) => sum + item.count, 0);

  if (total === 0) {
    return <p className="text-gray-500 dark:text-gray-400 text-center">No data to display</p>;
  }

  return (
    <div className="flex items-center justify-center">
      <div className="space-y-3 w-full">
        {data.map((item, index) => {
          const percentage = (item.count / total) * 100;
          return (
            <div key={index}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center space-x-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300 capitalize">
                    {item.status}
                  </span>
                </div>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {item.count} ({percentage.toFixed(0)}%)
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="h-2 rounded-full transition-all"
                  style={{
                    backgroundColor: COLORS[index % COLORS.length],
                    width: `${percentage}%`,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
