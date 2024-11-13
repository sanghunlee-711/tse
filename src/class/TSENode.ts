import { TSENodeAttributes } from '@src/types';

export type TSENodeContent = TSENode | string;

/**
 * @description TSENode 클래스는 각 Node의 속성, 타입, DOM 표현을 정의합니
 */
class TSENode {
  type: string;
  attrs: TSENodeAttributes;
  content: TSENodeContent[];

  constructor(
    type: string,
    attrs: TSENodeAttributes,
    content: TSENodeContent[] = []
  ) {
    this.type = type;
    this.attrs = attrs;
    this.content = content;
  }

  static isTSENode(node: any): node is TSENode {
    return (
      node instanceof TSENode &&
      typeof node.type === 'string' &&
      Array.isArray(node.content)
    );
  }

  // DOM 표현 정의 (예: 노드 타입에 따라 <p>, <h1> 등으로 표현)
  toDOM(): (string | TSENodeAttributes | (string | TSENodeAttributes)[])[] {
    const childDOMs = this.content
      .map((child) => {
        if (TSENode.isTSENode(child)) {
          const domRepresentation = child.toDOM();
          return domRepresentation.length > 0 ? domRepresentation : null;
        }
        return typeof child === 'string' ? child : null;
      })
      .filter((child) => child !== null); // null 값 필터링

    if (this.type === 'paragraph') {
      return ['p', this.attrs, ...childDOMs];
    } else if (this.type === 'heading') {
      return ['h' + this.attrs.level, this.attrs, ...childDOMs];
    }
    return ['div', this.attrs, ...childDOMs];
  }

  // JSON 직렬화 기능
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
}

export default TSENode;
