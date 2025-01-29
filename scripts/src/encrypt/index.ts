import { readFile } from 'fs';
import { join } from 'path';

export const convertFileToBase64 = async (path: string) => {
  readFile(join(__dirname, `../../../${path}`), (error, data) => {
    if (error) throw error;
    const base64Data = data.toString('base64');
    console.log(base64Data); // Prints the base64 encoded string
  });
};
