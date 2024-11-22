import TSENode from './TSENode';
import Transaction from './Transaction';
import Selection from './Selection';
import Schema from './Schema';

export interface EditorStateConfig {
  schema: Schema; // schema 속성 추가
  doc?: TSENode; // 문서의 초기 상태 (옵션)
}

class EditorState {
  schema: Schema; // schema 속성 추가
  doc: TSENode;
  selection: Selection;

  constructor(config: EditorStateConfig, selection: Selection) {
    this.schema = config.schema;
    this.doc = config.doc || this.schema.createNode('doc', {}, []);
    this.selection = selection;
  }

  apply(transaction: Transaction): EditorState {
    let updatedDoc = this.doc;
    transaction.steps.forEach((step) => {
      updatedDoc = step(updatedDoc);
    });

    updatedDoc.recalculateOffsets();

    return new EditorState(
      { schema: this.schema, doc: updatedDoc },
      this.selection
    );
  }

  resolvePosition(offset: number) {
    let accumulatedOffset = 0;

    const traverse = (
      node: TSENode
    ): { node: TSENode; localOffset: number } | null => {
      for (const child of node.content) {
        if (typeof child === 'string') {
          const length = child.length;
          if (accumulatedOffset + length >= offset) {
            return { node, localOffset: offset - accumulatedOffset };
          }
          accumulatedOffset += length;
        } else if (child instanceof TSENode) {
          const result: { node: TSENode; localOffset: number } | null =
            traverse(child);
          if (result) return result;
        }
      }
      return null;
    };

    const result = traverse(this.doc);
    if (!result) throw new Error('Offset out of bounds');
    console.log('resolve??', result);
    return result;
  }

  toJSON(): any {
    return {
      schema: this.schema.spec, // 스키마 스펙만 직렬화
      doc: this.doc.toJSON(), // 문서 내용을 JSON 형식으로 직렬화
      selection: this.selection,
    };
  }
}

export default EditorState;
