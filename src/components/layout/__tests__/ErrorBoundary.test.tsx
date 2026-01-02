import React from "react";
import { render, screen } from "@testing-library/react";
import { ErrorBoundary } from "../ErrorBoundary";
import { logger } from "@/utils/logger";

// logger 모킹
jest.mock("@/utils/logger", () => ({
  logger: {
    error: jest.fn(),
  },
}));

// 에러를 발생시키는 컴포넌트
const ThrowError: React.FC<{ shouldThrow?: boolean }> = ({ shouldThrow = false }) => {
  if (shouldThrow) {
    throw new Error("Test error");
  }
  return <div>No error</div>;
};

describe("ErrorBoundary", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // React의 에러 로깅 억제
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    (console.error as jest.Mock).mockRestore();
  });

  it("에러가 없으면 children을 렌더링해야 함", () => {
    render(
      <ErrorBoundary>
        <div>Test content</div>
      </ErrorBoundary>
    );

    expect(screen.getByText("Test content")).toBeInTheDocument();
  });

  it("에러 발생 시 에러 UI를 표시해야 함", () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText(/오류가 발생했습니다/i)).toBeInTheDocument();
  });

  it("에러 발생 시 logger.error를 호출해야 함", () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(logger.error).toHaveBeenCalledWith(
      "ErrorBoundary caught an error",
      expect.objectContaining({
        error: expect.objectContaining({
          message: "Test error",
        }),
      })
    );
  });

  it("fallback prop이 있으면 fallback을 렌더링해야 함", () => {
    const fallback = <div>Custom error message</div>;
    
    render(
      <ErrorBoundary fallback={fallback}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText("Custom error message")).toBeInTheDocument();
    expect(screen.queryByText(/오류가 발생했습니다/i)).not.toBeInTheDocument();
  });

  it("새로고침 버튼이 있어야 함", () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    const reloadButton = screen.getByRole("button", { name: /새로고침/i });
    expect(reloadButton).toBeInTheDocument();
  });
});

