interface AdminPlaceholderPageProps {
  title: string;
  description?: string;
}

export function AdminPlaceholderPage({ title, description }: AdminPlaceholderPageProps) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-8 shadow-sm">
      <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
      <p className="mt-2 text-gray-600">
        {description ??
          'This section will connect to your Neon domain tables via the Hamel API.'}
      </p>
    </div>
  );
}
