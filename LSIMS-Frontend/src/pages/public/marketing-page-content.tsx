import type { ReactNode } from "react";

import type { StrapiBlock, StrapiBlockText } from "@/features/cms/types";

function renderInline(children: StrapiBlockText[]) {
  return children.map((child, index) => {
    let content: ReactNode = child.text;

    if (child.bold) {
      content = <strong key={`b-${index}`}>{content}</strong>;
    }
    if (child.italic) {
      content = <em key={`i-${index}`}>{content}</em>;
    }
    if (child.underline) {
      content = <u key={`u-${index}`}>{content}</u>;
    }

    return <span key={index}>{content}</span>;
  });
}

function renderBlock(block: StrapiBlock, index: number) {
  switch (block.type) {
    case "heading": {
      const level = block.level ?? 2;
      const className =
        level <= 2
          ? "text-2xl font-semibold tracking-tight"
          : "text-xl font-semibold tracking-tight";

      if (level === 1) {
        return (
          <h1 key={index} className={className}>
            {renderInline(block.children)}
          </h1>
        );
      }
      if (level === 3) {
        return (
          <h3 key={index} className={className}>
            {renderInline(block.children)}
          </h3>
        );
      }
      return (
        <h2 key={index} className={className}>
          {renderInline(block.children)}
        </h2>
      );
    }
    case "paragraph":
      return (
        <p key={index} className="text-muted-foreground leading-relaxed">
          {renderInline(block.children)}
        </p>
      );
    case "list": {
      const ListTag = block.format === "ordered" ? "ol" : "ul";
      return (
        <ListTag
          key={index}
          className="list-inside list-disc space-y-2 text-muted-foreground"
        >
          {block.children.map((item, itemIndex) => (
            <li key={itemIndex}>{renderInline(item.children)}</li>
          ))}
        </ListTag>
      );
    }
    case "link":
      return (
        <p key={index}>
          <a
            href={block.url}
            className="text-primary underline-offset-4 hover:underline"
            target="_blank"
            rel="noreferrer"
          >
            {renderInline(block.children)}
          </a>
        </p>
      );
    default:
      return null;
  }
}

export function MarketingPageContent({ body }: { body: StrapiBlock[] | null }) {
  if (!body?.length) {
    return null;
  }

  return <div className="space-y-4">{body.map(renderBlock)}</div>;
}
