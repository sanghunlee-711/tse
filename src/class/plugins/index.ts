import CaretPlugin from './CaretPlugin';
import { InsertTextPlugin } from './InsertTextPlugin';
import { KeyUpPlugin } from './KeyUpPlugin';
import { MouseUpPlugin } from './MouseUPPlugin';

export const CorePlugins = [
  new InsertTextPlugin(),
  new MouseUpPlugin(),
  new KeyUpPlugin(),
  new CaretPlugin(),
];
