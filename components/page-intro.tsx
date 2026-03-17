type PageIntroProps = {
  eyebrow: string;
  title: string;
  description: string;
  actions?: React.ReactNode;
};

export function PageIntro({ eyebrow, title, description, actions }: PageIntroProps) {
  return (
    <div className="glass-card rounded-[30px] p-6 lg:p-8">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl">
          <p className="eyebrow">{eyebrow}</p>
          <h2 className="mt-3 font-display text-4xl leading-none lg:text-5xl">{title}</h2>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-[var(--color-ink-700)] lg:text-base">
            {description}
          </p>
        </div>
        {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
      </div>
    </div>
  );
}
