"use client";

import type { ReactNode } from "react";
import { MotionConfig } from "motion/react";
import { AuthProvider } from "@/components/AuthProvider";
import { ToastProvider } from "@/components/Toast";

export default function Providers({ children }: { children: ReactNode }) {
  return (
    // reducedMotion="user" : les animations de déplacement sont coupées pour
    // les personnes qui ont activé « réduire les animations ».
    <MotionConfig reducedMotion="user">
      <AuthProvider>
        <ToastProvider>{children}</ToastProvider>
      </AuthProvider>
    </MotionConfig>
  );
}
