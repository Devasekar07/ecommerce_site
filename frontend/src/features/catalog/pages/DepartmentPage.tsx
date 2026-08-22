import { Link, useParams } from "react-router-dom";
import { ErrorState } from "../../../components/ErrorState";
import { LoadingState } from "../../../components/LoadingState";
import { NotFoundPage } from "./NotFoundPage";
import { useDepartment } from "../api/catalogApi";
import { isCustomerHiddenDepartmentSlug } from "../lib/customerDepartments";

export function DepartmentPage() {
  const { departmentSlug } = useParams();
  const isHiddenDepartment = isCustomerHiddenDepartmentSlug(departmentSlug);
  const departmentQuery = useDepartment(isHiddenDepartment ? undefined : departmentSlug);

  if (!departmentSlug || isHiddenDepartment) {
    return <NotFoundPage />;
  }

  if (departmentQuery.isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <LoadingState label="Loading department" />
      </div>
    );
  }

  if (departmentQuery.isError || !departmentQuery.data) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <ErrorState title="Department not found" message="We could not load this department." />
      </div>
    );
  }

  const department = departmentQuery.data;
  const categories = department.categories;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <section className="border-b border-ink/10 pb-8">
        <p className="text-sm font-semibold uppercase text-berry">Department</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-normal sm:text-5xl">{department.name}</h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-ink/70">{department.description}</p>
      </section>

      <section className="py-10">
        <div className="mb-5">
          <p className="text-sm font-semibold uppercase text-leaf">Categories</p>
          <h2 className="mt-1 text-2xl font-semibold tracking-normal">Shop {department.name}</h2>
        </div>

        {categories.length ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {categories.map((category) => (
              <Link
                key={category.id}
                to={`/departments/${department.slug}/${category.slug}`}
                className="group flex min-h-32 flex-col justify-between rounded border border-ink/10 bg-white p-5 transition hover:border-ink hover:bg-ink hover:text-paper"
              >
                <span className="text-xl font-semibold tracking-normal">{category.name}</span>
                <span className="mt-6 text-sm text-ink/60 transition group-hover:text-paper/70">
                  {category.productCount} products
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <ErrorState title="No categories available" message="This department does not have active categories yet." />
        )}
      </section>
    </div>
  );
}
