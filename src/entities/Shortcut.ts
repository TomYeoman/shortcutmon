import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { ShortcutCompletionRecord } from "./ShortcutCompletionRecord";
import { ShortcutReminderRecord } from "./ShortcutReminderRecord";

@Entity('shortcut')
class Shortcut {

  @PrimaryGeneratedColumn()
  id: number;

  @Column("text")
  keyCombination: string;

  @Column("text")
  keyCombinationCharCodes: string;

  @Column("text")
  executable: string;

  @Column("integer")
  reminderFrequencyMinutes: number;

  // @Column("integer")
  // reminderFrequencyMinutes: number;

  @Column("float")
  timeElapsedInMinutesSinceLastCheck: number;

  // We use this, instead of a date, in order to accurately chart the time spent on a shortcut over time
  // E.G we look up all completion records in the last 7 days, by taking all records with a timestamp greater than the current total minus 7 days
  @Column("float")
  timeTotalMinutesSpentInApplication: number;

  @Column("integer")
  enabled: number;

  @OneToMany(() => ShortcutCompletionRecord, (completion_record) => completion_record.shortcut)
  shortcutCompletionRecords: ShortcutCompletionRecord[]

  @OneToMany(() => ShortcutReminderRecord, (reminder_record) => reminder_record.shortcut)
  shortcutReminderRecords: ShortcutReminderRecord[]

}

export { Shortcut }