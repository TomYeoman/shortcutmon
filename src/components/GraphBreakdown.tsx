import { VictoryLabel, VictoryAxis, VictoryLine } from "victory";
import React, { useEffect, useState } from "react";
import Breadcrumbs from "./Breadcrumbs";
import { useParams } from "react-router";
import { Connection, MoreThan } from "typeorm";
import { ShortcutCompletionRecord } from "../entities/ShortcutCompletionRecord";
import { ShortcutReminderRecord } from "../entities/ShortcutReminderRecord";
import { Shortcut } from "../entities/Shortcut";

const getStyles = () => {
  const BLUE_COLOR = "#00a3de";
  const RED_COLOR = "#dc2626";

  return {
    parent: {
      // background: "#ccdee8",
      boxSizing: "border-box",
      display: "inline",
      padding: 0,
      fontFamily: "'Fira Sans', sans-serif",
      height: "80vh",
      width: "100%",
    },

    // INDEPENDENT AXIS
    axisYears: {
      axis: { stroke: "white", strokeWidth: 1 },
      ticks: {
        stroke: "white",
        strokeWidth: 1,
      },
      tickLabels: {
        fill: "white",
        fontFamily: "inherit",
        fontSize: 8,
      },
    },
    // Times used
    axisOne: {
      grid: {
        stroke: ({ tick }) => (tick === -10 ? "transparent" : "#ffffff"),
        strokeWidth: 1,
      },
      axis: { stroke: BLUE_COLOR, strokeWidth: 0 },
      ticks: { strokeWidth: 0 },
      tickLabels: {
        fill: BLUE_COLOR,
        fontFamily: "inherit",
        fontSize: 8,
      },
    },
    labelOne: {
      fill: BLUE_COLOR,
      fontSize: 10,
    },
    lineOne: {
      data: { stroke: BLUE_COLOR, strokeWidth: 3.5 },
    },
    // Times reminded
    axisTwo: {
      axis: { stroke: RED_COLOR, strokeWidth: 0 },
      tickLabels: {
        fill: RED_COLOR,
        fontFamily: "inherit",
        fontSize: 8,
      },
    },
    labelTwo: {
      textAnchor: "end",
      fill: RED_COLOR,
      fontSize: 10,
    },
    lineTwo: {
      data: { stroke: RED_COLOR, strokeWidth: 3.5 },
    },

    // HORIZONTAL LINE
    lineThree: {
      data: { stroke: "#e95f46", strokeWidth: 2 },
    },
  };
};

