import sanitizeHtml from "sanitize-html";

const SANITIZE_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [
    "p", "strong", "em", "ul", "ol", "li", "a", "br",
    "h2", "h3", "h4", "span", "div",
  ],
  allowedAttributes: {
    a: ["href"],
  },
  allowedSchemes: ["http", "https", "mailto"],
  disallowedTagsMode: "discard",
};

export function sanitize(dirty: string): string {
  return sanitizeHtml(dirty, SANITIZE_OPTIONS);
}
