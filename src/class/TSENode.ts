import { TSENodeAttributes } from '@src/types';

export type TSENodeContent = TSENode | string;

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

  // DOM 표현 정의 (예: 노드 타입에 따라 <p>, <h1> 등으로 표현)
  toDOM(): (string | TSENodeAttributes | (string | TSENodeAttributes)[])[] {
    if (this.type === 'paragraph') {
      return [
        'p',
        this.attrs,
        ...this.content.map((child) =>
          child instanceof TSENode ? child.toDOM() : child
        ),
      ];
    }

    if (this.type === 'heading') {
      return [
        'h' + this.attrs.level,
        this.attrs,
        ...this.content.map((child) =>
          child instanceof TSENode ? child.toDOM() : child
        ),
      ];
    }
    return [
      'div',
      this.attrs,
      ...this.content.map((child) =>
        child instanceof TSENode ? child.toDOM() : child
      ),
    ];
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
