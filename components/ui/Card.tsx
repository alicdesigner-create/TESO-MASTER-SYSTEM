interface CardProps {
  children: React.ReactNode;
  style?: React.CSSProperties;
  padding?: number | string;
}

export default function Card({ children, style, padding = 20 }: CardProps) {
  return (
    <div
      style={{
        backgroundColor: "var(--bg-card)",
        border: "1px solid var(--border)",
        borderRadius: 8,
        boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
        padding,
        ...style,
      }}
    >
      {children}
    </div>
  );
}
