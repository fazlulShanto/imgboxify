import { readFile } from "fs/promises";
import { access, constants, stat } from "node:fs/promises";
import path from "path";

const baseURL = "https://imgbox.com";

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

interface IUploadResult {
    ok: boolean;
    message?: string;
    gellery_edit?: string;
    files?: IFileResult[];
}

interface IGalleryAuthResponse {
    ok: boolean;
    token_id: number;
    token_secret: string;
    gallery_id: string;
    gallery_secret: string;
    message?: string;
}

interface ImageBuffer {
    name: string;
    data: Buffer;
}

type InputImagePath = string[];
type InputImageBuffer = ImageBuffer[];

class Imgbox {
    private galleryAuthInfo: IGalleryAuthResponse | null = null;
    private csrf: string | null = null;
    private cookie: string | null = null;

    private constructor() {}

    private getAuthInfo = async () => {
        const response = await fetch(baseURL);
        const textResponse = await response.text();
        const csrf = textResponse
            .split('input name="authenticity_token" type="hidden" value="')[1]
            .split('"')[0];

        const rawSessionToken = response.headers
            .getSetCookie()
            .find((cookie) => cookie.startsWith("_imgbox_session="));

        if (!rawSessionToken) {
            throw new Error("Failed to issue session token");
        }

        const cookie = rawSessionToken.split(";")[0] + "; request_method=POST";

        this.csrf = csrf;
        this.cookie = cookie;
    };

    private getImageGalleryAuthInfo = async () => {
        const httpClientHeader = {
            "User-Agent":
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:132.0) Gecko/20100101 Firefox/132.0",
            "X-CSRF-Token": this.csrf,
            Cookie: this.cookie,
            "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        } as HeadersInit;

        const response = await fetch(baseURL + "/ajax/token/generate", {
            method: "POST",
            headers: httpClientHeader,
            body: new URLSearchParams({
                gallery: "true",
                gallery_title: Math.random().toString(30).slice(3),
                comments_enabled: "0",
            }),
        });

        this.galleryAuthInfo = await response.json();
    };

    private uploadBufferedImages = async (
        imageBuffers: InputImageBuffer
    ): Promise<IUploadResult> => {
        if (!Array.isArray(imageBuffers)) {
            throw new Error(
                "Invalid input format. An array of buffers/image path was expected."
            );
        }
        if (this.galleryAuthInfo === null) {
            throw new Error("Gallery auth info missing.");
        }

        const uploadForm = new FormData();

        uploadForm.append(
            "token_id",
            this.galleryAuthInfo.token_id?.toString()
        );
        uploadForm.append("token_secret", this.galleryAuthInfo.token_secret);
        uploadForm.append("content_type", "1"); // family safe
        uploadForm.append("thumbnail_size", "100c");
        uploadForm.append("gallery_id", this.galleryAuthInfo.gallery_id);
        uploadForm.append(
            "gallery_secret",
            this.galleryAuthInfo.gallery_secret
        );
        uploadForm.append("comments_enabled", "0");

        for (const image of imageBuffers) {
            uploadForm.append(
                "files[]",
                new Blob([image.data], { type: "application/octet-stream" }),
                image.name ?? Math.random().toString(32).slice(3)
            );
        }

        const uploaderHeaders = {
            "User-Agent":
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:132.0) Gecko/20100101 Firefox/132.0",
            "X-Requested-With": "XMLHttpRequest",
            Origin: "https://imgbox.com",
            "X-CSRF-Token": this.csrf,
            Cookie: this.cookie,
            Accept: "application/json, text/javascript, */*; q=0.01",
            Connection: "keep-alive",
            Referer: "https://imgbox.com/",
        } as HeadersInit;

        try {
            const response = await fetch(baseURL + "/upload/process", {
                method: "POST",
                headers: uploaderHeaders,
                body: uploadForm,
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            const result = {
                ok: true,
                gallery_edit: `https://imgbox.com/gallery/edit/${this.galleryAuthInfo.gallery_id}/${this.galleryAuthInfo.gallery_secret}`,
                ...data,
            };
            return result;
        } catch (error) {
            return {
                ok: false,
                message: "Failed to upload!",
            };
        }
    };

    private getImageBuffersFromPath = async (filePaths: InputImagePath) => {
        if (
            !Array.isArray(filePaths) ||
            !filePaths.every((f) => typeof f === "string")
        ) {
            return [];
        }

        const filteredFiles: InputImageBuffer = [];

        for (let i = 0; i < filePaths.length; i++) {
            try {
                if (!this.isFileAndHasReadPermission(filePaths[i])) {
                    continue;
                }
                const buf = await readFile(filePaths[i], { flag: "r" });
                const fileName = path.basename(filePaths[i]);
                filteredFiles.push({ name: fileName, data: buf });
            } catch (error) {}
        }
        return filteredFiles ?? [];
    };

    uploadImages = async (files: InputImageBuffer | InputImagePath) => {
        if (!Array.isArray(files)) {
            throw new Error(
                "Invalid input format. An array of buffers/image path was expected."
            );
        }
        const isBufferType = files.every(
            (f) => typeof f === "object" && Buffer.isBuffer(f?.data)
        );

        let finalUploadData: InputImageBuffer = [];

        if (!isBufferType) {
            finalUploadData = await this.getImageBuffersFromPath(
                files as InputImagePath
            );
        } else {
            finalUploadData = files as InputImageBuffer;
        }
        if (!Array.isArray(finalUploadData) || finalUploadData.length < 1) {
            throw new Error("Failed to prepare image data format.");
        }

        try {
            // const result = this.axiosUploadBufferedImages(finalUploadData);
            const result = this.uploadBufferedImages(finalUploadData);
            return result;
        } catch (error) {
            throw error;
        }
    };

    isFileAndHasReadPermission = async (path: string) => {
        try {
            await access(path, constants.R_OK);
            const stats = await stat(path);

            if (stats.isFile()) {
                return true;
            }
            return false;
        } catch (err) {
            return false;
        }
    }

    static create = async () => {
        try {
            const instance = new Imgbox();
            await instance.getAuthInfo();
            await instance.getImageGalleryAuthInfo();
            return instance;
        } catch (error) {
            throw new Error("Failed to create imgbox instance!");
        }
    };
}

export default Imgbox;
