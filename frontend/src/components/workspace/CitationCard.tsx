'use client';

export function CitationCard({ citation }: { citation: any }) {
  return (
    <div className="p-3 bg-white border rounded text-sm">
      <p className="font-medium">{citation.report_id}</p>
      <p className="text-gray-600 text-xs">Page {citation.page}</p>
      <p className="mt-2 italic">"{citation.excerpt}"</p>
    </div>
  );
}
