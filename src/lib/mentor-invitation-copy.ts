export const CURRENT_MENTOR_EDITION = "Hack IA Brasil 2026";

// The English labels are what the declaration in English will print.
export const MENTOR_ROLES = {
  "Mentor(a)": "Mentor",
  "Jurado(a)": "Judge",
  "Mentor(a) e jurado(a)": "Mentor and judge",
} as const;

export type MentorRole = keyof typeof MENTOR_ROLES;

export function isMentorRole(value: unknown): value is MentorRole {
  return typeof value === "string" && Object.hasOwn(MENTOR_ROLES, value);
}

export type MentorEdition = {
  name: string;
  event_date: string | null;
  hours: string | null;
  venue: string | null;
  address: string | null;
  map_url: string | null;
};

const civilDate = new Intl.DateTimeFormat("pt-BR", {
  weekday: "long",
  day: "2-digit",
  month: "2-digit",
  timeZone: "UTC",
});

export function formatMentorEditionDate(value: string | null): string | null {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T00:00:00Z`);
  if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== value) return null;
  const label = civilDate.format(date);
  return label.charAt(0).toLocaleUpperCase("pt-BR") + label.slice(1);
}

function getWebUrl(value: string | null): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    if ((url.protocol !== "https:" && url.protocol !== "http:") || url.username || url.password) return null;
    return url.href;
  } catch {
    return null;
  }
}

export { getWebUrl as getMentorEditionMapUrl };

function escapeHtml(value: string) {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;").replaceAll("'", "&#39;");
}

export const MENTOR_LINK_DAYS = 30;

// Panel previews use this in place of the personal token, which only exists at send time.
export function mentorAccessUrl(portalUrl: string, token = "link-pessoal") {
  return `${portalUrl.replace(/\/$/, "")}/entrar#${token}`;
}

const eventPitch = "O Hack IA Brasil junta jovens de 12 a 25 anos por dez horas para construir com IA. O foco é achar pessoas, não só projetos. O time vencedor pula etapas na IA Brasil Fellowship.";
const mentorAsk = "Queremos sua experiência ao lado deles. Você passa pelas equipes, ajuda a destravar decisões técnicas e dá feedback antes dos pitches.";
const declarationNote = "Depois do evento, a organização emite uma declaração da sua participação, em português e em inglês, para baixar na sua área de mentor.";

