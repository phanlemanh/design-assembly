// The frame every document of this plugin shares (specification 0004), written once: a person who
// has read one document of a command knows where to look in the next. A command gives the frame
// its facts as data, and the frame draws one page that needs nothing else.
//
// The six parts, always in this order, none ever dropped:
//   cover             the document's name, the repository, the date, the plugin's version, the scope
//   decision          one page for the person who decides: the conclusion, the three things most
//                     worth attention, what they must decide
//   findings          by severity, each with its evidence
//   recommendations   each with what it rests on and what to do
//   next              the next steps in order, each with the command to run
//   blind             what this document does not see
//
// A part with nothing to show says so in one line. A recommendation that does not say what it
// rests on is refused: the page is not drawn. Nothing here reads a clock or calls a model, so the
// same facts give the same page, byte for byte.
import { existsSync, mkdirSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";

import { changeOf, Refusal } from "./command.mjs";
import { escape as asText, familyStyles, originOf, readLook } from "./family.mjs";
import { printPdf } from "./stage.mjs";

export const PARTS = ["cover", "decision", "findings", "recommendations", "next", "blind"];

// How heavy a finding is, heaviest first, and what each word means on the page.
export const SEVERITIES = ["high", "medium", "low", "note"];
// What a recommendation may rest on. Nothing else counts as a reason.
export const BASES = {
  principle: "A design principle the owner fixed",
  standard: "A standard",
  measurement: "A measurement on this repository",
};
export const FORMATS = ["html", "pdf"];
// The flags of a command that hands a document over, beside its own.
export const DOCUMENT_FLAGS = { "--out": "value", "--format": "value" };
// The sheet a document is printed on: the size the page itself asks for.
const PAPER = { preferCSSPageSize: true };

// Every label the frame prints.
export const WORDS = {
  plugin: "design-assembly",
  date: "Date",
  dateNote: "the day of the last commit",
  noDate: "Not dated: the repository has no commit to take a date from",
  revision: "State of the repository",
  noRevision: "No commit yet",
  uncommitted: "with changes not yet committed",
  version: "Plugin",
  scope: "Scope examined",
  decision: "For the person who decides",
  attention: "Most worth your attention",
  decide: "What you must decide",
  findings: "Findings",
  findingsHeading: "What was found, the heaviest first",
  findingsLede: "Each finding carries the evidence it rests on.",
  evidence: "Evidence",
  recommendations: "Recommendations",
  recommendationsHeading: "What to do about it, and why",
  recommendationsLede:
    "Each recommendation says what it rests on: a design principle the owner fixed, a standard, or a measurement on this repository.",
  restsOn: "Rests on",
  toDo: "To do",
  next: "Next steps",
  nextHeading: "What to run, in this order",
  byHand: "By hand",
  blind: "What this document does not see",
  blindHeading: "Where this document is blind",
  blindLede: "A document that claims more than it shows is worse than none.",
  severity: {
    high: ["High", "broken today"],
    medium: ["Medium", "waits on a person, or holds less than it says"],
    low: ["Low", "holds, on a weaker footing"],
    note: ["Note", "for the record"],
  },
  // What a part says when it has nothing to show.
  empty: {
    attention: "Nothing stands out in what this document examined.",
    decide: "Nothing waits on your decision in what this document examined.",
    findings: "Nothing was found in what this document examined.",
    recommendations: "No recommendation: nothing that was examined calls for one.",
    next: "Nothing to run now.",
    blind: "No open limit is recorded for what this document examined.",
  },
};

// "1 answer waits", "3 answers wait": a count with the word that fits it.
export const plural = (count, one, many) => `${count} ${count === 1 ? one : many}`;

// A count the screen of a command writes as "3 row(s)" is written out on a page: "3 rows". A
// count of one is left as the command wrote it, since the words after it were written for many.
export const spelled = (text) =>
  String(text).replace(/\b(\d+) ((?:[a-z]+ )?[a-z]+)\(s\)/g, (whole, count, word) =>
    count === "1" ? whole : `${count} ${word}s`,
  );
// Every word the frame prints goes through here: written out, and never taken as markup.
const escape = (text) => asText(spelled(text));

const written = (value) => typeof value === "string" && value.trim() !== "";
const list = (value) => (Array.isArray(value) ? value : []);

// Every way a document cannot be drawn, one line each. Empty means every part can be set.
export function documentProblems(doc) {
  const found = [];
  for (const key of ["kind", "title", "version"]) {
    if (!written(doc?.[key])) found.push(`the cover has no ${key}`);
  }
  if (!written(doc?.origin?.name)) found.push("the cover does not name the repository");
  if (list(doc?.scope).length === 0 || !list(doc.scope).every(written)) {
    found.push("the cover does not say what was examined");
  }
  if (!written(doc?.decision?.conclusion)) found.push("the page for the person has no conclusion");
  if (list(doc?.decision?.attention).length > 3) {
    found.push("the page for the person lists more than three things worth attention");
  }
  for (const [index, item] of list(doc?.findings).entries()) {
    const at = `finding ${index + 1}`;
    if (!SEVERITIES.includes(item?.severity)) {
      found.push(`${at}: its severity is not one of ${SEVERITIES.join(", ")}`);
    }
    if (!written(item?.title)) found.push(`${at}: no title`);
    if (list(item?.evidence).length === 0 || !list(item.evidence).every(written)) {
      found.push(`${at}: no evidence`);
    }
  }
  for (const [index, item] of list(doc?.recommendations).entries()) {
    const at = `recommendation ${index + 1}`;
    if (!written(item?.what)) found.push(`${at}: it recommends nothing`);
    if (!(item?.basis?.kind in BASES) || !written(item?.basis?.text)) {
      found.push(
        `${at}: it does not say what it rests on (a principle, a standard or a measurement)`,
      );
    }
    if (!written(item?.action)) found.push(`${at}: it does not say what to do`);
  }
  for (const [index, item] of list(doc?.next).entries()) {
    if (!written(item?.why)) found.push(`next step ${index + 1}: no reason`);
  }
  for (const [index, item] of list(doc?.blind).entries()) {
    if (!written(item?.id) || !written(item?.note)) {
      found.push(`blind spot ${index + 1}: no id or no sentence`);
    }
  }
  return found;
}

// ---- the parts ------------------------------------------------------------------------------------

const code = (text) => `<code>${escape(text)}</code>`;
const emptyLine = (text) => `<p class="note empty">${escape(text)}</p>`;
const mark = (severity) => `<i class="mark mark-${severity}"></i>`;

// One part of the frame after the cover: numbered, with the eyebrow and heading every document
// gives it. `empty` marks a part that has nothing to show, for a reader and for a check.
function part(id, { eyebrow, heading, lede = null, empty = false, body }) {
  return `
<section class="sheet" data-part="${id}"${empty ? ' data-empty="true"' : ""}>
  <header class="sheet-head">
    <p class="eyebrow"><span>${String(PARTS.indexOf(id)).padStart(2, "0")}</span>${escape(eyebrow)}</p>
    <h2>${escape(heading)}</h2>
    ${lede ? `<p class="lede">${escape(lede)}</p>` : ""}
  </header>
  ${body}
</section>`;
}

function cover(doc, w) {
  const { name, revision, date } = doc.origin;
  const dirty = written(revision) && revision.endsWith("+");
  const fact = (label, value, wide = false) =>
    `<div${wide ? ' class="wide"' : ""}><dt>${escape(label)}</dt><dd>${value}</dd></div>`;
  return `
<header class="sheet cover" data-part="cover">
  <p class="eyebrow">${escape(doc.title)}</p>
  <h1>${escape(name)}</h1>
  ${written(doc.lede) ? `<p class="lede">${escape(doc.lede)}</p>` : ""}
  <dl class="facts">
    ${fact(
      w.date,
      written(date)
        ? `${escape(date)} <span class="aside">${escape(w.dateNote)}</span>`
        : escape(w.noDate),
    )}
    ${fact(
      w.revision,
      written(revision)
        ? `${code(revision.replace(/\+$/, ""))}${dirty ? ` <span class="aside">${escape(w.uncommitted)}</span>` : ""}`
        : escape(w.noRevision),
    )}
    ${fact(w.version, `${escape(w.plugin)} ${escape(doc.version)}`)}
    ${fact(
      w.scope,
      `<ul>${doc.scope.map((line) => `<li>${escape(line)}</li>`).join("")}</ul>`,
      true,
    )}
  </dl>
</header>`;
}

function decision(doc, w, emptyOf) {
  const { conclusion } = doc.decision;
  const figures = list(doc.decision.figures)
    .map(
      (figure) =>
        `<div class="figure"><b>${escape(figure.value)}${written(figure.of) ? `<small> / ${escape(figure.of)}</small>` : ""}</b><span>${escape(figure.label)}</span></div>`,
    )
    .join("");
  const attention = list(doc.decision.attention)
    .map(
      (item) =>
        `<li><div><b>${escape(item.title)}</b>${written(item.detail) ? `<span>${escape(item.detail)}</span>` : ""}</div></li>`,
    )
    .join("");
  const decide = list(doc.decision.decide)
    .map((item) => {
      const items = list(item.items)
        .map((line) => `<li>${escape(line)}</li>`)
        .join("");
      return `<li><b>${escape(item.what)}</b>${written(item.detail) ? `<span>${escape(item.detail)}</span>` : ""}${items ? `<ul class="asked">${items}</ul>` : ""}${written(item.more) ? `<span>${escape(item.more)}</span>` : ""}${written(item.command) ? `<span class="with">${code(item.command)}</span>` : ""}</li>`;
    })
    .join("");
  return `
<section class="sheet decision" data-part="decision">
  <header class="sheet-head">
    <p class="eyebrow"><span>01</span>${escape(w.decision)}</p>
    <h2>${escape(conclusion)}</h2>
  </header>
  ${figures ? `<div class="figures">${figures}</div>` : ""}
  <div class="two">
    <div>
      <h3>${escape(w.attention)}</h3>
      ${attention ? `<ol class="attention">${attention}</ol>` : emptyLine(emptyOf("attention"))}
    </div>
    <div>
      <h3>${escape(w.decide)}</h3>
      ${decide ? `<ul class="decide">${decide}</ul>` : emptyLine(emptyOf("decide"))}
    </div>
  </div>
</section>`;
}

// A table of what was read, set under the findings: wide, so it scrolls sideways on a narrow
// screen instead of pushing the page. A cell is a text, or an id with its text.
function register(table) {
  if (!table) return "";
  const columns = list(table.columns);
  const cell = (value) =>
    typeof value === "object" && value !== null
      ? `${written(value.code) ? code(value.code) : ""}${written(value.text) ? `<span>${escape(value.text)}</span>` : ""}`
      : escape(value ?? "");
  const row = (cells) => `<tr>${cells.map((value) => `<td>${cell(value)}</td>`).join("")}</tr>`;
  const groups = table.groups ?? [{ title: null, note: null, rows: table.rows ?? [] }];
  const body = groups
    .map(
      (group) =>
        `${written(group.title) ? `<tr class="group"><th colspan="${columns.length}" scope="colgroup">${escape(group.title)}${written(group.note) ? `<span>${escape(group.note)}</span>` : ""}</th></tr>` : ""}${list(group.rows).map(row).join("")}`,
    )
    .join("");
  return `
  <div class="register">
    <h3>${escape(table.title)}</h3>
    ${written(table.lede) ? `<p class="muted">${escape(table.lede)}</p>` : ""}
    <div class="scroll" role="region" tabindex="0" aria-label="${escape(table.title)}">
      <table>
        <thead><tr>${columns.map((name) => `<th scope="col">${escape(name)}</th>`).join("")}</tr></thead>
        <tbody>${body}</tbody>
      </table>
    </div>
  </div>`;
}

function findings(doc, w, emptyOf) {
  // The heaviest first; within one severity, the order the command gave.
  const sorted = SEVERITIES.flatMap((severity) =>
    list(doc.findings).filter((item) => item.severity === severity),
  );
  const tally = SEVERITIES.map((severity) => {
    const count = sorted.filter((item) => item.severity === severity).length;
    const [label, meaning] = w.severity[severity];
    return `<li>${mark(severity)}<b>${count}</b> ${escape(label.toLowerCase())}<span>${escape(meaning)}</span></li>`;
  }).join("");
  const items = sorted
    .map(
      (item) => `<li class="finding">
      <p class="severity">${mark(item.severity)}${escape(w.severity[item.severity][0])}</p>
      <div>
        <h4>${escape(item.title)}</h4>
        ${written(item.detail) ? `<p>${escape(item.detail)}</p>` : ""}
        <p class="label">${escape(w.evidence)}</p>
        <ul class="evidence">${item.evidence.map((line) => `<li>${escape(line)}</li>`).join("")}</ul>
      </div>
    </li>`,
    )
    .join("");
  return part("findings", {
    eyebrow: w.findings,
    heading: w.findingsHeading,
    lede: w.findingsLede,
    empty: sorted.length === 0,
    body: `${
      sorted.length === 0
        ? emptyLine(emptyOf("findings"))
        : `<ul class="tally">${tally}</ul><ol class="findings">${items}</ol>`
    }${register(doc.register)}`,
  });
}

function recommendations(doc, w, emptyOf) {
  const items = list(doc.recommendations)
    .map(
      (item) => `<li class="recommendation">
      <div>
        <h4>${escape(item.what)}</h4>
        ${written(item.about) ? `<p class="about">${escape(item.about)}</p>` : ""}
      </div>
      <dl>
        <div class="rests-on"><dt>${escape(w.restsOn)}</dt><dd><b>${escape(BASES[item.basis.kind])}:</b> ${escape(item.basis.text)}</dd></div>
        <div class="to-do"><dt>${escape(w.toDo)}</dt><dd>${escape(item.action)}${written(item.command) ? ` <span class="with">${code(item.command)}</span>` : ""}</dd></div>
      </dl>
    </li>`,
    )
    .join("");
  return part("recommendations", {
    eyebrow: w.recommendations,
    heading: w.recommendationsHeading,
    lede: w.recommendationsLede,
    empty: items === "",
    body: `${items ? `<ol class="recommendations">${items}</ol>` : emptyLine(emptyOf("recommendations"))}${after(doc, "recommendations")}`,
  });
}

function next(doc, w, emptyOf) {
  const items = list(doc.next)
    .map(
      (step) =>
        `<li><div>${written(step.command) ? code(step.command) : `<b>${escape(w.byHand)}</b>`}<span>${escape(step.why)}</span></div></li>`,
    )
    .join("");
  return part("next", {
    eyebrow: w.next,
    heading: w.nextHeading,
    empty: items === "",
    body: `${items ? `<ol class="steps">${items}</ol>` : emptyLine(emptyOf("next"))}${after(doc, "next")}`,
  });
}

function blind(doc, w, emptyOf) {
  // Blind spots under one heading stay together, in the order the command gave them.
  const groups = [];
  for (const item of list(doc.blind)) {
    const last = groups.at(-1);
    if (last && last.title === (item.group ?? null)) last.items.push(item);
    else groups.push({ title: item.group ?? null, items: [item] });
  }
  const body = groups
    .map(
      (group) =>
        `${written(group.title) ? `<h3>${escape(group.title)}</h3>` : ""}<ul class="plain blind">${group.items.map((item) => `<li>${code(item.id)}<span>${escape(item.note)}</span></li>`).join("")}</ul>`,
    )
    .join("");
  return part("blind", {
    eyebrow: w.blind,
    heading: w.blindHeading,
    lede: w.blindLede,
    empty: body === "",
    body: `${body || emptyLine(emptyOf("blind"))}${after(doc, "blind")}`,
  });
}

// A closing line a command adds under a part: what was left off the page, and where it is.
const after = (doc, id) =>
  written(doc.after?.[id]) ? `<p class="muted after">${escape(doc.after[id])}</p>` : "";

// What the frame adds to the rules of the family: the cover's facts, the page for the person, a
// finding with its evidence, a recommendation with its reason, the steps, and the two ways a page
// is read that the book is not, on a phone and on paper.
const STYLES = `
  .document { max-width: 1080px; }
  .document .sheet { break-inside: auto; }
  .sheet-head { break-inside: avoid; }
  .document .sheet.cover { padding-bottom: 48px; }
  .document h1 { overflow-wrap: anywhere; }
  .document h2 { max-width: 30ch; }
  .document h4 { margin: 0; font-size: var(--base); letter-spacing: 0; text-transform: none; line-height: 1.35; }
  .document code { overflow-wrap: anywhere; }
  .label { margin: 12px 0 4px; font-size: var(--xs); letter-spacing: 0.1em; text-transform: uppercase; color: var(--muted); }
  .aside { color: var(--muted); font-size: var(--sm); }
  .after { max-width: 72ch; margin-top: 20px; }
  .with { display: block; margin-top: 6px; }
  .with code, .steps code { padding: 3px 8px; background: var(--surface); border-radius: calc(var(--radius) * 0.6); color: var(--fg); }
  .facts { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 24px 40px; margin: 48px 0 0; }
  .facts > div { padding-top: 12px; border-top: 1px solid var(--line); }
  .facts .wide { grid-column: 1 / -1; }
  .facts dt { font-size: var(--xs); letter-spacing: 0.1em; text-transform: uppercase; color: var(--muted); }
  .facts dd { margin: 6px 0 0; font-size: var(--base); }
  .facts ul { margin: 0; padding: 0; list-style: none; columns: 2; column-gap: 40px; }
  .facts li { padding: 3px 0; font-size: var(--sm); break-inside: avoid; }
  .figures { display: flex; flex-wrap: wrap; gap: 24px 56px; margin-top: 40px; }
  .figure b { display: block; font-size: var(--h1); font-weight: 650; line-height: 1; letter-spacing: -0.03em; font-variant-numeric: tabular-nums; }
  .figure small { font-size: var(--xl); font-weight: 500; letter-spacing: 0; color: var(--muted); }
  .figure span { display: block; max-width: 24ch; margin-top: 8px; font-size: var(--xs); color: var(--muted); }
  .attention, .decide, .findings, .recommendations, .steps, .tally, .evidence, .asked { margin: 0; padding: 0; list-style: none; }
  .attention { counter-reset: attention; }
  .attention > li, .steps > li { display: grid; grid-template-columns: 32px minmax(0, 1fr); padding: 12px 0; border-top: 1px solid var(--line); }
  .attention > li { counter-increment: attention; }
  .attention > li::before { content: counter(attention); color: var(--accent); font-weight: 600; font-variant-numeric: tabular-nums; }
  .attention b, .decide b { display: block; font-weight: 600; }
  .attention span, .decide span { display: block; margin-top: 2px; color: var(--muted); }
  .decide > li { padding: 12px 0; border-top: 1px solid var(--line); }
  .asked { margin: 8px 0; }
  .asked li { padding: 4px 0 4px 14px; border-left: 2px solid var(--line); }
  .tally { display: flex; flex-wrap: wrap; gap: 8px 32px; margin: 40px 0 8px; }
  .tally b { font-variant-numeric: tabular-nums; }
  .tally span { margin-left: 8px; color: var(--muted); font-size: var(--xs); }
  .mark { display: inline-block; width: 10px; height: 10px; margin-right: 8px; border-radius: 2px; background: var(--fg); }
  .mark-medium { background: repeating-linear-gradient(135deg, var(--fg) 0 2px, transparent 2px 5px); outline: 1px solid var(--fg); outline-offset: -1px; }
  .mark-low { background: transparent; outline: 1px solid var(--fg); outline-offset: -1px; }
  .mark-note { background: transparent; outline: 1px dashed var(--muted); outline-offset: -1px; }
  .finding { display: grid; grid-template-columns: 132px minmax(0, 1fr); gap: 24px; padding: 20px 0; border-top: 1px solid var(--line); break-inside: avoid; }
  .severity { margin: 2px 0 0; font-size: var(--xs); letter-spacing: 0.1em; text-transform: uppercase; font-weight: 600; }
  .finding p { margin: 6px 0 0; max-width: 72ch; }
  .evidence li { padding: 4px 0 4px 14px; border-left: 2px solid var(--line); max-width: 80ch; overflow-wrap: anywhere; }
  .register { margin-top: 48px; }
  .scroll { margin-top: 12px; overflow-x: auto; border: 1px solid var(--line); border-radius: var(--radius); }
  .scroll:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
  table { width: 100%; border-collapse: collapse; }
  th, td { padding: 10px 14px; text-align: left; vertical-align: top; border-top: 1px solid var(--line); }
  thead th { border-top: 0; font-size: var(--xs); letter-spacing: 0.08em; text-transform: uppercase; font-weight: 600; color: var(--muted); white-space: nowrap; }
  tr.group th { background: var(--surface); font-weight: 600; }
  tr.group th span { margin-left: 12px; font-weight: 400; color: var(--muted); }
  td:first-child { white-space: nowrap; }
  td code + span { display: block; margin-top: 2px; }
  .recommendations { counter-reset: recommendation; margin-top: 40px; }
  .recommendation { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1.4fr); gap: 16px 48px; padding: 20px 0; border-top: 1px solid var(--line); counter-increment: recommendation; break-inside: avoid; }
  .recommendation h4::before { content: counter(recommendation) ". "; color: var(--accent); font-variant-numeric: tabular-nums; }
  .about { margin: 6px 0 0; color: var(--muted); }
  .recommendation dl { margin: 0; }
  .recommendation dl > div { display: grid; grid-template-columns: 88px minmax(0, 1fr); gap: 12px; }
  .recommendation dl > div + div { margin-top: 10px; }
  .recommendation dt { padding-top: 2px; font-size: var(--xs); letter-spacing: 0.1em; text-transform: uppercase; color: var(--muted); }
  .recommendation dd { margin: 0; overflow-wrap: anywhere; }
  .steps { counter-reset: step; margin-top: 40px; }
  .steps > li { counter-increment: step; break-inside: avoid; }
  .steps > li::before { content: counter(step); color: var(--accent); font-weight: 600; font-variant-numeric: tabular-nums; }
  .steps span { display: block; margin-top: 6px; max-width: 80ch; }
  .blind { margin-top: 40px; }
  h3 + .blind { margin-top: 0; }
  .blind li { max-width: 80ch; }
  .blind span { display: block; margin-top: 2px; color: var(--muted); }
  .document .note.empty { max-width: 62ch; margin-top: 40px; color: var(--muted); }
  .two .note.empty { margin-top: 0; }
  @media (max-width: 760px) {
    .book { padding: 0 20px 64px; }
    .sheet { padding: 48px 0 40px; }
    .sheet.cover { padding-top: 48px; }
    h1 { font-size: calc(var(--h1) * 0.7); }
    h2 { font-size: calc(var(--h2) * 0.8); }
    .lede { font-size: var(--base); }
    .two { grid-template-columns: minmax(0, 1fr); gap: 32px; margin-top: 32px; }
    .facts { grid-template-columns: minmax(0, 1fr); gap: 16px; margin-top: 32px; }
    .facts ul { columns: 1; }
    .figures { gap: 20px 32px; margin-top: 32px; }
    .finding, .recommendation { grid-template-columns: minmax(0, 1fr); gap: 8px; }
    .recommendation dl > div { grid-template-columns: minmax(0, 1fr); gap: 2px; }
    table { min-width: 640px; }
  }
  @page { size: A4; margin: 16mm 14mm; }
  @media print {
    html { font-size: 11.5px; }
    .book { max-width: none; padding: 0; }
    .sheet { padding: 28px 0 22px; }
    .sheet.cover { padding: 0 0 22px; }
    h1 { font-size: var(--h1); }
    h2 { font-size: var(--h2); }
    .two { grid-template-columns: 1.15fr 1fr; gap: 36px; margin-top: 28px; }
    .facts { grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px 32px; margin-top: 28px; }
    .facts ul { columns: 2; }
    .figures { margin-top: 24px; }
    .finding { grid-template-columns: 110px minmax(0, 1fr); gap: 20px; }
    .recommendation { grid-template-columns: minmax(0, 1fr) minmax(0, 1.4fr); gap: 12px 32px; }
    .recommendation dl > div { grid-template-columns: 76px minmax(0, 1fr); gap: 10px; }
    [data-part="decision"] { break-after: page; }
    .scroll { overflow: visible; }
    table { min-width: 0; }
    tr, .attention > li, .decide > li, .blind li { break-inside: avoid; }
  }`;

// The document as one page that needs nothing else. `look` is the repository's own look, as the
// family reads it; without one the page is set in plain values.
export function renderDocument(doc, look = {}) {
  const problems = documentProblems(doc);
  if (problems.length > 0) {
    throw new Error(`this document cannot be drawn: ${problems.join("; ")}`);
  }
  const w = WORDS;
  const emptyOf = (id) => (written(doc.empty?.[id]) ? doc.empty[id] : w.empty[id]);
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${escape(doc.title)} · ${escape(doc.origin.name)}</title>
<style>
${familyStyles(look)}${STYLES}
</style>
</head>
<body>
<main class="book document">${cover(doc, w)}${decision(doc, w, emptyOf)}${findings(doc, w, emptyOf)}${recommendations(doc, w, emptyOf)}${next(doc, w, emptyOf)}${blind(doc, w, emptyOf)}
</main>
</body>
</html>
`;
}

// The parts a drawn document has, in the order they stand on the page, and whether each says it
// has nothing to show.
export function partsOf(html) {
  return [...String(html).matchAll(/<(?:header|section) class="[^"]*" data-part="([a-z]+)"( data-empty="true")?/g)].map(
    ([, id, empty]) => ({ id, empty: empty !== undefined }),
  );
}

// ---- handing it over ------------------------------------------------------------------------------

// What a call asks for by way of a document: nothing, or a folder and a format. A relative folder
// is read from where the command is run, never against the target: a document is written where the
// person asked, and nowhere in the repository unless they named a folder inside it.
export function requested(call) {
  const out = call.flags["--out"];
  const format = call.flags["--format"];
  if (out === undefined) {
    if (format !== undefined) {
      throw new Refusal("--format says how a document is written: it goes with --out DIR");
    }
    return null;
  }
  if (!FORMATS.includes(format ?? "html")) {
    throw new Refusal(`--format is ${FORMATS.join(" or ")}`);
  }
  const folder = path.resolve(out);
  if (existsSync(folder) && !statSync(folder).isDirectory()) {
    throw new Refusal(`${out} is not a folder`);
  }
  return { out: folder, format: format ?? "html" };
}

// Writes the document a call asked for, and nothing when it asked for none. `build` gets where the
// page comes from (the repository's name, its last commit and that commit's day) and gives the
// document as data. The page is always written; the pdf is printed from it, with the repository's
// own browser, and a pdf that could not be printed is work left, said in so many words.
// Gives what to add to the answer for a machine, what to add for a person, and whether work is left.
export async function handOver(asked, target, build) {
  if (asked === null) return { data: {}, text: "", work: false };
  const { out, format } = asked;
  const doc = build(originOf(target, { apart: out }));
  // Drawn before anything is written: a document that cannot be drawn leaves no folder behind.
  const html = renderDocument(doc, readLook(target));
  mkdirSync(out, { recursive: true });
  const page = path.join(out, `${doc.kind}.html`);
  const files = [changeOf(target, page)];
  writeFileSync(page, html);
  const lines = [`document: ${page}`];
  const unwritten = [];
  if (format === "pdf") {
    const printed = path.join(out, `${doc.kind}.pdf`);
    const change = changeOf(target, printed);
    const { problem } = await printPdf(target, page, printed, PAPER);
    if (problem) {
      unwritten.push({ format, why: problem });
      lines.push(`note: the pdf was not written: ${problem}`);
    } else {
      files.push(change);
      lines.push(`also written as pdf: ${printed}`);
    }
  }
  return {
    data: { files, ...(unwritten.length > 0 ? { not_written: unwritten } : {}) },
    text: `\n${lines.join("\n")}\n`,
    work: unwritten.length > 0,
  };
}
