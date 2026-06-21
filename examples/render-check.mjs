// Ground-truth render check: render EVERY ui_component via the real kit
// renderer (renderToStaticMarkup) and report html/text length + throws.
// Run: node examples/render-check.mjs   (after `npm run build`)
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { DeclarativeRenderer } from "../dist/index.js";

const T = (content) => ({ type: "Text", props: { content } });
const ALIAS = {
  Row: { type: "Stack", extra: { direction: "row" } },
  Column: { type: "Stack", extra: { direction: "column" } },
  Password: { type: "Input", extra: { type: "password" } },
};

export const PROPS = {
  Accordion: { sections: [{ title: "Section one", content: T("Body one") }, { title: "Section two", content: T("Body two") }] },
  Alert: { type: "info", title: "Heads up", message: "This is an alert message." },
  Audio: { src: "https://www.w3schools.com/html/horse.mp3", title: "Sample audio", controls: true },
  Avatar: { fallback: "AI", size: "md" },
  Badge: { label: "New", color: "blue" },
  Button: { label: "Click me", variant: "primary" },
  Card: { title: "Card title", subtitle: "Subtitle", content: T("Card body content.") },
  Chart: { type: "line", x_key: "label", data: [{ label: "Mon", value: 3 }, { label: "Tue", value: 7 }, { label: "Wed", value: 5 }] },
  Code: { language: "python", content: "def hello():\n    print('hi')" },
  Column: { children: [T("Row A"), T("Row B")] },
  DataTable: { columns: [{ key: "name", label: "Name" }, { key: "role", label: "Role" }], rows: [{ name: "Ada", role: "Admin" }, { name: "Linus", role: "Dev" }] },
  DatePicker: { placeholder: "Pick a date", value: "2026-06-21" },
  Dialog: { title: "Confirm action", content: "Are you sure?", confirm_label: "Yes", cancel_label: "No" },
  Divider: { label: "Section" },
  Empty: { message: "Nothing here yet", icon: "Inbox" },
  Error: { title: "Something went wrong", message: "Could not load data." },
  FileUpload: { accept: "image/*", max_size_mb: 5 },
  Form: { submit_label: "Save", action: "#", children: [{ type: "Input", props: { label: "Email", placeholder: "you@example.com", param_name: "email" } }] },
  Graph: { nodes: [{ id: "a", label: "A" }, { id: "b", label: "B" }, { id: "c", label: "C" }], edges: [{ source: "a", target: "b" }, { source: "b", target: "c" }] },
  Grid: { columns: 2, children: [{ type: "Card", props: { title: "One" } }, { type: "Card", props: { title: "Two" } }] },
  Header: { text: "Section heading", level: 2, subtitle: "A subtitle" },
  Html: { content: "<p style='margin:0'>Inline <b>HTML</b> content.</p>" },
  Icon: { name: "Star", size: 24 },
  Image: { src: "https://placehold.co/200x120", alt: "Sample", width: 200, height: 120, caption: "A caption" },
  Input: { placeholder: "Type here…", value: "Hello", param_name: "demo" },
  KeyValue: { items: [{ key: "Status", value: "Active" }, { key: "Plan", value: "Pro" }] },
  Link: { label: "Imperal docs", href: "https://docs.imperal.io" },
  List: { items: [{ id: "1", title: "First item", subtitle: "A subtitle" }, { id: "2", title: "Second item" }, { id: "3", title: "Third item" }] },
  Loading: { message: "Loading…" },
  Markdown: { content: "# Title\n\nSome **markdown** with a [link](https://imperal.io) and `code`." },
  Menu: { items: [{ label: "Edit" }, { label: "Duplicate" }, { label: "Delete" }] },
  MultiSelect: { placeholder: "Pick tags", options: [{ label: "Alpha", value: "a" }, { label: "Beta", value: "b" }], values: ["a"] },
  Page: { title: "Page title", subtitle: "Subtitle", children: [T("Page content.")] },
  Password: { placeholder: "••••••", param_name: "pwd" },
  Progress: { value: 64, label: "Uploading", variant: "primary" },
  RichEditor: { content: "<p>Rich <b>text</b> editor.</p>", placeholder: "Write…" },
  Row: { children: [{ type: "Badge", props: { label: "A" } }, { type: "Badge", props: { label: "B" } }] },
  Section: { title: "Section", children: [T("Section content.")] },
  Select: { placeholder: "Choose one", value: "1", options: [{ label: "One", value: "1" }, { label: "Two", value: "2" }] },
  SlideOver: { title: "Slide over", open: true, children: [T("Slide-over content.")] },
  Slider: { min: 0, max: 100, value: 40, step: 1, label: "Volume" },
  Stack: { direction: "row", gap: 2, children: [{ type: "Badge", props: { label: "A" } }, { type: "Badge", props: { label: "B" } }] },
  Stat: { label: "Active users", value: "1,284", trend: "+12%" },
  Stats: { columns: 2, children: [{ type: "Stat", props: { label: "Users", value: "1.2k" } }, { type: "Stat", props: { label: "Revenue", value: "$8.4k" } }] },
  Tabs: { tabs: [{ label: "Overview", content: T("First tab.") }, { label: "Details", content: T("Second tab.") }] },
  TagInput: { placeholder: "Add tags…", values: ["alpha", "beta"] },
  Text: { content: "Example text.", variant: "body" },
  TextArea: { placeholder: "Write something…", value: "Multiline\ntext", rows: 3 },
  Timeline: { items: [{ title: "Created", description: "09:00" }, { title: "Updated", description: "10:30" }] },
  Toggle: { label: "Enabled", value: true },
  Tooltip: { content: "Tooltip text", children: [{ type: "Button", props: { label: "Hover me" } }] },
  Tree: { nodes: [{ label: "root", children: [{ label: "child A" }, { label: "child B" }] }] },
  Video: { src: "https://www.w3schools.com/html/mov_bbb.mp4", controls: true, width: 240 },
};

export function nodeFor(name) {
  const a = ALIAS[name];
  return { type: a?.type ?? name, props: { ...(PROPS[name] || {}), ...(a?.extra || {}) } };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const names = Object.keys(PROPS).sort();
  let ok = 0;
  const empty = [], threw = [];
  for (const name of names) {
    try {
      const html = renderToStaticMarkup(React.createElement(DeclarativeRenderer, { node: nodeFor(name), onAction() {} }));
      const txt = html.replace(/<[^>]+>/g, "").replace(/&[a-z#0-9]+;/g, " ").trim();
      const tag = txt.length === 0 ? "EMPTY" : "ok   ";
      if (txt.length === 0) empty.push(name);
      else ok++;
      console.log(`${tag} ${name.padEnd(13)} html=${String(html.length).padStart(5)} text=${String(txt.length).padStart(4)}`);
    } catch (e) {
      threw.push(name);
      console.log(`THREW ${name.padEnd(13)} ${String(e && e.message || e).slice(0, 160)}`);
    }
  }
  console.log(`\n=== ${ok}/${names.length} non-empty | EMPTY(${empty.length}): ${JSON.stringify(empty)} | THREW(${threw.length}): ${JSON.stringify(threw)}`);
}
