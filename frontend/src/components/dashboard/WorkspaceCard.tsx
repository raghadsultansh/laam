'use client';

export function WorkspaceCard({ workspace }: { workspace: any }) {
  return (
    <div className="p-6 border rounded-lg hover:shadow-lg transition">
      <h3 className="text-lg font-semibold">{workspace.name}</h3>
      <p className="text-gray-600 text-sm">{workspace.description}</p>
    </div>
  );
}
