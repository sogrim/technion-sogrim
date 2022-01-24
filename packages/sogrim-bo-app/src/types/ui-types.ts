export type SearchType = "course-name" | "course-number" | "catalog-name";
export type SearchOption = {
  name: string;
  _id: string;
};

export enum CoursePageMode {
  Table = "Table",
  Update = "Update",
  Delete = "Delete",
}

export enum CatalogPageMode {
  Update = "Update",
  AddNew = "AddNew",
}

export enum CatalogStepperPhase {
  SteeperP1 = 1,
  SteeperP2 = 2,
  SteeperP3 = 3,
  SteeperP4 = 4,
  SteeperP5 = 5,
}
