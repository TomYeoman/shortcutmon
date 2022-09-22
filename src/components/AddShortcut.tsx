import React, { useEffect, useState } from "react";
import Breadcrumbs from "./Breadcrumbs";
import HotkeyWindow from "./HotkeyWindow";
import Select, { ActionMeta, SingleValue } from "react-select";
import {
  FolderOpenIcon,
  ExclamationCircleIcon,
} from "@heroicons/react/outline";
import { useHistory, useParams } from "react-router";
import { getRepository } from "typeorm";
import { Shortcut } from "../entities/Shortcut";
import { DateTime } from "luxon";
import { isNumber } from "util";
const find = require("find-process");

export default function AddShortcut({
  handleClickSaveNewShortcut,
}: {
  handleClickSaveNewShortcut: (shortcut: Shortcut) => void;
}) {
  const history = useHistory();

  // Hotkey data
  const [shouldDisplayConfirmationModal, setDisplayConfirmationModal] =
    useState(false);
  const [hotkeyValue, setHotkeyValue] = useState("");
  const [hotkeyCharCodes, setHotkeyCharCodes] = useState("");
  const [isHotkeyValid, setIsHotkeyValid] = useState(true);

  // APPLICATION .EXE SELECTION
  const [availableProcesses, setAvailableProcesses] = useState([]);
  const APPLICATION_SELECTOR_OPEN_APPLICATION =
    "APPLICATION_SELECTOR_OPEN_APPLICATION";
  const APPLICATION_SELECTOR_FILE_SELECTION =
    "APPLICATION_SELECTOR_FILE_SELECTION";
  const [selectedApplicationSelectorType, setApplicationSelectorType] =
    useState([
      {
        type: APPLICATION_SELECTOR_OPEN_APPLICATION,
        label: "Choose from running applications",
        selected: true,
      },
      {
        type: APPLICATION_SELECTOR_FILE_SELECTION,
        label: "Select application from folder",
        selected: false,
      },
    ]);
  const [selectedApplicationFromDropdown, setSelectedApplicationFromDropdown] =
    useState("");
  const [selectedApplicationFromFile, setSelectedApplicationFromFilePicker] =
    useState("");

  const [isSelectedApplicationValid, setIsSelectedApplicationValid] =
    useState(true);

  // REMINDER MECHANISM
  const REMINDER_AUTOMATIC = "REMINDER_AUTOMATIC";
  const REMINDER_MANUAL = "REMINDER_MANUAL";
  const [selectedReminderMechanism, setReminderMechanism] = useState([
    {
      type: REMINDER_AUTOMATIC,
      label: "Use the automatic reminder scheduler (recommended)",
      selected: true,
    },
    {
      type: REMINDER_MANUAL,
      label: "Let me select a time frame",
      selected: false,
    },
  ]);
  const [reminderTimeframe, setReminderTimeframe] = useState(30);
  const [isReminderTimeframeValid, setIsReminderTimeframeValid] =
    useState(true);

  type Params = {
    id: string;
  };
  const params = useParams() as Params;

  useEffect(() => {
    const loadExistingData = async (id: string) => {
      //lookup the full shortcut using ID
      const shortcutRepository = await getRepository(Shortcut);
      const shortcut = (await shortcutRepository.findOne({
        where: { id: parseInt(id) },
      })) as Shortcut;

      // Set default values
      handleChangeApplicationTypeSelector(APPLICATION_SELECTOR_FILE_SELECTION);
      setHotkeyValue(shortcut.keyCombination);
      setHotkeyCharCodes(shortcut.keyCombinationCharCodes);
      setSelectedApplicationFromFilePicker(shortcut.executable);
      setReminderTimeframe(shortcut.reminderFrequencyMinutes);
    };

    if (params?.id) {
      const { id } = params;
      loadExistingData(id);
    }
  }, []);

  // Find all running processes on machine
  useEffect(() => {
    console.log("Looking up processes");
    find("name", "", { strict: true, logLevel: "error" }).then(function (
      list: any
    ) {
      console.log("there are %s nginx process(es)", list.length);
      // Use a set to create unique array of names
      const uniqueNames: any = [
        ...Array.from(new Set(list.map((item: any) => item.name))),
      ];
      const formattedNames = uniqueNames.map((name: any) => {
        return {
          value: name,
          label: name,
        };
      });
      setAvailableProcesses(formattedNames);
    });
  }, []);

  type SelectValue = {
    label: string;
    value: string;
  };

  const handleChangeApplicationTypeSelector = (option: any) => {
    setSelectedApplicationFromFilePicker("");
    setSelectedApplicationFromDropdown("");

    setApplicationSelectorType([
      ...selectedApplicationSelectorType.map((item: any) => {
        if (item.type === option) {
          return {
            ...item,
            selected: true,
          };
        } else {
          return {
            ...item,
            selected: false,
          };
        }
      }),
    ]);
  };

  const handleApplicationSelectChange = (
    option: SingleValue<SelectValue>,
    actionMeta: ActionMeta<SelectValue>
  ) => {
    setSelectedApplicationFromDropdown(option ? option.value : "");
  };

  const handleFileUploadChange = (val: any) => {
    if (val.target.files.length === 0) {
      return;
    }
    setSelectedApplicationFromFilePicker(val.target.files[0].name);
  };

  return (
    <div>
      {shouldDisplayConfirmationModal && (
        <HotkeyWindow
          handleConfirmChoice={(keyCodes, keyCharCodes) => {
            setDisplayConfirmationModal(false);

            setHotkeyValue(keyCodes);
            setHotkeyCharCodes(JSON.stringify(keyCharCodes));
          }}
          handleCancel={() => {
            setDisplayConfirmationModal(false);
          }}
          description={``}
          title="Set hotkey"
        />
      )}

      <Breadcrumbs
        pages={[
          {
            name: "Shortcut overview",
            href: "/",
            current: false,
          },
          {
            name: "Create shortcut",
            href: "/new_shortcut",
            current: true,
          },
        ]}
      />

      <div className="space-y-6 pt-10">
        <div>
          <h3 className="text-lg font-medium leading-6 text-gray-100">
            Information
          </h3>
        </div>
        <div className="space-y-5">
          {/* Shortcut */}
          <div className="grid grid-cols-3 items-start pt-5">
            <label
              htmlFor="key-combination"
              className="block text-sm font-medium text-gray-200 mt-px pt-2 col-span-1"
            >
              Key combination
            </label>
            <div className="mt-1 col-span-2">
              <div className="relative w-72 mt-1 rounded-md shadow-sm">
                <button
                  name="key-combination"
                  id="key-combination"
                  onClick={() => setDisplayConfirmationModal(true)}
                  className="block w-full px-3 py-2 h-10 rounded-md bg-gray-100 text-left"
                >
                  {hotkeyValue || (
                    <span className="text-gray-500">
                      Click to set combination...
                    </span>
                  )}
                </button>
                {!isHotkeyValid && (
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                    <ExclamationCircleIcon
                      className="h-5 w-5 text-red-500"
                      aria-hidden="true"
                    />
                  </div>
                )}
              </div>
              {!isHotkeyValid && (
                <p className="mt-2 text-sm text-red-600" id="email-error">
                  You must set a key combination.
                </p>
              )}
            </div>
          </div>
          <div className="grid grid-cols-3 items-start  pt-5">
            <label
              htmlFor="first-name"
              className="block text-sm font-medium text-gray-200 mt-px pt-2"
            >
              Application
            </label>

            <div className="mt-1 col-span-2">
              <div>
                {/* <div>Selected = {JSON.stringify(selectedApplicationSelectorType, null, 4)}</div> */}
                {selectedApplicationSelectorType.map((option) => (
                  <div className="flex items-center mt-1">
                    <input
                      onChange={(e) =>
                        handleChangeApplicationTypeSelector(e.currentTarget.id)
                      }
                      id={option.type}
                      name="application-name-selector"
                      type="radio"
                      className="h-4 w-4 border-gray-300 focus:ring-indigo-500"
                      checked={option.selected}
                    />
                    <label htmlFor={option.type} className="ml-3">
                      <span className="block text-sm font-medium text-gray-100">
                        {option.label}
                      </span>
                    </label>
                  </div>
                ))}
                {!isSelectedApplicationValid && (
                  <p className="mt-2 text-sm text-red-600" id="email-error">
                    You must set an executable
                  </p>
                )}

                <div className="mt-3">
                  {selectedApplicationSelectorType.find((type) => type.selected)
                    ?.type === APPLICATION_SELECTOR_FILE_SELECTION && (
                    <React.Fragment>
                      <label className="flex flex-col h-full w-72 items-center px-4 py-6 bg-white text-blue rounded-lg shadow-lg tracking-wide uppercase border border-blue cursor-pointer hover:bg-blue hover:text-gray-800">
                        <FolderOpenIcon
                          className="h-5 w-5 flex-shrink-0"
                          aria-hidden="true"
                        />
                        <span className="mt-2 text-base leading-normal">
                          {selectedApplicationFromFile || "Select application"}
                        </span>
                        <input
                          type="file"
                          className="hidden"
                          onChange={handleFileUploadChange}
                        />
                      </label>
                    </React.Fragment>
                  )}

                  {selectedApplicationSelectorType.find((type) => type.selected)
                    ?.type === APPLICATION_SELECTOR_OPEN_APPLICATION && (
                    <div className=" h-10 w-72">
                      {availableProcesses.length ? (
                        <Select
                          onChange={handleApplicationSelectChange}
                          options={availableProcesses}
                        />
                      ) : (
                        <div className=" px-3 py-2 h-10 rounded-md bg-gray-50 text-gray-700 text-left">
                          Loading current processes..
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* REMINDER */}
          <div className="grid grid-cols-3 items-start  pt-5">
            <label
              htmlFor="first-name"
              className="block text-sm font-medium text-gray-200"
            >
              Reminder
            </label>

            <div className="mt-1 col-span-2">
              <div className="flex text-gray-200 items-center">
                <span>Initially set my reminders to show</span>
                <input
                  onChange={(e) =>
                    setReminderTimeframe(parseInt(e.currentTarget.value))
                  }
                  type="number"
                  value={reminderTimeframe}
                  className="mx-3 h-10 w-12 text-gray-900 rounded-md text-center"
                  placeholder="X"
                />
                <span>minutes of no usage</span>
              </div>
              {!isReminderTimeframeValid && (
                <p className="mt-2 text-sm text-red-600" id="email-error">
                  Reminder duration must be greater than zero, and less than 60
                </p>
              )}
            </div>
          </div>

          <div className="pt-5">
            <div className="flex justify-end">
              <button
                onClick={() => {
                  // Navigate to home
                  history.push("/");
                }}
                type="button"
                className="rounded-md border border-gray-300 bg-white py-2 px-4 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  const validateForm = () => {
                    // TODO move to react hook forms for cleaner validation
                    let isFormValid = true;
                    setIsHotkeyValid(true);
                    setIsSelectedApplicationValid(true);
                    setIsReminderTimeframeValid(true);

                    if (!hotkeyValue) {
                      setIsHotkeyValid(false);
                      isFormValid = false;
                    }

                    if (
                      !selectedApplicationFromFile &&
                      !selectedApplicationFromDropdown
                    ) {
                      setIsSelectedApplicationValid(false);
                      isFormValid = false;
                    }

                    if (reminderTimeframe < 1 || reminderTimeframe > 60) {
                      setIsReminderTimeframeValid(false);
                      isFormValid = false;
                    }

                    return isFormValid;
                  };

                  if (!validateForm()) {
                    return;
                  }

                  // Save to SQL database
                  let executable = selectedApplicationFromFile;

                  if (
                    selectedApplicationSelectorType.find(
                      (type) => type.selected
                    )?.type === APPLICATION_SELECTOR_OPEN_APPLICATION
                  ) {
                    executable = selectedApplicationFromDropdown;
                  }

                  let shortcut = new Shortcut();

                  shortcut = {
                    ...shortcut,
                    keyCombination: hotkeyValue,
                    keyCombinationCharCodes: hotkeyCharCodes,
                    executable: executable,
                    reminderFrequencyMinutes: reminderTimeframe,
                    timeElapsedInMinutesSinceLastCheck: 0,
                    timeTotalMinutesSpentInApplication: 0,
                    enabled: 1,
                  };

                  debugger;
                  // Update existing shortcut record if we passed in an id
                  if (params.id) {
                    shortcut.id = parseInt(params.id);
                  }

                  console.log(JSON.stringify(shortcut, null, 4));
                  handleClickSaveNewShortcut(shortcut);
                }}
                type="submit"
                className="ml-3 inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
