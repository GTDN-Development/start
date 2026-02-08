export function TailwindScreen() {
  if (process.env.NODE_ENV === "production") return null;

  return (
    <div className="fixed bottom-16 left-5 z-99999 flex size-9 items-center justify-center rounded-full bg-[#282828] text-xs font-bold text-white uppercase inset-ring-1 inset-ring-current/15 dark:bg-black">
      <div className="sm:hidden">-</div>
      <div className="hidden sm:block md:hidden">sm</div>
      <div className="hidden md:block lg:hidden">md</div>
      <div className="hidden lg:block xl:hidden">lg</div>
      <div className="hidden xl:block 2xl:hidden">xl</div>
      <div className="hidden 2xl:block">2xl</div>
    </div>
  );
}
