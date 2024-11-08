import { Response } from "express";
import { CustomRequest } from "../types/customRequest";
import { Amount } from "../models/amount"; // Import the Amount model
import { Region } from "../models/region"; // Import the Region model
import { Grade } from "../models/grade"; // Import the Grade model
import { logAdminAction } from "../utils/logAdminAction";

// Create Amount
export const createAmount = async (req: CustomRequest, res: Response) => {
  const { regionId, gradeId, semester, amount } = req.body;

  if (!regionId || !gradeId || !semester || amount === undefined) {
    return res.status(400).json({ message: "All fields are required." });
  }

  try {
    const adminId = req.user?.id;
    if (!req.user?.region) {
      return res
        .status(400)
        .json({ message: "Region must be selected before accessing grades" });
    }

    // Check if the region and grade exist
    const region = await Region.findById(regionId);
    const grade = await Grade.findById(gradeId);

    if (!region || !grade) {
      await logAdminAction(
        req,
        "Create Amount",
        false,
        "Region or Grade",
        adminId?.toString() ?? "",
        `Region ${regionId} or Grade ${gradeId} not found`
      );
      return res.status(404).json({ message: "Region or Grade not found." });
    }

    // Check if an Amount entry already exists for the given region and grade
    const existingAmount = await Amount.findOne({
      region: regionId,
      grade: gradeId,
    });

    if (existingAmount) {
      // Check if the semester already exists in the semesters array
      const semesterExists = existingAmount.semesters.some(
        (s) => s.semester === semester
      );
      if (semesterExists) {
        return res
          .status(400)
          .json({ message: "Amount already exists for this semester." });
      }

      // Add the new semester and amount to the existing entry
      existingAmount.semesters.push({ semester, amount });
      await existingAmount.save();
      await logAdminAction(
        req,
        "Create Amount",
        true,
        "Amount",
        adminId?.toString() ?? "",
        `Added new semester for region ${regionId}, grade ${gradeId}`
      );
      return res.status(201).json({
        message: "Amount added successfully.",
        amount: existingAmount,
      });
    } else {
      // Create a new amount entry with the semester and amount
      const newAmount = new Amount({
        region: regionId,
        grade: gradeId,
        semesters: [{ semester, amount }],
      });

      await newAmount.save();
      await logAdminAction(
        req,
        "Create Amount",
        true,
        "Amount",
        adminId?.toString() ?? "",
        `Created new amount for region ${regionId}, grade ${gradeId}`
      );

      return res
        .status(201)
        .json({ message: "Amount created successfully.", amount: newAmount });
    }
  } catch (error: unknown) {
    if (error instanceof Error) {
      await logAdminAction(
        req,
        "Create Amount",
        false,
        "Amount",
        req.user?.id.toString() ?? "",
        error.message
      );
      return res
        .status(500)
        .json({ message: "Internal server error.", error: error.message });
    }
  }
};

// Update Amount
export const updateAmount = async (req: CustomRequest, res: Response) => {
  const { amount, semester } = req.body;
  const { amtId } = req.params;

  if (!amtId || !semester || amount === undefined) {
    return res
      .status(400)
      .json({ message: "amtId, semester, and amount are required." });
  }

  try {
    const adminId = req.user?.id;

    // Find the existing amount by amtId
    const amountToUpdate = await Amount.findById(amtId);

    if (!amountToUpdate) {
      await logAdminAction(
        req,
        "Update Amount",
        false,
        "Amount",
        adminId?.toString() ?? "",
        `Amount with ID ${amtId} not found`
      );
      return res.status(404).json({ message: "Amount not found." });
    }

    // Find the specific semester in the semesters array and update its amount
    const semesterToUpdate = amountToUpdate.semesters.find(
      (s) => s.semester === semester
    );
    if (!semesterToUpdate) {
      return res.status(404).json({ message: "Semester not found." });
    }

    semesterToUpdate.amount = amount;
    await amountToUpdate.save();

    await logAdminAction(
      req,
      "Update Amount",
      true,
      "Amount",
      adminId?.toString() ?? "",
      `Updated amount for amtId ${amtId}, semester ${semester}`
    );

    return res.status(200).json({
      message: "Amount updated successfully.",
      amount: amountToUpdate,
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      await logAdminAction(
        req,
        "Update Amount",
        false,
        "Amount",
        req.user?.id.toString() ?? "",
        error.message
      );
      return res
        .status(500)
        .json({ message: "Internal server error.", error: error.message });
    }
  }
};

// Delete Amount
export const deleteAmount = async (req: CustomRequest, res: Response) => {
  const { semester } = req.body; // Now using amtId and semester from the body
  const { amtId } = req.params;
  const adminId = req.user?.id;

  try {
    const amount = await Amount.findById(amtId);

    if (!amount) {
      await logAdminAction(
        req,
        "Delete Amount",
        false,
        "Amount",
        adminId?.toString() ?? "",
        `Amount with ID ${amtId} not found`
      );
      return res.status(404).json({ message: "Amount not found." });
    }

    // Check if there are multiple semesters
    if (amount.semesters.length > 1) {
      // Filter out the specific semester to delete
      amount.semesters = amount.semesters.filter(
        (sem) => sem.semester !== semester
      );
      await amount.save(); // Save the updated document with the semester removed
    } else {
      // If it's the last semester, delete the entire document
      await Amount.deleteOne({ _id: amtId });
    }

    await logAdminAction(
      req,
      "Delete Amount",
      true,
      "Amount",
      adminId?.toString() ?? "",
      `Deleted amount or semester with ID ${amtId}`
    );
    return res
      .status(200)
      .json({ message: "Amount or semester deleted successfully." });
  } catch (error: unknown) {
    if (error instanceof Error) {
      await logAdminAction(
        req,
        "Delete Amount",
        false,
        "Amount",
        adminId?.toString() ?? "",
        error.message
      );
      return res
        .status(500)
        .json({ message: "Internal server error.", error: error.message });
    }
  }
};

// View Amounts by Region
export const viewAmountsByRegion = async (
  req: CustomRequest,
  res: Response
) => {
  const { regionId } = req.params;
  const adminId = req.user?.id;
  if (!req.user?.region) {
    return res
      .status(400)
      .json({ message: "Region  must be selected before accessing grades" });
  }

  try {
    const amounts = await Amount.find({ region: regionId }); // Populate grade details

    if (amounts.length === 0) {
      await logAdminAction(
        req,
        "View Amounts by Region",
        false,
        "Region",
        adminId?.toString() ?? "",
        `No amounts found for region ${regionId}`
      );
      return res
        .status(404)
        .json({ message: "No amounts found for this region." });
    }

    await logAdminAction(
      req,
      "View Amounts by Region",
      true,
      "Region",
      adminId?.toString() ?? "",
      `Viewed amounts for region ${regionId}`
    );
    return res.status(200).json(amounts);
  } catch (error: unknown) {
    if (error instanceof Error) {
      await logAdminAction(
        req,
        "View Amounts by Region",
        false,
        "Region",
        adminId?.toString() ?? "",
        error.message
      );
      return res
        .status(500)
        .json({ message: "Internal server error.", error: error.message });
    }
  }
};
