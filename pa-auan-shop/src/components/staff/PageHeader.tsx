interface PageHeaderProps {
  title: string;
  subtitle?: string;
}

export function PageHeader({ title, subtitle }: PageHeaderProps) {
  return (
    <div className="mb-4 sm:mb-6">
      <h1 className="text-xl font-bold text-gray-800 sm:text-2xl">{title}</h1>
      {subtitle && <p className="mt-1 text-xs text-gray-400 sm:text-sm">{subtitle}</p>}
    </div>
  );
}
