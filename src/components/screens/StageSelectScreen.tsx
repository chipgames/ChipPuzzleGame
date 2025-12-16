import React, { useState, useEffect } from "react";
import { useLanguage } from "@/hooks/useLanguage";
import "./StageSelectScreen.css";

interface StageSelectScreenProps {
  onNavigate: (screen: "menu" | "stageSelect" | "game" | "guide" | "help") => void;
  onStartStage: (stageNumber: number) => void;
}

const StageSelectScreen: React.FC<StageSelectScreenProps> = ({ 
  onNavigate, 
  onStartStage 
}) => {
  const { t } = useLanguage();
  const [unlockedStages, setUnlockedStages] = useState<number>(1);

  useEffect(() => {
    // LocalStorage에서 해제된 스테이지 확인
    const saved = localStorage.getItem("chipPuzzleGame_progress");
    if (saved) {
      try {
        const progress = JSON.parse(saved);
        setUnlockedStages(Math.max(1, progress.highestStage || 1));
      } catch (e) {
        console.error("Failed to load progress", e);
      }
    }
  }, []);

  const handleStageClick = (stageNumber: number) => {
    if (stageNumber <= unlockedStages) {
      onStartStage(stageNumber);
    }
  };

  const renderStageGrid = () => {
    const stages = [];
    const totalStages = 1000;
    const stagesPerPage = 50;
    const currentPage = 1; // TODO: 페이지네이션 구현

    const startStage = (currentPage - 1) * stagesPerPage + 1;
    const endStage = Math.min(startStage + stagesPerPage - 1, totalStages);

    for (let i = startStage; i <= endStage; i++) {
      const isUnlocked = i <= unlockedStages;
      stages.push(
        <div
          key={i}
          className={`stage-card ${isUnlocked ? "unlocked" : "locked"}`}
          onClick={() => handleStageClick(i)}
        >
          <div className="stage-number">{i}</div>
          {!isUnlocked && <div className="stage-lock">🔒</div>}
        </div>
      );
    }

    return stages;
  };

  return (
    <div className="stage-select-screen">
      <div className="stage-select-header">
        <h2 className="stage-select-title">{t("stageSelect.title")}</h2>
        <button 
          className="stage-select-back-button"
          onClick={() => onNavigate("menu")}
        >
          ← {t("common.back")}
        </button>
      </div>
      <div className="stage-grid">
        {renderStageGrid()}
      </div>
    </div>
  );
};

export default StageSelectScreen;

