export default function RepositoriesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <section className="repositories-section">
      {children}
    </section>
  );
} 