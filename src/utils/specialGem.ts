import { Gem, GemType } from "@/types/gem";
import { Match } from "@/types/game";

/**
 * 매칭 결과에서 특수 젬 생성 정보 추출
 */
export interface SpecialGemInfo {
  position: { row: number; col: number };
  type: GemType;
  stripedDirection?: "horizontal" | "vertical";
}

/**
 * 매칭 결과를 분석하여 특수 젬 생성 위치 결정
 */
export function determineSpecialGems(matches: Match[]): SpecialGemInfo[] {
  const specialGems: SpecialGemInfo[] = [];

  for (const match of matches) {
    const count = match.positions.length;

    if (count === 4) {
      // 4개 매칭: 스트라이프 젬 생성 (매칭 방향과 동일)
      const centerIndex = Math.floor(count / 2);
      const centerPos = match.positions[centerIndex];
      
      specialGems.push({
        position: centerPos,
        type: "striped",
        stripedDirection: match.type === "horizontal" ? "horizontal" : "vertical",
      });
    } else if (count >= 5) {
      // 5개 이상 매칭: 컬러봄 생성
      const centerIndex = Math.floor(count / 2);
      const centerPos = match.positions[centerIndex];
      
      specialGems.push({
        position: centerPos,
        type: "colorBomb",
      });
    }
    // 3개 매칭은 일반 젬으로 처리
  }

  return specialGems;
}

/**
 * 교차 매칭 확인 (L자/T자 형태)
 */
export function findCrossMatches(matches: Match[]): SpecialGemInfo[] {
  const specialGems: SpecialGemInfo[] = [];
  const horizontalMatches = matches.filter((m) => m.type === "horizontal");
  const verticalMatches = matches.filter((m) => m.type === "vertical");

  // 교차점 찾기
  for (const hMatch of horizontalMatches) {
    for (const vMatch of verticalMatches) {
      const crossPoint = hMatch.positions.find((hPos) =>
        vMatch.positions.some(
          (vPos) => hPos.row === vPos.row && hPos.col === vPos.col
        )
      );

      if (crossPoint) {
        // L자/T자 매칭: 래핑 젬 생성
        specialGems.push({
          position: crossPoint,
          type: "wrapped",
        });
      }
    }
  }

  return specialGems;
}

/**
 * 특수 젬 생성 우선순위 결정
 * 1. 교차 매칭 (래핑) > 2. 5개 이상 (컬러봄) > 3. 4개 (스트라이프)
 */
export function prioritizeSpecialGems(
  matches: Match[]
): SpecialGemInfo[] {
  const crossMatches = findCrossMatches(matches);
  const linearMatches = matches.filter(
    (m) => !crossMatches.some((cm) => cm.position.row === m.positions[0]?.row && cm.position.col === m.positions[0]?.col)
  );

  const specialGems: SpecialGemInfo[] = [];

  // 교차 매칭 우선 처리
  specialGems.push(...crossMatches);

  // 선형 매칭 처리
  const linearSpecialGems = determineSpecialGems(linearMatches);
  
  // 교차 매칭과 겹치지 않는 것만 추가
  for (const gem of linearSpecialGems) {
    const isOverlapping = crossMatches.some(
      (cm) =>
        cm.position.row === gem.position.row &&
        cm.position.col === gem.position.col
    );
    if (!isOverlapping) {
      specialGems.push(gem);
    }
  }

  return specialGems;
}

