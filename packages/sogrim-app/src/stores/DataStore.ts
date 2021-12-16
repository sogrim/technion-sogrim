import { makeAutoObservable } from 'mobx';
import { createData } from '../components/Pages/SemestersPage/SemesterTable/SemesterTableUtils';
import { RowData } from '../components/Pages/SemestersPage/SemesterTable/SemesterTabsConsts';
import { CourseState, CourseStatus, UserDetails } from '../types/data-types';
import { RootStore } from './RootStore';

export class DataStore {

  constructor(
    public readonly rootStore: RootStore,
  ) {
    makeAutoObservable(this, { rootStore: false });
  }

  getAllUserSemesters = (courseList: CourseStatus[]): string[] => {
    const allSemestersSet = new Set<string>();
    courseList.forEach( course => course.semester ? allSemestersSet.add(course.semester) : null);
    const allSemesters = Array.from(allSemestersSet);
    allSemesters.sort( (first, second) => {
      let firstSplited = first.split('_');
      let secondSplited = second.split('_');
      return Number(firstSplited[1]) >= Number(secondSplited[1]) ? 1 : -1
    })    
    return allSemesters;
  }

  private displayGrade = (grade: string) => {
    if (!grade) {
      return '-';
    }       
    return grade.toString();
  }

  generateRows = (semester: string, courseList: CourseStatus[]) => {
    const allSemesterCourses = new Set<CourseStatus>();
    courseList.forEach(course => {
      if(course.semester === semester) {
        allSemesterCourses.add(course)
      }
    });
    const rows: RowData[] = [];
    allSemesterCourses.forEach( course => rows.push(createData(
        course.course.name, 
        course.course._id, 
        course.course.credit, 
        this.displayGrade(course.grade),
        course.type,
        course.state)));
    return rows;
  }

  updateCourseInUserDetails = (rowData: RowData, semester: string, userDetails: UserDetails): UserDetails => {
    const courseList = userDetails?.degree_status.course_statuses ?? [];

    const updateCourseRow: CourseStatus = {
      course: {
        _id: rowData.courseNumber,
        credit: rowData.credit,
        name: rowData.name,        
      },
      state: rowData.state as CourseState,
      type: rowData.type,          
      grade: rowData.grade,
      semester: semester,
      modified: true,
    }

    // TODO: handle change course ID...
    const updatedCourseStatus: CourseStatus[] = courseList.map( course => course.course._id !== rowData.courseNumber ? 
                                      course :
                                      updateCourseRow);
                                      
    const newUserDetails = {...userDetails};
    if (newUserDetails.degree_status?.course_statuses) {
      newUserDetails.degree_status.course_statuses = updatedCourseStatus;
      newUserDetails.modified = true;
    }    

    return newUserDetails;
  }
 
}
