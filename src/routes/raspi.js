import express from "express";
import RaspiController from "../app/controllers/RaspiController.js";

const router = express.Router();

// status
router.get("/status", RaspiController.status);

// open / close
router.post("/unlock", RaspiController.unlock);
router.post("/lock", RaspiController.lock);

// face features
router.post("/capture", RaspiController.capture);
router.post("/record", RaspiController.record);

// ✅ QUAN TRỌNG: endpoint frontend đang gọi
router.post("/recognize-remote", RaspiController.recognizeRemote);

export default router;
