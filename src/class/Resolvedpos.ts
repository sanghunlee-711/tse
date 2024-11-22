import TSENode from './TSENode';

export class ResolvedPos {
  // 트리 내에서의 경로
  path: number[];
  // 해당 노드 내의 오프셋 위치
  offset: number;
  // 커서 위치를 포함하는 노드
  node: TSENode;

  constructor(path: number[], offset: number, node: TSENode) {
    this.path = path;
    this.offset = offset;
    this.node = node;
  }

  // 현재 위치의 경로를 문자열로 반환 (디버깅용)
  toString(): string {
    return `ResolvedPos(path: [${this.path.join(', ')}], offset: ${this.offset}, node: ${this.node.type})`;
  }
}

/**
 * 문서 내에서 from 위치를 기반으로 ResolvedPos를 반환하는 함수.
 *
 * @param {TSENode} doc - 트리 구조의 루트 노드
 * @param {number} from - 커서 위치를 나타내는 숫자
 * @returns {ResolvedPos | null} - 찾은 위치의 경로와 오프셋 정보를 포함한 ResolvedPos 객체를 반환. 없으면 null 반환
 */
export function resolveFromPosition(
  doc: TSENode,
  from: number
): ResolvedPos | null {
  let positionCounter = 0;
  let result: ResolvedPos | null = null;

  /**
   * 트리를 순회하여 from 위치를 찾는 재귀 함수
   *
   * @param {TSENode} node - 현재 탐색 중인 노드
   * @param {number[]} path - 현재 노드까지의 경로
   * @returns {boolean} - 위치를 찾으면 true, 못 찾으면 false
   */
  function traverse(node: TSENode, path: number[] = []): boolean {
    if (result) return true; // 위치를 찾았으면 중지

    // 텍스트 노드인 경우, 길이를 누적하며 현재 위치 계산
    if (node.type === 'text' && typeof node.content[0] === 'string') {
      const text = node.content[0] as string;
      const textLength = text.length;

      // from 위치가 현재 노드에 포함되면 offset 계산
      if (positionCounter + textLength >= from) {
        const offset = from - positionCounter;
        result = new ResolvedPos(path, offset, node);
        return true;
      }

      // 현재 노드를 지나친 경우 위치를 누적
      positionCounter += textLength;
    }

    // 자식 노드가 있는 경우 재귀적으로 탐색
    if (node.content && Array.isArray(node.content)) {
      for (let i = 0; i < node.content.length; i++) {
        const childNode = node.content[i];
        if (childNode instanceof TSENode && traverse(childNode, [...path, i])) {
          return true;
        }
      }
    }

    return false;
  }

  // 문서 루트 노드에서 탐색 시작
  traverse(doc);
  return result;
}
