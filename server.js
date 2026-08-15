const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const app = express();

const STORAGE_ROOT = path.resolve("C:\\files");

// ============================================================
// MIDDLEWARE
// ============================================================

app.use(express.json());

// ============================================================
// SECURITY HELPERS
// ============================================================


function getSafePath(relativePath = "") {
    const resolved = path.resolve(STORAGE_ROOT, relativePath);

    const rootWithSeparator = STORAGE_ROOT.endsWith(path.sep)
        ? STORAGE_ROOT
        : STORAGE_ROOT + path.sep;

    if (
        resolved !== STORAGE_ROOT &&
        !resolved.startsWith(rootWithSeparator)
    ) {
        throw new Error("Invalid storage path");
    }

    return resolved;
}


function isValidFolderName(name) {
    if (!name || !name.trim()) {
        return false;
    }
    if (
        name.includes("..") ||
        name.includes("/") ||
        name.includes("\\") ||
        name.includes(":")
    ) {
        return false;
    }


    if (/[<>:"|?*\x00-\x1F]/.test(name)) {
        return false;
    }


    const reservedNames = [
        "CON",
        "PRN",
        "AUX",
        "NUL",
        "COM1",
        "COM2",
        "COM3",
        "COM4",
        "COM5",
        "COM6",
        "COM7",
        "COM8",
        "COM9",
        "LPT1",
        "LPT2",
        "LPT3",
        "LPT4",
        "LPT5",
        "LPT6",
        "LPT7",
        "LPT8",
        "LPT9"
    ];

    if (reservedNames.includes(name.trim().toUpperCase())) {
        return false;
    }

    return true;
}

// ============================================================
// FILE UPLOAD
// ============================================================

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        try {
            const folderPath = req.body.folderPath || "";

            const destination = getSafePath(folderPath);

            if (!fs.existsSync(destination)) {
                fs.mkdirSync(destination, {
                    recursive: true
                });
            }

            cb(null, destination);
        } catch (error) {
            cb(error);
        }
    },

    filename: (req, file, cb) => {

        const safeFilename = path.basename(file.originalname);

        cb(null, safeFilename);
    }
});

const upload = multer({
    storage,

    limits: {
        fileSize: 5 * 1024 * 1024 * 1024 // 5 GB
    }
});

// ============================================================
// UPLOAD API
// POST /upload
// ============================================================

app.post("/upload", upload.single("file"), (req, res) => {
    if (!req.file) {
        return res.status(400).json({
            success: false,
            error: "No file uploaded"
        });
    }

    res.json({
        success: true,
        name: req.file.originalname,
        size: req.file.size,
        path: req.body.folderPath || ""
    });
});

// ============================================================
// CREATE FOLDER
// POST /folder
// ============================================================

app.post("/folder", (req, res) => {
    try {
        const {
            name,
            folderPath = ""
        } = req.body;

        if (!isValidFolderName(name)) {
            return res.status(400).json({
                success: false,
                error: "Invalid folder name"
            });
        }

        const parentPath = getSafePath(folderPath);


        if (!fs.existsSync(parentPath)) {
            return res.status(404).json({
                success: false,
                error: "Parent folder does not exist"
            });
        }


        if (!fs.statSync(parentPath).isDirectory()) {
            return res.status(400).json({
                success: false,
                error: "Parent path is not a folder"
            });
        }

        const targetPath = path.join(
            parentPath,
            name.trim()
        );

        getSafePath(
            path.relative(STORAGE_ROOT, targetPath)
        );


        if (fs.existsSync(targetPath)) {
            return res.status(409).json({
                success: false,
                error: "Folder already exists"
            });
        }

        fs.mkdirSync(targetPath);

        console.log(
            `Folder created: ${targetPath}`
        );

        return res.status(201).json({
            success: true,
            name: name.trim(),
            path: path.relative(
                STORAGE_ROOT,
                targetPath
            )
        });

    } catch (error) {
        console.error(
            "Folder creation error:",
            error
        );

        return res.status(500).json({
            success: false,
            error: "Could not create folder"
        });
    }
});



app.delete("/delete", (req, res) => {
    try {
        const { itemPath } = req.body;

        if (!itemPath || typeof itemPath !== "string") {
            return res.status(400).json({
                success: false,
                error: "Item path is required"
            });
        }

        const targetPath = getSafePath(itemPath);

        if (targetPath === STORAGE_ROOT) {
            return res.status(400).json({
                success: false,
                error: "Cannot delete storage root"
            });
        }

        if (!fs.existsSync(targetPath)) {
            return res.status(404).json({
                success: false,
                error: "File or folder not found"
            });
        }

        const stats = fs.statSync(targetPath);

        if (stats.isDirectory()) {
            fs.rmSync(targetPath, {
                recursive: true,
                force: true
            });

            console.log(`Folder deleted: ${targetPath}`);

            return res.json({
                success: true,
                type: "folder",
                path: itemPath
            });
        }

        fs.unlinkSync(targetPath);

        console.log(`File deleted: ${targetPath}`);

        return res.json({
            success: true,
            type: "file",
            path: itemPath
        });

    } catch (error) {
        console.error("Delete error:", error);

        return res.status(500).json({
            success: false,
            error: "Could not delete item"
        });
    }
});
// ============================================================
// ERROR HANDLER
// ============================================================

app.use((error, req, res, next) => {
    console.error("Server error:", error);

    if (error instanceof multer.MulterError) {
        if (error.code === "LIMIT_FILE_SIZE") {
            return res.status(413).json({
                success: false,
                error: "File is too large. Maximum size is 5 GB."
            });
        }

        return res.status(400).json({
            success: false,
            error: error.message
        });
    }

    return res.status(500).json({
        success: false,
        error: error.message || "Internal server error"
    });
});

// ============================================================
// START SERVER
// ============================================================

app.listen(3000, "127.0.0.1", () => {
    console.log(
        "IMCLOUD server running on http://127.0.0.1:3000"
    );

    console.log(
        "Storage location:",
        STORAGE_ROOT
    );
});