const GraphBreakdown = ({ connection }: { connection: Connection }) => {
  const styles = getStyles();

  const INTERVAL_60_MINUTES = "60 minutes";
  const INTERVAL_24_HOURS = "24 hours";
  const timeframeOptions = [INTERVAL_60_MINUTES, INTERVAL_24_HOURS];

  const [dataSetCompletedShortcuts, setdataSetCompletedShortcuts] =
    useState<any>([]);
  const [dataSetRemindedShortcuts, setdataSetRemindedShortcuts] = useState<any>(
    []
  );
  const [loadedShortcut, setLoadedShortcut] = useState<Shortcut | null>(null);
  const [tickValues, setTickValues] = useState<any>([]);
  const [selectedTimeframe, setSelectedTimeframe] =
    useState(INTERVAL_60_MINUTES);

  // Scale can be 1 minute, or 1 hour, will create buckets for the last 100 mins, or 100 hours.

  // define type with ID as string
  type Params = {
    id: string;
  };
  const params = useParams() as Params;
  const { id } = params;

  useEffect(() => {
    const fetchData = async () => {
      // Fetch shortcut record by ID
      const shortcutRepository = connection.getRepository(Shortcut);
      const shortcut = (await shortcutRepository.findOne({
        where: { id: parseInt(id) },
      })) as Shortcut;
      setLoadedShortcut(shortcut);

      const formattedCompleted: any = [];
      const formattedMissed: any = [];

      // 10 minute buckets, or 1 hour
      let bucketSize = selectedTimeframe === INTERVAL_24_HOURS ? 24 : 6;
      // Default to 60 mins
      let totalMinutesOfDataRequired =
        selectedTimeframe === INTERVAL_24_HOURS ? 24 * 60 : 60;
      // E.G 10 minute buckets, or 60 minute
      let timeStep = totalMinutesOfDataRequired / bucketSize;

      for (let i = 1; i <= bucketSize; i++) {
        formattedCompleted.push({ x: i, y: 0 });
        formattedMissed.push({ x: i, y: 0 });
      }

      const shortcutCompletedRepository = connection.getRepository(
        ShortcutCompletionRecord
      );

      // Get the last X minutes of data
      const shortcutsCompleted = await shortcutCompletedRepository.find({
        where: {
          shortcut: { id: parseInt(id) },
          snapshotOfTimeElapsedSinceShortcutCreated: MoreThan(
            shortcut.timeTotalMinutesSpentInApplication -
              totalMinutesOfDataRequired
          ),
        },
      });

      const shortcutRemindedRepository = connection.getRepository(
        ShortcutReminderRecord
      );
      const shortcutsMissed = await shortcutRemindedRepository.find({
        where: {
          shortcut: { id: parseInt(id) },
          snapshotOfTimeElapsedSinceShortcutCreated: MoreThan(
            shortcut.timeTotalMinutesSpentInApplication -
              totalMinutesOfDataRequired
          ),
        },
      });

      shortcutsCompleted.forEach(
        (shortcutCompletedRecord: ShortcutCompletionRecord) => {
          let timeSinceShortcutCompleted =
            shortcut.timeTotalMinutesSpentInApplication -
            shortcutCompletedRecord.snapshotOfTimeElapsedSinceShortcutCreated;
          // console.log(timeSinceShortcutCompleted)

          let associatedBucket =
            formattedCompleted[
              Math.round(timeSinceShortcutCompleted / timeStep)
            ];
          associatedBucket && (associatedBucket.y += 1);
        }
      );

      shortcutsMissed.forEach((shortcutMissed: ShortcutReminderRecord) => {
        let timeSinceReminderSent =
          shortcut.timeTotalMinutesSpentInApplication -
          shortcutMissed.snapshotOfTimeElapsedSinceShortcutCreated;
        console.log(timeSinceReminderSent);

        let associatedBucket =
          formattedMissed[Math.round(timeSinceReminderSent / timeStep)];
        associatedBucket && (associatedBucket.y += 1);
      });

      let keys = Object.entries(formattedCompleted).map(
        ([key, val]: [any, any], index) => timeStep * index
      );
      setdataSetCompletedShortcuts(formattedCompleted);
      setdataSetRemindedShortcuts(formattedMissed);
      setTickValues(keys);
    };

    fetchData();

    return () => {};
  }, [
    dataSetCompletedShortcuts,
    dataSetRemindedShortcuts,
    tickValues,
    connection,
    id,
    selectedTimeframe,
  ]);

  const handleChangeTimeframe = (event) => {
    console.log(event.target.value);
    setSelectedTimeframe(event.target.value);
  };

  let isLoading =
    !dataSetCompletedShortcuts.length ||
    !dataSetRemindedShortcuts.length ||
    !tickValues.length ||
    !loadedShortcut;

  let completedMin = Math.min(
    ...dataSetCompletedShortcuts.map((item) => item.y)
  );
  let completedMax = Math.max(
    ...dataSetCompletedShortcuts.map((item) => item.y)
  );

  let remindedMin = Math.min(...dataSetRemindedShortcuts.map((item) => item.y));
  let remindedMax = Math.max(...dataSetRemindedShortcuts.map((item) => item.y));

  let scaleLower = Math.min(completedMin, remindedMin);
  let scaleUpper = Math.max(completedMax, remindedMax);

  debugger;
  return (
    <div className="">
      <Breadcrumbs
        pages={[
          {
            name: "Shortcut overview",
            href: "/",
            current: false,
          },
          {
            name: "Graph breakdown",
            href: "/graph_breakdown",
            current: true,
          },
        ]}
      />
      <div>
        <div className="flex text-gray-200 pt-10 flex-center items-center">
          <span>Show last</span>

          <select
            id="timeframe"
            name="timeframe"
            className="mx-3 h-10 w-28 text-gray-900 rounded-md text-center"
            defaultValue="Canada"
            onChange={handleChangeTimeframe}
          >
            {timeframeOptions.map((option) => (
              <option selected={option === selectedTimeframe} id={option}>
                {option}
              </option>
            ))}
          </select>

          <span>
            of usage (counted only whilst "{loadedShortcut?.executable}" is the
            active window)
          </span>
        </div>
      </div>

      {isLoading ? (
        <div>Loading...</div>
      ) : (
        <svg style={styles.parent} viewBox="0 0 450 350">
          <VictoryLabel x={25} y={55} style={styles.labelOne} text={"Used"} />
          <VictoryLabel
            x={425}
            y={55}
            style={styles.labelTwo}
            text={"Reminded"}
          />

          <g transform={"translate(0, 40)"}>
            {/* Add shared independent axis */}
            <VictoryAxis
              // scale="time"
              standalone={false}
              style={styles.axisYears}
              tickValues={tickValues}
              invertAxis={true}
              orientation="bottom"
              tickFormat={(x) => {
                if (selectedTimeframe === INTERVAL_24_HOURS) {
                  return `${Math.round(x / 60)}h
                      ago`;
                } else {
                  return `${Math.round(x)}m
                      ago`;
                }
              }}
            />
            <VictoryAxis
              dependentAxis
              domain={[scaleLower, scaleUpper]}
              offsetX={50}
              orientation="left"
              standalone={false}
              style={styles.axisOne}
            />
            <VictoryLine
              data={dataSetCompletedShortcuts}
              interpolation="monotoneX"
              scale={{ x: "time", y: "linear" }}
              standalone={false}
              style={styles.lineOne}
            />
            <VictoryAxis
              dependentAxis
              domain={[remindedMin, remindedMax]}
              orientation="right"
              standalone={false}
              style={styles.axisTwo}
            />
            <VictoryLine
              data={dataSetRemindedShortcuts}
              interpolation="monotoneX"
              scale={{ x: "time", y: "linear" }}
              standalone={false}
              style={styles.lineTwo}
            />
          </g>
        </svg>
      )}
    </div>
  );
};

export default GraphBreakdown;
