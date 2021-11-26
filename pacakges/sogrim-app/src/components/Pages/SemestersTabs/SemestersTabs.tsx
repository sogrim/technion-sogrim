import React from 'react';
import { observer } from 'mobx-react-lite';
import useUserState from '../../../hooks/apiHooks/useUserState';
import { CourseStatus } from '../../../types/data-types';

interface SemestersTabProps {
}

const SemestersTabComp: React.FC<SemestersTabProps> = () => {

    const { data: userState }  = useUserState();

    const allCourses: CourseStatus[] = userState?.details?.degree_status?.course_statuses || [];
    
    return (
        <div> 
            { allCourses !== [] ? allCourses.map( (course, id) => <h1> {course.course.name} - {course.state} </h1>) : null }
          
        </div>
      
    );
};



export const SemestersTab = observer(SemestersTabComp);

