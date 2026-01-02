import { Gem } from "@/types/gem";
import { Match } from "@/types/game";

/**
 * 매칭 결과 (특수 젬 정보 포함)
 */
export interface MatchResult {
  matches: Match[];
  specialGemPositions: Set<string>; // "row,col" 형식
}

/**
 * 게임 보드에서 매칭을 찾는 함수
 * 
 * 가로와 세로 방향으로 3개 이상의 같은 색상 젬이 연결된 매칭을 찾습니다.
 * 중복 매칭을 방지하기 위해 processed Set을 사용합니다.
 * 
 * @param board - 게임 보드 (2차원 배열, Gem 또는 null 포함)
 * @returns 발견된 모든 매칭의 배열
 * 
 * @example
 * ```typescript
 * const board = [
 *   [redGem, redGem, redGem, blueGem],
 *   [blueGem, greenGem, greenGem, greenGem]
 * ];
 * const matches = findMatches(board);
 * // 결과: [
 * //   { type: "horizontal", positions: [{row: 0, col: 0}, {row: 0, col: 1}, {row: 0, col: 2}] },
 * //   { type: "horizontal", positions: [{row: 1, col: 1}, {row: 1, col: 2}, {row: 1, col: 3}] }
 * // ]
 * ```
 */
export function findMatches(board: (Gem | null)[][]): Match[] {
  const matches: Match[] = [];
  const processed = new Set<string>(); // 중복 매칭 방지

  // 가로 매칭 검사
  for (let row = 0; row < board.length; row++) {
    let count = 1;
    let currentColor = board[row][0]?.color;
    let startCol = 0;

    for (let col = 1; col <= board[row].length; col++) {
      const gem = board[row][col];
      if (gem && gem.color === currentColor && currentColor) {
        count++;
      } else {
        // 매칭 발견 (3개 이상)
        if (count >= 3 && currentColor) {
          const positions: { row: number; col: number }[] = [];
          for (let i = 0; i < count; i++) {
            const pos = { row, col: startCol + i };
            const key = `${pos.row},${pos.col}`;
            if (!processed.has(key)) {
              positions.push(pos);
              processed.add(key);
            }
          }
          if (positions.length > 0) {
            matches.push({
              type: "horizontal",
              positions,
            });
          }
        }
        // 다음 매칭 검사 준비
        if (gem) {
          count = 1;
          currentColor = gem.color;
          startCol = col;
        } else {
          count = 0;
          currentColor = undefined;
        }
      }
    }
  }

  // 세로 매칭 검사
  if (board.length > 0) {
    for (let col = 0; col < board[0].length; col++) {
      let count = 1;
      let currentColor = board[0][col]?.color;
      let startRow = 0;

      for (let row = 1; row <= board.length; row++) {
        const gem = row < board.length ? board[row][col] : null;
        if (gem && gem.color === currentColor && currentColor) {
          count++;
        } else {
          // 매칭 발견 (3개 이상)
          if (count >= 3 && currentColor) {
            const positions: { row: number; col: number }[] = [];
            for (let i = 0; i < count; i++) {
              const pos = { row: startRow + i, col };
              const key = `${pos.row},${pos.col}`;
              if (!processed.has(key)) {
                positions.push(pos);
                processed.add(key);
              }
            }
            if (positions.length > 0) {
              matches.push({
                type: "vertical",
                positions,
              });
            }
          }
          // 다음 매칭 검사 준비
          if (gem) {
            count = 1;
            currentColor = gem.color;
            startRow = row;
          } else {
            count = 0;
            currentColor = undefined;
          }
        }
      }
    }
  }

  return matches;
}

/**
 * 특정 위치의 젬이 매칭에 포함되는지 확인
 * 
 * @param row - 확인할 행 인덱스
 * @param col - 확인할 열 인덱스
 * @param matches - 매칭 배열
 * @returns 해당 위치가 매칭에 포함되면 true, 아니면 false
 * 
 * @example
 * ```typescript
 * const matches = [
 *   { type: "horizontal", positions: [{row: 0, col: 0}, {row: 0, col: 1}] }
 * ];
 * isPositionInMatch(0, 0, matches); // true
 * isPositionInMatch(1, 0, matches); // false
 * ```
 */
export function isPositionInMatch(
  row: number,
  col: number,
  matches: Match[]
): boolean {
  return matches.some((match) =>
    match.positions.some((pos) => pos.row === row && pos.col === col)
  );
}

/**
 * 매칭 개수에 따라 특수 젬이 생성되는지 확인
 * 
 * 4개 이상의 젬이 매칭되면 특수 젬이 생성됩니다.
 * 
 * @param match - 확인할 매칭 객체
 * @returns 4개 이상이면 true, 아니면 false
 * 
 * @example
 * ```typescript
 * const match4 = { type: "horizontal", positions: [/* 4개 위치 *\/] };
 * shouldCreateSpecialGem(match4); // true
 * 
 * const match3 = { type: "horizontal", positions: [/* 3개 위치 *\/] };
 * shouldCreateSpecialGem(match3); // false
 * ```
 */
export function shouldCreateSpecialGem(match: Match): boolean {
  return match.positions.length >= 4;
}

