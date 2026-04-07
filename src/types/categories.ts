export type CategoryName = "Electrical" | "Hardwares" | "Paints" | "Plumbing" | "Sanitary Ware" | "Brands";

export type SubcategoryMap = {
  [subcategory: string]: {
    [subSubcategory: string]: never[]; // empty array placeholder
  };
};

export type CategoriesData = {
  [K in CategoryName]: SubcategoryMap;
};