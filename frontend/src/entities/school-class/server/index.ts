import 'server-only'
// Server-only public API of the school-class entity.
export {
  listClasses,
  getClass,
  myClasses,
  saveClass,
  deleteClass,
  setClassStudents,
  setClassTeachers,
  linkClassCourse,
} from './classes'
