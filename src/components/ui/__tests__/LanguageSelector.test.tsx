import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import LanguageSelector from "../LanguageSelector";
import { useLanguage } from "@/hooks/useLanguage";

// useLanguage 훅 모킹
jest.mock("@/hooks/useLanguage");

const mockUseLanguage = useLanguage as jest.MockedFunction<typeof useLanguage>;

describe("LanguageSelector", () => {
  const mockSetLanguage = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseLanguage.mockReturnValue({
      language: "ko",
      setLanguage: mockSetLanguage,
      t: (key: string) => key,
      isLoading: false,
    });
  });

  it("언어 선택 드롭다운을 렌더링해야 함", () => {
    render(<LanguageSelector />);
    const select = screen.getByRole("combobox", { name: /language selector/i });
    expect(select).toBeInTheDocument();
  });

  it("현재 언어가 선택되어 있어야 함", () => {
    mockUseLanguage.mockReturnValue({
      language: "en",
      setLanguage: mockSetLanguage,
      t: (key: string) => key,
      isLoading: false,
    });

    render(<LanguageSelector />);
    const select = screen.getByRole("combobox") as HTMLSelectElement;
    expect(select.value).toBe("en");
  });

  it("언어 변경 시 setLanguage를 호출해야 함", async () => {
    const user = userEvent.setup();
    render(<LanguageSelector />);
    
    const select = screen.getByRole("combobox");
    await user.selectOptions(select, "en");

    expect(mockSetLanguage).toHaveBeenCalledWith("en");
  });

  it("모든 지원 언어가 옵션으로 표시되어야 함", () => {
    render(<LanguageSelector />);
    const select = screen.getByRole("combobox");
    
    expect(select.querySelector('option[value="ko"]')).toBeInTheDocument();
    expect(select.querySelector('option[value="en"]')).toBeInTheDocument();
    expect(select.querySelector('option[value="ja"]')).toBeInTheDocument();
    expect(select.querySelector('option[value="zh"]')).toBeInTheDocument();
  });
});

