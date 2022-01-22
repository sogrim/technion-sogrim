export type SearchType = "course-name" | "course-number" | "catalog-name";
export type SearchOption = {
  name: string;
  _id: string;
};

export enum CoursePageMode {
  Table = "Table",
  Update = "Edit",
  Add = "Add",
}
