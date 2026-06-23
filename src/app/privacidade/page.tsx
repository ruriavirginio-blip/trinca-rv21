/* Política de Privacidade — TRINCA RV21 / Protocolo RV (Ruriá Virgínio).
   Necessária pra publicar o app na Meta (modo Live) e por conformidade LGPD. */

export const metadata = {
  title: "Política de Privacidade · TRINCA RV21",
  description: "Como a TRINCA RV21 (Protocolo RV) coleta, usa e protege seus dados.",
};

const S: Record<string, React.CSSProperties> = {
  main: { background: "#0a0a0b", color: "#e9e7e2", minHeight: "100vh", fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif", lineHeight: 1.65 },
  wrap: { maxWidth: 760, margin: "0 auto", padding: "56px 22px 80px" },
  h1: { fontSize: 30, fontWeight: 800, color: "#f0c969", letterSpacing: "-0.02em", marginBottom: 6 },
  upd: { color: "#8a867e", fontSize: 13, marginBottom: 34 },
  h2: { fontSize: 19, fontWeight: 700, color: "#f5f3ef", margin: "30px 0 10px" },
  p: { color: "#c7c3bb", fontSize: 15.5, marginBottom: 12 },
  li: { color: "#c7c3bb", fontSize: 15.5, marginBottom: 7 },
  a: { color: "#f0c969", textDecoration: "none" },
  foot: { marginTop: 44, paddingTop: 22, borderTop: "1px solid #26262c", color: "#7a766e", fontSize: 13 },
};

export default function Privacidade() {
  return (
    <main style={S.main}>
      <div style={S.wrap}>
        <h1 style={S.h1}>Política de Privacidade</h1>
        <p style={S.upd}>TRINCA RV21 · Protocolo RV — Ruriá Virgínio · Atualizada em 23/06/2026</p>

        <p style={S.p}>
          Esta Política explica como tratamos seus dados quando você interage com a TRINCA RV21
          (Protocolo RV), incluindo nosso site, a Lista VIP e nossos perfis e anúncios nas
          plataformas da Meta (Instagram e Facebook). Tratamos dados em conformidade com a Lei
          Geral de Proteção de Dados (LGPD — Lei nº 13.709/2018).
        </p>

        <h2 style={S.h2}>1. Quais dados coletamos</h2>
        <ul>
          <li style={S.li}>Dados que você fornece: nome, e-mail, número de WhatsApp e seu @ do Instagram (ao entrar na Lista VIP ou se inscrever).</li>
          <li style={S.li}>Dados de navegação: páginas acessadas, origem do acesso e identificadores de campanha (UTM), via nosso medidor próprio e o Pixel da Meta.</li>
          <li style={S.li}>Dados de compra: quando você adquire o desafio, recebemos a confirmação do pagamento pelo processador (Kiwify).</li>
        </ul>

        <h2 style={S.h2}>2. Para que usamos</h2>
        <ul>
          <li style={S.li}>Enviar o acesso, materiais e comunicações do desafio (inclusive por WhatsApp e e-mail).</li>
          <li style={S.li}>Avisar você sobre a abertura das turmas e condições da Lista VIP.</li>
          <li style={S.li}>Medir e melhorar nossos anúncios e conteúdos (otimização de campanhas na Meta).</li>
          <li style={S.li}>Cumprir obrigações legais e de segurança.</li>
        </ul>

        <h2 style={S.h2}>3. Compartilhamento</h2>
        <p style={S.p}>
          Compartilhamos dados apenas com prestadores que viabilizam a operação, como: Meta
          Plataforms (Pixel/anúncios), processador de pagamento (Kiwify), provedores de mensageria
          (WhatsApp via Twilio) e de infraestrutura (hospedagem e banco de dados). Não vendemos
          seus dados.
        </p>

        <h2 style={S.h2}>4. Pixel e cookies</h2>
        <p style={S.p}>
          Usamos o Pixel da Meta e tecnologias semelhantes para entender o desempenho de campanhas
          e exibir anúncios mais relevantes. Você pode gerenciar suas preferências de anúncios nas
          configurações da sua conta Meta.
        </p>

        <h2 style={S.h2}>5. Seus direitos</h2>
        <p style={S.p}>
          Você pode solicitar acesso, correção, portabilidade ou exclusão dos seus dados, além de
          revogar consentimentos, a qualquer momento. Para isso, fale com a gente pelo contato
          abaixo.
        </p>

        <h2 style={S.h2}>6. Retenção e segurança</h2>
        <p style={S.p}>
          Guardamos seus dados pelo tempo necessário às finalidades acima e adotamos medidas
          técnicas e organizacionais para protegê-los. Você pode pedir a remoção a qualquer momento.
        </p>

        <h2 style={S.h2}>7. Contato</h2>
        <p style={S.p}>
          Dúvidas ou solicitações sobre privacidade: Instagram{" "}
          <a style={S.a} href="https://instagram.com/ruriavirginio">@ruriavirginio</a> ou pelo
          WhatsApp informado no nosso perfil.
        </p>

        <div style={S.foot}>© 2026 Ruriá Virgínio · Protocolo RV · protocolorv.com.br</div>
      </div>
    </main>
  );
}
