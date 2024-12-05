import EditorView from '@src/class/EditorView';
import EditorState from '@src/class/EditorState';
import Schema from '@src/class/Schema';
import Transaction from '@src/class/Transaction';
import Selection from '@src/class/Selection';
import TSENode from './class/TSENode';

// 1. Schema 설정
const schemaSpec = {
  nodes: {
    doc: { content: 'block+' },
    paragraph: { group: 'block' },
    heading: { group: 'block', attrs: { level: 1 } },
  },
};
const schema = new Schema(schemaSpec);
const $rootElement = document.getElementById('tse');

if ($rootElement) {
  // 2. 초기 Document 생성
  const doc = new TSENode(
    'doc',
    {
      id: 'test',
    },
    [
      new TSENode('paragraph', {}, ['Hello, World!'], 0),
      new TSENode('paragraph', {}, ['ProseMirror-inspired editor'], 13),
    ]
  );
  const selection = new Selection(doc);
  // 3. EditorState 생성
  const state = new EditorState({ schema, doc }, selection);

  // 4. EditorView 생성 및 DOM에 렌더링
  const editorView = new EditorView($rootElement, state);

  //트랜잭션은 한번의 액션에 하나가 발생하게 된다!
  // 테스트 트랜잭션: 새로운 paragraph 노드 추가
  const transactionFoo = new Transaction(state);

  transactionFoo.addNode('paragraph', {}, [
    'This is a new paragraph added with Transaction.',
  ]);

  const transactionBar = new Transaction(state);
  transactionBar.addNode('paragraph', {}, [
    'One More Line With Transaction!@!',
  ]);

  const transactionZoo = new Transaction(state);
  transactionZoo.addNode('paragraph', {}, ['']);
  editorView.dispatch(transactionFoo);
  editorView.dispatch(transactionZoo);
  editorView.dispatch(transactionBar);
}
