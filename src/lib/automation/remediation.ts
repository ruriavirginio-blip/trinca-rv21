/* Mapa de conserto compartilhado entre o monitor (que detecta + alerta no Telegram)
   e o webhook do Telegram (que executa o conserto quando o Ruriá toca em "Resolver").
   - kind "server": dá pra consertar sozinho, no servidor, mesmo com o Mac do Ruriá DESLIGADO.
   - kind "code":   precisa de mudança de código → entrega o comando pronto + o agente certo. */

export type ActionKey = "dispatch" | "recover" | "code";

export type Remediation = {
  label: string; // texto do botão no Telegram
  agente: string; // quem resolve
  kind: "server" | "code";
  endpoint?: string; // chamado no servidor quando kind = server
  cmd?: string; // comando pronto pra colar no Claude Code quando kind = code
};

export const REMEDIATION: Record<ActionKey, Remediation> = {
  dispatch: {
    label: "✅ Resolver agora (re-disparar mensagens)",
    agente: "Agente Automação (Ag.2)",
    kind: "server",
    endpoint: "/api/automation/dispatch?limit=50",
  },
  recover: {
    label: "✅ Resolver agora (recuperar leads travadas)",
    agente: "Agente Tech Ops (Ag.4)",
    kind: "server",
    endpoint: "/api/automation/recover-leads",
  },
  code: {
    label: "🛠 Ver como resolver",
    agente: "Agente Tech Ops (Ag.4)",
    kind: "code",
    cmd: "COMANDO TECH OPS: o monitor do TRINCA RV21 detectou uma falha que precisa de código/infra. Abra /api/automation/monitor, leia o problema atual, ache a causa raiz e corrija. Rode o build e me reporte o que consertou.",
  },
};

export function isActionKey(v: string): v is ActionKey {
  return v === "dispatch" || v === "recover" || v === "code";
}
