import CockpitClient from "./CockpitClient";

export default function CockpitPage() {
  // O servidor já entrega o token da operação junto (como faz com a senha):
  // o cockpit abre Jornada/Alertas/Saúde SEM o Ruriá precisar digitar código.
  return (
    <CockpitClient
      cockpitPassword={process.env.COCKPIT_PASSWORD || "rv21"}
      opsToken={process.env.MONITOR_TOKEN || process.env.AUTOMATION_API_SECRET || ""}
    />
  );
}
