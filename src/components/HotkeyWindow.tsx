/* This example requires Tailwind CSS v2.0+ */
import { Fragment, useEffect, useRef, useState } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { ExclamationIcon } from "@heroicons/react/outline";
import { recordKeyCombination } from "react-hotkeys";

export default function HotkeyWindow({
  handleConfirmChoice,
  handleCancel,
  title,
  description,
}: {
  handleConfirmChoice: (keyCodes: string, keyCharCodes: number[]) => void;
  handleCancel: () => void;
  title: string;
  description: string;
}) {
  const saveButtonRef = useRef(null);
  const [keyCodes, setKeyCode] = useState("");
  const [keyCharCodes, setKeyCharCodes] = useState<number[]>([]);

  // APPLICATION .EXE SELECTION
  const COMBINATION_HOTKEY = "COMBINATION_HOTKEY";
  const COMBINATION_WORD = "COMBINATION_WORD";
  const [combinationTypeDropdown, setCombinationTypeDropdown] = useState([
    {
      type: COMBINATION_HOTKEY,
      label: "Shortcut",
      selected: true,
    },
    {
      type: COMBINATION_WORD,
      label: "Text",
      selected: false,
    },
  ]);

  const handleUpdateKeyCombinationType = (option: any) => {
    setKeyCode("");
    setKeyCharCodes([]);

    setCombinationTypeDropdown([
      ...combinationTypeDropdown.map((item: any) => {
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

  const confirmChoice = (hasConfirmed: boolean) => {
    handleConfirmChoice(keyCodes, keyCharCodes);
  };

  const cancelChanges = () => {
    handleCancel();
  };

  const clearChanges = () => {
    setKeyCode("");
    setKeyCharCodes([]);
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const { code, keyCode } = event;
      // TODO
      // When we delete a character in "text", also remove from keyChars
      // Allow upper and lower case
      if (
        combinationTypeDropdown.find((item: any) => item.selected)?.type ===
        COMBINATION_HOTKEY
      ) {
        setKeyCode(
          (prevPressed) => prevPressed + `${prevPressed ? "-" : ""}${code}`
        );

        let newKeyCharCodes = [...keyCharCodes, keyCode];
        setKeyCharCodes(newKeyCharCodes);
      } else {
        // Check if keyCode is backspace
        if (keyCode === 8) {
          // remove last character from keyCode
          setKeyCode((prevPressed) => prevPressed.slice(0, -1));
          setKeyCharCodes((prevPressed) => prevPressed.slice(0, -1));
        } else {
          setKeyCode(
            (prevPressed) =>
              prevPressed + String.fromCharCode(keyCode).toLowerCase()
          );

          let newKeyCharCodes = [...keyCharCodes, keyCode];
          setKeyCharCodes(newKeyCharCodes);
        }
      }
    };

    const handleKeyUp = (event: any) => {};

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("keyup", handleKeyUp);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("keyup", handleKeyUp);
    };
  });

  return (
    <Transition.Root show={true} as={Fragment}>
      <Dialog
        as="div"
        className="relative z-10 bg-slate-800"
        initialFocus={saveButtonRef}
        onClose={() => cancelChanges()}
      >
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </Transition.Child>

        <div className="fixed z-10 inset-0 overflow-y-auto ">
          <div className="flex items-end sm:items-center justify-center min-h-full p-4 text-center sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative bg-slate-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:max-w-lg sm:w-full ">
                <div className="px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="sm:flex sm:items-start">
                    <div className="mt-3 text-center sm:text-left w-full">
                      <Dialog.Title
                        as="h3"
                        className="text-lg leading-6 font-medium text-gray-900"
                      >
                        {/* {title} */}
                      </Dialog.Title>

                      {combinationTypeDropdown.map((option) => (
                        <div className="flex items-center">
                          <input
                            onChange={(e) =>
                              handleUpdateKeyCombinationType(e.currentTarget.id)
                            }
                            id={option.type}
                            name="reminder-mechanism-selector"
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

                      <div className="mt-2 w-full text-center">
                        {combinationTypeDropdown.find(
                          (item: any) => item.selected
                        )?.type === COMBINATION_WORD ? (
                          <input
                            // onChange={(e) => setPressed(e.currentTarget.value)}
                            id={COMBINATION_WORD}
                            name="reminder-mechanism-selector"
                            className="bg-gray-900 w-full p-5 text-white rounded-md text-center focus:ring-gray-500 focus-visible:ring-gray-500"
                            value={keyCodes}
                            autoFocus
                          />
                        ) : (
                          <p className="bg-gray-900 w-full p-5 text-white rounded-md text-center">
                            {keyCodes || "Enter hotkey"}
                          </p>
                        )}

                        {/* ////////////  */}
                      </div>
                    </div>
                  </div>
                </div>
                <div className=" px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    type="button"
                    className="ml-3 inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                    onClick={() => confirmChoice(true)}
                    ref={saveButtonRef}
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-gray-100 text-gray-900 font-medium  hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                    onClick={() => clearChanges()}
                  >
                    Clear combination
                  </button>
                  <button
                    type="button"
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                    onClick={() => cancelChanges()}
                  >
                    Cancel
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}
