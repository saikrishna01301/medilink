"use client";

import { type CSSProperties, useEffect, useMemo, useState } from "react";

import styles from "./NeumorphismClock.module.css";

const markerAngles = [30, 60, 120, 150, 210, 240, 300, 330];

const padZero = (value: number) => value.toString().padStart(2, "0");

const formatDateLabel = (date: Date) => {
  const day = padZero(date.getDate());
  const month = date.toLocaleString("en", { month: "short" });
  const year = date.getFullYear();
  return `${day} ${month}, ${year}`;
};

export default function NeumorphismClock() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const interval = window.setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => window.clearInterval(interval);
  }, []);

  const { hourAngle, minuteAngle, secondAngle, hourLabel, minuteLabel, period, dateLabel } =
    useMemo(() => {
      const seconds = now.getSeconds();
      const minutes = now.getMinutes();
      const hours = now.getHours();

      const secondAngleValue = seconds * 6;
      const minuteAngleValue = (minutes + seconds / 60) * 6;
      const hourAngleValue = ((hours % 12) + minutes / 60) * 30;

      const isPm = hours >= 12;
      const formattedHour = hours % 12 || 12;

      return {
        hourAngle: hourAngleValue,
        minuteAngle: minuteAngleValue,
        secondAngle: secondAngleValue,
        hourLabel: padZero(formattedHour),
        minuteLabel: padZero(minutes),
        period: isPm ? "PM" : "AM",
        dateLabel: formatDateLabel(now),
      };
    }, [now]);

  return (
    <div className={styles.wrapper} role="presentation" aria-label="Current time">
      <div className={styles.clock}>
        <span className={`${styles.text} ${styles.text1}`}>3</span>
        <span className={`${styles.text} ${styles.text2}`}>6</span>
        <span className={`${styles.text} ${styles.text3}`}>9</span>
        <span className={`${styles.text} ${styles.text4}`}>12</span>

        {markerAngles.map((deg) => {
          const markerStyle = { "--deg": `${deg}` } as CSSProperties;
          return <span key={deg} className={styles.shapeLine} style={markerStyle} />;
        })}

        <span className={`${styles.needle} ${styles.hourHand}`} style={{ transform: `translate(-50%, -100%) rotate(${hourAngle}deg)` }} />
        <span className={`${styles.needle} ${styles.minuteHand}`} style={{ transform: `translate(-50%, -100%) rotate(${minuteAngle}deg)` }} />
        <span className={`${styles.needle} ${styles.secondHand}`} style={{ transform: `translate(-50%, -100%) rotate(${secondAngle}deg)` }} />

        <span className={styles.center} />
      </div>

      <div className={styles.timeBlock}>
        <p className={styles.time}>
          {hourLabel}:{minuteLabel}
          <span className={styles.period}>{period}</span>
        </p>
        <p className={styles.date}>{dateLabel}</p>
      </div>
    </div>
  );
}

