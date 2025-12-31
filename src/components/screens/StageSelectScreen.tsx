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
  const [currentPage, setCurrentPage] = useState<number>(1);

  const totalStages = 1000;
  const stagesPerPage = 50;
  const totalPages = Math.ceil(totalStages / stagesPerPage);

  useEffect(() => {
    // LocalStorage에서 해제된 스테이지 확인
    const saved = localStorage.getItem("chipPuzzleGame_progress");
    if (saved) {
      try {
        const progress = JSON.parse(saved);
        const highestStage = Math.max(1, progress.highestStage || 1);
        setUnlockedStages(highestStage);
        
        // 해제된 스테이지가 있는 페이지로 자동 이동
        const unlockedPage = Math.ceil(highestStage / stagesPerPage);
        setCurrentPage(unlockedPage);
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

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const renderStageGrid = () => {
    const stages = [];
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

  const renderPagination = () => {
    const pages = [];
    const maxVisiblePages = 10;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage < maxVisiblePages - 1) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    // 이전 버튼
    pages.push(
      <button
        key="prev"
        className={`pagination-button ${currentPage === 1 ? "disabled" : ""}`}
        onClick={() => handlePageChange(currentPage - 1)}
        disabled={currentPage === 1}
      >
        «
      </button>
    );

    // 첫 페이지
    if (startPage > 1) {
      pages.push(
        <button
          key={1}
          className="pagination-button"
          onClick={() => handlePageChange(1)}
        >
          1
        </button>
      );
      if (startPage > 2) {
        pages.push(<span key="ellipsis1" className="pagination-ellipsis">...</span>);
      }
    }

    // 페이지 번호들
    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button
          key={i}
          className={`pagination-button ${i === currentPage ? "active" : ""}`}
          onClick={() => handlePageChange(i)}
        >
          {i}
        </button>
      );
    }

    // 마지막 페이지
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        pages.push(<span key="ellipsis2" className="pagination-ellipsis">...</span>);
      }
      pages.push(
        <button
          key={totalPages}
          className="pagination-button"
          onClick={() => handlePageChange(totalPages)}
        >
          {totalPages}
        </button>
      );
    }

    // 다음 버튼
    pages.push(
      <button
        key="next"
        className={`pagination-button ${currentPage === totalPages ? "disabled" : ""}`}
        onClick={() => handlePageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
      >
        »
      </button>
    );

    return pages;
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
      <div className="pagination-container">
        <div className="pagination-info">
          {t("stageSelect.page")} {currentPage} / {totalPages}
        </div>
        <div className="pagination">
          {renderPagination()}
        </div>
      </div>
    </div>
  );
};

export default StageSelectScreen;

