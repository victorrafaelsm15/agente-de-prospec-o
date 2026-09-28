"use client";

import { useCallback, useRef, useState } from "react";
import type { AgentEvent, QualificationCriteria } from "@/agents/types";
import type { Lead } from "@/types/lead";

export interface AgentStepLog {
  id: number;
  step: string;
  status: "running" | "done" | "error";
  message: string;
}

export interface SkippedLead {
  name: string;
  reason: string;
}

export interface RunCriteria {
  niche: string;
  city: string;
  state: string;
  quantity: number;
  additionalInstructions?: string;
  qualification?: QualificationCriteria;
}

type Phase = "idle" | "running" | "done" | "error";

export function useProspectingAgent() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [steps, setSteps] = useState<AgentStepLog[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [skipped, setSkipped] = useState<SkippedLead[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [summary, setSummary] = useState<{
    count: number;
    requested: number;
    skippedByCriteria: number;
  } | null>(null);
  const stepIdRef = useRef(0);
  const runningRef = useRef(false);

  const run = useCallback(async (criteria: RunCriteria) => {
    if (runningRef.current) return;
    runningRef.current = true;

    setPhase("running");
    setSteps([]);
    setLeads([]);
    setSkipped([]);
    setErrorMessage(null);
    setSummary(null);

    try {
      const response = await fetch("/api/agent/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(criteria),
      });

      if (!response.ok || !response.body) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error ?? "Não foi possível iniciar a pesquisa.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.trim()) continue;
          const event = JSON.parse(line) as AgentEvent;
          handleEvent(event);
        }
      }

      if (buffer.trim()) {
        handleEvent(JSON.parse(buffer) as AgentEvent);
      }

      setPhase("done");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Erro inesperado.");
      setPhase("error");
    } finally {
      runningRef.current = false;
    }

    function handleEvent(event: AgentEvent) {
      if (event.type === "step") {
        stepIdRef.current += 1;
        const id = stepIdRef.current;
        setSteps((prev) => [...prev, { id, step: event.step, status: event.status, message: event.message }]);
      } else if (event.type === "lead") {
        setLeads((prev) => [...prev, event.lead]);
      } else if (event.type === "skipped") {
        setSkipped((prev) => [...prev, { name: event.name, reason: event.reason }]);
      } else if (event.type === "done") {
        setSummary({
          count: event.count,
          requested: event.requested,
          skippedByCriteria: event.skippedByCriteria,
        });
      } else if (event.type === "error") {
        setErrorMessage(event.message);
      }
    }
  }, []);

  const reset = useCallback(() => {
    setPhase("idle");
    setSteps([]);
    setLeads([]);
    setSkipped([]);
    setErrorMessage(null);
    setSummary(null);
  }, []);

  return { phase, steps, leads, skipped, errorMessage, summary, run, reset };
}
