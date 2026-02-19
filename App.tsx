import React, { useState } from 'react';
import { DotMatrixGrid } from './components/DotMatrixGrid';
import { StatusBar } from './components/StatusBar';
import { GlassCard } from './components/GlassCard';
import { DotMatrixCalendar } from './components/DotMatrixCalendar';
import { BookingStep, BookingState } from './types';
import { generateBookingSouvenir } from './services/geminiService';
import { generateBookingConfirmation } from './services/emailService';
import { saveBooking } from './services/bookingStore';
import { AnimatePresence, motion } from 'framer-motion';
import { Loader2, ArrowRight, Minus, CreditCard, AlertTriangle, Download, RotateCcw, Instagram, Facebook } from 'lucide-react';

// Zen-Tech / WKW Animation Constants - Slower, more languid
const pageVariants = {
  initial: { opacity: 0, x: 10, filter: 'blur(8px)' },
  in: { opacity: 1, x: 0, filter: 'blur(0px)' },
  out: { opacity: 0, x: -10, filter: 'blur(8px)' }
};

const pageTransition = {
  duration: 0.8,
  ease: [0.2, 0.0, 0.2, 1] // Very smooth, almost linear mid-section
};

const hapticImpact = () => {
  if (navigator.vibrate) {
    navigator.vibrate(5); // More subtle
  }
};

