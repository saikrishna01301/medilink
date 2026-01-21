type Props = { rawContent?: string };

const ContentRenderer: React.FC<Props> = ({ rawContent }) => {
  if (!rawContent?.trim()) return null;

  // Split into paragraphs/sections on blank lines (keeps bullet blocks together).
  const sections = rawContent.split(/\n{2,}/);

  // Parse simple inline markdown without unsafe HTML.
  const renderInline = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*|\*.*?\*|`.*?`)/);
    return parts.map((part, idx) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return (
          <strong key={idx} className="font-semibold text-gray-900">
            {part.slice(2, -2)}
          </strong>
        );
      }
      if (part.startsWith("*") && part.endsWith("*")) {
        return (
          <em key={idx} className="italic">
            {part.slice(1, -1)}
          </em>
        );
      }
      if (part.startsWith("`") && part.endsWith("`")) {
        return (
          <code
            key={idx}
            className="rounded bg-gray-100 px-1 py-0.5 text-[11px] text-gray-800"
          >
            {part.slice(1, -1)}
          </code>
        );
      }
      return part;
    });
  };

  return (
    <div className="space-y-3 text-sm leading-6 text-gray-900">
      {sections.map((section, sectionIndex) => {
        const lines = section
          .split("\n")
          .map((l) => l.trim())
          .filter(Boolean);

        if (!lines.length) return null;

        const allDash = lines.every((l) => l.startsWith("- "));
        const allNumbered = lines.every((l) => /^\d+\.\s/.test(l));

        // Render lists if every line is a bullet/number.
        if (allDash || allNumbered) {
          const isOrdered = allNumbered;
          const items = lines.map((l) =>
            l.replace(isOrdered ? /^\d+\.\s/ : /^-\s/, "").trim()
          );

          const ListTag = isOrdered ? "ol" : "ul";
          return (
            <ListTag
              key={sectionIndex}
              className={`space-y-1 pl-5 ${
                isOrdered ? "list-decimal list-outside" : "list-disc list-outside"
              }`}
            >
              {items.map((item, itemIdx) => (
                <li key={itemIdx}>{renderInline(item)}</li>
              ))}
            </ListTag>
          );
        }

        // Render headings if the first line starts with hashes.
        if (lines[0].startsWith("## ")) {
          return (
            <h5
              key={sectionIndex}
              className="text-xs font-semibold uppercase tracking-wide text-gray-500"
            >
              {renderInline(lines[0].slice(3))}
            </h5>
          );
        }
        if (lines[0].startsWith("# ")) {
          return (
            <h4 key={sectionIndex} className="text-sm font-semibold text-gray-900">
              {renderInline(lines[0].slice(2))}
            </h4>
          );
        }

        // Default: paragraph, keep single newlines.
        return (
          <p key={sectionIndex} className="whitespace-pre-line">
            {renderInline(lines.join("\n"))}
          </p>
        );
      })}
    </div>
  );
};

export default ContentRenderer;
