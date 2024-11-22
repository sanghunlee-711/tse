import Schema from './Schema';
import TSENode from './TSENode';

/**
 * @description
 * Transaction 클래스는 문서 상태를 변경하는 여러 단계를 저장하고,
 * 노드 추가/삭제와 같은 명령을 기록,
 * apply 메서드를 통해 한 번에 상태를 갱신.
 */

interface TransactionAttrs {
  [key: string]: any;
}

class Transaction {
  schema: Schema;
  steps: ((doc: TSENode) => TSENode)[] = []; // 트랜잭션에 적용할 단계 함수 배열

  constructor(schema: Schema) {
    this.schema = schema;
  }

  // 새로운 노드를 추가하는 단계 설정
  addNode(
    type: string,
    attrs: TransactionAttrs,
    content: (TSENode | string)[] = []
  ): this {
    const newNode = this.schema.createNode(type, attrs, content);
    this.steps.push((doc) => {
      const newContent = [...doc.content, newNode];
      return new TSENode(doc.type, doc.attrs, newContent);
    });
    return this;
  }

  // 특정 노드의 속성을 업데이트하는 단계 설정
  updateNodeAttrs(nodeIndex: number, newAttrs: TransactionAttrs): this {
    this.steps.push((doc) => {
      const updatedContent = doc.content.map((node, index) =>
        index === nodeIndex && node instanceof TSENode
          ? new TSENode(node.type, { ...node.attrs, ...newAttrs }, node.content)
          : node
      );
      return new TSENode(doc.type, doc.attrs, updatedContent);
    });
    return this;
  }
}

export default Transaction;
