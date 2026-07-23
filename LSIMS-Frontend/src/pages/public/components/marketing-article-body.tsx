export function MarketingArticleBody({ paragraphs }: { paragraphs: string[] }) {
  return (
    <div className="space-y-4">
      {paragraphs.map((paragraph, index) => (
        <p key={index} className="leading-relaxed text-muted-foreground">
          {paragraph}
        </p>
      ))}
    </div>
  );
}
