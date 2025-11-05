import { Trash2 } from 'lucide-react';
import { StudyPlan, Subject } from '../../lib/supabase';

type WeeklyCalendarProps = {
  plans: (StudyPlan & { subject: Subject })[];
  onSlotClick: (day: number, time: string) => void;
  onDeletePlan: (id: string) => void;
};

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
// generate 24 hourly slots from 00:00 to 23:00
const TIME_SLOTS = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`);

export function WeeklyCalendar({ plans, onSlotClick, onDeletePlan }: WeeklyCalendarProps) {
  const getPlanForSlot = (day: number, time: string) => {
    return plans.find((plan) => {
      const planStart = plan.start_time.substring(0, 5);
      return plan.day_of_week === day && planStart === time;
    });
  };

  const timeToMinutes = (time: string) => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const calculateDuration = (startTime: string, endTime: string) => {
    const start = timeToMinutes(startTime);
    const end = timeToMinutes(endTime);
    return (end - start) / 60;
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <div className="min-w-max">
          <div className="grid grid-cols-8 border-b border-gray-200">
            <div className="bg-gray-50 p-4 font-semibold text-gray-700">Time</div>
            {DAYS.map((day, index) => (
              <div
                key={day}
                className="bg-gray-50 p-4 font-semibold text-gray-700 text-center"
              >
                {day}
              </div>
            ))}
          </div>

          <div className="divide-y divide-gray-200">
            {TIME_SLOTS.map((time) => (
              <div key={time} className="grid grid-cols-8">
                <div className="p-4 bg-gray-50 text-sm text-gray-600 font-medium">
                  {time}
                </div>
                {DAYS.map((_, dayIndex) => {
                  const plan = getPlanForSlot(dayIndex, time);

                  return (
                    <div
                      key={`${dayIndex}-${time}`}
                      className="relative border-l border-gray-200 min-h-[60px] hover:bg-gray-50 cursor-pointer transition"
                      onClick={() => !plan && onSlotClick(dayIndex, time)}
                    >
                      {plan && (
                        <div
                          className="absolute inset-1 rounded p-2 text-white text-xs overflow-hidden group"
                          style={{
                            backgroundColor: plan.subject.color,
                            height: `${calculateDuration(plan.start_time, plan.end_time) * 60 - 8}px`,
                          }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="font-semibold truncate">
                            {plan.subject.name}
                          </div>
                          <div className="text-white text-opacity-90 text-xs">
                            {plan.start_time.substring(0, 5)} - {plan.end_time.substring(0, 5)}
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeletePlan(plan.id);
                            }}
                            className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition bg-white bg-opacity-20 p-1 rounded hover:bg-opacity-30"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
