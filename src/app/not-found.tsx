import Link from "next/link";
import { SearchX } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 py-24 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-muted">
        <SearchX className="h-5 w-5" />
      </div>
      <h1 className="text-lg font-semibold text-foreground">Página não encontrada</h1>
      <p className="mt-1.5 text-sm text-muted">
        O conteúdo que você procura não existe ou foi removido.
      </p>
      <Link href="/" className="mt-5">
        <Button variant="secondary" size="sm">
          Voltar ao Dashboard
        </Button>
      </Link>
    </div>
  );
}
