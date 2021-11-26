import { makeAutoObservable } from 'mobx';
import { CourseStatus } from '../types/data-types';
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

 
}