const App: React.FC = () => {
  const [step, setStep] = useState<BookingStep>(BookingStep.PEOPLE);
  const [bookingData, setBookingData] = useState<BookingState>({
    peopleCount: 2,
    dateRange: { start: null, end: null },
    name: '',
    phone: '',
    email: '',
    notes: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState<string>("INITIALIZING...");
  const [showConfirmation, setShowConfirmation] = useState(false);

  const isTimeSelected = bookingData.dateRange.start && bookingData.dateRange.start.getHours() >= 21;
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(bookingData.email);
  const isLargeGroup = bookingData.peopleCount >= 12;

  // Generate current date string in YYYY.MM.DD format
  const currentDateStr = new Date().toLocaleDateString('en-CA').replace(/-/g, '.');

  const handleNext = async () => {
    hapticImpact();
    if (step === BookingStep.PEOPLE) setStep(BookingStep.DATE);
    else if (step === BookingStep.DATE && isTimeSelected) setStep(BookingStep.CONFIRMATION);
    else if (step === BookingStep.CONFIRMATION && isEmailValid) {
       setShowConfirmation(true);
    }
  };

  const handleBack = () => {
    hapticImpact();
    if (step > BookingStep.PEOPLE) setStep(step - 1);
  };

  const proceedToFinalize = async () => {
    setShowConfirmation(false);
    if (isLargeGroup) {
        await handleStripeCheckout();
    } else {
        await handleFinalize();
    }
  };

  const handleStripeCheckout = async () => {
    setIsLoading(true);
    setLoadingStatus("SECURE CHANNEL...");
    await new Promise(r => setTimeout(r, 1500));
    setLoadingStatus("GATEWAY...");
    await new Promise(r => setTimeout(r, 1500));
    setLoadingStatus("VERIFYING...");
    await new Promise(r => setTimeout(r, 1000));
    await handleFinalize();
  };

  const handleFinalize = async () => {
    if (!isLoading) setIsLoading(true);
    setLoadingStatus("GENERATING ARTIFACT...");
    const bookingRef = `MC-${Date.now().toString(36).toUpperCase()}`;

    if (bookingData.dateRange.start) {
        const effectiveEnd = bookingData.dateRange.end || bookingData.dateRange.start;
        const effectiveRange = { start: bookingData.dateRange.start, end: effectiveEnd };
        const imageUrl = await generateBookingSouvenir(bookingData.peopleCount, effectiveRange);
        setLoadingStatus("COMPILING...");
        const confirmationUrl = generateBookingConfirmation({
            name: bookingData.name,
            phone: bookingData.phone,
            email: bookingData.email,
            notes: bookingData.notes,
            people: bookingData.peopleCount,
            range: effectiveRange,
            souvenirUrl: imageUrl,
            bookingRef,
        });
        const dateStr = bookingData.dateRange.start.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
        const timeStr = bookingData.dateRange.start.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });

        saveBooking({
          ref: bookingRef,
          name: bookingData.name,
          phone: bookingData.phone,
          email: bookingData.email,
          peopleCount: bookingData.peopleCount,
          date: bookingData.dateRange.start.toISOString().split('T')[0],
          time: timeStr,
          notes: bookingData.notes,
          createdAt: new Date().toISOString(),
        });

        // Persist to D1 — await to capture cancelToken for email
        let cancelToken = '';
        try {
          const d1Res = await fetch('/api/bookings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ref: bookingRef,
              name: bookingData.name,
              phone: bookingData.phone,
              email: bookingData.email,
              guests: bookingData.peopleCount,
              date: bookingData.dateRange.start.toISOString().split('T')[0],
              time: timeStr,
              notes: bookingData.notes,
              createdAt: new Date().toISOString(),
            }),
          });
          if (d1Res.ok) {
            const d1Data = await d1Res.json() as { cancelToken?: string };
            cancelToken = d1Data.cancelToken || '';
          }
        } catch (err) {
          console.warn('[SYS.D1] Booking save failed:', err);
        }

        // Send email confirmation with cancelToken (fire-and-forget)
        fetch('/api/send-confirmation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: bookingData.name,
            phone: bookingData.phone,
            email: bookingData.email,
            notes: bookingData.notes,
            people: bookingData.peopleCount,
            date: dateStr,
            time: timeStr,
            bookingRef,
            cancelToken,
          }),
        }).catch((err) => console.warn('[SYS.MAIL] Email send failed:', err));

        setBookingData(prev => ({ ...prev, souvenirUrl: imageUrl, confirmationUrl, bookingRef }));
    }
    setIsLoading(false);
    setStep(BookingStep.SUCCESS);
  };

  const handleBookAnother = () => {
    hapticImpact();
    if (bookingData.confirmationUrl) {
      URL.revokeObjectURL(bookingData.confirmationUrl);
    }
    setBookingData({
      peopleCount: 2,
      dateRange: { start: null, end: null },
      name: '',
      phone: '',
      email: '',
      notes: '',
    });
    setStep(BookingStep.PEOPLE);
  };

  const handleDownloadConfirmation = () => {
    if (!bookingData.confirmationUrl) return;
    hapticImpact();
    const a = document.createElement('a');
    a.href = bookingData.confirmationUrl;
    a.download = `MAMAO_CONFIRMATION_${bookingData.bookingRef || Date.now()}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="min-h-screen text-warm-white font-sans flex flex-col relative selection:bg-nothing-red/30 selection:text-white">
      <DotMatrixGrid />
      
      <main className="flex-grow flex flex-col items-center justify-center p-6 pb-40 z-10">
        {/* Header - Cinematic Title */}
        <header className="mb-10 text-center relative">
          <h1 className="text-6xl md:text-7xl font-serif italic font-medium tracking-tight mb-2 text-warm-white bloom-white opacity-90">
            Mamao Club
          </h1>
          <div className="flex items-center justify-center gap-4 text-[9px] font-mono text-white/40 tracking-[0.4em] uppercase">
             <span>SYS.{currentDateStr}</span>
             <span className="w-1 h-1 bg-nothing-red rounded-full animate-pulse bloom-red"></span>
             <span>ONLINE</span>
          </div>
          {/* Decorative Floor Plan */}
          <svg viewBox="0 0 200 60" className="w-48 mx-auto mt-4 opacity-[0.07]" fill="none" stroke="currentColor" strokeWidth="0.5">
            <rect x="10" y="5" width="180" height="50" rx="2" />
            <rect x="20" y="10" width="30" height="15" rx="1" strokeDasharray="2 2" />
            <rect x="60" y="10" width="30" height="15" rx="1" strokeDasharray="2 2" />
            <rect x="110" y="10" width="30" height="15" rx="1" strokeDasharray="2 2" />
            <rect x="150" y="10" width="30" height="15" rx="1" strokeDasharray="2 2" />
            <line x1="100" y1="30" x2="100" y2="50" strokeDasharray="1 3" />
            <rect x="30" y="35" width="50" height="15" rx="6" strokeOpacity="0.6" />
            <rect x="120" y="35" width="50" height="15" rx="6" strokeOpacity="0.6" />
            <circle cx="55" cy="42" r="2" fill="currentColor" fillOpacity="0.3" stroke="none" />
            <circle cx="145" cy="42" r="2" fill="currentColor" fillOpacity="0.3" stroke="none" />
            <rect x="85" y="35" width="30" height="18" rx="1" strokeOpacity="0.4" />
            <text x="92" y="46" fontSize="5" fill="currentColor" fillOpacity="0.3" stroke="none" fontFamily="monospace">DJ</text>
          </svg>
        </header>

        {/* Main Interface */}
        <GlassCard className="w-full max-w-md min-h-[540px] flex flex-col transition-all duration-1000 ease-out">
           {/* Progress Line - Neon Tube Style */}
           <div className="absolute top-0 left-0 w-full h-[1px] bg-white/5">
             <motion.div 
               className="h-full bg-nothing-red shadow-[0_0_15px_rgba(215,25,33,0.8)]"
               initial={{ width: '0%' }}
               animate={{ width: `${((step + 1) / 4) * 100}%` }}
               transition={{ duration: 1.5, ease: "circOut" }}
             />
           </div>

           <div className="flex-grow p-8 flex flex-col relative">
             <AnimatePresence mode="wait">
               
               {/* STEP 1: PARTY SIZE */}
               {step === BookingStep.PEOPLE && (
                 <motion.div
                   key="people"
                   initial="initial"
                   animate="in"
                   exit="out"
                   variants={pageVariants}
                   transition={pageTransition}
                   className="flex-grow flex flex-col"
                 >
                   <div className="flex justify-between items-center mb-8">
                      <div className="text-[10px] font-mono text-nothing-red tracking-widest bloom-red">01 // QUANTITY</div>
                   </div>
                   
                   <h2 className="text-4xl font-serif italic mb-12 text-warm-white bloom-white leading-tight opacity-90">
                     How many<br/>tonight?
                   </h2>
                   
                   <div className="grid grid-cols-4 gap-3 mb-auto">
                     {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((num) => {
                       return (
                         <button
                           key={num}
                           onClick={() => {
                             hapticImpact();
                             setBookingData({ ...bookingData, peopleCount: num });
                           }}
                           className={`
                             aspect-square flex items-center justify-center text-lg font-mono border transition-all duration-500 relative group overflow-hidden
                             ${bookingData.peopleCount === num 
                               ? 'bg-white/10 text-white border-white/40 shadow-[0_0_15px_rgba(255,255,255,0.1)]' 
                               : 'bg-transparent text-white/30 border-white/5 hover:border-white/20 hover:text-white/80'}
                           `}
                         >
                           <span className="relative z-10 italic">{num < 10 ? `0${num}` : num}</span>
                         </button>
                       );
                     })}
                     
                     {/* Large Group Dropdown */}
                     <div
                        className={`
                            aspect-square relative flex items-center justify-center border transition-all duration-500
                            ${bookingData.peopleCount >= 12
                                ? 'bg-white/10 text-white border-white/40'
                                : 'border-white/5 text-white/30 hover:border-white/20 hover:text-white/80'}
                        `}
                     >
                        <select
                            value={bookingData.peopleCount >= 12 ? bookingData.peopleCount : ''}
                            onChange={(e) => {
                                const val = parseInt(e.target.value);
                                if (!isNaN(val)) {
                                    hapticImpact();
                                    setBookingData({ ...bookingData, peopleCount: val });
                                }
                            }}
                            className="w-full h-full bg-transparent text-center font-mono text-lg italic focus:outline-none cursor-pointer appearance-none"
                        >
                            <option value="" disabled className="bg-[#030303] text-white/50">12+</option>
                            {Array.from({ length: 13 }, (_, i) => i + 12).map(n => (
                              <option key={n} value={n} className="bg-[#030303] text-white">{n}</option>
                            ))}
                        </select>
                     </div>
                   </div>
                 </motion.div>
               )}

               {/* STEP 2: CHRONOLOGY */}
               {step === BookingStep.DATE && (
                 <motion.div
                   key="date"
                   initial="initial"
                   animate="in"
                   exit="out"
                   variants={pageVariants}
                   transition={pageTransition}
                   className="flex-grow flex flex-col"
                 >
                   <div className="text-[10px] font-mono text-nothing-red mb-8 tracking-widest bloom-red">02 // CHRONOLOGY</div>
                   <h2 className="text-4xl font-serif italic mb-6 text-warm-white bloom-white leading-tight opacity-90">
                     Choose the<br/>moment.
                   </h2>

                   <div className="mb-auto">
                      <DotMatrixCalendar 
                        dateRange={bookingData.dateRange}
                        onSelectRange={(range) => {
                          setBookingData({ ...bookingData, dateRange: range });
                        }}
                      />
                   </div>
                 </motion.div>
               )}

               {/* STEP 3: VERIFICATION */}
               {step === BookingStep.CONFIRMATION && (
                 <motion.div
                   key="confirm"
                   initial="initial"
                   animate="in"
                   exit="out"
                   variants={pageVariants}
                   transition={pageTransition}
                   className="flex-grow flex flex-col"
                 >
                   <div className="text-[10px] font-mono text-nothing-red mb-8 tracking-widest bloom-red">03 // VERIFICATION</div>
                   <h2 className="text-4xl font-serif italic mb-8 text-warm-white bloom-white leading-tight opacity-90">
                     Confirm<br/>details.
                   </h2>

                   <div className="space-y-8 border-l border-white/10 pl-8 py-2 mb-auto relative">
                     {/* Neon Line */}
                     <motion.div 
                        initial={{ scaleY: 0 }}
                        animate={{ scaleY: 1 }}
                        transition={{ duration: 1.2, delay: 0.2 }}
                        className="absolute left-[-1px] top-0 bottom-0 w-[1px] bg-nothing-red opacity-60 origin-top shadow-[0_0_10px_rgba(215,25,33,0.5)]"
                     />

                     <div className="group">
                       <div className="text-[9px] font-mono uppercase text-white/30 mb-1">Guests</div>
                       <div className="text-xl font-serif italic flex items-baseline gap-2 text-warm-white">
                         <span>{bookingData.peopleCount < 10 ? `0${bookingData.peopleCount}` : bookingData.peopleCount}</span>
                         <span className="text-xs font-mono text-white/30 not-italic">SOULS</span>
                         {isLargeGroup && (
                            <span className="ml-2 px-1 py-0.5 border border-nothing-red text-[7px] text-nothing-red tracking-widest uppercase not-italic">
                                LARGE_PARTY
                            </span>
                         )}
                       </div>
                     </div>

                     <div className="group">
                       <div className="text-[9px] font-mono uppercase text-white/30 mb-2">
                           {bookingData.dateRange.end ? 'Duration' : 'Date'}
                       </div>
                       
                       {bookingData.dateRange.end ? (
                           <div className="flex flex-col gap-2">
                               <div className="flex items-center gap-4 bg-white/5 p-3 rounded-sm border border-white/5">
                                   <div className="flex flex-col">
                                       <span className="text-[8px] font-mono text-nothing-red tracking-wider">IN</span>
                                       <span className="text-lg font-serif italic">
                                           {bookingData.dateRange.start?.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                                       </span>
                                   </div>
                                   <div className="h-[1px] flex-grow bg-white/10 flex items-center justify-center">
                                       <Minus size={12} className="text-white/20" />
                                   </div>
                                   <div className="flex flex-col text-right">
                                       <span className="text-[8px] font-mono text-white/30 tracking-wider">OUT</span>
                                       <span className="text-lg font-serif italic">
                                           {bookingData.dateRange.end.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                                       </span>
                                   </div>
                               </div>
                           </div>
                       ) : (
                           <div className="text-xl font-serif italic text-warm-white">
                               {bookingData.dateRange.start?.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                           </div>
                       )}
                     </div>

                     <div className="group">
                       <div className="text-[9px] font-mono uppercase text-white/30 mb-1">Time</div>
                       <div className="text-xl font-serif italic text-warm-white flex items-center gap-3">
                         <div className="relative flex h-2 w-2 mt-1">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-nothing-red opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-nothing-red shadow-[0_0_8px_#D71921]"></span>
                         </div>
                         <div className="flex items-baseline gap-2">
                            <span className="text-2xl tracking-wide">
                                {bookingData.dateRange.start?.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}
                            </span>
                         </div>
                       </div>
                     </div>

                     <div className="group pt-4 border-t border-white/5 mt-4 space-y-5">
                       <div className="text-[9px] font-mono uppercase text-white/30 mb-2">Contact</div>
                       <input
                          type="text"
                          placeholder="FULL_NAME"
                          value={bookingData.name}
                          onChange={(e) => setBookingData({...bookingData, name: e.target.value})}
                          className="w-full bg-transparent border-b border-white/20 py-2 text-lg font-mono text-warm-white focus:outline-none focus:border-nothing-red transition-colors placeholder:text-white/10 tracking-wider italic"
                       />
                       <input
                          type="tel"
                          placeholder="PHONE_NUMBER"
                          value={bookingData.phone}
                          onChange={(e) => setBookingData({...bookingData, phone: e.target.value})}
                          className="w-full bg-transparent border-b border-white/20 py-2 text-lg font-mono text-warm-white focus:outline-none focus:border-nothing-red transition-colors placeholder:text-white/10 tracking-wider italic"
                       />
                       <input
                          type="email"
                          placeholder="EMAIL_ADDRESS"
                          value={bookingData.email}
                          onChange={(e) => setBookingData({...bookingData, email: e.target.value})}
                          className="w-full bg-transparent border-b border-white/20 py-2 text-lg font-mono text-warm-white focus:outline-none focus:border-nothing-red transition-colors placeholder:text-white/10 tracking-wider italic"
                       />
                     </div>

                     <div className="group pt-4 border-t border-white/5 mt-4">
                       <div className="text-[9px] font-mono uppercase text-white/30 mb-3">Special Occasion / Requests</div>
                       <div className="flex flex-wrap gap-2 mb-3">
                         {[
                           'Birthday',
                           'Anniversary',
                           'Date Night',
                           'Corporate',
                           'Graduation',
                           'Hen/Bucks',
                           'VIP Table',
                           'Cake Setup',
                           'Dietary Needs',
                           'Wheelchair Access',
                         ].map((tag) => {
                           const isActive = bookingData.notes.includes(tag);
                           return (
                             <button
                               key={tag}
                               type="button"
                               onClick={() => {
                                 hapticImpact();
                                 if (isActive) {
                                   const cleaned = bookingData.notes
                                     .replace(tag, '')
                                     .replace(/,\s*,/g, ',')
                                     .replace(/^,\s*|,\s*$/g, '')
                                     .trim();
                                   setBookingData({...bookingData, notes: cleaned});
                                 } else {
                                   const prefix = bookingData.notes.trim();
                                   const joined = prefix ? prefix + ', ' + tag : tag;
                                   setBookingData({...bookingData, notes: joined});
                                 }
                               }}
                               className={`
                                 px-3 py-1.5 text-[10px] font-mono tracking-wider border transition-all duration-300
                                 ${isActive
                                   ? 'bg-white/10 text-white border-white/30'
                                   : 'bg-transparent text-white/25 border-white/8 hover:border-white/20 hover:text-white/60'}
                               `}
                             >
                               {tag.toUpperCase()}
                             </button>
                           );
                         })}
                       </div>
                       <textarea
                          placeholder="ANYTHING ELSE WE SHOULD KNOW..."
                          value={bookingData.notes}
                          onChange={(e) => setBookingData({...bookingData, notes: e.target.value})}
                          rows={2}
                          className="w-full bg-transparent border-b border-white/20 py-2 text-sm font-mono text-warm-white focus:outline-none focus:border-nothing-red transition-colors placeholder:text-white/10 tracking-wider italic resize-none"
                       />
                     </div>
                   </div>
                   
                   {isLoading ? (
                     <div className="flex items-center gap-3 text-xs font-mono text-nothing-red animate-pulse mt-6 justify-center">
                        <Loader2 className="animate-spin" size={14}/>
                        <span className="tracking-widest">{loadingStatus}</span>
                     </div>
                   ) : (
                     <button
                       onClick={handleNext}
                       disabled={!isEmailValid}
                       className={`
                         w-full py-4 font-mono text-xs tracking-[0.2em] transition-all duration-500 flex items-center justify-center gap-3 group mt-6 border
                         ${isEmailValid 
                            ? 'bg-white/5 text-warm-white border-white/20 hover:bg-white/10 hover:border-white/40 hover:shadow-[0_0_20px_rgba(255,255,255,0.1)]' 
                            : 'bg-transparent text-white/10 border-white/5 cursor-not-allowed'}
                       `}
                     >
                       {isLargeGroup ? (
                           <>
                               <span>SECURE DEPOSIT</span>
                               <CreditCard size={12} />
                           </>
                       ) : (
                           <>
                               <span>READY TO MAMAO</span>
                               <ArrowRight size={12} className={`transition-transform ${isEmailValid ? 'group-hover:translate-x-1' : ''}`}/>
                           </>
                       )}
                     </button>
                   )}
                 </motion.div>
               )}

               {/* STEP 4: SUCCESS */}
               {step === BookingStep.SUCCESS && (
                 <motion.div
                   key="success"
                   initial="initial"
                   animate="in"
                   exit="out"
                   variants={pageVariants}
                   transition={pageTransition}
                   className="flex-grow flex flex-col items-center text-center"
                 >
                   <div className="w-14 h-14 rounded-full border border-nothing-red/30 flex items-center justify-center mb-5 text-nothing-red shadow-[0_0_20px_rgba(215,25,33,0.2)]">
                      <div className="w-2 h-2 bg-nothing-red rounded-full animate-pulse shadow-[0_0_10px_#D71921]"></div>
                   </div>

                   <h2 className="text-3xl font-serif italic mb-1 text-warm-white bloom-white">Booking Confirmed.</h2>
                   {bookingData.bookingRef && (
                     <p className="text-[10px] font-mono text-nothing-red mb-6 tracking-widest bloom-red">
                       REF: {bookingData.bookingRef}
                     </p>
                   )}

                   {/* Booking Summary */}
                   <div className="w-full space-y-2 mb-6 text-left border border-white/10 p-4">
                     {bookingData.name && (
                       <div className="flex justify-between text-xs font-mono">
                         <span className="text-white/40">NAME</span>
                         <span className="text-warm-white">{bookingData.name}</span>
                       </div>
                     )}
                     <div className="flex justify-between text-xs font-mono">
                       <span className="text-white/40">GUESTS</span>
                       <span className="text-warm-white">{bookingData.peopleCount < 10 ? `0${bookingData.peopleCount}` : bookingData.peopleCount} SOULS</span>
                     </div>
                     <div className="flex justify-between text-xs font-mono">
                       <span className="text-white/40">DATE</span>
                       <span className="text-warm-white">{bookingData.dateRange.start?.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                     </div>
                     <div className="flex justify-between text-xs font-mono">
                       <span className="text-white/40">TIME</span>
                       <span className="text-warm-white">{bookingData.dateRange.start?.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}</span>
                     </div>
                   </div>

                   {/* Souvenir Image (if Gemini was available) */}
                   {bookingData.souvenirUrl ? (
                     <motion.div
                        initial={{ opacity: 0, scale: 0.95, filter: 'blur(10px)' }}
                        animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                        transition={{ delay: 0.2, duration: 1.5 }}
                        className="w-full aspect-[9/16] max-h-[240px] relative rounded-sm overflow-hidden border border-white/10 shadow-2xl group mb-6"
                     >
                        <img
                          src={bookingData.souvenirUrl}
                          alt="Digital Souvenir"
                          className="w-full h-full object-cover opacity-80 mix-blend-screen contrast-125 saturate-0 group-hover:saturate-50 transition-all duration-1000"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                        <div className="absolute bottom-3 right-3 text-[8px] font-mono text-white/60">
                           NO. {bookingData.bookingRef}
                        </div>
                     </motion.div>
                   ) : (
                     <div className="w-full py-6 bg-white/[0.02] border border-white/5 flex flex-col items-center justify-center mb-6">
                        <div className="text-[9px] font-mono text-white/20 tracking-widest mb-1">SOUVENIR UNAVAILABLE</div>
                        <div className="text-[8px] font-mono text-white/10 tracking-wider">ARTIFACT GENERATION OFFLINE</div>
                     </div>
                   )}

                   {/* Action Buttons */}
                   <div className="w-full space-y-3 mt-auto">
                     <button
                       onClick={handleDownloadConfirmation}
                       disabled={!bookingData.confirmationUrl}
                       className="w-full py-3 bg-white/5 text-warm-white border border-white/20 hover:bg-white/10 hover:border-white/40 hover:shadow-[0_0_20px_rgba(255,255,255,0.1)] font-mono text-xs tracking-[0.2em] transition-all duration-500 flex items-center justify-center gap-3"
                     >
                       <Download size={12} />
                       <span>DOWNLOAD CONFIRMATION</span>
                     </button>
                     <button
                       onClick={handleBookAnother}
                       className="w-full py-3 border border-white/10 hover:bg-white/5 text-white/40 hover:text-warm-white font-mono text-xs tracking-[0.2em] transition-all duration-500 flex items-center justify-center gap-3"
                     >
                       <RotateCcw size={12} />
                       <span>BOOK ANOTHER</span>
                     </button>
                   </div>

                   {/* Social Links */}
                   <div className="flex items-center gap-4 mt-6">
                     <span className="text-[9px] font-mono text-white/30 tracking-widest">FOLLOW</span>
                     <a
                       href="https://www.instagram.com/mamaoclub.melb/"
                       target="_blank"
                       rel="noopener noreferrer"
                       className="w-10 h-10 border border-white/15 flex items-center justify-center text-white/40 hover:text-nothing-red hover:border-nothing-red/50 hover:shadow-[0_0_12px_rgba(215,25,33,0.3)] transition-all duration-500"
                     >
                       <Instagram size={16} />
                     </a>
                     <a
                       href="https://www.facebook.com/61560555782062"
                       target="_blank"
                       rel="noopener noreferrer"
                       className="w-10 h-10 border border-white/15 flex items-center justify-center text-white/40 hover:text-nothing-red hover:border-nothing-red/50 hover:shadow-[0_0_12px_rgba(215,25,33,0.3)] transition-all duration-500"
                     >
                       <Facebook size={16} />
                     </a>
                   </div>
                 </motion.div>
               )}

             </AnimatePresence>
           </div>

           {/* Navigation Footer */}
           {step !== BookingStep.SUCCESS && !isLoading && (
             <div className="p-8 pt-0 flex justify-between items-center">
                {step > BookingStep.PEOPLE && (
                  <button 
                    onClick={handleBack}
                    className="text-[10px] font-mono text-white/30 hover:text-white transition-colors tracking-widest hover:bloom-white"
                  >
                    BACK
                  </button>
                )}
                
                {step < BookingStep.CONFIRMATION && (
                  <button
                    onClick={handleNext} 
                    disabled={step === BookingStep.DATE && !isTimeSelected}
                    className={`
                      ml-auto w-10 h-10 rounded-full border flex items-center justify-center transition-all duration-500
                      ${(step === BookingStep.DATE && !isTimeSelected) 
                        ? 'border-white/5 text-white/5 cursor-not-allowed' 
                        : 'border-white/20 text-white hover:bg-white/10 hover:border-white/50 hover:shadow-[0_0_15px_rgba(255,255,255,0.2)]'}
                    `}
                  >
                    <ArrowRight size={14} />
                  </button>
                )}
             </div>
           )}
        </GlassCard>
      </main>

      {/* Confirmation Dialog Overlay */}
      <AnimatePresence>
        {showConfirmation && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm"
          >
            <GlassCard className="w-full max-w-sm p-6 border-nothing-red/30 shadow-[0_0_30px_rgba(215,25,33,0.15)]">
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-full border border-nothing-red flex items-center justify-center mb-4 text-nothing-red">
                  <AlertTriangle size={24} />
                </div>
                <h3 className="text-2xl font-serif italic text-warm-white bloom-white mb-2">Finalize Protocol?</h3>
                <p className="text-[10px] font-mono text-white/50 mb-6 tracking-widest uppercase">
                  Action is irreversible
                </p>

                <div className="w-full space-y-3 mb-8 text-left border-t border-b border-white/10 py-4">
                  {bookingData.name && (
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-white/40">NAME</span>
                      <span className="text-warm-white truncate max-w-[180px]">{bookingData.name}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-white/40">DATE</span>
                    <span className="text-warm-white">{bookingData.dateRange.start?.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                  </div>
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-white/40">TIME</span>
                    <span className="text-warm-white">{bookingData.dateRange.start?.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}</span>
                  </div>
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-white/40">GUESTS</span>
                    <span className="text-warm-white">{bookingData.peopleCount < 10 ? `0${bookingData.peopleCount}` : bookingData.peopleCount} SOULS</span>
                  </div>
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-white/40">CONTACT</span>
                    <span className="text-warm-white truncate max-w-[150px]">{bookingData.email}</span>
                  </div>
                  {bookingData.notes && (
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-white/40">NOTES</span>
                      <span className="text-warm-white truncate max-w-[180px]">{bookingData.notes}</span>
                    </div>
                  )}
                </div>

                <div className="flex gap-3 w-full">
                  <button
                    onClick={() => setShowConfirmation(false)}
                    className="flex-1 py-3 border border-white/10 hover:bg-white/5 text-warm-white/60 hover:text-warm-white text-[10px] font-mono tracking-widest transition-colors"
                  >
                    ABORT
                  </button>
                  <button
                    onClick={proceedToFinalize}
                    className="flex-1 py-3 bg-nothing-red text-off-black hover:bg-nothing-red/90 text-[10px] font-mono tracking-widest font-bold shadow-[0_0_15px_rgba(215,25,33,0.4)] transition-all"
                  >
                    EXECUTE
                  </button>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>

      <StatusBar />
    </div>
  );
};

export default App;