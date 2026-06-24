import { createFileRoute } from "@tanstack/react-router";
import { DashboardShell } from "@/components/DashboardShell";

export const Route = createFileRoute("/")({
  component: HmiDashboard,
});

function HmiDashboard() {
  return (
    <DashboardShell>
      {/* Left panel: faded brand watermark */}
      <div style={{ flex: 1, minWidth: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <img src="/trilo-mark.png" alt="" style={{
          height: "62%", maxHeight: 470, opacity: 0.13,
          objectFit: "contain", userSelect: "none", pointerEvents: "none",
        }} />
      </div>
    </DashboardShell>
  );
}
