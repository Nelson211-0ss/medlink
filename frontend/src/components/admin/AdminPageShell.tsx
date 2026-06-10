import type { ReactNode } from 'react';

export function AdminPageShell({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <div className="admin-page">
      <header className="admin-page-header">
        <h1 className="admin-page-title">{title}</h1>
        <p className="admin-page-description">{description}</p>
      </header>
      {children}
    </div>
  );
}
