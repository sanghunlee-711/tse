import Schema from '@src/class/Schema';
import Transaction from '@src/class/Transaction';
import EditorState from '@src/class/EditorState';

// Schema 설정
const schemaSpec = {
  nodes: {
    doc: { content: 'block+' },
    paragraph: { group: 'block' },
    heading: { group: 'block', attrs: { level: 1 } },
  },
};

const mySchema = new Schema(schemaSpec);

const initialDoc = mySchema.createNode('doc', {}, [
  mySchema.createNode('paragraph', {}, ['Initial content']), // 초기 paragraph 노드 설정
]);

// 초기 상태 생성
let state = EditorState.create({ schema: mySchema, doc: initialDoc });

// 트랜잭션 생성 및 단계 설정
const transaction = new Transaction(mySchema);
transaction.addNode('paragraph', {}, ['New paragraph added']);
transaction.updateNodeAttrs(0, { class: 'updated-text' });

// 트랜잭션 적용
state = state.apply(transaction);

// 선택 상태 업데이트
state = state.setSelection({ from: 1, to: 1 });

// 상태 직렬화
const jsonState = state.toJSON();
console.log('Serialized State:', jsonState);
/* 예상 출력
Serialized State: {
  schema: {
    nodes: {
      doc: { content: "block+" },
      paragraph: { group: "block" },
      heading: { group: "block", attrs: { level: 1 } },
    },
  },
  doc: {
    type: "doc",
    attrs: {},
    content: [
      {
        type: "paragraph",
        attrs: { class: "updated-text" },
        content: ["Initial content"]
      },
      {
        type: "paragraph",
        attrs: {},
        content: ["New paragraph added"]
      }
    ]
  },
  selection: { from: 1, to: 1 }
}
*/

const restoredState = EditorState.fromJSON({ schema: mySchema }, jsonState);
console.log('Restored State DOM:', restoredState.doc.toDOM());
/* 예상 출력
Restored State DOM: [
  "div", {}, [
    ["p", { class: "updated-text" }, "Initial content"],
    ["p", {}, "New paragraph added"]
  ]
]
*/
