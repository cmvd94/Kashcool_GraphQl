import { Router } from "express";
import { graphqlAuthMiddleware } from "../middlewares/graphqlAuthMiddleware";
import upload from "../config/multerConfig";
import { uploadChildImage } from "../controllers/childController";

const router = Router();

router.put(
  "/imageUpload/:childId",
  graphqlAuthMiddleware,
  upload.single("media"),
  uploadChildImage
);


export default router;
