import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Shortcut } from "./Shortcut";

@Entity('shortcut_reminder_record')
class ShortcutReminderRecord {

  @PrimaryGeneratedColumn()
  id: number;

  @Column("float")
  snapshotOfTimeElapsedSinceShortcutCreated: number;

  @ManyToOne(() => Shortcut, (shortcut) => shortcut.shortcutReminderRecords)
  shortcut: Shortcut

}

export { ShortcutReminderRecord }