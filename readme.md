# Imgboxify Package Documentation

## Table of Contents
- [Overview](#overview)
- [Installation](#installation)
- [Usage](#usage)
- [API Reference](#api-reference)
  - [Imgbox Class](#imgbox-class)
  - [Methods](#methods)
- [Examples](#examples)

## Overview

Imgboxify provides a simple and efficient way to upload images to the imgbox.com service. It supports uploading both from file paths and image buffers, making it versatile for various use cases. Although you can't mix up both image buffers and file path together in the input array.

## Installation

To install the Imgboxify package, use npm:

```bash
npm install imgboxify
```

```bash
pnpm add imgboxify
```

## Usage

To use the Imgboxify, you first need to create an instance of the `Imgbox` class using the static `create` method. Then, you can use the `uploadImages` method to upload your images.

```javascript
import Imgbox from 'image-uploader';
// const { default: Imgbox } = require("imgboxify");

const uploader = await Imgbox.create();
const result = await uploader.uploadImages(['path/to/image1.jpg', 'path/to/image2.png']);
console.log(result);
```

## API Reference

### Imgbox Class

The main class of the Imgboxify package.

#### Methods

##### `static create()`

Creates and initializes an instance of the Imgbox class.

- Returns: `Promise<Imgbox>`

##### `uploadImages(files: InputImageBuffer | InputImagePath)`

Uploads one or more images to imgbox.com.

- Parameters:
  - `files`: An array of either file paths (`string[]`) or image buffers (`{name: string, data: Buffer}[]`)
- Returns: `Promise<IUploadResult>`

##### `isFileAndHasReadPermission(path: string)`

Checks if a file exists and has read permissions.

- Parameters:
  - `path`: The file path to check
- Returns: `Promise<boolean>`

### Interfaces

#### IUploadResult

The result of an upload operation.

```typescript
interface IUploadResult {
    ok: boolean;
    message?: string;
    gallery_edit?: string;
    files?: IFileResult[];
}
```

#### IFileResult

Information about an uploaded file.

```typescript
interface IFileResult {
    id: string;
    slug: string;
    name: string;
    name_html_escaped: string;
    created_at: string;
    created_at_human: string;
    updated_at: string;
    gallery_id: string;
    url: string;
    original_url: string;
    thumbnail_url: string;
    square_url: string;
    selected: boolean;
    comments_enabled: number;
    comments_count: number;
}
```

## Examples

### Uploading images from file paths

```javascript
import Imgbox from 'image-uploader';

async function uploadFromPaths() {
    const uploader = await Imgbox.create();
    const result = await uploader.uploadImages(['image1.jpg', 'image2.png']);
    console.log(result);
}

uploadFromPaths();
```

### Uploading images from buffers

```javascript
import Imgbox from 'image-uploader';
import fs from 'fs/promises';

async function uploadFromBuffers() {
    const uploader = await Imgbox.create();
    
    const image1 = await fs.readFile('image1.jpg');
    const image2 = await fs.readFile('image2.png');
    
    const buffers = [
        { name: 'image1.jpg', data: image1 },
        { name: 'image2.png', data: image2 }
    ];
    
    const result = await uploader.uploadImages(buffers);
    console.log(result);
}

uploadFromBuffers();
```