export function mentorInvitationCopy({ name, edition, portalUrl, accessUrl }: {
  name: string;
  edition: MentorEdition;
  portalUrl: string;
  accessUrl: string;
}) {
  const firstName = name.trim().split(/\s+/)[0];
  const date = formatMentorEditionDate(edition.event_date);
  const schedule = [date, edition.hours].filter(Boolean).join(" · ");
  const subject = [`${firstName}, vem mentorar no Hack IA Brasil?`, date].filter(Boolean).join(" · ");
  const portal = getWebUrl(portalUrl);
  const image = new URL("/mentor-invitation-globe.png", portal ?? "https://hackiabrasil.com").href;
  const action = getWebUrl(accessUrl) ?? portal ?? "/mentores";
  const venue = edition.venue;
  const address = edition.address;
  const mapUrl = getWebUrl(edition.map_url);
  const preheader = [schedule, venue, "Confirme com um clique."].filter(Boolean).join(" · ");

  const text = `Olá, ${firstName}!

${eventPitch}

${mentorAsk}

${[edition.name, schedule, venue, address, mapUrl && `Mapa: ${mapUrl}`].filter(Boolean).join("\n")}

${declarationNote}

Confirmar presença: ${action}

Equipe Hack IA Brasil
IA Brasil × Trilha × Cognition`;

  const details = `<tr><td class="gutter" bgcolor="#0b0e16" style="padding:13px 32px;border-top:1px solid #29292d;border-bottom:1px solid #29292d;">
  <p style="margin:0;color:#e1e5ef;font-size:15px;line-height:21px;font-weight:600;">${escapeHtml(edition.name)}</p>
  ${schedule ? `<p style="margin:5px 0 3px;color:#ffffff;font-size:17px;line-height:23px;font-weight:700;">${escapeHtml(schedule)}</p>` : ""}
  ${venue ? `<p style="margin:5px 0 2px;color:#e1e5ef;font-size:15px;line-height:21px;font-weight:600;">${escapeHtml(venue)}</p>` : ""}
  ${address || mapUrl ? `<p style="margin:0;color:#bfc7d9;font-size:13px;line-height:19px;">${address ? escapeHtml(address) : ""}${mapUrl ? ` <span style="white-space:nowrap;">${address ? "&nbsp;·&nbsp; " : ""}<a href="${escapeHtml(mapUrl)}" style="color:#e1e5ef;text-decoration:underline;">Ver no mapa</a></span>` : ""}</p>` : ""}
</td></tr>`;

  const button = `<table role="presentation" cellspacing="0" cellpadding="0" border="0"><tr>
    <td align="center" bgcolor="#ffffff" style="border:1px solid #ffffff;mso-padding-alt:14px 22px;">
      <a href="${escapeHtml(action)}" style="display:inline-block;border:1px solid #ffffff;padding:13px 21px;color:#000928;background-color:#ffffff;font-family:Oxanium,'Trebuchet MS',Arial,sans-serif;font-size:15px;line-height:21px;font-weight:bold;text-decoration:none;mso-padding-alt:0;">Confirmar presença</a>
    </td>
  </tr></table>`;

  const html = `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="dark">
<meta name="supported-color-schemes" content="dark">
<title>${escapeHtml(subject)}</title>
<style>
@font-face { font-family: 'Geist Mono'; font-style: normal; font-weight: 400; font-display: swap; src: url(https://fonts.gstatic.com/s/geistmono/v6/or3yQ6H-1_WfwkMZI_qYPLs1a-t7PU0AbeE9KK5U5Cl4PuCTfNg.woff2) format('woff2'); }
@font-face { font-family: Oxanium; font-style: normal; font-weight: 400 700; font-display: swap; src: url(https://fonts.gstatic.com/s/oxanium/v21/RrQQboN_4yJ0JmiMe2LE0ZJCZ4c.woff2) format('woff2'); }
@media screen and (max-width: 480px) {
  .gutter { padding-left: 22px !important; padding-right: 22px !important; }
  .hero-title { font-size: 28px !important; line-height: 31px !important; }
  .hero-art { width: 102px !important; height: 102px !important; }
  .hero-cell { padding: 20px 21px 25px !important; }
}
@media screen and (max-width: 350px) {
  .hero-art { width: 78px !important; height: 78px !important; }
}
@media screen and (max-width: 300px) {
  .gutter { padding-left: 15px !important; padding-right: 15px !important; }
  .hero-cell { padding-left: 15px !important; padding-right: 15px !important; }
  .hero-title { font-size: 23px !important; line-height: 26px !important; }
  .hero-art { width: 58px !important; height: 58px !important; }
}
</style>
</head>
<body style="margin:0;padding:0;background-color:#0d0d0f;color:#ffffff;font-family:Oxanium,'Trebuchet MS',Arial,sans-serif;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;mso-hide:all;">${escapeHtml(preheader)}</div>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" bgcolor="#0d0d0f">
<tr><td align="center" style="padding:24px 10px;">
<!--[if mso]><table role="presentation" width="592" align="center"><tr><td><![endif]-->
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" bgcolor="#000000" style="max-width:592px;border:1px solid #29292d;font-family:Oxanium,'Trebuchet MS',Arial,sans-serif;">
<tr><td class="hero-cell" style="padding:28px 30px 30px;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"><tr>
    <td valign="middle">
      <p style="margin:0 0 13px;color:#acb4c6;font-family:'Geist Mono','Courier New',monospace;font-size:11px;line-height:17px;letter-spacing:2px;text-transform:uppercase;">Convite para mentoria</p>
      <h1 class="hero-title" style="margin:0;color:#ffffff;font-family:Oxanium,'Trebuchet MS',Arial,sans-serif;font-size:40px;line-height:43px;font-weight:600;letter-spacing:-1.1px;">O Hack IA Brasil precisa de você</h1>
    </td>
    <td align="right" valign="middle" style="padding-left:8px;">
      <img class="hero-art" src="${escapeHtml(image)}" width="174" height="174" alt="" style="display:block;width:174px;height:174px;border:0;">
    </td>
  </tr></table>
</td></tr>
${details}
<tr><td class="gutter" style="padding:28px 32px 8px;">
  <p style="margin:0 0 13px;color:#ffffff;font-size:18px;line-height:25px;font-weight:bold;">Olá, ${escapeHtml(firstName)}!</p>
  <p style="margin:0 0 14px;color:#d0d2db;font-size:16px;line-height:25px;">${eventPitch}</p>
  <p style="margin:0 0 22px;color:#d0d2db;font-size:16px;line-height:25px;">${mentorAsk}</p>
  ${button}
</td></tr>
<tr><td class="gutter" style="padding:22px 32px 30px;">
  <p style="margin:0;color:#aeb0bd;font-size:14px;line-height:22px;">${declarationNote}</p>
</td></tr>
<tr><td class="gutter" bgcolor="#101014" style="padding:19px 32px 22px;border-top:1px solid #29292d;">
  <p style="margin:0 0 6px;color:#ffffff;font-size:13px;line-height:19px;font-weight:bold;">Equipe Hack IA Brasil</p>
  <p style="margin:0;color:#bfc1cb;font-size:12px;line-height:19px;">IA Brasil × Trilha × Cognition</p>
</td></tr>
</table>
<!--[if mso]></td></tr></table><![endif]-->
</td></tr>
</table>
</body>
</html>`;

  return { subject, text, html };
}
