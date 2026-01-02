import { Component, ErrorInfo, ReactNode } from "react";
import { logger } from "@/utils/logger";
import "./ErrorBoundary.css";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // 에러 로깅
    logger.error("ErrorBoundary caught an error", {
      error: {
        message: error.message,
        stack: error.stack,
        name: error.name,
      },
      errorInfo: {
        componentStack: errorInfo.componentStack,
      },
      timestamp: new Date().toISOString(),
    });

    this.setState({ errorInfo });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="error-boundary" role="alert" aria-live="assertive">
          <div className="error-boundary-content">
            <div className="error-boundary-icon">⚠️</div>
            <h2 className="error-boundary-title">
              {this.getLocalizedText("error.title")}
            </h2>
            <p className="error-boundary-message">
              {this.getLocalizedText("error.message")}
            </p>
            {process.env.NODE_ENV === "development" && this.state.error && (
              <details className="error-boundary-details">
                <summary>{this.getLocalizedText("error.details")}</summary>
                <pre className="error-boundary-stack">
                  {this.state.error.toString()}
                  {this.state.error.stack && (
                    <>
                      {"\n\n"}
                      {this.state.error.stack}
                    </>
                  )}
                  {this.state.errorInfo?.componentStack && (
                    <>
                      {"\n\nComponent Stack:\n"}
                      {this.state.errorInfo.componentStack}
                    </>
                  )}
                </pre>
              </details>
            )}
            <div className="error-boundary-actions">
              <button
                className="error-boundary-button error-boundary-button-primary"
                onClick={this.handleReload}
                aria-label={this.getLocalizedText("error.reload")}
              >
                {this.getLocalizedText("error.reload")}
              </button>
              {process.env.NODE_ENV === "development" && (
                <button
                  className="error-boundary-button error-boundary-button-secondary"
                  onClick={this.handleReset}
                  aria-label={this.getLocalizedText("error.reset")}
                >
                  {this.getLocalizedText("error.reset")}
                </button>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }

  private getLocalizedText(key: string): string {
    // 간단한 다국어 지원 (실제로는 useLanguage 훅을 사용해야 하지만 클래스 컴포넌트에서는 제한적)
    let lang = "ko";
    try {
      lang = localStorage.getItem("language") || "ko";
    } catch {
      // LocalStorage 접근 실패 시 기본값 사용
    }
    const translations: Record<string, Record<string, string>> = {
      ko: {
        "error.title": "오류가 발생했습니다",
        "error.message": "게임을 새로고침해주세요.",
        "error.details": "에러 상세 정보",
        "error.reload": "새로고침",
        "error.reset": "다시 시도",
      },
      en: {
        "error.title": "An Error Occurred",
        "error.message": "Please refresh the game.",
        "error.details": "Error Details",
        "error.reload": "Reload",
        "error.reset": "Try Again",
      },
      zh: {
        "error.title": "发生错误",
        "error.message": "请刷新游戏。",
        "error.details": "错误详情",
        "error.reload": "重新加载",
        "error.reset": "重试",
      },
      ja: {
        "error.title": "エラーが発生しました",
        "error.message": "ゲームをリフレッシュしてください。",
        "error.details": "エラー詳細",
        "error.reload": "リロード",
        "error.reset": "再試行",
      },
    };

    return translations[lang]?.[key] || translations.ko[key] || key;
  }
}










