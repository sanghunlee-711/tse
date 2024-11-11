import Schema from '@src/class/Schema';
import EditorState from '@src/class/EditorState';
import EditorView from '@src/class/EditorView';

// 간단한 Schema 정의
const mySchema = new Schema({
  nodes: {
    doc: { content: 'block+' },
    text: {},
    paragraph: { content: 'text*', group: 'block' },
    bold_text: { marks: 'bold' },
  },
  marks: {
    bold: {
      parseDOM: [{ tag: 'strong' }],
      toDOM() {
        return ['strong', 0];
      },
    },
  },
});

// EditorState 초기화
const state = EditorState.create({
  schema: mySchema,
  plugins: [
    //   keymap({ /* 키 맵핑 플러그인 설정 */ }),
    //   inputRules({ /* inputRules 설정 */ })
  ],
});

const element = document.querySelector('#tse');

// EditorView 초기화
const view = new EditorView(element, {
  state,
  dispatchTransaction(transaction) {
    let newState = view.state.apply(transaction);
    view.updateState(newState);
  },
});
