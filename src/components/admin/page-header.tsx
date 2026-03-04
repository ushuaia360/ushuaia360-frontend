export default function PageHeader({
  title,
  children,
}: {
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex h-14 items-center justify-between border-b border-[#EBEBEB] px-8">
      <h1 className="text-[18px] font-medium text-gray-900">{title}</h1>
      {children}
    </div>
  );
}
