import TSENode from './TSENode';
import Transaction from './Transaction';
import Schema from './Schema';

interface EditorStateConfig {
  schema: Schema;
  doc?: TSENode; // 문서의 초기 상태 (옵션)
}

export interface Selection {
  from: number;
  to: number;
}

class EditorState {
  schema: Schema;
  doc: TSENode;
  selection: Selection;

  constructor(
    config: EditorStateConfig,
    selection: Selection = { from: 0, to: 0 }
  ) {
    this.schema = config.schema;
    this.doc = config.doc || this.schema.createNode('doc', {}, []);
    this.selection = selection;
  }

  // 트랜잭션을 적용하여 새로운 EditorState 반환
  apply(transaction: Transaction): EditorState {
    try {
      let updatedDoc = this.doc;

      transaction.steps.forEach((step) => {
        updatedDoc = step(updatedDoc);
      });

      // 선택 상태 업데이트 (예: 새로 추가된 노드의 끝에 커서 위치)
      const newSelection = {
        from: updatedDoc.content.length - 1,
        to: updatedDoc.content.length - 1,
      };

      return new EditorState(
        { schema: this.schema, doc: updatedDoc },
        newSelection
      );
    } catch (error) {
      console.error('Transaction apply error:', error);
      return this; // 에러 발생 시 기존 상태를 그대로 반환
    }
  }

  // 새로운 설정으로 EditorState를 재구성
  reconfigure(config: Partial<EditorStateConfig>): EditorState {
    const newSchema = config.schema || this.schema;
    const newDoc = config.doc || this.doc;
    return new EditorState({ schema: newSchema, doc: newDoc }, this.selection);
  }

  // 현재 상태를 JSON 형식으로 직렬화
  toJSON(): any {
    return {
      schema: this.schema.spec, // 스키마 스펙만 직렬화
      doc: this.doc.toJSON(), // 문서 내용을 JSON 형식으로 직렬화
      selection: this.selection,
    };
  }

  // JSON 데이터를 기반으로 EditorState를 복원하는 정적 메서드입니다.
  static fromJSON(config: EditorStateConfig, json: any): EditorState {
    const doc = config.schema.nodeFromJSON(json.doc);
    const selection = json?.selection || { from: 0, to: 0 };

    return new EditorState({ schema: config.schema, doc }, selection);
  }

  // 초기 상태 생성 메서드
  static create(config: EditorStateConfig): EditorState {
    return new EditorState(config);
  }

  // 선택 상태를 설정하는 메서드로, 커서 위치나 선택 범위를 업데이트할 때 사용됩니다.
  setSelection(selection: Selection): EditorState {
    return new EditorState({ schema: this.schema, doc: this.doc }, selection);
  }
}

export default EditorState;
