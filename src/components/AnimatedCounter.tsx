import { useEffect, useState, useRef } from "react";

export default function AnimatedCounter({ 
  value, 
  number, 
  suffix, 
  label 
}: { 
  value: string; 
  number: number; 
  suffix: string; 
  label: string;
  key?: any;
}) {
  const [count, setCount] = useState(0);
  const elementRef = useRef<HTMLDivElement>(null);
  const [hasStarted, setHasStarted] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setHasStarted(true);
        }
      },
      { threshold: 0.1 }
    );

    if (elementRef.current) {
      observer.observe(elementRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!hasStarted) return;

    let start = 0;
    const end = number;
    if (end === 0) return;
    
    const duration = 1500; // 1.5 seconds animation
    const steps = 60;
    const stepTime = duration / steps;
    const increment = end / steps;

    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, stepTime);

    return () => clearInterval(timer);
  }, [hasStarted, number]);

  return (
    <div 
      ref={elementRef} 
      className="text-center p-6 bg-brand-navy-dark/85 border border-white/10 rounded-sm hover:border-brand-orange/40 transition-all duration-300 shadow-md group"
    >
      <div className="font-serif text-3xl md:text-4.5xl font-bold text-brand-orange group-hover:scale-105 transition-transform duration-300 select-none">
        {hasStarted ? `${count}${suffix}` : value}
      </div>
      <div className="mt-2 text-xs md:text-sm text-gray-300 font-semibold tracking-wider uppercase">
        {label}
      </div>
    </div>
  );
}
