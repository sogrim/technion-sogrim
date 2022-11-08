import { makeAutoObservable } from "mobx";
import { RowData } from "../components/Pages/SemestersPage/SemesterTabsConsts";
import {
  ALL,
  CourseState,
  CourseStatus,
  UserDetails,
  UserSettings,
} from "../types/data-types";
import { RootStore } from "./RootStore";

const isCourseRowEqualToCourseStatus = (
  row: RowData,
  courseStatus: CourseStatus,
  semester: string
) =>
  row.courseNumber === courseStatus.course._id &&
  row.name === courseStatus.course.name &&
  row.credit === courseStatus.course.credit &&
  row.grade === courseStatus.grade &&
  row.type === courseStatus.type &&
  row.state === courseStatus.state &&
  semester === courseStatus.semester;
export class DataStore {
  public userDetails: UserDetails = {} as UserDetails;
  public userSettings: UserSettings = {} as UserSettings;
  public userBankNames: string[] = [];

  constructor(public readonly rootStore: RootStore) {
    makeAutoObservable(this, { rootStore: false });
  }

  updateStoreUserDetails = (newUserDetails: UserDetails) => {
    this.userDetails = newUserDetails;
  };

  updateStoreUserSettings = (newUserSettings: UserSettings) => {
    this.userSettings = newUserSettings;
  };

  get modifiedStatus() {
    return (
      this.userDetails?.degree_status?.course_statuses?.length > 0 &&
      this.userDetails?.modified
    );
  }

  getAllUserSemesters = (courseList: CourseStatus[]): string[] => {
    const allSemestersSet = new Set<string>();
    courseList.forEach((course) =>
      course.semester ? allSemestersSet.add(course.semester) : null
    );
    const allSemesters = Array.from(allSemestersSet);
    allSemesters.sort((first, second) => {
      let firstSplitted = first.split("_");
      let secondSplitted = second.split("_");
      return Number(firstSplitted[1]) >= Number(secondSplitted[1]) ? 1 : -1;
    });
    return allSemesters;
  };

  getUserBankNames = () => {
    if (this.userBankNames.length === 0) {
      this.generateUserBanksNames();
    }
    return this.userBankNames;
  };

  getUserGPA = (): number => {
    const courseList = this.userDetails?.degree_status.course_statuses ?? [];
    let sum = 0,
      credit = 0;
    courseList.forEach((course) => {
      const courserGrade = course.grade ? Number(course.grade) : null;
      if (courserGrade === 0 || !!courserGrade) {
        sum += courserGrade * course.course.credit;
        credit += course.course.credit;
      }
    });
    if (credit === 0) {
      return 0;
    }
    const avg = sum / credit;
    return Math.round((avg + Number.EPSILON) * 100) / 100;
  };

  getNumberOfBankComplete = (): number => {
    const bankList =
      this.userDetails?.degree_status?.course_bank_requirements ?? [];
    let count = 0;
    bankList.forEach((bank) => {
      if (bank.completed) {
        count++;
      }
    });
    return count;
  };

  private displayContent = (content: string | undefined) => {
    if (!content) {
      return "-";
    }
    return content.toString();
  };

  private generateUserBanksNames = () => {
    const userBanksNamesList: string[] = [];
    this.userDetails?.degree_status?.course_bank_requirements?.forEach(
      (bankReq) => {
        userBanksNamesList.push(bankReq.course_bank_name);
      }
    );
    this.userBankNames = userBanksNamesList;
  };

  generateRowsForSemester = (
    semester: string | null,
    courseList: CourseStatus[],
    semester0: boolean = false
  ) => {
    if (!courseList || courseList.length === 0) {
      return [];
    }
    const allSemesterCourses = new Set<CourseStatus>();
    courseList.forEach((course) => {
      if (
        // Normal Semester
        (!semester0 && course.semester === semester) ||
        // Semester 0
        (semester0 &&
          course.semester === semester &&
          (course.grade === "פטור ללא ניקוד" ||
            course.grade === "פטור עם ניקוד"))
      ) {
        allSemesterCourses.add(course);
      }
    });
    const rows: RowData[] = [];
    allSemesterCourses.forEach((course) =>
      rows.push({
        name: course.course.name,
        courseNumber: course.course._id,
        credit: course.course.credit,
        semester: course.semester,
        state: course.state,
        grade: this.displayContent(course.grade),
        type: this.displayContent(course.type),
        sg_name: course.specialization_group_name,
        msg: course.additional_msg,
      })
    );
    return rows;
  };

