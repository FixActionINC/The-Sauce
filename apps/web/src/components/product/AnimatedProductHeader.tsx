import type { ReactNode } from "react";

interface AnimatedProductHeaderProps {
  children: ReactNode;
}

export default function AnimatedProductHeader({
  children,
}: AnimatedProductHeaderProps) {
  return <div>{children}</div>;
}
