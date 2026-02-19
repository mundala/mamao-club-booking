import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface DateRange {
  start: Date | null;
  end: Date | null;
}

interface DotMatrixCalendarProps {
  dateRange: DateRange;
  onSelectRange: (range: DateRange) => void;
}

const hapticImpact = () => {
  if (navigator.vibrate) {
    navigator.vibrate(5);
  }
};

const TIME_SLOTS = [
  { label: '21:00', hour: 21, minute: 0 },
  { label: '21:30', hour: 21, minute: 30 },
  { label: '22:00', hour: 22, minute: 0 },
  { label: '22:30', hour: 22, minute: 30 },
  { label: '23:00', hour: 23, minute: 0 },
];

export const DotMatrixCalendar: React.FC<DotMatrixCalendarProps> = ({ dateRange, onSelectRange }) => {
  const [viewDate, setViewDate] = useState(new Date());
  const [direction, setDirection] = useState(0);
  const [hoveredDate, setHoveredDate] = useState<string | null>(null);

  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const handleMonthChange = (dir: number) => {
    hapticImpact();
    setDirection(dir);
    const newDate = new Date(viewDate);
    newDate.setMonth(newDate.getMonth() + dir);
    setViewDate(newDate);
  };

  const handleDateClick = (date: Date) => {
    hapticImpact();
    
    // Normalize time to midnight for consistent comparison
    date.setHours(0, 0, 0, 0);

    let newRange: DateRange = { ...dateRange };

    if (!dateRange.start || (dateRange.start && dateRange.end)) {
      // Start new selection
      newRange = { start: date, end: null };
    } else if (dateRange.start && !dateRange.end) {
      if (date < dateRange.start) {
        // Clicked before start, set as new start
        newRange = { start: date, end: null };
      } else if (date.getTime() === dateRange.start.getTime()) {
        // Clicked same day
        newRange = { start: date, end: null }; 
      } else {
        // Valid end date
        newRange = { start: dateRange.start, end: date };
      }
    }
    
    onSelectRange(newRange);
  };

  const handleTimeClick = (hour: number, minute: number) => {
    hapticImpact();
    if (dateRange.start) {
      const newStart = new Date(dateRange.start);
      newStart.setHours(hour, minute, 0, 0);
      onSelectRange({ ...dateRange, start: newStart });
    }
  };

  const daysInMonth = getDaysInMonth(viewDate.getFullYear(), viewDate.getMonth());
  const firstDay = getFirstDayOfMonth(viewDate.getFullYear(), viewDate.getMonth());
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const blanks = Array.from({ length: firstDay }, (_, i) => i);
  const monthNames = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const isSameDay = (d1: Date, d2: Date) => d1.toDateString() === d2.toDateString();

  const variants = {
    enter: (dir: number) => ({ x: dir > 0 ? 20 : -20, opacity: 0, filter: 'blur(4px)' }),
    center: { x: 0, opacity: 1, filter: 'blur(0px)' },
    exit: (dir: number) => ({ x: dir < 0 ? 20 : -20, opacity: 0, filter: 'blur(4px)' })
  };

  return (
    <div className="w-full select-none font-mono">
      {/* Header */}
      <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-2">
        <button onClick={() => handleMonthChange(-1)} className="p-2 hover:bg-white/5 rounded-full transition-colors text-white/50 hover:text-white">
          <ChevronLeft size={16} />
        </button>
        <span className="text-sm tracking-[0.3em] font-bold">
            {viewDate.getFullYear()} . {monthNames[viewDate.getMonth()]}
        </span>
        <button onClick={() => handleMonthChange(1)} className="p-2 hover:bg-white/5 rounded-full transition-colors text-white/50 hover:text-white">
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Grid Header */}
      <div className="grid grid-cols-7 mb-2 text-center">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
          <div key={i} className="text-[10px] text-white/30">{d}</div>
        ))}
      </div>

      {/* Calendar Matrix */}
      <div className="relative overflow-visible">
        <AnimatePresence initial={false} custom={direction} mode="popLayout">
          <motion.div
            key={viewDate.toISOString()}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="grid grid-cols-7 gap-y-2 gap-x-0"
          >
            {blanks.map(b => <div key={`blank-${b}`} />)}
            {days.map(d => {
              const currentDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), d);
              const dateKey = currentDate.toISOString();
              
              const isPast = currentDate < today;
              const isClosedDay = currentDate.getDay() === 0 || currentDate.getDay() === 3; // Sun & Wed
              const isStart = dateRange.start && isSameDay(currentDate, dateRange.start);
              const isEnd = dateRange.end && isSameDay(currentDate, dateRange.end);
              const isInRange = dateRange.start && dateRange.end && currentDate > dateRange.start && currentDate < dateRange.end;
              const isSelected = isStart || isEnd;
              const hasRange = !!(dateRange.start && dateRange.end);

              // Grid Intelligence for Routing
              // Calculate column index (0-6) to prevent wires from wrapping around rows visually
              const globalIndex = firstDay + d - 1;
              const colIndex = globalIndex % 7;
              
              // Wire Logic:
              // Connect Right IF: In Range OR Start Node AND NOT Right Edge (Sat) AND Next day is in range/end
              const shouldConnectRight = hasRange && (isStart || isInRange) && (currentDate < dateRange.end!) && colIndex !== 6;
              // Connect Left IF: In Range OR End Node AND NOT Left Edge (Sun) AND Prev day is in range/start
              const shouldConnectLeft = hasRange && (isEnd || isInRange) && (currentDate > dateRange.start!) && colIndex !== 0;

              return (
                <div 
                  key={d} 
                  className="flex justify-center items-center relative h-10"
                  onMouseEnter={() => !isPast && !isClosedDay && setHoveredDate(dateKey)}
                  onMouseLeave={() => setHoveredDate(null)}
                >
                  
                  {/* === Zen-Tech Pulse Wire === */}
                  <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-[1px] flex items-center justify-center z-0 pointer-events-none">
                    
                    {/* Left Segment */}
                    <div className="w-1/2 h-full flex justify-end">
                       {shouldConnectLeft && (
                          <motion.div 
                             initial={{ width: 0, opacity: 0 }}
                             animate={{ width: "100%", opacity: 1 }}
                             transition={{ duration: 0.4, ease: "circOut" }}
                             className="h-full w-full bg-nothing-red shadow-[0_0_8px_rgba(215,25,33,0.5)] relative overflow-hidden"
                          >
                             {/* Data Pulse Animation */}
                             <motion.div 
                                className="absolute inset-0 bg-white/40"
                                animate={{ opacity: [0, 0.5, 0] }}
                                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                             />
                          </motion.div>
                       )}
                    </div>
                    
                    {/* Right Segment */}
                    <div className="w-1/2 h-full flex justify-start">
                        {shouldConnectRight && (
                          <motion.div 
                             initial={{ width: 0, opacity: 0 }}
                             animate={{ width: "100%", opacity: 1 }}
                             transition={{ duration: 0.4, ease: "circOut" }}
                             className="h-full w-full bg-nothing-red shadow-[0_0_8px_rgba(215,25,33,0.5)] relative overflow-hidden"
                          >
                             {/* Data Pulse Animation */}
                             <motion.div 
                                className="absolute inset-0 bg-white/40"
                                animate={{ opacity: [0, 0.5, 0] }}
                                transition={{ duration: 2, repeat: Infinity, ease: "linear", delay: 0.2 }}
                             />
                          </motion.div>
                       )}
                    </div>
                  </div>

                  {/* === Range Zone (Ghost Fill) === */}
                  {isInRange && (
                     <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.05 }}
                        className="absolute inset-0 bg-nothing-red z-0"
                     />
                  )}

                  {/* === Hover Tooltip === */}
                  <AnimatePresence>
                    {hoveredDate === dateKey && !isPast && !isInRange && !isSelected && (
                      <motion.div
                        initial={{ opacity: 0, y: 5, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.15, ease: "easeOut" }}
                        className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 z-50 pointer-events-none"
                      >
                         <div className="bg-off-black/90 backdrop-blur-md border border-white/20 text-[9px] text-warm-white font-mono uppercase tracking-wide px-3 py-1.5 shadow-[0_4px_20px_rgba(0,0,0,0.5)] whitespace-nowrap flex gap-2">
                            <span>{currentDate.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' })}</span>
                         </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* === The Date Node === */}
                  <button
                    disabled={isPast || isClosedDay}
                    onClick={() => handleDateClick(currentDate)}
                    className={`
                      relative w-8 h-8 flex flex-col items-center justify-center text-xs transition-all duration-300 z-10 group
                      ${isPast || isClosedDay ? 'opacity-20 cursor-not-allowed' : 'cursor-pointer'}
                    `}
                  >
                     {/* Selection State (Terminal Node) */}
                     {isSelected && (
                         <motion.div
                           layoutId="selectionNode"
                           className="absolute inset-0 bg-nothing-red shadow-[0_0_20px_rgba(215,25,33,0.4)]"
                           initial={{ scale: 0.8, opacity: 0 }}
                           animate={{ scale: 1, opacity: 1 }}
                           transition={{ type: "spring", stiffness: 400, damping: 25 }}
                         >
                            {/* Inner Interference Pulse */}
                            <div className="absolute inset-0 bg-white/10 animate-pulse" />

                            {/* Tech Corners (Brackets) */}
                            <div className="absolute top-0 left-0 w-1.5 h-1.5 border-t border-l border-white/80" />
                            <div className="absolute top-0 right-0 w-1.5 h-1.5 border-t border-r border-white/80" />
                            <div className="absolute bottom-0 left-0 w-1.5 h-1.5 border-b border-l border-white/80" />
                            <div className="absolute bottom-0 right-0 w-1.5 h-1.5 border-b border-r border-white/80" />
                         </motion.div>
                     )}

                     {/* Selection Ripple Feedback */}
                     {isSelected && (
                        <motion.div
                          key="ripple"
                          initial={{ width: "100%", height: "100%", opacity: 1 }}
                          animate={{ width: "280%", height: "280%", opacity: 0 }}
                          style={{ left: "50%", top: "50%", x: "-50%", y: "-50%", position: "absolute" }}
                          transition={{ duration: 0.8, ease: "easeOut" }}
                          className="rounded-full border border-nothing-red pointer-events-none z-0"
                        />
                     )}

                     {/* Text Content */}
                     <span className={`relative z-20 font-mono ${isSelected ? 'text-off-black font-bold' : isInRange ? 'text-warm-white font-medium' : isClosedDay ? 'text-white/20 line-through' : 'text-white/60 group-hover:text-white'}`}>
                        {d < 10 ? `0${d}` : d}
                     </span>

                     {/* Rest Day Label */}
                     {isClosedDay && !isPast && (
                        <span className="absolute -bottom-0.5 text-[5px] text-white/25 tracking-wider z-20">REST</span>
                     )}

                     {/* Hover Ring for non-selected */}
                     {!isSelected && !isPast && !isInRange && !isClosedDay && (
                        <div className="absolute inset-0 border border-white/0 group-hover:border-white/30 scale-75 group-hover:scale-100 transition-all duration-300 rounded-sm" />
                     )}

                  </button>
                </div>
              );
            })}
          </motion.div>
        </AnimatePresence>
      </div>
      
      {/* Time Slot Selection (Only show if Start Date is selected) */}
      <AnimatePresence>
        {dateRange.start && (
          <motion.div
            initial={{ opacity: 0, height: 0, marginTop: 0 }}
            animate={{ opacity: 1, height: 'auto', marginTop: 24 }}
            exit={{ opacity: 0, height: 0, marginTop: 0 }}
            className="overflow-hidden border-t border-white/10 pt-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-[9px] text-nothing-red uppercase tracking-widest">
                <Clock size={10} />
                <span>SELECT ARRIVAL (21:00-23:00)</span>
              </div>
            </div>
            
            <div className="grid grid-cols-5 gap-2">
              {TIME_SLOTS.map((slot) => {
                const isSelected = dateRange.start?.getHours() === slot.hour && dateRange.start?.getMinutes() === slot.minute;
                return (
                  <button
                    key={slot.label}
                    onClick={() => handleTimeClick(slot.hour, slot.minute)}
                    className={`
                      py-2 font-mono text-[10px] sm:text-xs border transition-all duration-300 relative overflow-hidden group flex flex-col items-center justify-center gap-1
                      ${isSelected 
                        ? 'border-nothing-red text-nothing-red bg-nothing-red/10 shadow-[0_0_10px_rgba(215,25,33,0.2)]' 
                        : 'border-white/10 text-white/40 hover:border-white/30 hover:text-white hover:bg-white/5'}
                    `}
                  >
                    <span>{slot.label}</span>
                    {isSelected && <motion.div layoutId="activeTime" className="w-1 h-1 bg-nothing-red rounded-full" />}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Decorative Status Line */}
      <div className="mt-6 flex justify-between text-[9px] text-white/20 uppercase tracking-widest">
        <span>MODE: RANGE_SELECT</span>
        <div className="flex gap-2">
            <span className={dateRange.start ? 'text-nothing-red' : ''}>{dateRange.start ? 'START_LOCKED' : 'WAITING'}</span>
            <span>//</span>
            <span className={dateRange.end ? 'text-nothing-red' : ''}>{dateRange.end ? 'END_LOCKED' : 'WAITING'}</span>
        </div>
      </div>
    </div>
  );
};