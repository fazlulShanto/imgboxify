import ImgBox from "../src/Imgbox";
import { test, describe, it, beforeEach , before} from 'node:test';
import assert from 'node:assert/strict';
import fs from "node:fs";
import path from "node:path";
const imageFiles = ["./test/images/i1.jpg","./test/images/i2.png","./test/images/i3.jpg"];

const main = async () => {
    const uploader = await ImgBox.create();

    // const fileBuffer = fs.readFileSync("./src/a.jpg");

    const result = await uploader.uploadImages(imageFiles);
    // const result = await uploader.uploadImages([
    //     {
    //         name: "a.jpg",
    //         data: fileBuffer,
    //     },
    //     {
    //         name : 'b.jpg',
    //         data : fs.readFileSync("./test/b.jpg")
    //     }
    // ]);
    console.dir(result, { depth: null });
};

// test/example.test.js



// Describe a set of tests (optional)

describe('Upload Images by file path', async () => {

  let uploader:ImgBox ;
  beforeEach(async ()=>{
    uploader = await ImgBox.create();
  });

  it('should able to upload with file path',async () => {
    const inputFiles = imageFiles.slice(0,2);
    const result = await uploader.uploadImages(inputFiles);
    assert.strictEqual(result.files?.length,inputFiles.length);
  });


  it('should able to upload with file path',async () => {
    const inputFiles = imageFiles.slice(0,3);
    const fileBuffers = inputFiles.map( v => ({name : path.basename(v), data : fs.readFileSync(v)}));
    const result = await uploader.uploadImages(fileBuffers);
    assert.strictEqual(result.files?.length,inputFiles.length);
  });

});
