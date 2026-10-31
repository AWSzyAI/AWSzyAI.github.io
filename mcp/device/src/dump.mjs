#!/usr/bin/env node
// 只读：把 device 文档原样打印到 stdout（云端优先，退回备份），给本机的分析脚本用。
//   npm run -s dump > device.json
import { loadDevice } from './source.mjs';

const doc = await loadDevice({ reload: true });
process.stderr.write(`来源：${doc.source} · 更新于 ${doc.updatedAt}\n`);
process.stdout.write(JSON.stringify(doc.payload));
