import { Gem } from "@/types/gem";
import { GEM_COLORS } from "@/constants/gemConfig";

/**
 * 중력 적용: 빈 공간을 채우기 위해 젬을 아래로 이동
 */
export function applyGravity(board: (Gem | null)[][], cellSize: number = 50): (Gem | null)[][] {
  const newBoard = board.map((row) => [...row]);
  const rows = newBoard.length;
  const cols = newBoard[0]?.length || 0;

  // 각 열에 대해 아래에서 위로 검사
  for (let col = 0; col < cols; col++) {
    let writeIndex = rows - 1; // 아래에서부터 채울 위치

    // 아래에서 위로 검사하며 젬을 아래로 이동
    for (let row = rows - 1; row >= 0; row--) {
      if (newBoard[row][col] !== null) {
        if (writeIndex !== row) {
          // 젬을 아래로 이동
          const gem = newBoard[row][col]!;
          newBoard[writeIndex][col] = gem;
          
          // 애니메이션을 위해 원래 위치와 목표 위치 저장
          // targetY는 실제 픽셀 좌표로 설정 (렌더링 시 계산됨)
          // 현재 위치를 시작 위치로 저장
          if (gem.y === undefined || gem.y === 0) {
            // 초기 위치가 없으면 현재 row 기반으로 계산
            gem.y = row * cellSize;
          }
          // 목표 위치는 나중에 렌더링 시 계산되므로, row만 저장
          gem.targetY = writeIndex; // row를 저장 (렌더링 시 실제 Y 좌표로 변환)
          gem.position.row = writeIndex;
          
          newBoard[row][col] = null;
        }
        writeIndex--;
      }
    }

    // 빈 공간을 새 젬으로 채우기
    for (let row = writeIndex; row >= 0; row--) {
      const newGem = generateNewGem(row, col);
      // 새 젬은 위에서 떨어지는 효과를 위해 시작 위치를 위로 설정
      newGem.y = -cellSize * (writeIndex - row + 1); // 위에서 시작
      newGem.targetY = row; // 목표 row 저장
      newBoard[row][col] = newGem;
    }
  }

  return newBoard;
}

/**
 * 새 젬 생성
 */
export function generateNewGem(row: number, col: number): Gem {
  const randomColor = GEM_COLORS[Math.floor(Math.random() * GEM_COLORS.length)];
  
  return {
    id: `${Date.now()}-${row}-${col}-${Math.random()}`,
    color: randomColor,
    type: "normal",
    position: { row, col },
    x: 0, // 나중에 계산됨
    y: 0, // 나중에 계산됨
    targetX: undefined, // 초기에는 애니메이션 없음
    targetY: undefined, // 초기에는 애니메이션 없음
    scale: 1,
    rotation: 0,
  };
}

