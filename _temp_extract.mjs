import { PDFParse } from './node_modules/pdf-parse/dist/pdf-parse/esm/index.js';
import { readFileSync } from 'fs';

const dataBuffer = readFileSync("AMATEGEKO Y'UMUHANDA 2.pdf");
const parser = new PDFParse({ data: dataBuffer });
const result = await parser.getText();
process.stdout.write(result.text);