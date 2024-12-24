import { DeleteTextPlugin } from './DeleteTextPlugin';
import { EnterKeyPlugin } from './EnterKeyPlugin';
import { InsertTextPlugin } from './InsertTextPlugin';
import { KeyUpPlugin } from './KeyUpPlugin';
import { MouseUpPlugin } from './MouseUpPlugin';

export const CorePlugins = [
  new InsertTextPlugin(),
  new DeleteTextPlugin(),
  new MouseUpPlugin(),
  new KeyUpPlugin(),
  new EnterKeyPlugin(),
];
