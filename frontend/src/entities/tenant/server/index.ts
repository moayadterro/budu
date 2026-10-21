import 'server-only'
// Server-only public API of the tenant entity.
export {
  listTenants,
  getGradeScale,
  setGradeScale,
  getTenantName,
  schoolPeople,
  schoolCourses,
  addToSchool,
  setSchoolRole,
  type Tenant,
  type TenantKind,
  type SchoolPerson,
  type SchoolCourse,
  type SchoolRole,
} from './tenants'
