import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Shortcut } from "./Shortcut";

@Entity('shortcut_completion_record')
class ShortcutCompletionRecord {

  @PrimaryGeneratedColumn()
  id: number;

  // This allows us to graph when this shortcut was used, and graph it relative to
  // the total time spent on the application
  @Column("float")
  snapshotOfTimeElapsedSinceShortcutCreated: number;

  @ManyToOne(() => Shortcut, (shortcut) => shortcut.shortcutCompletionRecords)
  shortcut: Shortcut

}

export { ShortcutCompletionRecord }