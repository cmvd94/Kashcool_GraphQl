import { Region } from "../../../models/region"; // Adjust the import based on your file structure
import { Grade } from "../../../models/grade"; // Adjust the import based on your file structure

import { MyContext } from "../../apollo";

export const userQueryResolver = {
  Query: {
    // Resolver for fetching all regions
    //_parent:null Nested resolver:Region->RegionGrade
    allRegions: async (_parent: any, _args: any, context: MyContext) => {
      //console.log("all region");
      /*need to solve for specific region*/
      const regions = await Region.find().lean(); // Fetch regions from database
      return regions; // This result becomes the parent for the nested `grades` resolver
    },
  },
  // _parent: allregion
  Region: {
    grades: async (parent: any, _args: any, _context: MyContext) => {
      //console.log("Fetching grades for region:", parent._id);
      return parent.grades; // Return the grades array for the given region
    },
  },
  // _parent:Region
  RegionGrade: {
    sem: async (parent: any, _args: any, _context: MyContext) => {
      //console.log("Fetching semesters for grade:", parent);
      const grade = await Grade.findOne({ _id: parent.gradeId });

      // If the grade or semesters don't exist, return an empty array
      if (!grade || !grade.semesters || grade.semesters.length === 0) {
        //console.log("inside null")
        return [];
      }

      // Map the semesters to the desired structure
      return grade.semesters.map((semester) => ({
        semesterName: semester.semesterName,
      }));
    },
  },
};
