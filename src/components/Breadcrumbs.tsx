import { HomeIcon } from "@heroicons/react/outline";
import { Link } from "react-router-dom";

export default function Breadcrumbs({
  pages,
}: {
  pages: { name: string; href: string; current: boolean }[];
}) {
  return (
    <nav className="flex" aria-label="Breadcrumb">
      <ol role="list" className="flex items-center space-x-4">
        <li>
          <div>
            {/* <a href="#" className="text-gray-100 hover:text-gray-300">
              <HomeIcon className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
              <span className="sr-only">Home</span>
            </a> */}
            <Link className="text-gray-100 hover:text-gray-300" to={"/"}>
              <HomeIcon className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
              <span className="sr-only">Home</span>
            </Link>
          </div>
        </li>
        {pages.map((page) => (
          <li key={page.name}>
            <div className="flex items-center">
              <svg
                className="h-5 w-5 flex-shrink-0 text-gray-300"
                xmlns="http://www.w3.org/2000/svg"
                fill="#A0AEC0"
                viewBox="0 0 20 20"
                aria-hidden="true"
              >
                <path d="M5.555 17.776l8-16 .894.448-8 16-.894-.448z" />
              </svg>
              <Link
                className="ml-4 text-sm font-medium text-gray-100 hover:text-gray-300"
                to={page.href}
              >
                {page.name}
              </Link>
            </div>
          </li>
        ))}
      </ol>
    </nav>
  );
}
