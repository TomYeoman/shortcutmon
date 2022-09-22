import { useHistory } from "react-router";
import { TrashIcon, ChartBarIcon, PencilIcon } from "@heroicons/react/outline";
import { Shortcut } from "../entities/Shortcut";

function classNames(...classes: any) {
  return classes.filter(Boolean).join(" ");
}

export default function Shortcuts({
  shortcuts,
  handleClickDeleteKeyCombination,
  handleUpdateEnabledStatus,
  handleClickEditShortcut,
}: {
  shortcuts: Shortcut[];
  handleClickDeleteKeyCombination: (id: string) => void;
  handleClickEditShortcut: (id: string) => void;
  handleUpdateEnabledStatus: (id: string) => void;
}) {
  const history = useHistory();
  const handleClickNewReminder = () => {
    history.push("/new_shortcut");
  };

  const handleCickGraphBreakdown = (id: string) => {
    history.push("/graph_breakdown/" + id);
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-xl font-semibold text-gray-100">
            Shortcut Manager
          </h1>
          <p className="mt-2 text-sm text-gray-300">
            Add your shortcuts, or text phrases you would like to be reminded
            about below.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-gray-800 focus:ring-offset-2 sm:w-auto"
            onClick={() => {
              handleClickNewReminder();
            }}
          >
            Add new reminder
          </button>
        </div>
      </div>
      <div className="-mx-4 mt-10 ring-1 ring-gray-300 sm:-mx-6 md:mx-0 md:rounded-lg">
        <table className="min-w-full divide-y divide-gray-300 text-left">
          <thead>
            <tr>
              <th
                scope="col"
                className="py-3.5 pl-4 pr-3 text-sm font-semibold text-gray-100"
              >
                Shortcut
              </th>
              <th
                scope="col"
                className="px-3 py-3.5 text-sm font-semibold text-gray-100"
              >
                Application
              </th>
              <th
                scope="col"
                className="px-3 py-3.5 text-sm font-semibold text-gray-100"
              >
                Reminder Frequency (min)
              </th>
              <th
                scope="col"
                className="px-3 py-3.5 text-sm font-semibold text-gray-100"
              >
                Statistics
              </th>
              <th
                scope="col"
                className="px-3 py-3.5 text-sm font-semibold text-gray-100"
              >
                Enabled
              </th>
              <th
                scope="col"
                className="px-3 py-3.5 text-sm font-semibold text-gray-100"
              >
                Edit
              </th>
              <th
                scope="col"
                className="px-3 py-3.5 text-sm font-semibold text-gray-100"
              >
                Remove
              </th>
              <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                <span className="sr-only">Select</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {shortcuts.map((shortcut) => (
              <tr key={shortcut.id}>
                <td
                  className={classNames(
                    "px-3 py-3.5 text-sm text-gray-300 border-t border-gray-200 table-cell"
                  )}
                >
                  <div className="font-medium text-gray-100">
                    {shortcut.keyCombination}
                  </div>
                </td>
                <td
                  className={classNames(
                    "px-3 py-3.5 text-sm text-gray-300 border-t border-gray-200 table-cell"
                  )}
                >
                  {shortcut.executable}
                </td>
                <td
                  className={classNames(
                    "px-3 py-3.5 text-sm text-gray-300 border-t border-gray-200 table-cell"
                  )}
                >
                  {shortcut.reminderFrequencyMinutes}
                </td>
                <td
                  className={classNames(
                    "px-3 py-3.5 text-sm text-gray-300 border-t border-gray-200 table-cell"
                  )}
                >
                  <ChartBarIcon
                    id={shortcut.id.toString()}
                    onClick={(e) => {
                      handleCickGraphBreakdown(e.currentTarget.id);
                    }}
                    className="h-5 w-5 flex-shrink-0 cursor-pointer hover:text-red-400"
                    aria-hidden="true"
                  />
                </td>
                <td
                  className={classNames(
                    "px-3 py-3.5 text-sm text-gray-300 border-t border-gray-200 table-cell"
                  )}
                >
                  <button
                    type="button"
                    className={classNames(
                      shortcut.enabled
                        ? "bg-green-800 hover:bg-green-700 focus:ring-green-500"
                        : "bg-red-500 hover:bg-red-700 focus:ring-red-500",
                      "inline-flex items-center rounded-md border border-gray-300 px-2 py-2 text-sm font-medium leading-4 text-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-30"
                    )}
                    id={shortcut.id.toString()}
                    onClick={(e) => {
                      handleUpdateEnabledStatus(e.currentTarget.id);
                    }}
                  >
                    <span className="w-16 text-center">
                      {shortcut.enabled ? `Enabled` : `Disabled`}
                    </span>
                  </button>
                </td>
                <td
                  className={classNames(
                    "px-3 py-3.5 text-sm text-gray-300 border-t border-gray-200 table-cell"
                  )}
                >
                  <PencilIcon
                    id={shortcut.id.toString()}
                    onClick={(e) => {
                      handleClickEditShortcut(e.currentTarget.id);
                    }}
                    className="h-5 w-5 flex-shrink-0 cursor-pointer hover:text-red-400"
                    aria-hidden="true"
                  />
                </td>
                <td
                  className={classNames(
                    "px-3 py-3.5 text-sm text-gray-300 border-t border-gray-200 table-cell"
                  )}
                >
                  <TrashIcon
                    id={shortcut.id.toString()}
                    onClick={(e) => {
                      handleClickDeleteKeyCombination(e.currentTarget.id);
                    }}
                    className="h-5 w-5 flex-shrink-0 cursor-pointer hover:text-red-400"
                    aria-hidden="true"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
