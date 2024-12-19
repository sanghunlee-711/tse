import { TSENodeAttributes } from '@src/types';

//*TODO: Type적용시키기.
export type TSENodeType =
  | 'doc'
  | 'paragraph'
  | 'div'
  | 'image'
  | 'h1'
  | 'h2'
  | 'h3'
  | 'ul'
  | 'ol'
  | 'li'
  | 'span';

export type TSENodeContent = TSENode | string;
const OFFSET_DELIMITER = 1;

/**
 * @description TSENode 클래스는 각 Node의 속성, 타입, DOM 표현을 정의합니
 */
class TSENode {
  type: string;
  attrs: TSENodeAttributes;
  content: TSENodeContent[];
  startOffset: number;
  endOffset: number;

  constructor(
    type: string,
    attrs: TSENodeAttributes,
    content: TSENodeContent[] = [],
    startOffset: number = 0
  ) {
    this.type = type;
    this.attrs = attrs;
    this.content = content;
    this.startOffset = startOffset;
    this.endOffset = this.calculateEndOffset();
  }

  static isTSENode(node: any): node is TSENode {
    return (
      node instanceof TSENode &&
      typeof node.type === 'string' &&
      Array.isArray(node.content)
    );
  }

  /**
   * 노드의 종료 오프셋을 계산합니다.
   * @returns {number} 종료 오프셋
   */
  private calculateEndOffset(): number {
    let endOffset = this.startOffset;

    this.content.forEach((child: TSENodeContent) => {
      if (child instanceof TSENode) {
        endOffset = Math.max(endOffset, child.calculateEndOffset());
      } else if (typeof child === 'string') {
        endOffset += child.length;
      }
    });
    return endOffset;
  }

  /**
   * @descriptions 전체 노드 계층 구조에서 오프셋을 재계산합니다.
   */
  recalculateOffsets() {
    const dfs = (
      node: TSENode,
      prevEndOffset: number,
      isRoot = false
    ): number => {
      // 현재 노드의 시작 오프셋 설정
      node.startOffset = prevEndOffset;
      let currentOffset = prevEndOffset;
      let currIdx = 0;
      let isEnd = node.content.length - 1 === currIdx;

      for (let i = 0; i < node.content.length; i++) {
        const content = node.content[i];
        currIdx = i;

        if (typeof content === 'string') {
          // 문자열 길이를 현재 오프셋에 더함
          currentOffset += content.length;
        } else if (content instanceof TSENode) {
          // 자식 노드를 재귀적으로 처리
          currentOffset = dfs(content, currentOffset);
        }
      }

      // 현재 노드의 종료 오프셋 설정
      node.endOffset = currentOffset;

      // 문단 타입이면서 루트가 아닌 경우에만 OFFSET_DELIMITER를 추가
      if (node.type === 'paragraph' && !isRoot) {
        currentOffset += OFFSET_DELIMITER;
      }

      return currentOffset;
    };

    // 루트 노드에서 재귀 시작 (루트 노드에는 OFFSET_DELIMITER 적용 안 함)
    dfs(this, 0, true);
  }

  toJSON(): any {
    return {
      type: this.type,
      attrs: this.attrs,
      content: this.content.map((child) =>
        child instanceof TSENode ? child.toJSON() : child
      ),
    };
  }

  // 노드를 업데이트하는 메서드
  update(
    attrs: { [key: string]: any },
    content: TSENodeContent[] = this.content
  ): TSENode {
    return new TSENode(this.type, attrs || this.attrs, content);
  }

  getNodeLength(): number {
    if (typeof this === 'string') {
      return (this as string).length;
    } else if (this instanceof TSENode) {
      // TSENode인 경우 content를 순회하며 자식 노드의 길이를 합산
      return this.content.reduce((acc, child) => {
        if (typeof child === 'string') {
          return acc + child.length;
        } else if (child instanceof TSENode) {
          return acc + child.getNodeLength();
        }
        return acc;
      }, 0);
    }
    return 0;
  }
}

export default TSENode;
