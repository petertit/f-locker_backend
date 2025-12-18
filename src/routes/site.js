// server/src/routes/site.js
import express from "express";
import SiteController from "../app/controllers/SiteController.js";

const router = express.Router();

router.get("/", (req, res) => SiteController.home(req, res));

export default router;
