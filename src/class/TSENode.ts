import { TSENodeAttributes } from '@src/types';

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
    if (typeof this.content === 'string') {
      return this.startOffset + (this.content as string).length;
    }

    if (Array.isArray(this.content)) {
      let endOffset = this.startOffset;

      this.content.forEach((child) => {
        if (child instanceof TSENode) {
          endOffset = Math.max(endOffset, child.calculateEndOffset());
        } else if (typeof child === 'string') {
          endOffset += child.length;
        }
      });
      return endOffset;
    }
    return this.startOffset;
  }

  /**
   * @descriptions 전체 노드 계층 구조에서 오프셋을 재계산합니다.
   */
  recalculateOffsets() {
    let currOffset = this.startOffset;

    const dfs = (node: TSENode) => {
      //시작 오프셋 갱신
      node.startOffset = currOffset;

      node.content.forEach((content) => {
        if (typeof content === 'string') {
          currOffset += content.length;
        } else if (content instanceof TSENode) {
          dfs(content);
        }
      });

      //현 컨텐츠 길이 계산 후 offSet갱신
      node.endOffset = currOffset;

      if (node.type === 'paragraph') {
        currOffset += OFFSET_DELIMITER;
      }
    };

    dfs(this);
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
