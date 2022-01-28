import { makeAutoObservable } from "mobx";
import { createData } from "../components/Pages/SemestersPage/SemesterTable/SemesterTableUtils";
import { RowData } from "../components/Pages/SemestersPage/SemesterTabsConsts";
import { CourseStatus, UserDetails, CourseState } from "../types/data-types";
import { RootStore } from "./RootStore";

export class DataStore {
  public userDetails: UserDetails = {} as UserDetails;
  public userBankNames: string[] = [];

  constructor(public readonly rootStore: RootStore) {
    makeAutoObservable(this, { rootStore: false });
  }

  updateStoreUserDetails = (newUserDitails: UserDetails) => {
    this.userDetails = newUserDitails;
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
      let firstSplited = first.split("_");
      let secondSplited = second.split("_");
      return Number(firstSplited[1]) >= Number(secondSplited[1]) ? 1 : -1;
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

  generateRowsForSemester = (semester: string, courseList: CourseStatus[]) => {
    const allSemesterCourses = new Set<CourseStatus>();
    courseList.forEach((course) => {
      if (course.semester === semester) {
        allSemesterCourses.add(course);
      }
    });
    const rows: RowData[] = [];
    allSemesterCourses.forEach((course) =>
      rows.push(
        createData(
          course.course.name,
          course.course._id,
          course.course.credit,
          course.semester,
          course.state,
          this.displayContent(course.grade),
          this.displayContent(course.type),
          course.additional_msg
        )
      )
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
      rows.push(
        createData(
          course.course.name,
          course.course._id,
          course.course.credit,
          course.semester,
          course.state,
          this.displayContent(course.grade),
          this.displayContent(course.type),
          course.additional_msg
        )
      )
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

    const updatedCourseStatus: CourseStatus[] = courseList.map((courseStatus) =>
      courseStatus.course._id === rowData.courseNumber &&
      courseStatus.semester === rowData.semester
        ? updateCourseRow
        : courseStatus
    );

    this.userDetails.degree_status.course_statuses = updatedCourseStatus;
    this.userDetails.modified = true;

    return this.userDetails;
  };

  deleteCourseInUserDetails = (rowData: RowData, semester: string) => {
    const courseList = this.userDetails?.degree_status.course_statuses ?? [];
    const idx = courseList.findIndex(
      (course) => course.course._id === rowData.courseNumber
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
      }
    });

    this.userDetails.degree_status.course_statuses = courseList;
    this.userDetails.modified = true;

    return this.userDetails;
  };
}