  generateRowsForBank = (bank: string, courseList: CourseStatus[]) => {
    const allSemesterCourses = new Set<CourseStatus>();
    courseList?.forEach((course) => {
      if (course.type === bank) {
        allSemesterCourses.add(course);
      }
    });
    const rows: RowData[] = [];
    allSemesterCourses?.forEach((course) =>
      rows.push({
        name: course.course.name,
        courseNumber: course.course._id,
        credit: course.course.credit,
        semester: course.semester,
        state: course.state,
        grade: this.displayContent(course.grade),
        type: this.displayContent(course.type),
        sg_name: course.specialization_group_name,
        msg: course.additional_msg,
      })
    );

    return rows;
  };

  updateCourseInUserDetails = (rowData: RowData, semester: string) => {
    const courseList = this.userDetails?.degree_status.course_statuses ?? [];

    const updateCourseRow: CourseStatus = {
      course: {
        _id: rowData.courseNumber,
        credit: +rowData.credit,
        name: rowData.name,
      },
      state: rowData.state as CourseState,
      type: rowData.type,
      grade: rowData.grade,
      semester: semester,
      modified: true,
    };

    const updatedCourseStatuses: CourseStatus[] = courseList.map(
      (courseStatus) => {
        if (
          courseStatus.course._id === rowData.courseNumber &&
          courseStatus.semester === semester
        ) {
          this.userDetails.modified =
            this.userDetails.modified ||
            !isCourseRowEqualToCourseStatus(rowData, courseStatus, semester);
          return updateCourseRow;
        } else {
          return courseStatus;
        }
      }
    );

    this.userDetails.degree_status.course_statuses = updatedCourseStatuses;

    return this.userDetails;
  };

  deleteCourseInUserDetails = (rowData: RowData, semester: string) => {
    const courseList = this.userDetails?.degree_status.course_statuses ?? [];
    const idx = courseList.findIndex(
      (courseStatus) =>
        courseStatus.course._id === rowData.courseNumber &&
        courseStatus.semester === semester
    );
    const newCourseList = [...courseList];
    newCourseList.splice(idx, 1);

    this.userDetails.degree_status.course_statuses = newCourseList;
    this.userDetails.modified = true;

    return this.userDetails;
  };

  insertCourseInUserDetails = (rowData: RowData, semester: string) => {
    const courseList = this.userDetails?.degree_status.course_statuses ?? [];

    const newCourse: CourseStatus = {
      course: {
        _id: rowData.courseNumber,
        credit: +rowData.credit,
        name: rowData.name,
      },
      state: rowData.state as CourseState,
      type: rowData.type,
      grade: rowData.grade,
      semester: semester,
      modified: true,
    };

    courseList.push(newCourse);
    this.userDetails.degree_status.course_statuses = courseList;
    this.userDetails.modified = true;

    return this.userDetails;
  };

  deleteSemesterInUserDetails = (semester: string) => {
    const courseList = this.userDetails?.degree_status.course_statuses ?? [];
    const newCourseList = [...courseList];

    courseList.forEach((course) => {
      if (course.semester === semester) {
        const idx = newCourseList.findIndex(
          (courseToRemove) => courseToRemove.course._id === course.course._id
        );
        newCourseList.splice(idx, 1);
      }
    });
    this.userDetails.degree_status.course_statuses = newCourseList;
    this.userDetails.modified = true;

    return this.userDetails;
  };

  updateIrrelevantCourse = (
    course: RowData,
    action: "לא רלוונטי" | "לא הושלם"
  ): UserDetails => {
    const courseList = this.userDetails?.degree_status.course_statuses ?? [];

    courseList.forEach((courseListItem, idx) => {
      if (
        courseListItem.course._id === course.courseNumber &&
        courseListItem.semester === course.semester
      ) {
        courseListItem.state = action;
        courseListItem.modified = true;
      }
    });

    this.userDetails.degree_status.course_statuses = courseList;
    this.userDetails.modified = true;

    return this.userDetails;
  };

  updateComputeInProgressInUserSettings = (
    computeInProgress: boolean
  ): UserSettings => {
    this.userSettings.compute_in_progress = computeInProgress;
    this.userDetails.modified = true;
    return this.userSettings;
  };

  isBankTypeOfCourseAll = (type: string | undefined): boolean => {
    return this.userDetails?.degree_status?.course_bank_requirements?.some(
      (bankReq) =>
        bankReq.course_bank_name === type && bankReq.bank_rule_name === ALL
    );
  };
}
