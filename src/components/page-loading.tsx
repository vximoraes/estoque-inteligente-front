export default function PageLoading() {
  return (
    <div className="w-full h-screen flex flex-col items-center justify-center">
      <div className="relative w-12 h-12">
        <div className="absolute inset-0 rounded-full border-4 border-[#0f1419]/15"></div>
        <div className="absolute inset-0 rounded-full border-4 border-[#0f1419] border-r-transparent animate-spin"></div>
      </div>
      <p className="mt-4 text-gray-600 font-medium">Carregando...</p>
    </div>
  );
}
