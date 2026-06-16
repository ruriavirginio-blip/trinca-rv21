"use client";

import { useEffect, useState } from "react";

const targetDate = new Date("2026-06-23T00:00:00");
const initialTime = { d: 0, h: 0, m: 0, s: 0 };

function getRemainingTime() {
  const diff = Math.max(0, targetDate.getTime() - Date.now());

  return {
    d: Math.floor(diff / 86400000),
    h: Math.floor((diff % 86400000) / 3600000),
    m: Math.floor((diff % 3600000) / 60000),
    s: Math.floor((diff % 60000) / 1000),
  };
}

export function CountdownTimer() {
  const [time, setTime] = useState(initialTime);

  useEffect(() => {
    const firstTickId = window.setTimeout(() => {
      setTime(getRemainingTime());
    }, 0);

    const intervalId = window.setInterval(() => {
      setTime(getRemainingTime());
    }, 1000);

    return () => {
      window.clearTimeout(firstTickId);
      window.clearInterval(intervalId);
    };
  }, []);

  return (
    <div className="rv-countdown" aria-label="Contagem regressiva para 23 de junho de 2026">
      <span>⏱ Encerra em:</span>
      {[
        [time.d, "dias"],
        [time.h, "horas"],
        [time.m, "min"],
        [time.s, "seg"],
      ].map(([value, label]) => (
        <b key={label}>
          <strong>{String(value).padStart(2, "0")}</strong>
          <small>{label}</small>
        </b>
      ))}
    </div>
  );
}
