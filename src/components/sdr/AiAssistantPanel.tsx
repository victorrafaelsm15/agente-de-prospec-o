"use client";

import { useState, type FormEvent } from "react";
import { Sparkles, Send, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";

const SUGGESTIONS = [
  "Quais leads devo abordar hoje?",
  "Quais follow-ups estão pendentes?",
  "Mostre os leads com maior oportunidade.",
  "Resuma minhas oportunidades desta semana.",
];

interface Exchange {
  question: string;
  answer: string;
  aiGenerated: boolean;
}

export function AiAssistantPanel() {
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<Exchange[]>([]);
  const { showToast } = useToast();

  async function ask(q: string) {
    if (!q.trim() || loading) return;
    setLoading(true);
    try {
      const response = await fetch("/api/sdr/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Não foi possível responder.");
      setHistory((prev) => [...prev, { question: q, answer: data.answer, aiGenerated: data.aiGenerated }]);
      setQuestion("");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Erro ao consultar a IA.", "error");
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    ask(question);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-1.5">
          <Sparkles className="h-4 w-4 text-brand" />
          Assistente de IA
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="mb-3 text-sm text-muted">
          Pergunte sobre seus leads. As respostas usam somente os dados reais da sua base.
        </p>

        {history.length > 0 && (
          <div className="mb-4 max-h-72 space-y-3 overflow-y-auto rounded-lg bg-slate-50 p-3">
            {history.map((exchange, idx) => (
              <div key={idx} className="space-y-1">
                <p className="text-[13px] font-medium text-foreground">{exchange.question}</p>
                <p className="text-[13px] text-muted">{exchange.answer}</p>
              </div>
            ))}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ex: quais leads devo abordar hoje?"
            disabled={loading}
          />
          <Button type="submit" size="md" disabled={loading || !question.trim()} loading={loading}>
            {!loading && <Send className="h-4 w-4" />}
          </Button>
        </form>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => ask(s)}
              disabled={loading}
              className="cursor-pointer rounded-full border border-border-strong bg-white px-2.5 py-1 text-[12px] text-slate-600 transition-colors hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {s}
            </button>
          ))}
        </div>

        {loading && (
          <div className="mt-3 flex items-center gap-1.5 text-xs text-muted">
            <Loader2 className="h-3 w-3 animate-spin" /> Consultando...
          </div>
        )}
      </CardContent>
    </Card>
  );
}
