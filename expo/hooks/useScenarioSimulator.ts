import { useState, useCallback } from 'react';
import {
  ScenarioInput,
  ResponseSimulation,
  ResponseStyle,
  RefineTool,
  RefineAction,
  PracticeRound,
  SimulatorSession,
  SimulatorStep,
  REFINE_TOOLS,
} from '@/types/scenarioSimulator';
import {
  generateSimulations,
  refineResponse,
  generatePracticeFeedback,
  saveSession,
} from '@/services/simulator/scenarioSimulatorService';

export function useScenarioSimulator() {
  const [step, setStep] = useState<SimulatorStep>('input');
  const [input, setInput] = useState<ScenarioInput>({
    messageReceived: '',
    situationDescription: '',
    conversationContext: '',
  });
  const [simulations, setSimulations] = useState<ResponseSimulation[]>([]);
  const [selectedStyle, setSelectedStyle] = useState<ResponseStyle | null>(null);
  const [refineTools, setRefineTools] = useState<RefineAction[]>(
    REFINE_TOOLS.map(t => ({ ...t })),
  );
  const [refinedResponse, setRefinedResponse] = useState<string>('');
  const [practiceRounds, setPracticeRounds] = useState<PracticeRound[]>([]);
  const [currentFeedback, setCurrentFeedback] = useState<{
    feedback: string;
    improvementTip: string;
  } | null>(null);
  const [sessionSaved, setSessionSaved] = useState<boolean>(false);

  const updateInput = useCallback(<K extends keyof ScenarioInput>(
    key: K,
    value: ScenarioInput[K],
  ) => {
    setInput(prev => ({ ...prev, [key]: value }));
  }, []);

  const runSimulation = useCallback(() => {
    const hasContent =
      input.messageReceived.trim() ||
      input.situationDescription.trim() ||
      input.conversationContext.trim();

    if (!hasContent) return;

    console.log('[useScenarioSimulator] Running simulation');
    const results = generateSimulations(input);
    setSimulations(results);
    setStep('simulations');
  }, [input]);

  const selectResponse = useCallback((style: ResponseStyle) => {
    console.log('[useScenarioSimulator] Selected style:', style);
    setSelectedStyle(style);

    const sim = simulations.find(s => s.style === style);
    if (sim) {
      setRefinedResponse(sim.responseText);
    }

    if (style === 'secure') {
      setStep('refine');
    }
  }, [simulations]);

  const startRefining = useCallback(() => {
    const secureSim = simulations.find(s => s.style === 'secure');
    if (secureSim) {
      setRefinedResponse(secureSim.responseText);
      setSelectedStyle('secure');
    }
    setStep('refine');
  }, [simulations]);

  const toggleRefineTool = useCallback((toolId: RefineTool) => {
    setRefineTools(prev => {
      const updated = prev.map(t =>
        t.id === toolId ? { ...t, active: !t.active } : t,
      );

      const activeTools = updated.filter(t => t.active).map(t => t.id);
      const secureSim = simulations.find(s => s.style === 'secure');
      if (secureSim) {
        const newResponse = refineResponse(secureSim.responseText, activeTools);
        setRefinedResponse(newResponse);
      }

      return updated;
    });
  }, [simulations]);

  const updateRefinedResponse = useCallback((text: string) => {
    setRefinedResponse(text);
  }, []);

  const startPractice = useCallback(() => {
    setStep('practice');
    setCurrentFeedback(null);
  }, []);

  const submitPracticeResponse = useCallback((style: ResponseStyle, response: string) => {
    console.log('[useScenarioSimulator] Submitting practice response');
    const { feedback, improvementTip } = generatePracticeFeedback(style, response);

    const round: PracticeRound = {
      id: `practice_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      chosenStyle: style,
      refinedResponse: response,
      feedback,
      improvementTip,
      timestamp: Date.now(),
    };

    setPracticeRounds(prev => [...prev, round]);
    setCurrentFeedback({ feedback, improvementTip });
  }, []);

  const completeSession = useCallback(async () => {
    console.log('[useScenarioSimulator] Completing session');

    const session: SimulatorSession = {
      id: `sim_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      input,
      simulations,
      practiceRounds,
      finalResponse: refinedResponse || null,
      timestamp: Date.now(),
    };

    await saveSession(session);
    setSessionSaved(true);
    setStep('complete');
  }, [input, simulations, practiceRounds, refinedResponse]);

  const reset = useCallback(() => {
    setStep('input');
    setInput({ messageReceived: '', situationDescription: '', conversationContext: '' });
    setSimulations([]);
    setSelectedStyle(null);
    setRefineTools(REFINE_TOOLS.map(t => ({ ...t })));
    setRefinedResponse('');
    setPracticeRounds([]);
    setCurrentFeedback(null);
    setSessionSaved(false);
  }, []);

  const goBack = useCallback(() => {
    switch (step) {
      case 'simulations':
        setStep('input');
        break;
      case 'refine':
        setStep('simulations');
        setSelectedStyle(null);
        break;
      case 'practice':
        setStep('refine');
        setCurrentFeedback(null);
        break;
      case 'complete':
        setStep('practice');
        break;
    }
  }, [step]);

  return {
    step,
    input,
    simulations,
    selectedStyle,
    refineTools,
    refinedResponse,
    practiceRounds,
    currentFeedback,
    sessionSaved,
    updateInput,
    runSimulation,
    selectResponse,
    startRefining,
    toggleRefineTool,
    updateRefinedResponse,
    startPractice,
    submitPracticeResponse,
    completeSession,
    reset,
    goBack,
  };
}
