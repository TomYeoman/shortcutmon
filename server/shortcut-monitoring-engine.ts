import { Notification } from 'electron';
import { createConnection, getRepository, MoreThan } from "typeorm";

import { Shortcut } from "../src/entities/Shortcut";
import { ShortcutCompletionRecord } from "../src/entities/ShortcutCompletionRecord";
import { ShortcutReminderRecord } from '../src/entities/ShortcutReminderRecord';

import ConnectionObject from "../src/utils/connectionObject";
import { browserKeymap } from "./keybind-mappings";
import { uiHookToBrowserMapping } from './keybind-mappings';
import logger from "./logger";

// https://stackoverflow.com/questions/18883037/nodejs-listen-for-global-hotkey-press/41441872#41441872
const UiHook = require('uiohook-napi')
const activeWindows = require('electron-active-window');

class ShortcutMonitoringEngine {
  private activeShortcuts: Shortcut[] = [];
  private keyCache: Record<string, number[]> = {}
  private activeWindow: any = null

  async init() {
    logger.debug("Init engine")

    // Setup listeners
    this.registerActiveWindowListener()
    this.registerKeyboardListener()
    await createConnection(ConnectionObject);
    // Setup DB + initial data
    this.fetchShortcuts()

    // Run checks to see whether we need to remind the user of any shortcuts
    this.startEngine()
  }

  // Every 30 seconds, check active window + assign time elapsed since last shortcut evaluation
  // for any record which was listening for key combinations on this application
  registerActiveWindowListener() {

    // Set local variable to the active window, used to check which application we're using keys in
    const TIME_INTERVAL_SECONDS = 10

    setInterval(() => {

      activeWindows().getActiveWindow().then((result: any) => {
        this.activeWindow = result.windowClass
        logger.debug(`Assigning active application to ${this.activeWindow} and updating time spent, as ${TIME_INTERVAL_SECONDS} seconds has passed`)

        this.activeShortcuts.forEach((shortcut) => {
          if (shortcut.executable === this.activeWindow) {
            this.updateTimeSpentInApplication(shortcut, TIME_INTERVAL_SECONDS)
          }
        })
      });
    }, TIME_INTERVAL_SECONDS * 1000)
  }

  registerKeyboardListener() {
    UiHook.uIOhook.on('keydown', (e: { keycode: number }) => {
      this.updateCache(parseInt(uiHookToBrowserMapping[e.keycode]), this.activeWindow)
    })
    UiHook.uIOhook.start()
  }

  // Refresh cache of all shortcuts, Called on engine init, and also by frontend whenever we add/delete/edit a shortcut
  fetchShortcuts = async () => {
    const shortcuts = await getRepository(Shortcut).find();
    let activeShortcuts = shortcuts.filter((shortcut) => shortcut.enabled)
    logger.debug(`Fetched ${shortcuts.length} (${activeShortcuts.length} active) shortcuts and saved to cache`)
    this.activeShortcuts = activeShortcuts
  }

  // Check on keypress whether our application cache contains the shortcut
  updateCache = async (key: number, application: string) => {
    try {

      logger.debug("")
      // First lets update our cache
      this.keyCache[application] ? this.keyCache[application].push(key) : this.keyCache[application] = [key]

      // Now lets check whether we've completed any shortcut for the currently open application
      let shortcutsToCheck = this.activeShortcuts.filter((shortcut) => shortcut.executable === application)
      logger.debug(`Checking for match on key ${key}}. The active application is ${this.activeWindow}, there are  ${shortcutsToCheck.length} shortcuts registered to this application`)
      // logger.debug(`Cache is ${JSON.stringify(this.keyCache)}`)

      shortcutsToCheck.forEach(async (shortcut) => {
        // TODO store the browser mapping in the DB, so we don't need to do ts lookup each time (also means frontend can catch, and warn if we don't have a mapping for a key)

        if (!shortcut.keyCombination.length) {
          console.error("Processed shortcut with zero length")
        }

        const shortcutKeyCodes = JSON.parse(shortcut.keyCombinationCharCodes)

        logger.info(`Shortcut keycodes for ${shortcut.keyCombination} are ${shortcutKeyCodes}, cache is ${this.keyCache[application]}`)

        // check whether the cache contains the shortcut
        let shortcutLength = shortcutKeyCodes.length
        let cacheLength = this.keyCache[application].length

        // TODO - in the future, we could optimize this, by only start building cache once we've seen the first key in the shortcut
        if (this.keyCache[application].slice(cacheLength - shortcutLength, cacheLength).join().includes(shortcutKeyCodes.join())) {
          let completion = new ShortcutCompletionRecord();
          completion.snapshotOfTimeElapsedSinceShortcutCreated = shortcut.timeTotalMinutesSpentInApplication
          completion.shortcut = shortcut

          await getRepository(ShortcutCompletionRecord).save(completion)
        } else {
          logger.debug(`Found no combination of ${shortcut.keyCombination} (${shortcutKeyCodes}) in keyCache`)
        }
      })

      // only store a max cache of 10 characters per application (could make this length of max shortcut in future)
      if (this.keyCache[application].length > 10) {
        this.keyCache[application].shift()
      }
    } catch (e) {
      logger.error(e)
    }
  }

