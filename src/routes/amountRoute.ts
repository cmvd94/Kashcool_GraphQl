import express from "express";
import {
  createAmount,
  updateAmount,
  deleteAmount,
  viewAmountsByRegion,
} from "../controllers/amountController";
import AdminAuthMiddleware from "../middlewares/AdminAuthMiddleware";
import roleAuthMiddleware from "../middlewares/roleAuthMiddleware";

const router = express.Router();

// Route to create or update an amount
router.post(
  "/addamount",
  AdminAuthMiddleware,
  roleAuthMiddleware(["superadmin", "admin", "contentmanager", "moderator"]),
  createAmount
);

// oute to update
router.patch(
  "/update/:amtId",
  AdminAuthMiddleware,
  roleAuthMiddleware(["superadmin", "admin", "contentmanager", "moderator"]),
  updateAmount
);

// Route to delete an amount
router.delete(
  "/delete/:amtId",
  AdminAuthMiddleware,
  roleAuthMiddleware(["superadmin", "admin", "contentmanager"]),
  deleteAmount
);

// Route to view amounts by region
router.get(
  "/:regionId",
  AdminAuthMiddleware,
  roleAuthMiddleware([
    "superadmin",
    "admin",
    "contentmanager",
    "moderator",
    "support",
  ]),
  viewAmountsByRegion
);

export default router;
