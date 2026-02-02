export default function NotFound() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-white">
            <div className="text-center">
                <h1 className="text-6xl font-bold text-black mb-4">404</h1>
                <p className="text-xl text-neutral-500 mb-8">Página não encontrada</p>
                <a
                    href="/"
                    className="inline-block px-6 py-3 bg-black text-white rounded-xl hover:bg-neutral-800 transition-colors"
                >
                    Voltar para o início
                </a>
            </div>
        </div>
    );
}
