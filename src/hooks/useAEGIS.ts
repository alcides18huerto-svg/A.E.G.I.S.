import { useState, useEffect, useCallback } from 'react';
import { aegisEngine } from '../engine/aegisEngine';
import type { SystemState, EngineConfig, AnomalyResult, SafetyAlert, SensorReading } from '../engine/types';

export function useAEGIS() {
  const [state, setState] = useState<SystemState>(aegisEngine.getState());
  const [config, setConfig] = useState<EngineConfig>(aegisEngine.getConfig());
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    const unsubscribe = aegisEngine.subscribe(() => {
      setState({ ...aegisEngine.getState() });
      setConfig({ ...aegisEngine.getConfig() });
    });

    // Auto-start
    aegisEngine.start(2000);
    setIsRunning(true);

    return () => {
      unsubscribe();
      aegisEngine.stop();
    };
  }, []);

  const toggleEngine = useCallback(() => {
    if (isRunning) {
      aegisEngine.stop();
      setIsRunning(false);
    } else {
      aegisEngine.start(2000);
      setIsRunning(true);
    }
  }, [isRunning]);

  const updateConfig = useCallback((partial: Partial<EngineConfig>) => {
    aegisEngine.setConfig(partial);
  }, []);

  const toggleOnline = useCallback(() => {
    aegisEngine.toggleOnline();
  }, []);

  const injectAnomaly = useCallback((crewId: string, type: string) => {
    aegisEngine.injectAnomaly(crewId, type);
  }, []);

  const acknowledgeAlert = useCallback((alertId: string) => {
    aegisEngine.acknowledgeAlert(alertId);
  }, []);

  const getHistory = useCallback((crewId: string): SensorReading[] => {
    return aegisEngine.getReadingHistory(crewId);
  }, []);

  const getAnomalies = useCallback((crewId?: string, limit?: number): AnomalyResult[] => {
    return aegisEngine.getRecentAnomalies(crewId, limit);
  }, []);

  const getAlerts = useCallback((crewId?: string, limit?: number): SafetyAlert[] => {
    return aegisEngine.getRecentAlerts(crewId, limit);
  }, []);

  return {
    state,
    config,
    isRunning,
    toggleEngine,
    updateConfig,
    toggleOnline,
    injectAnomaly,
    acknowledgeAlert,
    getHistory,
    getAnomalies,
    getAlerts,
  };
}
