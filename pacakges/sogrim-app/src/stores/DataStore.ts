import { makeAutoObservable } from 'mobx';
import { createData } from '../components/Pages/SemestersPage/SemesterTable/SemesterTableUtils';
import { RowData } from '../components/Pages/SemestersPage/SemesterTable/SemesterTabsConsts';
import { CourseStatus, Grade } from '../types/data-types';
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

  private displayGrade = (grade: Grade) => {
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

 
}