  // Every minute or so, check for any shortcuts that need to be reminded on
  startEngine() {

    const TIME_INTERVAL_SECONDS = 10

    setInterval(() => {
      this.activeShortcuts.forEach(async (shortcut) => {

        logger.debug("Checking whether to remind user of shortcut: " + shortcut.keyCombination)

        // Our due date was in the past, so it's time to check whether we've actually used the key combinations listed
        if (shortcut.timeElapsedInMinutesSinceLastCheck >= shortcut.reminderFrequencyMinutes) {
          // If there are records in ShortcutCompletionRecord since last reminder date, then we don't need to remind the user
          // Get all completion records, between last reminder date and now

          let snapshotTime = shortcut.timeTotalMinutesSpentInApplication - shortcut.reminderFrequencyMinutes
          logger.debug(`Looking for snapshots past ${snapshotTime}`)
          let records = await getRepository(ShortcutCompletionRecord).find({
            where: {
              shortcut: shortcut,
              // Get last 30 minutes of records for example
              snapshotOfTimeElapsedSinceShortcutCreated: MoreThan(shortcut.timeTotalMinutesSpentInApplication - shortcut.reminderFrequencyMinutes)
            }
          })

          if (records.length === 0) {
            logger.info(`No completion records found for shortcut ${shortcut.keyCombination} since last reminder due date, sending notification`)
            let reminder = new ShortcutReminderRecord();

            // Display reminder, and save to DB
            if (Notification.isSupported()) {
              let notification = new Notification({
                title: 'Shortcut Reminder',
                body: `You haven't used the shortcut ${shortcut.keyCombination} in ${shortcut.reminderFrequencyMinutes} ${shortcut.reminderFrequencyMinutes > 1 ? `minutes` : `minute`}, you should use it now!`,
              })
              notification.show();
            } else {
              logger.error("Notifications not supported")
            }

            reminder.snapshotOfTimeElapsedSinceShortcutCreated = shortcut.timeTotalMinutesSpentInApplication
            reminder.shortcut = shortcut
            await getRepository(ShortcutReminderRecord).save(reminder)

            // Send notification
          } else {
            logger.info(`Found ${records.length} completion records for shortcut ${shortcut.keyCombination} since last reminder due date, not sending notification`)
          }

          this.updateNextDueDate(shortcut)
        }
      });
    }, TIME_INTERVAL_SECONDS * 1000);
  }

  updateNextDueDate = async (shortcut: Shortcut) => {
    shortcut.timeElapsedInMinutesSinceLastCheck = 0
    getRepository(Shortcut).save(shortcut).then((result) => {
      logger.debug(`Updated next due date for shortcut ${shortcut.keyCombination}`)
    }).catch((err) => {
      logger.error("Error updating next due date")
    })
  }

  updateTimeSpentInApplication = async (shortcut: Shortcut, checkInterval: number) => {
    let minutes = checkInterval / 60
    shortcut.timeElapsedInMinutesSinceLastCheck += minutes
    shortcut.timeTotalMinutesSpentInApplication += minutes

    logger.debug(`Updating time spent on ${shortcut.keyCombination} - ${shortcut.executable} by ${minutes} minutes, total time spent is now ${shortcut.timeTotalMinutesSpentInApplication} minutes, since last check: ${shortcut.timeElapsedInMinutesSinceLastCheck} minutes`)

    getRepository(Shortcut).save(shortcut).then((result) => {
      logger.debug(`Updated time spent on shortcut ${shortcut.keyCombination}`)
    }).catch((err) => {
      logger.error("Error updating time spent")
    })
  }

}

let engine = new ShortcutMonitoringEngine()

export default engine