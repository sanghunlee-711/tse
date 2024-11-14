import { EditorView } from '@src/class/EditorView';
import EditorState from '@src/class/EditorState';
import Schema from '@src/class/Schema';
import Transaction from '@src/class/Transaction';
// import TSENode from 'src/class/TSENode';

// 1. Schema 설정
const schemaSpec = {
  nodes: {
    doc: { content: 'block+' },
    paragraph: { group: 'block' },
    heading: { group: 'block', attrs: { level: 1 } },
  },
};
const schema = new Schema(schemaSpec);

// 2. 초기 Document 생성
const initialDoc = schema.createNode('doc', {}, [
  schema.createNode('paragraph', {}, ['Hello, welcome to TSE Editor!']),
]);

// 3. EditorState 생성
const initialState = EditorState.create({
  schema: schema,
  doc: initialDoc,
});

// 4. EditorView 생성 및 DOM에 렌더링
const rootElement = document.getElementById('tse');
if (rootElement) {
  const editorView = new EditorView(rootElement, initialState);

  // 테스트 트랜잭션: 새로운 paragraph 노드 추가
  const transaction = new Transaction(schema);
  transaction.addNode('paragraph', {}, [
    'This is a new paragraph added dynamically.',
  ]);
  editorView.dispatch(transaction);

  const $consoleButton = document.getElementById('console-button');
  $consoleButton?.addEventListener('click', () => {
    console.info(editorView.state.toJSON());
  });
}
